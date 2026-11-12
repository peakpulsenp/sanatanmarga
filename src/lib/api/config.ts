/**
 * SanatanMarga Production API Abstraction Layer
 *
 * Provides unified interfaces for:
 * - Database (Firestore with Cloudflare R2 fallback)
 * - Storage (Firebase Storage with R2 fallback)
 * - AI Services (Gemini/Vertex AI with quota governance)
 * - Snapshot System (Static JSON + R2 distribution)
 * - Auth (Firebase Auth with local demo fallback)
 * - Real-time (Firestore listeners with polling fallback)
 * - Feature Flags (Feature Control OS integration)
 *
 * All services implement the same interface regardless of backend.
 * Environment variables control which backend is active.
 */

// ============================================================
// Types & Interfaces
// ============================================================

export type BackendMode = "demo" | "firebase" | "firebase+r2" | "r2-only" | "custom";

export interface ApiConfig {
  mode: BackendMode;
  firebase?: FirebaseConfig;
  r2?: R2Config;
  ai?: AiConfig;
  snapshot?: SnapshotConfig;
  features?: FeatureConfig;
}

export interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  // Emulator support
  useEmulator?: boolean;
  emulatorHost?: string;
  emulatorPort?: number;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string; // e.g. https://pub-xxx.r2.dev
  customDomain?: string; // e.g. https://assets.sanatanmarga.com
}

export interface AiConfig {
  provider: "gemini" | "vertex" | "openai" | "custom";
  gemini?: {
    apiKey: string;
    model?: string; // default: gemini-1.5-flash
    ttsModel?: string; // default: gemini-2.5-flash-preview-tts
  };
  vertex?: {
    projectId: string;
    location: string;
    model?: string;
  };
  openai?: {
    apiKey: string;
    model?: string;
  };
  quota?: {
    dailyTokenLimit?: number;
    dailyRequestLimit?: number;
    costAlertThreshold?: number; // USD
  };
}

export interface SnapshotConfig {
  enabled: boolean;
  // Static hosting (current mode)
  staticBaseUrl?: string; // e.g. /snapshots or https://cdn.sanatanmarga.com/snapshots
  // R2-backed dynamic snapshots
  r2Prefix?: string; // e.g. snapshots/
  // Generation
  generateOnWrite?: boolean;
  generateIntervalMs?: number;
  // Verification
  verifyIntegrity?: boolean;
}

export interface FeatureConfig {
  // Feature Control OS endpoint
  controlEndpoint?: string; // e.g. /api/cache/feature-control.json
  // Local fallback
  localDefaults?: Record<string, "off" | "admin_only" | "beta" | "public">;
  // Polling
  pollIntervalMs?: number;
}

// ============================================================
// Database Abstraction
// ============================================================

export type DocumentData = Record<string, any>;

export interface IDatabase {
  // Core CRUD
  getDoc<T>(pathOrRef: string | DocumentReference<T>): Promise<T | null>;
  setDoc<T>(pathOrRef: string | DocumentReference<T>, data: T, merge?: boolean): Promise<void>;
  updateDoc<T>(pathOrRef: string | DocumentReference<T>, data: Partial<T>): Promise<void>;
  deleteDoc(pathOrRef: string | DocumentReference<any>): Promise<void>;
  addDoc<T>(collectionPathOrRef: string | CollectionReference<T>, data: T): Promise<DocumentReference<T>>;

  // Queries
  getDocs<T>(collectionPathOrRef: string | CollectionReference<T> | Query<T>, constraints?: QueryConstraint[]): Promise<T[]>;

  // Realtime
  onSnapshot<T>(path: string, callback: (data: T[]) => void, options?: SnapshotOptions): () => void;
  onSnapshot<T>(ref: CollectionReference<T> | Query<T>, callback: (data: T[]) => void, options?: SnapshotOptions): () => void;
  onSnapshot<T>(ref: DocumentReference<T>, callback: (data: T | null) => void, options?: SnapshotOptions): () => void;

  // Batch/Transaction
  batch(): WriteBatch;
  runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;

  // Admin
  listCollections(path: string): Promise<string[]>;
  getCollectionSize(path: string): Promise<number>;

  // Query helpers
  where(field: string, op: string, value: any): QueryConstraint;
  orderBy(field: string, direction?: "asc" | "desc"): QueryConstraint;
  limit(value: number): QueryConstraint;
  startAfter?(value: any): QueryConstraint;
}

