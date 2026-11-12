import { auth } from "@/src/lib/firebase";

export function resetRotatingAiCache() {
  // No-op client side
}

const prepareAuthHeaders = async (forceRefresh = false): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!auth.currentUser && typeof window !== "undefined") {
    await new Promise<void>((resolve) => {
      const unsub = auth.onAuthStateChanged(() => {
        unsub();
        resolve();
      });
      setTimeout(() => { unsub(); resolve(); }, 1200);
    });
  }

  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken(forceRefresh);
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
      headers["X-User-Uid"] = auth.currentUser.uid;
      if (auth.currentUser.email) headers["X-User-Email"] = auth.currentUser.email;
      if (auth.currentUser.displayName) headers["X-User-Name"] = auth.currentUser.displayName;
    } catch (e) {
      console.warn("Could not get auth ID token for AI proxy:", e);
    }
  }
  return headers;
};

export const generateWithRotation = async (options: {
  model: string;
  contents: any;
  config?: any;
  category?: string;
  moduleName?: string;
  requestId?: string;
}) => {
  const headers = await prepareAuthHeaders(false);

  const reqPayload = {
    ...options,
    requestId: options.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    moduleName: options.moduleName || "AI_NEWSROOM"
  };

  console.log(`[AI_NEWSROOM] Dispatching AI rotation request (module=${reqPayload.moduleName}, model=${options.model}, category=${options.category || 'general'}, reqId=${reqPayload.requestId})`);

  const baseUrl = typeof window !== "undefined" ? "" : (process.env.API_BASE_URL || "http://localhost:3000");
  let res = await fetch(`${baseUrl}/api/gemini/generate-with-rotation`, {
    method: "POST",
    headers,
    body: JSON.stringify(reqPayload),
  });

  // If 401 Unauthorized and user is logged in, force refresh token and retry once
  if (res.status === 401 && auth.currentUser) {
    console.log("[rotatingAiService] Received 401, force refreshing auth token and retrying request...");
    const refreshedHeaders = await prepareAuthHeaders(true);
    res = await fetch(`${baseUrl}/api/gemini/generate-with-rotation`, {
      method: "POST",
      headers: refreshedHeaders,
      body: JSON.stringify(reqPayload),
    });
  }

  let rawText = await res.text();
  let trimmedText = rawText.trim();
  const isHtml = trimmedText.toLowerCase().startsWith("<!doctype") || 
                 trimmedText.toLowerCase().startsWith("<html") || 
                 res.headers.get("content-type")?.includes("text/html");

  if (isHtml) {
    console.error("[rotatingAiService] API endpoint returned HTML instead of JSON:", trimmedText.slice(0, 200));
    const error = new Error("AI सेवा अस्थायी रूपमा व्यस्त छ (Gateway Timeout)। कृपया केही बेरमा पुनः प्रयास गर्नुहोस्।");
    (error as any).status = res.status;
    (error as any).isInvalidHtmlResponse = true;
    (error as any).isGatewayTimeout = true;
    (error as any).code = "DISCOVERY_API_INVALID_RESPONSE";
    throw error;
  }

  if (!res.ok) {
    let parsedErr = rawText;
    let parsedObj: any = null;
    try {
      parsedObj = JSON.parse(rawText);
      parsedErr = parsedObj.error || rawText;
    } catch {}
    
    const isQuota = res.status === 429 || 
                    parsedErr.includes("429") || 
                    parsedErr.includes("RESOURCE_EXHAUSTED") || 
                    parsedErr.toLowerCase().includes("quota");

    const userFriendlyMsg = isQuota
      ? "AI Discovery अहिले उपलब्ध छैन। API quota समाप्त भएको छ।"
      : parsedErr || `API Server Error (Status ${res.status})`;

    const error = new Error(userFriendlyMsg);
    (error as any).response = parsedObj || rawText;
    (error as any).status = res.status;
    (error as any).isQuotaError = isQuota;
    (error as any).code = isQuota ? "AI_QUOTA_EXHAUSTED" : "API_ERROR";
    throw error;
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    console.error("[rotatingAiService] JSON parse error on response:", rawText.slice(0, 200));
    const error = new Error("DISCOVERY_API_INVALID_RESPONSE");
    (error as any).status = res.status;
    (error as any).isInvalidHtmlResponse = true;
    (error as any).code = "DISCOVERY_API_INVALID_RESPONSE";
    throw error;
  }

  if (!data.success) {
    const isQuota = data.code === "AI_QUOTA_EXHAUSTED" || (data.error && data.error.includes("429"));
    const error = new Error(data.error || "AI generation failed");
    (error as any).response = data;
    (error as any).isQuotaError = isQuota;
    (error as any).code = isQuota ? "AI_QUOTA_EXHAUSTED" : (data.code || "API_ERROR");
    throw error;
  }

  if (data.modelUsed) {
    console.log(`[AI_MODEL_CALL_SUCCESS] (module=${reqPayload.moduleName}, modelUsed=${data.modelUsed}, reqId=${reqPayload.requestId})`);
  }

  return data.response;
};

