/**
 * AI Services Implementation
 * Supports: Gemini (Google AI), Vertex AI, OpenAI, Custom
 * Includes quota governance, cost tracking, and fallback
 */

import type {
  IAiService,
  GenerateOptions,
  GenerateResult,
  ChatMessage,
  ChatOptions,
  ChatResult,
  TtsOptions,
  TtsResult,
  VisionResult,
  QuotaStatus,
  CostEstimate,
  TokenUsage,
} from "./config";

export type { IAiService };

/* ============================================================
 * Quota Manager (shared across providers)
 * ============================================================ */

interface QuotaRecord {
  date: string; // YYYY-MM-DD
  tokens: number;
  requests: number;
  costUsd: number;
  byModel: Record<string, { tokens: number; requests: number; costUsd: number }>;
}

class QuotaManager {
  private config: any;
  private storageKey = "sm_ai_quota";

  constructor(config: any) {
    this.config = config;
  }

  private getTodayKey(): string {
    return new Date().toISOString().split("T")[0];
  }

  private load(): QuotaRecord {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { date: this.getTodayKey(), tokens: 0, requests: 0, costUsd: 0, byModel: {} };
  }

  private save(record: QuotaRecord): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(record));
    } catch {}
  }

  recordUsage(model: string, usage: TokenUsage, costUsd: number): void {
    const record = this.load();
    if (record.date !== this.getTodayKey()) {
      // Reset daily
      record.date = this.getTodayKey();
      record.tokens = 0;
      record.requests = 0;
      record.costUsd = 0;
      record.byModel = {};
    }

    record.tokens += usage.totalTokens;
    record.requests += 1;
    record.costUsd += costUsd;

    if (!record.byModel[model]) record.byModel[model] = { tokens: 0, requests: 0, costUsd: 0 };
    record.byModel[model].tokens += usage.totalTokens;
    record.byModel[model].requests += 1;
    record.byModel[model].costUsd += costUsd;

    this.save(record);
  }

  getStatus(): QuotaStatus {
    const record = this.load();
    const limits = {
      dailyTokens: this.config?.quota?.dailyTokenLimit || 1_000_000,
      dailyRequests: this.config?.quota?.dailyRequestLimit || 10_000,
      dailyCostUsd: this.config?.quota?.costAlertThreshold || 100,
    };

    return {
      used: { tokens: record.tokens, requests: record.requests, costUsd: record.costUsd },
      limits,
      remaining: {
        tokens: Math.max(0, limits.dailyTokens - record.tokens),
        requests: Math.max(0, limits.dailyRequests - record.requests),
        costUsd: Math.max(0, limits.dailyCostUsd - record.costUsd),
      },
      resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
      isExceeded: record.tokens >= limits.dailyTokens || record.requests >= limits.dailyRequests || record.costUsd >= limits.dailyCostUsd,
    };
  }

  checkQuota(estimatedTokens: number): { allowed: boolean; reason?: string } {
    const status = this.getStatus();
    if (status.isExceeded) return { allowed: false, reason: "Daily quota exceeded" };
    if (status.remaining.tokens < estimatedTokens) return { allowed: false, reason: "Insufficient token quota remaining" };
    return { allowed: true };
  }

  estimateCost(model: string, estimatedTokens: number): CostEstimate {
    // Rough pricing (update with actual provider pricing)
    const pricing: Record<string, { input: number; output: number }> = {
      "gemini-1.5-flash": { input: 0.000075, output: 0.0003 }, // per 1K tokens
      "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
      "gemini-2.5-flash": { input: 0.000075, output: 0.0003 },
      "gpt-4o": { input: 0.005, output: 0.015 },
      "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    };

    const p = pricing[model] || pricing["gemini-1.5-flash"];
    const inputTokens = estimatedTokens * 0.7;
    const outputTokens = estimatedTokens * 0.3;
    const costUsd = (inputTokens / 1000) * p.input + (outputTokens / 1000) * p.output;

    return { estimatedTokens, estimatedCostUsd: costUsd, model };
  }
}

/* ============================================================
 * Base AI Provider
 * ============================================================ */

abstract class BaseAiProvider implements IAiService {
  protected quota: QuotaManager;
  protected model: string;
  protected ttsModel?: string;

  constructor(config: any) {
    this.quota = new QuotaManager(config);
    this.model = config.model || "gemini-1.5-flash";
    this.ttsModel = config.ttsModel;
  }

