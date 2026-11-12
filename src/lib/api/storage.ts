/**
 * Storage Implementation
 * Supports: Firebase Storage (primary) + Cloudflare R2 (fallback/CDN)
 * Demo mode uses localStorage/IndexedDB for metadata + blob URLs
 */

import type {
  IStorage,
  StorageMetadata,
  UploadResult,
  ResumableUpload,
  ListOptions,
  ListResult,
  StorageItem,
} from "./config";

export type {
  IStorage,
  StorageMetadata,
  UploadResult,
  ResumableUpload,
  ListOptions,
  ListResult,
  StorageItem,
};

/* ============================================================
 * Demo/Local Storage
 * ============================================================ */

class DemoStorage implements IStorage {
  private metadata = new Map<string, StorageMetadata>();
  private blobs = new Map<string, Blob>();

  async upload(path: string, data: Blob | ArrayBuffer | ReadableStream, metadata?: StorageMetadata): Promise<UploadResult> {
    const blob = data instanceof Blob ? data : data instanceof ArrayBuffer ? new Blob([data]) : await this.streamToBlob(data);
    this.blobs.set(path, blob);
    this.metadata.set(path, metadata || { contentType: blob.type || "application/octet-stream" });

    const url = URL.createObjectURL(blob);
    const hash = await this.sha256(blob);

    return {
      path,
      size: blob.size,
      md5Hash: hash.slice(0, 32),
      downloadUrl: url,
      metadata: this.metadata.get(path)!,
    };
  }

  async uploadResumable(path: string, data: Blob, metadata?: StorageMetadata): Promise<ResumableUpload> {
    let paused = false;
    let cancelled = false;
    let progress = 0;
    let progressCb: ((bytes: number, total: number) => void) | null = null;

    const promise = (async () => {
      const chunkSize = 1024 * 1024; // 1MB chunks
      const chunks = Math.ceil(data.size / chunkSize);

      for (let i = 0; i < chunks; i++) {
        if (cancelled) throw new Error("Cancelled");
        while (paused) await new Promise(r => setTimeout(r, 100));

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, data.size);
        progress = end;

        progressCb?.(progress, data.size);
        await new Promise(r => setTimeout(r, 10)); // Simulate upload
      }

      return this.upload(path, data, metadata);
    })();

    return {
      path,
      pause: async () => { paused = true; },
      resume: async () => { paused = false; },
      cancel: async () => { cancelled = true; },
      onProgress: (cb) => { progressCb = cb; return () => { progressCb = null; }; },
      promise,
    };
  }

  async download(path: string): Promise<Blob> {
    const blob = this.blobs.get(path);
    if (!blob) throw new Error(`Not found: ${path}`);
    return blob;
  }

  async getDownloadUrl(path: string): Promise<string> {
    const blob = this.blobs.get(path);
    if (!blob) throw new Error(`Not found: ${path}`);
    return URL.createObjectURL(blob);
  }

  async getSignedUrl(path: string, _expirationSeconds: number): Promise<string> {
    return this.getDownloadUrl(path);
  }

  async getMetadata(path: string): Promise<StorageMetadata> {
    const meta = this.metadata.get(path);
    if (!meta) throw new Error(`Not found: ${path}`);
    return meta;
  }

  async updateMetadata(path: string, metadata: StorageMetadata): Promise<void> {
    this.metadata.set(path, metadata);
  }

  async delete(path: string): Promise<void> {
    this.blobs.delete(path);
    this.metadata.delete(path);
  }

  async deleteMultiple(paths: string[]): Promise<void> {
    for (const p of paths) await this.delete(p);
  }

  async list(prefix: string, options?: ListOptions): Promise<ListResult> {
    const items: StorageItem[] = [];
    const prefixes = new Set<string>();

    for (const [path, blob] of this.blobs) {
      if (path.startsWith(prefix)) {
        const relative = path.slice(prefix.length);
        const parts = relative.split("/");
        if (parts.length === 1) {
          items.push({
            path,
            name: parts[0],
            size: blob.size,
            md5Hash: (await this.sha256(blob)).slice(0, 32),
            updated: new Date(),
            metadata: this.metadata.get(path) || {},
          });
        } else {
          prefixes.add(parts[0]);
        }
      }
    }

    const maxResults = options?.maxResults || 1000;
    return {
      items: items.slice(0, maxResults),
      prefixes: Array.from(prefixes),
      nextPageToken: items.length > maxResults ? "more" : undefined,
    };
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    const blob = this.blobs.get(sourcePath);
    const meta = this.metadata.get(sourcePath);
    if (!blob) throw new Error(`Source not found: ${sourcePath}`);
    await this.upload(destPath, blob, meta);
  }

  async move(sourcePath: string, destPath: string): Promise<void> {
    await this.copy(sourcePath, destPath);
    await this.delete(sourcePath);
  }

  private async streamToBlob(stream: ReadableStream): Promise<Blob> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks);
  }

  private async sha256(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
}

