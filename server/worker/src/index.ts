import type { Env } from "./types";
import { createRouter } from "./routes";
import { HttpError, errorResponse, finalize } from "./http";
import { handleScheduledSync } from "./sync";

const router = createRouter();

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // Handle OPTIONS Preflight
    if (req.method === "OPTIONS") {
      const preflight = new Response(null, { status: 204 });
      return finalize(preflight, req, env);
    }

    try {
      const match = router.match(req.method, url.pathname);

      if (match === "method_not_allowed") {
        return finalize(errorResponse(405, "method_not_allowed"), req, env);
      }

      if (!match) {
        return finalize(
          errorResponse(404, "not_found", { path: url.pathname }),
          req,
          env
        );
      }

      const res = await match.handler({
        req,
        env,
        ctx,
        url,
        params: match.params,
      });

      return finalize(res, req, env);
    } catch (err: any) {
      if (err instanceof HttpError) {
        return finalize(errorResponse(err.status, err.message, err.extra), req, env);
      }

      console.error("[Worker Error]", err);
      return finalize(
        errorResponse(500, "internal_server_error", {
          message: err?.message || String(err),
        }),
        req,
        env
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduledSync(env));
  },
};
