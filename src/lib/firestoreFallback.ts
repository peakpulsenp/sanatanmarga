/**
 * Firestore quota circuit breaker + durable pending-write queue.
 *
 * When Firestore starts returning `resource-exhausted` (daily quota hit,
 * Spark plan limits, billing disabled...), the breaker OPENS:
 *   - reads are served from the local mirror, hydrated from the R2 snapshot
 *     tree (`/api/cache/collection/<name>.json` via the API gateway);
 *   - writes are applied to the local mirror immediately (UI stays live),
 *     persisted in a local queue and mirrored to the gateway's R2 journal so
 *     nothing is lost even if this device goes away;
 *   - after the cooldown a single probe read decides whether to CLOSE the
 *     breaker; on success the queue is replayed into Firestore in order.
 *
 * State is persisted in localStorage so reloads and other tabs respect it.
 */
import { backendConfig, apiUrl } from "./backendConfig";

export type BreakerState = "closed" | "open" | "half_open";

export interface BreakerSnapshot {
  state: BreakerState;
  openedAt: number | null;
  cooldownUntil: number | null;
  trips: number;
  lastError: string | null;
  lastRecoveredAt: number | null;
  fallbackReads: number;
  queuedWrites: number;
}

export type PendingOpKind = "set" | "update" | "delete";

export interface PendingOp {
  opId: string;
  kind: PendingOpKind;
  path: string;
  data?: any;
  merge?: boolean;
  ts: number;
  attempts: number;
  journaled?: boolean;
}

const BREAKER_KEY = "sm_fs_breaker_v1";
const QUEUE_KEY = "sm_fs_pending_writes_v1";
const EVENT = "sm-firestore-breaker";
const MAX_QUEUE = 2000;

/* ------------------------------------------------------------------ */
/* Error classification                                                */
/* ------------------------------------------------------------------ */

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "").toLowerCase();
  const msg = String(error.message || error).toLowerCase();
  return (
    code === "resource-exhausted" ||
    code === "firestore/resource-exhausted" ||
    msg.includes("quota exceeded") ||
    msg.includes("resource_exhausted") ||
    msg.includes("resource-exhausted") ||
    msg.includes("billing") && msg.includes("disabled")
  );
}

/** Errors where serving fallback data is better than failing the screen. */
export function isUnavailableError(error: any): boolean {
  const code = String(error?.code || "").toLowerCase();
  return code === "unavailable" || code === "deadline-exceeded" || code === "internal";
}

/* ------------------------------------------------------------------ */
/* Breaker                                                             */
/* ------------------------------------------------------------------ */

function now() {
  return Date.now();
}

function loadBreaker(): BreakerSnapshot {
  const base: BreakerSnapshot = {
    state: "closed",
    openedAt: null,
    cooldownUntil: null,
    trips: 0,
    lastError: null,
    lastRecoveredAt: null,
    fallbackReads: 0,
    queuedWrites: 0,
  };
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(BREAKER_KEY) : null;
    if (raw) return { ...base, ...JSON.parse(raw) };
  } catch {}
  return base;
}

let breaker: BreakerSnapshot = loadBreaker();

function saveBreaker() {
  breaker.queuedWrites = queue.length;
  try {
    localStorage.setItem(BREAKER_KEY, JSON.stringify(breaker));
  } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...breaker } }));
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === BREAKER_KEY && e.newValue) {
      try {
        breaker = { ...breaker, ...JSON.parse(e.newValue) };
        window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...breaker } }));
      } catch {}
    }
    if (e.key === QUEUE_KEY) queue = loadQueue();
  });
}

export function getBreakerSnapshot(): BreakerSnapshot {
  return { ...breaker, queuedWrites: queue.length };
}

