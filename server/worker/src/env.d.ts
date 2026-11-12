/**
 * Minimal ambient Cloudflare Workers types used by this worker.
 *
 * These exist so the project type-checks with plain TypeScript (lib: ES2022 + WebWorker)
 * without installing @cloudflare/workers-types. tsconfig sets `types: []`, so the
 * official package is never loaded implicitly and these declarations cannot clash with it.
 * If you prefer the official types, delete this file and add
 * "@cloudflare/workers-types" to `compilerOptions.types`.
 */

interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}

interface R2Object {
  readonly key: string;
  readonly version: string;
  readonly size: number;
  readonly etag: string;
  readonly httpEtag: string;
  readonly uploaded: Date;
  readonly httpMetadata?: R2HTTPMetadata;
  readonly customMetadata?: Record<string, string>;
  readonly range?: R2Range;
  writeHttpMetadata(headers: Headers): void;
}

interface R2ObjectBody extends R2Object {
  readonly body: ReadableStream<Uint8Array>;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

interface R2GetOptions {
  onlyIf?: R2Conditional | Headers;
  range?: R2Range | Headers;
}

interface R2PutOptions {
  onlyIf?: R2Conditional | Headers;
  httpMetadata?: R2HTTPMetadata | Headers;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer | string;
  sha256?: ArrayBuffer | string;
}

interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  startAfter?: string;
  include?: ("httpMetadata" | "customMetadata")[];
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob,
    options?: R2PutOptions,
  ): Promise<R2Object | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledEvent {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}