export interface DocumentReference<T = DocumentData> {
  id: string;
  path: string;
  parent: CollectionReference<T> | null;
  type?: "document";
}

export interface CollectionReference<T = DocumentData> {
  id: string;
  path: string;
  type?: "collection";
  parent?: CollectionReference<any> | null;
  collection?: CollectionReference<T>;
  constraints?: QueryConstraint[];
}

export interface Query<T = DocumentData> {
  path: string;
  constraints: QueryConstraint[];
  type?: "query";
  collection?: CollectionReference<T>;
}

export interface QueryConstraint {
  type: string;
  field?: string;
  operator?: string;
  op?: string;
  value?: any;
  direction?: "asc" | "desc";
}

export interface DocumentSnapshot<T = DocumentData> {
  id: string;
  type?: "document";
  ref?: any;
  exists: boolean | (() => boolean);
  data: () => T | undefined;
  get?: (field: string) => any;
  metadata?: any;
}

export interface QuerySnapshot<T = DocumentData> {
  docs: DocumentSnapshot<T>[];
  size: number;
  empty: boolean;
}

export interface SnapshotOptions {
  includeMetadataChanges?: boolean;
}

export interface WriteBatch {
  set<T>(ref: DocumentReference<T>, data: T, merge?: boolean): WriteBatch;
  update<T>(ref: DocumentReference<T>, data: Partial<T>): WriteBatch;
  delete<T>(ref: DocumentReference<T>): WriteBatch;
  commit(): Promise<void>;
}

export interface Transaction {
  get<T>(ref: DocumentReference<T>): Promise<T | null>;
  set<T>(ref: DocumentReference<T>, data: T, merge?: boolean): Transaction;
  update<T>(ref: DocumentReference<T>, data: Partial<T>): Transaction;
  delete<T>(ref: DocumentReference<T>): Transaction;
}

// ============================================================
// Storage Abstraction
// ============================================================

export interface IStorage {
  // Upload
  upload(path: string, data: Blob | ArrayBuffer | ReadableStream, metadata?: StorageMetadata): Promise<UploadResult>;
  uploadResumable(path: string, data: Blob, metadata?: StorageMetadata): Promise<ResumableUpload>;

  // Download
  download(path: string): Promise<Blob>;
  getDownloadUrl(path: string): Promise<string>;
  getSignedUrl(path: string, expirationSeconds: number): Promise<string>;

  // Metadata
  getMetadata(path: string): Promise<StorageMetadata>;
  updateMetadata(path: string, metadata: StorageMetadata): Promise<void>;

  // Delete
  delete(path: string): Promise<void>;
  deleteMultiple(paths: string[]): Promise<void>;

  // List
  list(prefix: string, options?: ListOptions): Promise<ListResult>;

  // Copy/Move
  copy(sourcePath: string, destPath: string): Promise<void>;
  move(sourcePath: string, destPath: string): Promise<void>;
}

export interface StorageMetadata {
  contentType?: string;
  cacheControl?: string;
  customMetadata?: Record<string, string>;
  md5Hash?: string;
}

export interface UploadResult {
  path: string;
  size: number;
  md5Hash: string;
  downloadUrl: string;
  metadata: StorageMetadata;
}

export interface ResumableUpload {
  path: string;
  pause(): Promise<void>;
  resume(): Promise<void>;
  cancel(): Promise<void>;
  onProgress: (callback: (bytesTransferred: number, totalBytes: number) => void) => () => void;
  promise: Promise<UploadResult>;
}

export interface ListOptions {
  maxResults?: number;
  pageToken?: string;
}

export interface ListResult {
  items: StorageItem[];
  prefixes: string[];
  nextPageToken?: string;
}

export interface StorageItem {
  path: string;
  name: string;
  size: number;
  md5Hash: string;
  updated: Date;
  metadata: StorageMetadata;
}

// ============================================================
// AI Services Abstraction
// ============================================================

export interface IAiService {
  // Text Generation
  generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  generateStructured<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T>;

  // Chat/Conversation
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;

  // Embeddings
  embed(text: string | string[]): Promise<number[][]>;

  // TTS (Text-to-Speech)
  synthesizeSpeech(text: string, options?: TtsOptions): Promise<TtsResult>;

  // Vision/OCR
  analyzeImage(image: Blob | string, prompt?: string): Promise<VisionResult>;

  // Quota/Cost
  getQuotaStatus(): Promise<QuotaStatus>;
  estimateCost(request: any): Promise<CostEstimate>;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
  stopSequences?: string[];
  responseFormat?: "text" | "json";
}

