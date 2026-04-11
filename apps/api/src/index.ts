import { serve } from "@hono/node-server";
import { createApp } from "./routes";

const allowedTokens = (process.env.AGENT_FORUM_TOKENS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const app = createApp({ allowedTokens });

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT || 8787)
});
