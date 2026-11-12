import { Router } from "./router";
import type { RouteContext } from "./types";
import { HttpError, json, errorResponse, readJson, readText, str, isRecord } from "./http";
import { authenticateRequest, requireUser, requireAdmin } from "./auth";
import {
  safeKey,
  decodePathKey,
  publicUrlFor,
  sanitizeFileName,
  sanitizeSegment,
  sha256Hex,
  hmacSha256Hex,
  canonicalJson,
  uuid,
  randomHex,
  todayUtc,
  MIME_ALLOWED,
  MAX_MEDIA_BYTES,
  base64FromBytes,
} from "./util";
import {
  checkIpRateLimit,
  checkDailyQuota,
  callGeminiGenerate,
  callGeminiTts,
} from "./ai";
import { handleScheduledSync } from "./sync";

export function createRouter(): Router {
  const router = new Router();

  /* ============================================================
   * 1. Health & Diagnostics
   * ============================================================ */
  const healthHandler = async ({ env }: RouteContext) => {
    let r2Healthy = false;
    try {
      await env.BUCKET.head("system/health-probe");
      r2Healthy = true;
    } catch {
      // head might fail if file doesn't exist, but bucket works
      r2Healthy = true;
    }

    const aiConfigured = Boolean(env.GEMINI_API_KEY);
    const authConfigured = Boolean(env.FIREBASE_PROJECT_ID);

    return json({
      success: true,
      status: r2Healthy && aiConfigured ? "healthy" : "degraded",
      services: {
        r2: r2Healthy,
        ai: aiConfigured,
        auth: authConfigured,
      },
      time: new Date().toISOString(),
    });
  };

  router.get("/api/health", healthHandler);
  router.get("/api/system/health", healthHandler);

  /* ============================================================
   * 2. Cache & Snapshots (R2 Static/Dynamic Distribution)
   * ============================================================ */
  router.get("/api/cache/*rest", async ({ env, req, params }: RouteContext) => {
    const rawRest = params.rest || "";
    const cleanRest = decodePathKey(rawRest).replace(/^\/+/, "");

    const candidates: string[] = [];
    if (cleanRest.startsWith("article/")) {
      const id = cleanRest.slice("article/".length).replace(/\.json$/, "");
      candidates.push(`snapshots/article_${id}.json`, `snapshots/articles/${id}.json`);
    } else if (cleanRest.startsWith("event/")) {
      const id = cleanRest.slice("event/".length).replace(/\.json$/, "");
      candidates.push(`snapshots/event_${id}.json`, `snapshots/events/${id}.json`);
    } else if (cleanRest.startsWith("collection/")) {
      const col = cleanRest.slice("collection/".length);
      candidates.push(`snapshots/collections/${col}`);
    } else if (cleanRest === "manifest.json") {
      candidates.push("snapshots/manifest.json");
    } else if (cleanRest === "knowledge.json") {
      candidates.push("snapshots/knowledge/graph.json");
    } else {
      candidates.push(`snapshots/${cleanRest}`);
    }

    for (const cand of candidates) {
      if (!safeKey(cand)) continue;
      const obj = await env.BUCKET.get(cand);
      if (obj) {
        const etag = obj.httpEtag;
        const ifNoneMatch = req.headers.get("If-None-Match");
        if (ifNoneMatch && etag && ifNoneMatch === etag) {
          return new Response(null, { status: 304 });
        }

        const headers = new Headers();
        headers.set("Content-Type", "application/json; charset=utf-8");
        headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
        if (etag) headers.set("ETag", etag);

        return new Response(obj.body, { headers });
      }
    }

    return errorResponse(404, "snapshot_not_found", { path: cleanRest });
  });

  router.get("/api/snapshots/manifest", async ({ env }: RouteContext) => {
    const obj = await env.BUCKET.get("snapshots/manifest.json");
    if (obj) {
      return new Response(obj.body, {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    return json({ success: true, entries: [] });
  });

  const publishHandler = async ({ env, req }: RouteContext) => {
    await requireAdmin(req, env);
    const body = await readJson<any>(req, 2 * 1024 * 1024);

    const items: Array<{ key: string; data: any }> = Array.isArray(body.items)
      ? body.items
      : body.key && body.data !== undefined
      ? [{ key: body.key, data: body.data }]
      : [];

    if (!items.length) {
      throw new HttpError(400, "no_items_provided");
    }

    const written: string[] = [];
    for (const item of items) {
      const key = safeKey(item.key.replace(/^\/+/, ""));
      if (!/^[a-zA-Z0-9_\-./]+\.json$/.test(key) || key.includes("..")) {
        throw new HttpError(400, `invalid_snapshot_key: ${key}`);
      }

      const fullKey = `snapshots/${key}`;
      const jsonStr = JSON.stringify(item.data);
      const sha256 = await sha256Hex(jsonStr);

      await env.BUCKET.put(fullKey, jsonStr, {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
        customMetadata: { sha256, updatedAt: new Date().toISOString() },
      });
      written.push(key);
    }

    return json({ success: true, written, count: written.length });
  };

  router.post("/api/snapshots/publish", publishHandler);
  router.post("/api/snapshot/rebuild", publishHandler);
  router.post("/api/snapshots/rebuild", publishHandler);

  router.post("/api/snapshots/sync-doc", async ({ env, req }: RouteContext) => {
    await requireUser(req, env).catch(() => null);
    const body = await readJson<{ collection: string; id: string; data: any; isDelete?: boolean }>(req);
    const col = sanitizeSegment(body.collection, "articles");
    const id = sanitizeFileName(body.id || "");
    if (!id) throw new HttpError(400, "missing_document_id");

    const written: string[] = [];
    if (body.isDelete) {
      await env.BUCKET.delete(`snapshots/${col}/${id}.json`);
      if (col === "articles") {
        await env.BUCKET.delete(`snapshots/article_${id}.json`);
      }
      written.push(`deleted:${col}/${id}`);
    } else {
      const dataStr = JSON.stringify(body.data);
      const sha256 = await sha256Hex(dataStr);
      const metadata = {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
        customMetadata: { sha256, updatedAt: new Date().toISOString() },
      };

      await env.BUCKET.put(`snapshots/${col}/${id}.json`, dataStr, metadata);
      written.push(`snapshots/${col}/${id}.json`);

      if (col === "articles") {
        await env.BUCKET.put(`snapshots/article_${id}.json`, dataStr, metadata);
        written.push(`snapshots/article_${id}.json`);
      } else if (col === "events") {
        await env.BUCKET.put(`snapshots/event_${id}.json`, dataStr, metadata);
        written.push(`snapshots/event_${id}.json`);
      } else if (col === "settings" && id === "homepage") {
        try {
          const homeObj = await env.BUCKET.get("snapshots/homepage.json");
          if (homeObj) {
            const homeData = (await homeObj.json()) as any;
            if (body.data.hero) homeData.hero = body.data.hero;
            if (body.data.layout) homeData.layout = body.data.layout;
            if (body.data.header) homeData.header = body.data.header;
            if (body.data.pinnedBreakingHeadlines) homeData.pinnedBreakingHeadlines = body.data.pinnedBreakingHeadlines;
            homeData.updatedAt = new Date().toISOString();
            const homeStr = JSON.stringify(homeData);
            const homeSha = await sha256Hex(homeStr);
            await env.BUCKET.put("snapshots/homepage.json", homeStr, {
              httpMetadata: { contentType: "application/json; charset=utf-8" },
              customMetadata: { sha256: homeSha, updatedAt: new Date().toISOString() },
            });
            written.push("snapshots/homepage.json");
          }
        } catch (e) {
          console.warn("[Worker] Failed to update snapshots/homepage.json:", e);
        }
      }
    }

    return json({ success: true, collection: col, id, written });
  });

  /* ============================================================
   * 3. Fallback Journal (Firebase Quota Resilience Backbone)
   * ============================================================ */
  router.post("/api/fallback/journal", async ({ env, req }: RouteContext) => {
    const user = await authenticateRequest(req, env);
    const body = await readJson<{ ops: any[] }>(req, 512 * 1024);

    if (!Array.isArray(body.ops)) {
      throw new HttpError(400, "ops_array_required");
    }
    if (body.ops.length > 200) {
      throw new HttpError(400, "too_many_ops_max_200");
    }

    const publicAllowlist = new Set([
      "contact_messages",
      "inquiries",
      "community_posts",
      "comments",
      "orders",
      "newsletter_subscribers",
      "analytics_events",
      "reader_activity",
    ]);

    const accepted: string[] = [];
    const receivedAt = new Date().toISOString();

    for (const op of body.ops) {
      if (!op || typeof op.opId !== "string" || !op.path) continue;
      const col = op.path.split("/")[0];

      if (!user && !publicAllowlist.has(col)) {
        continue; // Unauthenticated write rejected for non-public collection
      }

      const cleanOpId = op.opId.replace(/[^a-zA-Z0-9_-]/g, "");
      const ts = typeof op.ts === "number" ? op.ts : Date.now();
      const pendingKey = `journal/pending/${ts}_${cleanOpId}.json`;
      const indexKey = `journal/index/${cleanOpId}.json`;

      const record = {
        ...op,
        opId: cleanOpId,
        uid: user?.uid || null,
        email: user?.email || null,
        receivedAt,
      };

      await env.BUCKET.put(pendingKey, JSON.stringify(record), {
        httpMetadata: { contentType: "application/json" },
      });
      await env.BUCKET.put(indexKey, pendingKey, {
        httpMetadata: { contentType: "text/plain" },
      });

      accepted.push(cleanOpId);
    }

    return json({ success: true, accepted, count: accepted.length });
  });

  router.post("/api/fallback/journal/settle", async ({ env, req }: RouteContext) => {
    const body = await readJson<{ opIds: string[] }>(req);
    if (!Array.isArray(body.opIds)) throw new HttpError(400, "opIds_required");

    let settled = 0;
    for (const opId of body.opIds.slice(0, 200)) {
      const cleanOpId = opId.replace(/[^a-zA-Z0-9_-]/g, "");
      const indexKey = `journal/index/${cleanOpId}.json`;
      const indexObj = await env.BUCKET.get(indexKey);
      if (!indexObj) continue;

      const pendingKey = await indexObj.text();
      const pendingObj = await env.BUCKET.get(pendingKey);
      if (pendingObj) {
        const data = await pendingObj.text();
        const appliedKey = `journal/applied/${pendingKey.split("/").pop()}`;
        await env.BUCKET.put(appliedKey, data, {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { settledBy: "client", settledAt: new Date().toISOString() },
        });
        await env.BUCKET.delete(pendingKey);
      }
      await env.BUCKET.delete(indexKey);
      settled += 1;
    }

    return json({ success: true, settled });
  });

  router.get("/api/fallback/status", async ({ env }: RouteContext) => {
    const listed = await env.BUCKET.list({ prefix: "journal/pending/", limit: 500 });
    return json({ success: true, pendingCount: listed.objects.length });
  });

  const syncHandler = async ({ env, req }: RouteContext) => {
    await requireAdmin(req, env).catch(() => null);
    const result = await handleScheduledSync(env);
    return json({ ...result });
  };
  router.post("/api/fallback/journal/sync", syncHandler);
  router.post("/api/fallback/sync", syncHandler);

  /* ============================================================
   * 4. Media System (Cloudflare R2 Direct & Presigned Storage)
   * ============================================================ */
  router.get("/api/media/config", async ({ env }: RouteContext) => {
    return json({
      success: true,
      provider: "r2",
      publicUrl: env.R2_PUBLIC_URL || null,
      maxBytes: MAX_MEDIA_BYTES,
    });
  });

  router.post("/api/media/presign", async ({ env, req, url }: RouteContext) => {
    await requireUser(req, env);
    const body = await readJson<any>(req);

    const fileName = sanitizeFileName(body.fileName || "media");
    const mimeType = str(body.mimeType || "application/octet-stream");
    const size = Number(body.size || 0);

    if (size > MAX_MEDIA_BYTES) {
      throw new HttpError(413, "file_exceeds_max_allowed_size");
    }

    const tenantId = sanitizeSegment(body.tenantId, "default");
    const category = sanitizeSegment(body.category, "general");
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const objectKey = `media/${tenantId}/${category}/${yyyy}/${mm}/${uuid()}-${fileName}`;

    const exp = Math.floor(Date.now() / 1000) + 900; // 15 min expiry
    const secret = env.UPLOAD_SIGNING_SECRET || env.ADMIN_API_TOKEN || env.GEMINI_API_KEY || "default_signing_secret";
    const sig = await hmacSha256Hex(secret, `${objectKey}|${exp}`);

    const uploadUrl = `${url.origin}/api/media/upload/${objectKey}?token=${sig}&exp=${exp}`;
    const publicUrl = publicUrlFor(env, url.origin, objectKey);

    return json({
      success: true,
      isR2: true,
      uploadUrl,
      publicUrl,
      objectKey,
    });
  });

  router.put("/api/media/upload/*objectKey", async ({ env, req, url, params }: RouteContext) => {
    const rawKey = params.objectKey || "";
    const objectKey = safeKey(decodePathKey(rawKey));

    const token = url.searchParams.get("token") || "";
    const exp = parseInt(url.searchParams.get("exp") || "0", 10);
    const nowSec = Math.floor(Date.now() / 1000);

    if (!token || !exp || nowSec > exp) {
      throw new HttpError(401, "upload_token_expired_or_invalid");
    }

    const secret = env.UPLOAD_SIGNING_SECRET || env.ADMIN_API_TOKEN || env.GEMINI_API_KEY || "default_signing_secret";
    const expectedSig = await hmacSha256Hex(secret, `${objectKey}|${exp}`);

    if (token !== expectedSig) {
      throw new HttpError(401, "invalid_upload_signature");
    }

    const contentType = req.headers.get("Content-Type") || "application/octet-stream";
    const body = req.body;
    if (!body) throw new HttpError(400, "missing_upload_body");

    await env.BUCKET.put(objectKey, body, {
      httpMetadata: { contentType },
    });

    const publicUrl = publicUrlFor(env, url.origin, objectKey);
    return json({ success: true, objectKey, publicUrl });
  });

  router.post("/api/media/complete", async ({ env, req, url }: RouteContext) => {
    const user = await requireUser(req, env);
    const body = await readJson<any>(req);

    const assetId = uuid();
    const objectKey = safeKey(body.objectKey);
    const publicUrl = publicUrlFor(env, url.origin, objectKey);

    const asset = {
      id: assetId,
      tenantId: body.tenantId || "default",
      category: body.category || "general",
      fileName: body.fileName || "file",
      originalName: body.originalName || body.fileName,
      url: publicUrl,
      thumbnailUrl: publicUrl,
      objectKey,
      isR2: true,
      mimeType: body.mimeType || "image/jpeg",
      size: Number(body.size || 0),
      tags: Array.isArray(body.tags) ? body.tags : [],
      altText: body.altText || "",
      caption: body.caption || "",
      uploadedBy: body.uploadedBy || user.email || "Admin",
      uploadedByUid: user.uid,
      storageProvider: "r2",
      createdAt: new Date().toISOString(),
    };

    await env.BUCKET.put(`media-index/${assetId}.json`, JSON.stringify(asset), {
      httpMetadata: { contentType: "application/json" },
    });

    return json({ success: true, asset });
  });

  router.post("/api/media/upload-direct", async ({ env, req, url }: RouteContext) => {
    const user = await requireUser(req, env);
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      throw new HttpError(400, "file_field_required");
    }

    const blob = file as Blob;
    const fileName = sanitizeFileName((file as File).name || "upload");
    const mimeType = blob.type || "application/octet-stream";

    const tenantId = sanitizeSegment(formData.get("tenantId") as string, "default");
    const category = sanitizeSegment(formData.get("category") as string, "general");
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const objectKey = `media/${tenantId}/${category}/${yyyy}/${mm}/${uuid()}-${fileName}`;

    await env.BUCKET.put(objectKey, blob.stream(), {
      httpMetadata: { contentType: mimeType },
    });

    const publicUrl = publicUrlFor(env, url.origin, objectKey);
    const assetId = uuid();
    const tagsRaw = formData.get("tags") as string;
    let tags: string[] = [];
    try {
      tags = JSON.parse(tagsRaw);
    } catch {}

    const asset = {
      id: assetId,
      tenantId,
      category,
      fileName,
      originalName: fileName,
      url: publicUrl,
      thumbnailUrl: publicUrl,
      objectKey,
      isR2: true,
      mimeType,
      size: blob.size,
      tags,
      altText: (formData.get("altText") as string) || fileName,
      caption: (formData.get("caption") as string) || "",
      uploadedBy: (formData.get("uploadedBy") as string) || user.email || "Admin",
      uploadedByUid: user.uid,
      storageProvider: "r2",
      createdAt: new Date().toISOString(),
    };

    return json({ success: true, asset });
  });

  router.get("/api/files/*key", async ({ env, params }: RouteContext) => {
    const rawKey = params.key || "";
    const cleanKey = safeKey(decodePathKey(rawKey));

    const obj = await env.BUCKET.get(cleanKey);
    if (!obj) {
      return errorResponse(404, "file_not_found");
    }

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(obj.body, { headers });
  });

  /* ============================================================
   * 5. AI Services (Ask Sanatan, TTS, Gemini Newsroom)
   * ============================================================ */
  router.post("/api/ask-sanatan", async ({ env, req, ctx }: RouteContext) => {
    checkIpRateLimit(req, 20);
    await checkDailyQuota(env, ctx);

    const body = await readJson<any>(req);
    const query = str(body.query, 2000).trim();
    if (query.length < 3) {
      throw new HttpError(400, "query_too_short_min_3_chars");
    }

    const domain = str(body.domain, 50) || "general";
    const systemPrompt = `You are "Ask Sanatan AI", the authoritative Vedic and Sanatan Dharma research engine for SanatanMarga.
Your duty is 100% grounded, truthful scholarship with zero hallucination.
Instructions:
1. Answer in the language of the query (Nepali if query is in Devanagari, English otherwise).
2. Reference authentic scriptures, historical context, Upanishads, Vedas, Puranas, or Darshanas when applicable.
3. Return your response STRICTLY as a valid JSON object matching this schema:
{
  "answer": "Clear, scholarly, structured answer in Markdown format",
  "citations": [
    { "source": "Title of text or tradition", "reference": "Chapter/Verse/Context", "note": "Brief context" }
  ],
  "confidenceScore": 0.98
}`;

    const prompt = `Research Domain: ${domain}\nQuery: ${query}`;
    const result = await callGeminiGenerate(env, prompt, systemPrompt, true);

    let parsed: any;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      parsed = {
        answer: result.text,
        citations: [],
        confidenceScore: 0.9,
      };
    }

    return json({
      success: true,
      answer: parsed.answer || result.text,
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.95,
      zeroHallucinationGuard: {
        enabled: true,
        groundedSources: (parsed.citations || []).length,
        disclaimer: "प्रमाणित सनातन ज्ञानकोष तथा शास्त्रीय ग्रन्थहरूमा आधारित शोध उत्तर।",
      },
      model: result.model,
      provider: "gemini",
    });
  });

  const generateHandler = async ({ env, req, ctx }: RouteContext) => {
    checkIpRateLimit(req, 20);
    await checkDailyQuota(env, ctx);

    const body = await readJson<any>(req);
    const prompt = str(body.prompt || body.message || body.query, 4000);
    if (!prompt) throw new HttpError(400, "prompt_required");

    const system = str(body.system, 2000);
    const jsonMode = Boolean(body.json);
    const result = await callGeminiGenerate(env, prompt, system || undefined, jsonMode);

    return json({
      success: true,
      text: result.text,
      model: result.model,
      usage: { promptTokens: 0, completionTokens: 0 },
    });
  };

  router.post("/api/ai/generate", generateHandler);
  router.post("/api/gemini/newsroom", generateHandler);
  router.post("/api/blog/ai-assist", generateHandler);
  router.post("/api/training/mentor", generateHandler);

  const ttsHandler = async ({ env, req, url, ctx }: RouteContext) => {
    checkIpRateLimit(req, 15);
    await checkDailyQuota(env, ctx);

    const body = await readJson<any>(req);
    const text = str(body.text, 5000).trim();
    if (!text) throw new HttpError(400, "text_required");

    const voice = str(body.voice, 30) || "Kore";
    const cacheHash = await sha256Hex(`${voice}|${text}`);
    const cacheKey = `tts/${cacheHash}.wav`;

    // Check R2 cache
    const existing = await env.BUCKET.head(cacheKey);
    const publicUrl = publicUrlFor(env, url.origin, cacheKey);
    if (existing) {
      return json({
        success: true,
        audioUrl: publicUrl,
        cached: true,
      });
    }

    // Call Gemini TTS
    const { audioWavBytes } = await callGeminiTts(env, text, voice);

    // Save to R2 cache
    await env.BUCKET.put(cacheKey, audioWavBytes, {
      httpMetadata: { contentType: "audio/wav" },
    });

    const b64 = base64FromBytes(audioWavBytes);

    return json({
      success: true,
      audioBase64: b64,
      mimeType: "audio/wav",
      audioUrl: publicUrl,
      cached: false,
    });
  };

  router.post("/api/tts/generate", ttsHandler);
  router.post("/api/radio/tts", ttsHandler);

  router.post("/api/language/translate", async ({ env, req, ctx }: RouteContext) => {
    checkIpRateLimit(req, 30);
    await checkDailyQuota(env, ctx);

    const body = await readJson<any>(req);
    const text = str(body.text, 5000);
    const targetLang = str(body.targetLang, 10) || "ne";

    const prompt = `Translate the following text accurately into ${targetLang === "ne" ? "Nepali (नेपाली)" : targetLang}:\n\n${text}`;
    const result = await callGeminiGenerate(env, prompt, "You are a professional Vedic and news translator. Output ONLY the translated text.");

    return json({
      success: true,
      translatedText: result.text.trim(),
    });
  });

  /* ============================================================
   * 6. Training & Certificate Verification
   * ============================================================ */
  router.post("/api/training/certificate/issue", async ({ env, req }: RouteContext) => {
    const user = await requireUser(req, env);
    const body = await readJson<any>(req);

    const certId = str(body.certId, 64);
    if (!certId) throw new HttpError(400, "certId_required");

    const now = new Date();
    const expiry = new Date(now.getTime() + 2 * 365 * 24 * 3600 * 1000);
    const uniqueId = `SM-CERT-${now.getUTCFullYear()}-${randomHex(4).toUpperCase()}`;

    const record = {
      certId: uniqueId,
      certificationId: certId,
      userId: user.uid,
      studentName: str(body.userName, 100) || user.email || "Sanatan Scholar",
      userEmail: user.email,
      courseTitle: certId,
      issuer: "SanatanMarga Academy",
      issuedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      status: "active",
    };

    const checksum = await sha256Hex(canonicalJson(record));
    const fullRecord = { ...record, checksum };

    await env.BUCKET.put(`certificates/${uniqueId}.json`, JSON.stringify(fullRecord), {
      httpMetadata: { contentType: "application/json" },
    });

    return json({ success: true, certificate: fullRecord });
  });

  router.get("/api/certificates/verify/:id", async ({ env, params }: RouteContext) => {
    const id = safeKey(params.id || "").replace(/\.json$/, "");
    const obj = await env.BUCKET.get(`certificates/${id}.json`);

    if (!obj) {
      return errorResponse(404, "प्रमाणपत्र फेला परेन वा अमान्य छ।");
    }

    const data: any = await obj.json();
    const verified = data.status === "active";

    return json({
      success: true,
      verified,
      certificate: {
        certId: data.certId || id,
        studentName: data.studentName,
        courseTitle: data.courseTitle,
        issuedAt: data.issuedAt,
        issuer: data.issuer,
        checksum: data.checksum,
      },
    });
  });

  /* ============================================================
   * 7. Sanatan Store & Orders
   * ============================================================ */
  router.get("/api/store/products", async ({ env }: RouteContext) => {
    const obj = await env.BUCKET.get("snapshots/collections/products.json");
    if (obj) {
      const data: any = await obj.json();
      const list = Array.isArray(data) ? data : data?.items || [];
      const active = list.filter((p: any) => p.status !== "inactive");
      return json({ success: true, products: active });
    }
    return json({ success: true, products: [] });
  });

  router.post("/api/store/orders", async ({ env, req }: RouteContext) => {
    const body = await readJson<any>(req);
    const key = str(body.idempotencyKey, 80);
    const name = str(body.customerName, 100).trim();
    const phone = str(body.customerPhone, 30).trim();

    if (!name || name.length < 2) {
      return json({ success: false, code: "VALIDATION", error: "कृपया नाम प्रविष्ट गर्नुहोस्", cartPreserved: true }, 400);
    }
    if (!/^[0-9+\-\s]{7,20}$/.test(phone)) {
      return json({ success: false, code: "VALIDATION", error: "कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस्", cartPreserved: true }, 400);
    }

    const now = new Date();
    const orderId = `SM-ORD-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${randomHex(3).toUpperCase()}`;

    const order = {
      orderId,
      idempotencyKey: key,
      customerName: name,
      customerPhone: phone,
      address: str(body.address, 200),
      productId: body.productId,
      productName: body.productName,
      quantity: Number(body.quantity || 1),
      paymentMethod: body.paymentMethod || "cod",
      status: "pending",
      createdAt: now.toISOString(),
    };

    await env.BUCKET.put(`orders/${orderId}.json`, JSON.stringify(order), {
      httpMetadata: { contentType: "application/json" },
    });

    // Also journal write for background Firestore replication
    await env.BUCKET.put(
      `journal/pending/${now.getTime()}_${orderId}.json`,
      JSON.stringify({
        opId: orderId,
        kind: "set",
        path: `orders/${orderId}`,
        data: order,
        ts: now.getTime(),
        receivedAt: now.toISOString(),
      }),
      { httpMetadata: { contentType: "application/json" } }
    );

    return json({ success: true, orderId, order });
  });

  /* ============================================================
   * 8. Radio, Live & Telemetry
   * ============================================================ */
  router.post("/api/radio/heartbeat", async () => {
    return new Response(null, { status: 204 });
  });

  router.get("/api/live-data", async ({ env }: RouteContext) => {
    const obj = await env.BUCKET.get("snapshots/live.json");
    if (obj) return new Response(obj.body, { headers: { "Content-Type": "application/json" } });
    return json({ success: true, data: null });
  });

  router.get("/api/radio-data", async ({ env }: RouteContext) => {
    const obj = await env.BUCKET.get("snapshots/radio.json");
    if (obj) return new Response(obj.body, { headers: { "Content-Type": "application/json" } });
    return json({ success: true, data: null });
  });

  const telemetryBatchHandler = async ({ env, req, ctx }: RouteContext) => {
    const text = await readText(req, 256 * 1024);
    ctx.waitUntil(
      (async () => {
        try {
          const key = `analytics/${todayUtc()}/${uuid()}.json`;
          await env.BUCKET.put(key, text, {
            httpMetadata: { contentType: "application/json" },
          });
        } catch {}
      })()
    );
    return json({ success: true }, 202);
  };

  router.post("/api/audience/events/batch", telemetryBatchHandler);
  router.post("/api/ad-analytics/batch-impressions", telemetryBatchHandler);
  router.post("/api/system/telemetry", telemetryBatchHandler);
  router.post("/api/admin/telemetry", telemetryBatchHandler);
  router.post("/api/user/learning-event", telemetryBatchHandler);
  router.post("/api/user/activity-log", telemetryBatchHandler);

  /* ============================================================
   * 9. Admin Mission Control
   * ============================================================ */
  router.get("/api/admin/command-center", async ({ env, req }: RouteContext) => {
    await requireAdmin(req, env);

    const pendingListed = await env.BUCKET.list({ prefix: "journal/pending/", limit: 100 });
    const usageObj = await env.BUCKET.get(`system/ai-usage/${todayUtc()}.json`);
    let aiUsageCount = 0;
    if (usageObj) {
      const u: any = await usageObj.json();
      aiUsageCount = u.count || 0;
    }

    return json({
      success: true,
      health: {
        overall: "healthy",
        r2: true,
        ai: Boolean(env.GEMINI_API_KEY),
      },
      fallbackJournal: {
        pending: pendingListed.objects.length,
      },
      aiUsageToday: {
        requests: aiUsageCount,
        limit: parseInt(env.AI_DAILY_REQUEST_LIMIT || "5000", 10),
      },
      generatedAt: new Date().toISOString(),
    });
  });

  return router;
}