  abstract generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  abstract generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T>;
  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
  abstract embed(text: string | string[]): Promise<number[][]>;
  abstract synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult>;
  abstract analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult>;

  getQuotaStatus(): Promise<QuotaStatus> {
    return Promise.resolve(this.quota.getStatus());
  }

  estimateCost(request: any): Promise<CostEstimate> {
    // Rough estimate based on prompt length
    const estimatedTokens = JSON.stringify(request).length / 3;
    return Promise.resolve(this.quota.estimateCost(this.model, estimatedTokens));
  }

  protected recordUsage(usage: TokenUsage): void {
    const costEstimate = this.quota.estimateCost(this.model, usage.totalTokens);
    this.quota.recordUsage(this.model, usage, costEstimate.estimatedCostUsd);
  }

  protected makeUsage(promptTokens: number, completionTokens: number): TokenUsage {
    return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
  }
}

/* ============================================================
 * Google Gemini Provider
 * ============================================================ */

class GeminiProvider extends BaseAiProvider {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(config: any) {
    super(config);
    this.apiKey = config.apiKey;
  }

  private async request(endpoint: string, body: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/${endpoint}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${res.status} - ${err.error?.message || res.statusText}`);
    }

    return res.json();
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
        stopSequences: options?.stopSequences,
        responseMimeType: options?.responseFormat === "json" ? "application/json" : "text/plain",
      },
      systemInstruction: options?.systemPrompt ? { parts: [{ text: options.systemPrompt }] } : undefined,
    };

    const data = await this.request(`models/${this.model}:generateContent`, body);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = this.makeUsage(
      data.usageMetadata?.promptTokenCount || 0,
      data.usageMetadata?.candidatesTokenCount || 0
    );

    this.recordUsage(usage);

    return {
      text,
      usage,
      model: this.model,
      finishReason: data.candidates?.[0]?.finishReason || "STOP",
    };
  }

  async generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      systemInstruction: options?.systemPrompt ? { parts: [{ text: options.systemPrompt }] } : undefined,
    };

    const data = await this.request(`models/${this.model}:generateContent`, body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const usage = this.makeUsage(
      data.usageMetadata?.promptTokenCount || 0,
      data.usageMetadata?.candidatesTokenCount || 0
    );
    this.recordUsage(usage);

    try {
      return JSON.parse(text) as T;
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) return JSON.parse(match[1]) as T;
      throw new Error("Failed to parse structured response");
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : m.role === "system" ? "user" : "user",
      parts: [{ text: m.content }],
    }));

    // Handle system prompt separately
    if (messages[0]?.role === "system") {
      contents.shift();
    }

    const body = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
      systemInstruction: messages[0]?.role === "system" ? { parts: [{ text: messages[0].content }] } : undefined,
      tools: options?.functions ? [{ functionDeclarations: options.functions }] : undefined,
      toolConfig: options?.functionCall ? {
        functionCallingConfig: {
          mode: options.functionCall === "auto" ? "AUTO" : "ANY",
          allowedFunctionNames: typeof options.functionCall === "object" && options.functionCall && "name" in options.functionCall ? [(options.functionCall as any).name] : undefined,
        },
      } : undefined,
    };

    const data = await this.request(`models/${this.model}:generateContent`, body);

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;

    const usage = this.makeUsage(
      data.usageMetadata?.promptTokenCount || 0,
      data.usageMetadata?.candidatesTokenCount || 0
    );
    this.recordUsage(usage);

    return {
      message: {
        role: "assistant",
        content: text,
        functionCall: functionCall ? { name: functionCall.name, args: functionCall.args } : undefined,
      },
      usage,
      model: this.model,
    };
  }

  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const body = { requests: texts.map(t => ({ model: "models/embedding-001", content: { parts: [{ text: t }] } })) };

    const data = await this.request("models/embedding-001:batchEmbedContents", body);
    return data.embeddings?.map((e: any) => e.values) || [];
  }

  async synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult> {
    const ttsModel = this.ttsModel || "gemini-2.5-flash-preview-tts";
    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: options?.voice || "Kore" },
          },
        },
      },
    };

    const data = await this.request(`models/${ttsModel}:generateContent`, body);

    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio data in response");

    const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const usage = this.makeUsage(text.length / 3, 0); // Rough estimate
    this.recordUsage(usage);

    return {
      audioData: audioBytes.buffer,
      format: options?.format || "mp3",
      durationSeconds: audioBytes.length / 16000, // Rough estimate for 16kHz
      usage,
    };
  }

  async analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult> {
    const imageData = typeof image === "string" ? image : await this.blobToBase64(image);
    const mimeType = typeof image === "string" ? "image/jpeg" : image.type || "image/jpeg";

    const body = {
      contents: [{
        parts: [
          { text: prompt || "Describe this image in detail." },
          { inlineData: { mimeType, data: imageData } },
        ],
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    };

    const data = await this.request(`models/${this.model}:generateContent`, body);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = this.makeUsage(
      data.usageMetadata?.promptTokenCount || 0,
      data.usageMetadata?.candidatesTokenCount || 0
    );
    this.recordUsage(usage);

    return { text, usage, model: this.model };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/* ============================================================
 * Vertex AI Provider (Google Cloud)
 * ============================================================ */

class VertexAiProvider extends BaseAiProvider {
  private projectId: string;
  private location: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: any) {
    super(config);
    this.projectId = config.projectId;
    this.location = config.location;
    this.model = config.model || "gemini-1.5-flash-001";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;

    // In production, use google-auth-library or gcloud auth
    // For now, expect token to be provided via env or fetched from metadata server
    this.accessToken = import.meta.env.VITE_VERTEX_ACCESS_TOKEN || "";
    this.tokenExpiry = Date.now() + 3600000; // 1 hour
    return this.accessToken;
  }

  private async request(endpoint: string, body: any): Promise<any> {
    const token = await this.getAccessToken();
    const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}${endpoint}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Vertex AI error: ${res.status} - ${err.error?.message || res.statusText}`);
    }

    return res.json();
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
      systemInstruction: options?.systemPrompt ? { parts: [{ text: options.systemPrompt }] } : undefined,
    };

    const data = await this.request(":generateContent", body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = this.makeUsage(data.usageMetadata?.promptTokenCount || 0, data.usageMetadata?.candidatesTokenCount || 0);
    this.recordUsage(usage);

    return { text, usage, model: this.model, finishReason: data.candidates?.[0]?.finishReason || "STOP" };
  }

  async generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 8192,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      systemInstruction: options?.systemPrompt ? { parts: [{ text: options.systemPrompt }] } : undefined,
    };

    const data = await this.request(":generateContent", body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const usage = this.makeUsage(data.usageMetadata?.promptTokenCount || 0, data.usageMetadata?.candidatesTokenCount || 0);
    this.recordUsage(usage);

    return JSON.parse(text) as T;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
      },
      systemInstruction: messages[0]?.role === "system" ? { parts: [{ text: messages[0].content }] } : undefined,
      tools: options?.functions ? [{ functionDeclarations: options.functions }] : undefined,
    };

    const data = await this.request(":generateContent", body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = this.makeUsage(data.usageMetadata?.promptTokenCount || 0, data.usageMetadata?.candidatesTokenCount || 0);
    this.recordUsage(usage);

    return { message: { role: "assistant", content: text }, usage, model: this.model };
  }

  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const embeddings: number[][] = [];

    for (const t of texts) {
      const data = await this.request(":predict", { instances: [{ content: t }], parameters: { model: "text-embedding-004" } });
      embeddings.push(data.predictions?.[0]?.embeddings?.values || []);
    }

    return embeddings;
  }

  async synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult> {
    // Vertex AI TTS uses different models
    throw new Error("TTS not implemented for Vertex AI provider");
  }

  async analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult> {
    const imageData = typeof image === "string" ? image : await this.blobToBase64(image);
    const mimeType = typeof image === "string" ? "image/jpeg" : image.type || "image/jpeg";

    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt || "Describe this image." },
          { inlineData: { mimeType, data: imageData } },
        ],
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    };

    const data = await this.request(":generateContent", body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = this.makeUsage(data.usageMetadata?.promptTokenCount || 0, data.usageMetadata?.candidatesTokenCount || 0);
    this.recordUsage(usage);

    return { text, usage, model: this.model };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/* ============================================================
 * OpenAI Provider
 * ============================================================ */

class OpenAiProvider extends BaseAiProvider {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(config: any) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4o-mini";
  }

  private async request(endpoint: string, body: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${res.status} - ${err.error?.message || res.statusText}`);
    }

    return res.json();
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const body = {
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: options?.topP ?? 0.95,
      stop: options?.stopSequences,
      response_format: options?.responseFormat === "json" ? { type: "json_object" } : undefined,
      system: options?.systemPrompt ? { role: "system", content: options.systemPrompt } : undefined,
    };

    const data = await this.request("/chat/completions", body);
    const text = data.choices?.[0]?.message?.content || "";
    const usage = this.makeUsage(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);
    this.recordUsage(usage);

    return { text, usage, model: this.model, finishReason: data.choices?.[0]?.finish_reason || "stop" };
  }

  async generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
    const body = {
      model: this.model,
      messages: [
        { role: "system", content: "Output valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: { type: "json_object" },
    };

    const data = await this.request("/chat/completions", body);
    const text = data.choices?.[0]?.message?.content || "{}";
    const usage = this.makeUsage(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);
    this.recordUsage(usage);

    return JSON.parse(text) as T;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const body = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content, name: m.name, function_call: m.functionCall })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: options?.topP ?? 0.95,
      functions: options?.functions,
      function_call: options?.functionCall,
    };

    const data = await this.request("/chat/completions", body);
    const choice = data.choices?.[0];
    const message = choice?.message;
    const usage = this.makeUsage(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);
    this.recordUsage(usage);

    return {
      message: {
        role: "assistant",
        content: message?.content || "",
        functionCall: message?.function_call ? { name: message.function_call.name, args: JSON.parse(message.function_call.arguments) } : undefined,
      },
      usage,
      model: this.model,
    };
  }

  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const data = await this.request("/embeddings", { model: "text-embedding-3-small", input: texts });
    return data.data.map((d: any) => d.embedding);
  }

  async synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult> {
    const data = await this.request("/audio/speech", {
      model: "tts-1",
      voice: options?.voice || "alloy",
      input: text,
      response_format: options?.format || "mp3",
      speed: options?.speed || 1.0,
    });

    const arrayBuffer = await data.arrayBuffer();
    const usage = this.makeUsage(text.length / 3, 0);
    this.recordUsage(usage);

    return {
      audioData: arrayBuffer,
      format: options?.format || "mp3",
      durationSeconds: arrayBuffer.byteLength / 16000,
      usage,
    };
  }

  async analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult> {
    const imageData = typeof image === "string" ? image : await this.blobToBase64(image);

    const body = {
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt || "Describe this image." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageData}` } },
        ],
      }],
      max_tokens: 4096,
    };

    const data = await this.request("/chat/completions", body);
    const text = data.choices?.[0]?.message?.content || "";
    const usage = this.makeUsage(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);
    this.recordUsage(usage);

    return { text, usage, model: "gpt-4o" };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/* ============================================================
 * Demo/Mock AI Provider (for local development)
 * ============================================================ */

