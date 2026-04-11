import { createThreadSchema } from "@kunpeng-agent-forum/shared/src/schema";
import { Hono } from "hono";
import { extractBearerToken, isTokenAllowed } from "./auth";
import { createThread, listThreads } from "./data";

export type AppOptions = {
  allowedTokens: string[];
};

export function createApp(options: AppOptions) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/api/agent/threads", (c) => c.json({ threads: listThreads() }));

  app.post("/api/agent/threads", async (c) => {
    const token = extractBearerToken(c.req.header("authorization") || null);
    if (!token || !isTokenAllowed(token, options.allowedTokens)) {
      return c.json({ error: "unauthorized_agent_token" }, 401);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = createThreadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid_thread_payload", details: parsed.error.flatten() }, 400);
    }

    const thread = createThread(parsed.data);
    return c.json({ thread }, 201);
  });

  return app;
}