export interface GenerateResult {
  text: string;
  usage: TokenUsage;
  model: string;
  finishReason: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  functionCall?: any;
}

export interface ChatOptions extends GenerateOptions {
  functions?: FunctionDefinition[];
  functionCall?: "auto" | "none" | { name: string };
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: any;
}

export interface ChatResult {
  message: ChatMessage;
  usage: TokenUsage;
  model: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface TtsOptions {
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  format?: "mp3" | "wav" | "ogg" | "webm";
  sampleRate?: number;
}

export interface TtsResult {
  audioData: ArrayBuffer;
  format: string;
  durationSeconds: number;
  usage: TokenUsage;
}

export interface VisionResult {
  text: string;
  objects?: DetectedObject[];
  labels?: string[];
  usage: TokenUsage;
  model?: string;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface QuotaStatus {
  used: {
    tokens: number;
    requests: number;
    costUsd: number;
  };
  limits: {
    dailyTokens: number;
    dailyRequests: number;
    dailyCostUsd: number;
  };
  remaining: {
    tokens: number;
    requests: number;
    costUsd: number;
  };
  resetAt: Date;
  isExceeded: boolean;
}

export interface CostEstimate {
  estimatedTokens: number;
  estimatedCostUsd: number;
  model: string;
}

// ============================================================
// Snapshot System Abstraction
// ============================================================

export interface ISnapshotSystem {
  // Read
  getHomepageSnapshot(): Promise<HomepageSnapshot>;
  getLatestSnapshot(): Promise<LatestSnapshot>;
  getBreakingSnapshot(): Promise<BreakingSnapshot>;
  getTrendingSnapshot(): Promise<TrendingSnapshot>;
  getCategoriesSnapshot(): Promise<CategoriesSnapshot>;
  getArticleSnapshot(articleId: string): Promise<ArticleSnapshot>;
  getEventSnapshot(eventId: string): Promise<EventSnapshot>;
  getKnowledgeSnapshot(): Promise<KnowledgeSnapshot>;
  getManifest(): Promise<Manifest>;

  // Write (admin)
  rebuildAll(): Promise<RebuildResult>;
  rebuildModule(module: SnapshotModule): Promise<ModuleRebuildResult>;
  invalidateCache(module?: SnapshotModule): Promise<void>;

  // Verification
  verifyIntegrity(module: SnapshotModule): Promise<IntegrityResult>;
  getHealth(): Promise<SnapshotHealth>;
}

export type SnapshotModule =
  | "homepage"
  | "latest"
  | "breaking"
  | "trending"
  | "categories"
  | "articles"
  | "events"
  | "knowledge"
  | "nepal-hub"
  | "media"
  | "ads"
  | "all";

export interface HomepageSnapshot {
  generatedAt: string;
  version: string;
  featuredArticles: Article[];
  breakingNews?: Article[];
  latestNews: Article[];
  trendingNews: Article[];
  videoNews: Article[];
  categoryArticles: Record<string, Article[]>;
  categories: Category[];
  layout: any[] | null;
  platformStats?: PlatformStats;
  announcements?: any[];
}

export interface LatestSnapshot {
  generatedAt: string;
  articles: Article[];
}

export interface BreakingSnapshot {
  generatedAt: string;
  breakingNews: Article[];
}

export interface TrendingSnapshot {
  generatedAt: string;
  trendingNews: Article[];
}

export interface CategoriesSnapshot {
  generatedAt: string;
  categories: Category[];
  categoryArticles: Record<string, Article[]>;
}

export interface ArticleSnapshot {
  article: Article;
  relatedArticles: Article[];
  knowledgeLinks: KnowledgeLink[];
  audioUrl?: string;
  generatedAt: string;
}

export interface EventSnapshot {
  event: Event;
  generatedAt: string;
}

export interface KnowledgeSnapshot {
  generatedAt: string;
  nodes: KnowledgeNode[];
  categories: KnowledgeCategory[];
  relations: KnowledgeRelation[];
}

export interface Manifest {
  snapshotVersion: string;
  generatedAt: string;
  modules: Record<string, { version: string; sha256: string }>;
}

export interface RebuildResult {
  success: boolean;
  modulesRebuilt: SnapshotModule[];
  durationMs: number;
  errors: string[];
}

export interface ModuleRebuildResult {
  module: SnapshotModule;
  success: boolean;
  itemCount: number;
  durationMs: number;
  sha256: string;
  errors: string[];
}

export interface IntegrityResult {
  module: SnapshotModule;
  valid: boolean;
  expectedSha256: string;
  actualSha256: string;
  itemCount: number;
  mismatches: IntegrityMismatch[];
}

export interface IntegrityMismatch {
  path: string;
  expected: any;
  actual: any;
}

export interface SnapshotHealth {
  status: "healthy" | "degraded" | "stale" | "failed";
  lastGenerated: Record<SnapshotModule, string>;
  cacheHitRate: number;
  readsSaved: number;
  errors: string[];
}

// ============================================================
// Auth Abstraction
// ============================================================

export interface IAuth {
  // Current user
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;