class DemoAiProvider implements IAiService {
  private quota = new QuotaManager({ quota: { dailyTokenLimit: 1000000, dailyRequestLimit: 10000, costAlertThreshold: 100 } });

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    await new Promise(r => setTimeout(r, 500));
    const usage = { promptTokens: Math.ceil(prompt.length / 4), completionTokens: 100, totalTokens: Math.ceil(prompt.length / 4) + 100 };
    this.quota.recordUsage("demo", usage, 0);

    return {
      text: `[Demo AI] ${prompt.slice(0, 100)}... (simulated response)`,
      usage,
      model: "demo",
      finishReason: "STOP",
    };
  }

  async generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
    await new Promise(r => setTimeout(r, 300));
    const usage = { promptTokens: 50, completionTokens: 50, totalTokens: 100 };
    this.quota.recordUsage("demo", usage, 0);

    // Return mock data based on schema
    return this.mockStructured(schema) as T;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    await new Promise(r => setTimeout(r, 400));
    const lastMsg = messages[messages.length - 1]?.content || "";
    const usage = { promptTokens: 50, completionTokens: 50, totalTokens: 100 };
    this.quota.recordUsage("demo", usage, 0);

    return {
      message: { role: "assistant", content: `[Demo AI] Response to: ${lastMsg.slice(0, 100)}...` },
      usage,
      model: "demo",
    };
  }

  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    return texts.map(() => Array.from({ length: 768 }, () => Math.random() * 2 - 1));
  }

  async synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult> {
    await new Promise(r => setTimeout(r, 200));
    const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    this.quota.recordUsage("demo-tts", usage, 0);

    // Generate silence
    const sampleRate = options?.sampleRate || 16000;
    const duration = options?.format === "mp3" ? 2 : 1;
    const audioData = new ArrayBuffer(sampleRate * duration * 2);

    return {
      audioData,
      format: options?.format || "mp3",
      durationSeconds: duration,
      usage,
    };
  }

  async analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult> {
    await new Promise(r => setTimeout(r, 300));
    const usage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
    this.quota.recordUsage("demo-vision", usage, 0);

    return {
      text: `[Demo Vision] Analysis of image: ${prompt || "general description"}`,
      objects: [{ name: "object", confidence: 0.9, boundingBox: { x: 0, y: 0, width: 100, height: 100 } }],
      labels: ["demo", "simulated"],
      usage,
    };
  }

  getQuotaStatus(): Promise<QuotaStatus> {
    return Promise.resolve(this.quota.getStatus());
  }

  estimateCost(request: any): Promise<CostEstimate> {
    return Promise.resolve({ estimatedTokens: 100, estimatedCostUsd: 0, model: "demo" });
  }

  private mockStructured(schema: any): any {
    if (!schema || !schema.properties) return {};

    const result: any = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      const p = prop as any;
      switch (p.type) {
        case "string":
          result[key] = p.enum ? p.enum[0] : `mock_${key}`;
          break;
        case "number":
        case "integer":
          result[key] = p.minimum || 0;
          break;
        case "boolean":
          result[key] = true;
          break;
        case "array":
          result[key] = p.items ? [this.mockStructured(p.items)] : [];
          break;
        case "object":
          result[key] = this.mockStructured(p);
          break;
        default:
          result[key] = null;
      }
    }
    return result;
  }
}

