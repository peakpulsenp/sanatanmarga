/**
 * Static cache bridge.
 *
 * The original app expects a small Express server to expose SnapshotOS data at
 * /api/cache/*. Those JSON files already ship inside public/snapshots. This
 * bridge transparently redirects cache reads to that static tree so the site
 * behaves identically on any static host (Vercel, Netlify, Render, GitHub
 * Pages) without a backend.
 */
const nativeFetch = typeof window !== "undefined" ? window.fetch.bind(window) : null;

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cacheCandidates(rel: string): string[] {
  const clean = rel.split("?")[0].replace(/^\/+/, "");

  if (clean.startsWith("article/")) {
    const id = decode(clean.slice("article/".length).replace(/\.json$/, ""));
    return [
      `/snapshots/article_${id}.json`,
      `/snapshots/snapshots/article_${id}.json`,
      `/snapshots/snapshots/modules/article/${id}.json`,
    ];
  }
  if (clean.startsWith("event/")) {
    const id = decode(clean.slice("event/".length).replace(/\.json$/, ""));
    return [`/snapshots/event_${id}.json`, `/snapshots/events/${id}.json`];
  }
  if (clean.startsWith("chautari/thread_")) {
    const id = decode(clean.slice("chautari/thread_".length).replace(/\.json$/, ""));
    return [`/snapshots/chautari/thread/${id}.json`];
  }
  if (clean === "chautari/home.json" || clean === "chautari/recent.json") {
    return ["/snapshots/chautari/recent.json", "/snapshots/chautari/trending.json"];
  }
  if (clean.startsWith("chautari/")) {
    return [`/snapshots/chautari/${clean.slice("chautari/".length)}`];
  }
  if (clean.startsWith("comments/")) {
    return [`/snapshots/comments/${clean.slice("comments/".length)}`];
  }
  if (clean.startsWith("glamour/")) {
    return [`/snapshots/glamour/${clean.slice("glamour/".length)}`];
  }
  if (clean.startsWith("events/")) {
    return [`/snapshots/events/${clean.slice("events/".length)}`];
  }
  if (clean.startsWith("nepal_hub/")) {
    return [`/snapshots/nepal_hub/${clean.slice("nepal_hub/".length)}`];
  }
  if (clean.startsWith("settings/")) {
    return [`/snapshots/settings/${clean.slice("settings/".length)}`, `/snapshots/site_config.json`];
  }
  if (clean === "manifest.json") {
    return ["/demo/manifest.json"];
  }
  if (clean === "knowledge.json") {
    return ["/snapshots/knowledge/graph.json", "/snapshots/knowledge/index.json"];
  }
  if (clean.startsWith("collection/")) {
    const col = decode(clean.slice("collection/".length));
    return [`/demo/collections/${col}.json`];
  }
  if (clean.startsWith("homepage")) {
    return [`/snapshots/${clean}`];
  }
  if (clean === "site_config.json") {
    return ["/snapshots/site_config.json", "/snapshots/settings/site.json"];
  }
  if (clean === "nepalhub.json") {
    return ["/snapshots/nepalhub.json", "/snapshots/nepal_hub/live.json"];
  }
  return [`/snapshots/${clean}`];
}

export function installStaticCacheBridge(): void {
  if (!nativeFetch || (window as any).__smStaticCacheBridge) return;
  (window as any).__smStaticCacheBridge = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = "";
    try {
      url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    } catch {}

    const isCacheRead =
      url.includes("/api/cache/") &&
      (!init?.method || String(init.method).toUpperCase() === "GET");

    if (!isCacheRead) return nativeFetch(input as any, init);

    const pathname = url.startsWith("http")
      ? new URL(url).pathname
      : url.split("?")[0];

    const rel = pathname.slice(pathname.indexOf("/api/cache/") + "/api/cache/".length);
    const candidates = cacheCandidates(rel);

    for (const candidate of candidates) {
      try {
        const response = await nativeFetch(candidate, init);
        if (response.ok) return response;
      } catch {
        // try next candidate
      }
    }

    // Return a well-formed 404 instead of an HTML shell so JSON callers fall
    // back to their bundled data instead of throwing parse errors.
    return new Response(JSON.stringify({ error: "not_found", path: pathname }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  };
}
