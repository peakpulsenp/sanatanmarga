import type { Handler } from "./types";

interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  handler: Handler;
}

/**
 * Tiny router. Patterns: literal segments, `:param` (one segment), `*rest` (rest of path, may be empty only if last).
 */
export class Router {
  private routes: Route[] = [];

  on(method: string | string[], pattern: string, handler: Handler): this {
    const methods = Array.isArray(method) ? method : [method];
    const keys: string[] = [];
    const src = pattern
      .split("/")
      .map((seg) => {
        if (seg.startsWith(":")) {
          keys.push(seg.slice(1));
          return "([^/]+)";
        }
        if (seg.startsWith("*")) {
          keys.push(seg.slice(1) || "rest");
          return "(.+)";
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    const regex = new RegExp(`^${src}/?$`);
    for (const m of methods) this.routes.push({ method: m.toUpperCase(), regex, keys, handler });
    return this;
  }

  get(p: string, h: Handler) {
    return this.on("GET", p, h);
  }
  post(p: string, h: Handler) {
    return this.on("POST", p, h);
  }
  put(p: string, h: Handler) {
    return this.on("PUT", p, h);
  }

  match(method: string, path: string): { handler: Handler; params: Record<string, string> } | "method_not_allowed" | null {
    let pathMatched = false;
    const m = method === "HEAD" ? "GET" : method;
    for (const r of this.routes) {
      const hit = r.regex.exec(path);
      if (!hit) continue;
      pathMatched = true;
      if (r.method !== m) continue;
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = hit[i + 1]));
      return { handler: r.handler, params };
    }
    return pathMatched ? "method_not_allowed" : null;
  }
}