/* ============================================================
 * Fallback AI Provider (tries multiple providers)
 * ============================================================ */

export class FallbackAiProvider implements IAiService {
  private providers: IAiService[];
  private currentIndex = 0;

  constructor(providers: IAiService[]) {
    this.providers = providers;
  }

  private async tryProviders<T>(fn: (provider: IAiService) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[(this.currentIndex + i) % this.providers.length];
      try {
        const result = await fn(provider);
        this.currentIndex = (this.currentIndex + i) % this.providers.length;
        return result;
      } catch (e) {
        lastError = e as Error;
        console.warn(`[FallbackAI] Provider failed: ${provider.constructor.name}`, e);
      }
    }

    throw lastError || new Error("All AI providers failed");
  }

  generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    return this.tryProviders(p => p.generateText(prompt, options));
  }

  generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
    return this.tryProviders(p => p.generateStructured(prompt, schema, options));
  }

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    return this.tryProviders(p => p.chat(messages, options));
  }

  embed(text: string | string[]): Promise<number[][]> {
    return this.tryProviders(p => p.embed(text));
  }

  synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult> {
    return this.tryProviders(p => p.synthesizeSpeech(text, options));
  }

  analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult> {
    return this.tryProviders(p => p.analyzeImage(image, prompt));
  }

  getQuotaStatus(): Promise<QuotaStatus> {
    return this.providers[this.currentIndex].getQuotaStatus();
  }

  estimateCost(request: any): Promise<CostEstimate> {
    return this.providers[this.currentIndex].estimateCost(request);
  }
}

/* ============================================================
 * Factory
 * ============================================================ */

export function createAiService(config: any): IAiService {
  if (!config.ai) {
    return new DemoAiProvider();
  }

  const providers: IAiService[] = [];

  switch (config.ai.provider) {
    case "gemini":
      if (config.ai.gemini?.apiKey) providers.push(new GeminiProvider(config.ai.gemini));
      break;
    case "vertex":
      if (config.ai.vertex?.projectId) providers.push(new VertexAiProvider(config.ai.vertex));
      break;
    case "openai":
      if (config.ai.openai?.apiKey) providers.push(new OpenAiProvider(config.ai.openai));
      break;
  }

  // Always add demo as final fallback
  providers.push(new DemoAiProvider());

  if (providers.length === 1) return providers[0];
  return new FallbackAiProvider(providers);
}