  // Sign in/out
  signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult>;
  createUserWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<AuthResult>;
  signInWithPopup(provider: AuthProvider): Promise<AuthResult>;
  signOut(): Promise<void>;

  // Token
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult>;

  // Profile
  updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void>;
  sendEmailVerification(): Promise<void>;

  // Admin
  verifyIdToken(token: string): Promise<DecodedToken>;
  createCustomToken(uid: string, claims?: Record<string, any>): Promise<string>;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: UserProvider[];
  customClaims?: Record<string, any>;
  role?: UserRole;
  metadata?: {
    createdAt: string;
    lastLoginAt: string;
  };
}

export interface UserProvider {
  providerId: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export type UserRole =
  | "super_admin"
  | "admin"
  | "chief_editor"
  | "editor"
  | "moderator"
  | "author"
  | "member"
  | "user";

export interface AuthResult {
  user: User;
  credential?: any;
}

export interface IdTokenResult {
  token: string;
  expirationTime: string;
  authTime: string;
  issuedAt: string;
  claims: Record<string, any>;
}

export interface DecodedToken {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  claims: Record<string, any>;
}

export interface AuthProvider {
  providerId: string;
  setCustomParameters(params: Record<string, string>): AuthProvider;
}

export type AuthProviderType = "google" | "facebook" | "twitter" | "github" | "microsoft" | "apple" | "yahoo";

// ============================================================
// Real-time / Messaging Abstraction
// ============================================================

export interface IMessaging {
  // FCM / Web Push
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string | null>;
  onMessage(callback: (payload: MessagePayload) => void): () => void;
  onTokenRefresh(callback: (token: string) => void): () => void;
  deleteToken(): Promise<void>;