/* ============================================================
 * Firebase Storage Implementation
 * ============================================================ */

class FirebaseStorage implements IStorage {
  private storage: any;
  private bucket: string;

  constructor(config: any) {
    this.bucket = config.storageBucket;
    this.initializeApp(config);
  }

  private initializeApp(config: any) {
    import("firebase/app").then(({ initializeApp, getApps }) => {
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      return import("firebase/storage").then((storageMod: any) => ({ app, storageMod }));
    }).then(({ app, storageMod }: any) => {
      this.storage = storageMod.getStorage(app);
      if (config.useEmulator && storageMod.connectStorageEmulator) {
        storageMod.connectStorageEmulator(this.storage, config.emulatorHost || "localhost", config.emulatorPort || 9199);
      }
    }).catch(console.error);
  }

  private ensureStorage() {
    if (!this.storage) throw new Error("Firebase Storage not initialized");
    return this.storage;
  }

  async upload(path: string, data: Blob | ArrayBuffer | ReadableStream, metadata?: StorageMetadata): Promise<UploadResult> {
    const { ref, uploadBytesResumable, getDownloadURL, getMetadata } = await import("firebase/storage");
    const storageRef = ref(this.ensureStorage(), path);
    const blob = data instanceof Blob ? data : data instanceof ArrayBuffer ? new Blob([data]) : await this.streamToBlob(data);

    const snapshot = await uploadBytesResumable(storageRef, blob, {
      contentType: metadata?.contentType || blob.type,
      customMetadata: metadata?.customMetadata,
      cacheControl: metadata?.cacheControl,
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    const meta = await getMetadata(snapshot.ref);

    return {
      path,
      size: blob.size,
      md5Hash: meta.md5Hash || "",
      downloadUrl,
      metadata: {
        contentType: meta.contentType,
        cacheControl: meta.cacheControl,
        customMetadata: meta.customMetadata,
        md5Hash: meta.md5Hash,
      },
    };
  }

  async uploadResumable(path: string, data: Blob, metadata?: StorageMetadata): Promise<ResumableUpload> {
    const { ref, uploadBytesResumable, getDownloadURL, getMetadata } = await import("firebase/storage");
    const storageRef = ref(this.ensureStorage(), path);

    const uploadTask = uploadBytesResumable(storageRef, data, {
      contentType: metadata?.contentType || data.type,
      customMetadata: metadata?.customMetadata,
      cacheControl: metadata?.cacheControl,
    });

    let progressCb: ((bytes: number, total: number) => void) | null = null;
    uploadTask.on("state_changed", (snap: any) => {
      progressCb?.(snap.bytesTransferred, snap.totalBytes);
    });

    return {
      path,
      pause: async () => uploadTask.pause(),
      resume: async () => uploadTask.resume(),
      cancel: async () => uploadTask.cancel(),
      onProgress: (cb) => { progressCb = cb; return () => { progressCb = null; }; },
      promise: (async () => {
        await uploadTask;
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        const meta = await getMetadata(uploadTask.snapshot.ref);
        return {
          path,
          size: data.size,
          md5Hash: meta.md5Hash || "",
          downloadUrl,
          metadata: {
            contentType: meta.contentType,
            cacheControl: meta.cacheControl,
            customMetadata: meta.customMetadata,
            md5Hash: meta.md5Hash,
          },
        };
      })(),
    };
  }

  async download(path: string): Promise<Blob> {
    const { ref, getDownloadURL } = await import("firebase/storage");
    const url = await getDownloadURL(ref(this.ensureStorage(), path));
    const res = await fetch(url);
    return res.blob();
  }

  async getDownloadUrl(path: string): Promise<string> {
    const { ref, getDownloadURL } = await import("firebase/storage");
    return getDownloadURL(ref(this.ensureStorage(), path));
  }

  async getSignedUrl(path: string, expirationSeconds: number): Promise<string> {
    // Firebase doesn't natively support signed URLs for Storage
    // Would need Cloud Function or use download URL with short TTL
    return this.getDownloadUrl(path);
  }

  async getMetadata(path: string): Promise<StorageMetadata> {
    const { ref, getMetadata } = await import("firebase/storage");
    const meta = await getMetadata(ref(this.ensureStorage(), path));
    return {
      contentType: meta.contentType,
      cacheControl: meta.cacheControl,
      customMetadata: meta.customMetadata,
      md5Hash: meta.md5Hash,
    };
  }

  async updateMetadata(path: string, metadata: StorageMetadata): Promise<void> {
    const { ref, updateMetadata } = await import("firebase/storage");
    await updateMetadata(ref(this.ensureStorage(), path), {
      contentType: metadata.contentType,
      cacheControl: metadata.cacheControl,
      customMetadata: metadata.customMetadata,
    });
  }

  async delete(path: string): Promise<void> {
    const { ref, deleteObject } = await import("firebase/storage");
    await deleteObject(ref(this.ensureStorage(), path));
  }

  async deleteMultiple(paths: string[]): Promise<void> {
    const { ref, deleteObject } = await import("firebase/storage");
    await Promise.all(paths.map(p => deleteObject(ref(this.ensureStorage(), p))));
  }

  async list(prefix: string, options?: ListOptions): Promise<ListResult> {
    const { ref, listAll, getMetadata } = await import("firebase/storage");
    const listRef = ref(this.ensureStorage(), prefix);
    const res = await listAll(listRef);

    const items: StorageItem[] = [];
    for (const itemRef of res.items) {
      const meta = await getMetadata(itemRef);
      items.push({
        path: itemRef.fullPath,
        name: itemRef.name,
        size: meta.size,
        md5Hash: meta.md5Hash || "",
        updated: new Date(meta.updated),
        metadata: {
          contentType: meta.contentType,
          cacheControl: meta.cacheControl,
          customMetadata: meta.customMetadata,
          md5Hash: meta.md5Hash,
        },
      });
    }

    return {
      items: items.slice(0, options?.maxResults || 1000),
      prefixes: res.prefixes.map((p: any) => p.fullPath),
    };
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    // Firebase Storage doesn't have server-side copy
    const blob = await this.download(sourcePath);
    const meta = await this.getMetadata(sourcePath);
    await this.upload(destPath, blob, meta);
  }

  async move(sourcePath: string, destPath: string): Promise<void> {
    await this.copy(sourcePath, destPath);
    await this.delete(sourcePath);
  }

  private async streamToBlob(stream: ReadableStream): Promise<Blob> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks);
  }
}