export function onBreakerChange(cb: (s: BreakerSnapshot) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** True when Firestore should be bypassed right now. */
export function shouldUseFallback(): boolean {
  if (backendConfig.mode !== "firebase") return true;
  if (breaker.state === "closed") return false;
  if (breaker.cooldownUntil && now() >= breaker.cooldownUntil) {
    // Cooldown elapsed: let exactly one caller probe Firestore.
    if (breaker.state === "open") {
      breaker.state = "half_open";
      saveBreaker();
      return false;
    }
  }
  return breaker.state === "open";
}

export function tripBreaker(error: any) {
  const trips = breaker.state === "closed" ? 1 : breaker.trips + 1;
  const cooldown = Math.min(
    backendConfig.fallbackCooldownMs * Math.pow(2, Math.max(0, trips - 1)),
    backendConfig.fallbackMaxCooldownMs,
  );
  const wasClosed = breaker.state === "closed";
  breaker = {
    ...breaker,
    state: "open",
    openedAt: wasClosed ? now() : breaker.openedAt || now(),
    cooldownUntil: now() + cooldown,
    trips,
    lastError: String(error?.code || error?.message || error).slice(0, 300),
  };
  saveBreaker();
  if (wasClosed) {
    console.warn(
      `[FirestoreFallback] Quota/availability failure — switching to R2 + local fallback for ${Math.round(cooldown / 60000)} min.`,
      error,
    );
  }
}

let replayHandler: (() => Promise<void>) | null = null;
export function registerReplayHandler(fn: () => Promise<void>) {
  replayHandler = fn;
}

export function recordFirestoreSuccess() {
  if (breaker.state === "closed") return;
  breaker = { ...breaker, state: "closed", cooldownUntil: null, lastRecoveredAt: now(), trips: 0 };
  saveBreaker();
  console.info("[FirestoreFallback] Firestore recovered — replaying queued writes.");
  replayHandler?.().catch((e) => console.warn("[FirestoreFallback] replay failed", e));
}

export function countFallbackRead() {
  breaker.fallbackReads += 1;
  // Persist lazily (reads are hot).
  if (breaker.fallbackReads % 25 === 1) saveBreaker();
}

/** Admin/testing hook. */
export function forceBreaker(state: "open" | "closed") {
  if (state === "open") tripBreaker({ code: "manual-override" });
  else recordFirestoreSuccess();
}

/* ------------------------------------------------------------------ */
/* Pending write queue                                                 */
/* ------------------------------------------------------------------ */

function loadQueue(): PendingOp[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(QUEUE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let queue: PendingOp[] = loadQueue();

function saveQueue() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("[FirestoreFallback] Could not persist pending queue (storage full?)", e);
  }
  saveBreaker();
}

export function newOpId(): string {
  const c: any = typeof crypto !== "undefined" ? crypto : null;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Serialize Firestore/our sentinels & timestamps into plain JSON. */
export function encodeValue(value: any): any {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return { __timestamp: value.getTime() };
  if (Array.isArray(value)) return value.map(encodeValue);
  if (typeof value.toMillis === "function" && typeof value.seconds === "number") {
    return { __timestamp: value.toMillis() };
  }
  if ("__serverTimestamp" in value || "__increment" in value || "__arrayUnion" in value || "__arrayRemove" in value || "__deleteField" in value) {
    return value;
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) out[k] = encodeValue(v);
  }
  return out;
}

export function enqueueWrite(op: Omit<PendingOp, "opId" | "ts" | "attempts"> & { opId?: string }): PendingOp {
  const full: PendingOp = {
    opId: op.opId || newOpId(),
    kind: op.kind,
    path: op.path,
    data: op.data === undefined ? undefined : encodeValue(op.data),
    merge: op.merge,
    ts: now(),
    attempts: 0,
  };
  queue.push(full);
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  breaker.queuedWrites = queue.length;
  saveQueue();
  scheduleJournalFlush();
  return full;
}

export function getPendingOps(): PendingOp[] {
  return [...queue];
}

export function removeOps(opIds: string[]) {
  const set = new Set(opIds);
  queue = queue.filter((op) => !set.has(op.opId));
  saveQueue();
}

export function markAttempt(opId: string) {
  const op = queue.find((o) => o.opId === opId);
  if (op) op.attempts += 1;
  saveQueue();
}

/* ------------------------------------------------------------------ */
/* R2 journal mirroring (durability beyond this device)                */
/* ------------------------------------------------------------------ */

let journalTimer: ReturnType<typeof setTimeout> | null = null;
let tokenProvider: (() => Promise<string | null>) | null = null;

export function registerTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = await tokenProvider?.();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {}
  return headers;
}

function scheduleJournalFlush() {
  if (!backendConfig.hasApiGateway || journalTimer) return;
  journalTimer = setTimeout(() => {
    journalTimer = null;
    flushJournal().catch(() => {});
  }, 1500);
}

export async function flushJournal(): Promise<number> {
  if (!backendConfig.hasApiGateway) return 0;
  const pending = queue.filter((op) => !op.journaled).slice(0, 200);
  if (!pending.length) return 0;
  try {
    const res = await fetch(apiUrl("/api/fallback/journal"), {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        ops: pending.map(({ opId, kind, path, data, merge, ts }) => ({ opId, kind, path, data, merge, ts })),
      }),
    });
    if (!res.ok) return 0;
    const body = await res.json().catch(() => ({}));
    const accepted = new Set<string>(Array.isArray(body.accepted) ? body.accepted : []);
    for (const op of queue) if (accepted.has(op.opId)) op.journaled = true;
    saveQueue();
    if (queue.some((op) => !op.journaled)) scheduleJournalFlush();
    return accepted.size;
  } catch {
    return 0;
  }
}

/** Tell the gateway these journal entries were replayed by the client. */
export async function settleJournal(opIds: string[]) {
  if (!backendConfig.hasApiGateway || !opIds.length) return;
  for (let i = 0; i < opIds.length; i += 200) {
    try {
      await fetch(apiUrl("/api/fallback/journal/settle"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ opIds: opIds.slice(i, i + 200) }),
      });
    } catch {}
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    scheduleJournalFlush();
    if (breaker.state !== "closed" && queue.length) {
      // Let the next read act as the probe.
      if (breaker.cooldownUntil && now() >= breaker.cooldownUntil) shouldUseFallback();
    }
  });
}