  // Background handler
  setBackgroundMessageHandler(handler: (payload: MessagePayload) => Promise<void>): void;
}

export interface MessagePayload {
  notification?: {
    title: string;
    body: string;
    image?: string;
  };
  data?: Record<string, string>;
  from?: string;
  collapseKey?: string;
  messageId?: string;
  sentTime?: number;
  ttl?: number;
}

// ============================================================
// Core Domain Types (shared)
// ============================================================

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  status: "draft" | "published" | "archived" | "review";
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  audioUrl?: string;
  audioDuration?: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  provenance?: ProvenanceData;
  districtTags?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  nameEn: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  parentId?: string;
  articleCount: number;
}

export interface ProvenanceData {
  sources: Source[];
  factChecks: FactCheck[];
  editorNotes: string;
  verifiedAt: string;
  verifiedBy: string;
}

export interface Source {
  name: string;
  url: string;
  type: "primary" | "secondary" | "wire" | "interview" | "document";
  credibility: number;
}

export interface FactCheck {
  claim: string;
  verdict: "true" | "false" | "partially_true" | "unverified";
  explanation: string;
  checkedBy: string;
  checkedAt: string;
  sources: string[];
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  featuredImage?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  location: string;
  locationType: "physical" | "virtual" | "hybrid";
  virtualUrl?: string;
  category: string;
  organizer: string;
  organizerContact?: string;
  capacity?: number;
  registeredCount: number;
  isPublic: boolean;
  requiresRegistration: boolean;
  tags: string[];
  status: "draft" | "published" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  slug: string;
  type: "entity" | "concept" | "scripture" | "person" | "place" | "event" | "text" | "philosophy";
  category: string;
  summary: string;
  content: string;
  language: "ne" | "en" | "sa" | "pi";
  scriptureRef?: string;
  tags: string[];
  relatedNodeIds: string[];
  media: KnowledgeMedia[];
  sources: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
}

export interface KnowledgeRelation {
  from: string;
  to: string;
  type: "references" | "contains" | "part_of" | "related_to" | "contradicts" | "evolved_from";
  strength: number;
}

export interface KnowledgeLink {
  nodeId: string;
  title: string;
  type: string;
  relevance: number;
}

export interface KnowledgeMedia {
  type: "image" | "audio" | "video" | "document";
  url: string;
  caption: string;
  metadata: Record<string, any>;
}

export interface PlatformStats {
  articlesCount: number;
  membersCount: number;
  districtsCount: number;
  resourcesCount: number;
  discussionsCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  nameEn: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  parentId?: string;
  articleCount: number;
}

// ============================================================
// Feature Flag Integration
// ============================================================

export interface IFeatureFlags {
  isEnabled(featureId: string, userContext?: UserAccessContext): boolean;
  getState(featureId: string): FeatureState;
  getAllStates(): Record<string, FeatureState>;
  onChange(callback: (featureId: string, state: FeatureState) => void): () => void;
  refresh(): Promise<void>;
}

export type FeatureState = "off" | "admin_only" | "beta" | "public";

export interface UserAccessContext {
  userId?: string;
  role?: UserRole;
  tenantId?: string;
  isBetaUser?: boolean;
  previewMode?: boolean;
  email?: string;
}

// ============================================================
// Configuration Factory
// ============================================================

export function createApiConfigFromEnv(): ApiConfig {
  const mode = (import.meta.env.VITE_API_MODE as BackendMode) || "demo";

  return {
    mode,
    firebase: import.meta.env.VITE_FIREBASE_PROJECT_ID ? {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      useEmulator: import.meta.env.VITE_FIREBASE_USE_EMULATOR === "true",
      emulatorHost: import.meta.env.VITE_FIREBASE_EMULATOR_HOST,
      emulatorPort: parseInt(import.meta.env.VITE_FIREBASE_EMULATOR_PORT || "8080"),
    } : undefined,
    r2: import.meta.env.VITE_R2_ACCOUNT_ID ? {
      accountId: import.meta.env.VITE_R2_ACCOUNT_ID,
      accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
      bucket: import.meta.env.VITE_R2_BUCKET,
      publicUrl: import.meta.env.VITE_R2_PUBLIC_URL,
      customDomain: import.meta.env.VITE_R2_CUSTOM_DOMAIN,
    } : undefined,
    ai: import.meta.env.VITE_AI_PROVIDER ? {
      provider: import.meta.env.VITE_AI_PROVIDER as AiConfig["provider"],
      gemini: import.meta.env.VITE_GEMINI_API_KEY ? {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        model: import.meta.env.VITE_GEMINI_MODEL,
        ttsModel: import.meta.env.VITE_GEMINI_TTS_MODEL,
      } : undefined,
      vertex: import.meta.env.VITE_VERTEX_PROJECT_ID ? {
        projectId: import.meta.env.VITE_VERTEX_PROJECT_ID,
        location: import.meta.env.VITE_VERTEX_LOCATION,
        model: import.meta.env.VITE_VERTEX_MODEL,
      } : undefined,
      openai: import.meta.env.VITE_OPENAI_API_KEY ? {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        model: import.meta.env.VITE_OPENAI_MODEL,
      } : undefined,
      quota: {
        dailyTokenLimit: parseInt(import.meta.env.VITE_AI_DAILY_TOKEN_LIMIT || "1000000"),
        dailyRequestLimit: parseInt(import.meta.env.VITE_AI_DAILY_REQUEST_LIMIT || "10000"),
        costAlertThreshold: parseFloat(import.meta.env.VITE_AI_COST_ALERT_THRESHOLD || "100"),
      },
    } : undefined,
    snapshot: {
      enabled: import.meta.env.VITE_SNAPSHOT_ENABLED !== "false",
      staticBaseUrl: import.meta.env.VITE_SNAPSHOT_STATIC_BASE_URL || "/snapshots",
      r2Prefix: import.meta.env.VITE_SNAPSHOT_R2_PREFIX || "snapshots/",
      generateOnWrite: import.meta.env.VITE_SNAPSHOT_GENERATE_ON_WRITE === "true",
      generateIntervalMs: parseInt(import.meta.env.VITE_SNAPSHOT_GENERATE_INTERVAL_MS || "300000"),
      verifyIntegrity: import.meta.env.VITE_SNAPSHOT_VERIFY_INTEGRITY !== "false",
    },
    features: {
      controlEndpoint: import.meta.env.VITE_FEATURE_CONTROL_ENDPOINT || "/api/cache/feature-control.json",
      pollIntervalMs: parseInt(import.meta.env.VITE_FEATURE_POLL_INTERVAL_MS || "60000"),
    },
  };
}