/* ============================================================
 * Cloudflare R2 Storage Implementation
 * ============================================================ */

class R2Storage implements IStorage {
  private config: any;
  private baseUrl: string;

  constructor(config: any) {
    this.config = config;
    this.baseUrl = config.publicUrl || `https://${config.bucket}.${config.accountId}.r2.dev`;
  }

  private async signRequest(method: string, path: string, body?: any, headers?: Record<string, string>): Promise<RequestInit> {
    const { Signer } = await import("@aws-sdk/signature-v4");
    const { Sha256 } = await import("@aws-crypto/sha256-js");
    const { defaultProvider } = await import("@aws-sdk/credential-provider-node");

    const signer = new Signer({
      credentials: defaultProvider(),
      region: "auto",
      service: "s3",
      sha256: Sha256,
    });

    const url = new URL(`${this.baseUrl}${path}`);
    const request = new Request(url.toString(), {
      method,
      body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      headers: { "Content-Type": "application/octet-stream", ...headers },
    });

    const signed = await signer.sign(request);
    return signed;
  }

  async upload(path: string, data: Blob | ArrayBuffer | ReadableStream, metadata?: StorageMetadata): Promise<UploadResult> {
    const blob = data instanceof Blob ? data : data instanceof ArrayBuffer ? new Blob([data]) : await this.streamToBlob(data);
    const arrayBuffer = await blob.arrayBuffer();

    const init = await this.signRequest("PUT", path, arrayBuffer, {
      "Content-Type": metadata?.contentType || blob.type,
      "Content-Length": blob.size.toString(),
      "x-amz-meta-custom": JSON.stringify(metadata?.customMetadata || {}),
    });

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, body: arrayBuffer });
    if (!res.ok) throw new Error(`R2 PUT failed: ${res.status} ${res.statusText}`);

    const hash = await this.sha256(blob);
    const downloadUrl = `${this.baseUrl}${path}`;

    return {
      path,
      size: blob.size,
      md5Hash: hash.slice(0, 32),
      downloadUrl,
      metadata: metadata || { contentType: blob.type },
    };
  }

  async uploadResumable(path: string, data: Blob, metadata?: StorageMetadata): Promise<ResumableUpload> {
    // R2 supports multipart upload for large files
    // For simplicity, we'll use single PUT with progress simulation
    let progressCb: ((bytes: number, total: number) => void) | null = null;

    const promise = (async () => {
      const chunkSize = 5 * 1024 * 1024; // 5MB
      const chunks = Math.ceil(data.size / chunkSize);

      if (chunks === 1) {
        return this.upload(path, data, metadata);
      }

      // Multipart upload
      const { createMultipartUpload, uploadPart, completeMultipartUpload } = await import("@aws-sdk/client-s3");
      const { S3Client } = await import("@aws-sdk/client-s3");

      const client = new S3Client({
        region: "auto",
        endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      const uploadId = await client.send(createMultipartUpload({
        Bucket: this.config.bucket,
        Key: path,
        ContentType: metadata?.contentType || data.type,
        Metadata: metadata?.customMetadata,
      })).then(r => r.UploadId);

      const parts: any[] = [];
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, data.size);
        const chunk = data.slice(start, end);
        const arrayBuffer = await chunk.arrayBuffer();

        const part = await client.send(uploadPart({
          Bucket: this.config.bucket,
          Key: path,
          UploadId: uploadId,
          PartNumber: i + 1,
          Body: new Uint8Array(arrayBuffer),
        }));

        parts.push({ ETag: part.ETag, PartNumber: i + 1 });
        progressCb?.(end, data.size);
      }

      await client.send(completeMultipartUpload({
        Bucket: this.config.bucket,
        Key: path,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }));

      const hash = await this.sha256(data);
      return {
        path,
        size: data.size,
        md5Hash: hash.slice(0, 32),
        downloadUrl: `${this.baseUrl}${path}`,
        metadata: metadata || { contentType: data.type },
      };
    })();

    return {
      path,
      pause: async () => {},
      resume: async () => {},
      cancel: async () => {},
      onProgress: (cb) => { progressCb = cb; return () => { progressCb = null; }; },
      promise,
    };
  }

  async download(path: string): Promise<Blob> {
    const init = await this.signRequest("GET", path);
    const res = await fetch(`${this.baseUrl}${path}`, init);
    if (!res.ok) throw new Error(`R2 GET failed: ${res.status}`);
    return res.blob();
  }

  async getDownloadUrl(path: string): Promise<string> {
    return `${this.baseUrl}${path}`;
  }

  async getSignedUrl(path: string, expirationSeconds: number): Promise<string> {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    const command = new GetObjectCommand({ Bucket: this.config.bucket, Key: path });
    return getSignedUrl(client, command, { expiresIn: expirationSeconds });
  }

  async getMetadata(path: string): Promise<StorageMetadata> {
    const { S3Client, HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    const res = await client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: path }));
    return {
      contentType: res.ContentType,
      cacheControl: res.CacheControl,
      customMetadata: res.Metadata ? JSON.parse(res.Metadata.custom || "{}") : undefined,
      md5Hash: res.ETag?.replace(/"/g, ""),
    };
  }

  async updateMetadata(path: string, metadata: StorageMetadata): Promise<void> {
    const { S3Client, CopyObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    await client.send(new CopyObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
      CopySource: `${this.config.bucket}/${path}`,
      MetadataDirective: "REPLACE",
      ContentType: metadata.contentType,
      CacheControl: metadata.cacheControl,
      Metadata: metadata.customMetadata,
    }));
  }

  async delete(path: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    await client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: path }));
  }

  async deleteMultiple(paths: string[]): Promise<void> {
    const { S3Client, DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    await client.send(new DeleteObjectsCommand({
      Bucket: this.config.bucket,
      Delete: { Objects: paths.map(p => ({ Key: p })) },
    }));
  }

  async list(prefix: string, options?: ListOptions): Promise<ListResult> {
    const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    const res = await client.send(new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix,
      MaxKeys: options?.maxResults || 1000,
      ContinuationToken: options?.pageToken,
      Delimiter: "/",
    }));

    const items: StorageItem[] = (res.Contents || []).map(obj => ({
      path: obj.Key!,
      name: obj.Key!.split("/").pop()!,
      size: obj.Size!,
      md5Hash: obj.ETag?.replace(/"/g, "") || "",
      updated: obj.LastModified!,
      metadata: {},
    }));

    const prefixes = (res.CommonPrefixes || []).map(p => p.Prefix!);

    return {
      items,
      prefixes,
      nextPageToken: res.NextContinuationToken,
    };
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    const { S3Client, CopyObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    await client.send(new CopyObjectCommand({
      Bucket: this.config.bucket,
      Key: destPath,
      CopySource: `${this.config.bucket}/${sourcePath}`,
    }));
  }

  async move(sourcePath: string, destPath: string): Promise<void> {
    await this.copy(sourcePath, destPath);
    await this.delete(sourcePath);
  }

  private async streamToBlob(stream: ReadableStream): Promise<Blob> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks);
  }

  private async sha256(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
}

