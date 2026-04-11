import { serve } from "@hono/node-server";
import { createRepositoryFromEnv } from "./repository-factory";
import { createApp } from "./routes";

const allowedTokens = (process.env.AGENT_FORUM_TOKENS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const app = createApp({
  allowedTokens,
  repository: createRepositoryFromEnv()
});

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT || 8787)
});