/* ============================================================
 * Hybrid Storage (Firebase + R2)
 * ============================================================ */

export class HybridStorage implements IStorage {
  private primary: IStorage;
  private fallback: IStorage;
  private mode: "primary" | "fallback" | "both";

  constructor(primary: IStorage, fallback: IStorage, mode: "primary" | "fallback" | "both" = "both") {
    this.primary = primary;
    this.fallback = fallback;
    this.mode = mode;
  }

  async upload(path: string, data: Blob | ArrayBuffer | ReadableStream, metadata?: StorageMetadata): Promise<UploadResult> {
    if (this.mode === "fallback") return this.fallback.upload(path, data, metadata);

    try {
      const result = await this.primary.upload(path, data, metadata);
      if (this.mode === "both") {
        this.fallback.upload(path, data, metadata).catch(console.warn);
      }
      return result;
    } catch (e) {
      console.warn("[HybridStorage] Primary upload failed, trying fallback:", e);
      return this.fallback.upload(path, data, metadata);
    }
  }

  async uploadResumable(path: string, data: Blob, metadata?: StorageMetadata): Promise<ResumableUpload> {
    if (this.mode === "fallback") return this.fallback.uploadResumable(path, data, metadata);
    return this.primary.uploadResumable(path, data, metadata);
  }

  async download(path: string): Promise<Blob> {
    try {
      return await this.primary.download(path);
    } catch {
      return this.fallback.download(path);
    }
  }

  async getDownloadUrl(path: string): Promise<string> {
    try {
      return await this.primary.getDownloadUrl(path);
    } catch {
      return this.fallback.getDownloadUrl(path);
    }
  }

  async getSignedUrl(path: string, expirationSeconds: number): Promise<string> {
    try {
      return await this.primary.getSignedUrl(path, expirationSeconds);
    } catch {
      return this.fallback.getSignedUrl(path, expirationSeconds);
    }
  }

  async getMetadata(path: string): Promise<StorageMetadata> {
    try {
      return await this.primary.getMetadata(path);
    } catch {
      return this.fallback.getMetadata(path);
    }
  }

  async updateMetadata(path: string, metadata: StorageMetadata): Promise<void> {
    await Promise.allSettled([
      this.primary.updateMetadata(path, metadata),
      this.fallback.updateMetadata(path, metadata),
    ]);
  }

  async delete(path: string): Promise<void> {
    await Promise.allSettled([
      this.primary.delete(path),
      this.fallback.delete(path),
    ]);
  }

  async deleteMultiple(paths: string[]): Promise<void> {
    await Promise.allSettled([
      this.primary.deleteMultiple(paths),
      this.fallback.deleteMultiple(paths),
    ]);
  }

  async list(prefix: string, options?: ListOptions): Promise<ListResult> {
    try {
      return await this.primary.list(prefix, options);
    } catch {
      return this.fallback.list(prefix, options);
    }
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    await Promise.allSettled([
      this.primary.copy(sourcePath, destPath),
      this.fallback.copy(sourcePath, destPath),
    ]);
  }

  async move(sourcePath: string, destPath: string): Promise<void> {
    await Promise.allSettled([
      this.primary.move(sourcePath, destPath),
      this.fallback.move(sourcePath, destPath),
    ]);
  }
}

/* ============================================================
 * Factory
 * ============================================================ */

export function createStorage(config: any): IStorage {
  if (config.mode === "demo" || !config.firebase) {
    return new DemoStorage();
  }

  if (config.mode === "firebase+r2" && config.r2) {
    return new HybridStorage(
      new FirebaseStorage(config.firebase),
      new R2Storage(config.r2),
      "both"
    );
  }

  if (config.mode === "firebase") {
    return new FirebaseStorage(config.firebase);
  }

  if (config.mode === "r2-only" && config.r2) {
    return new R2Storage(config.r2);
  }

  return new DemoStorage();
}