import { createApp } from "./routes";

type Env = {
  AGENT_FORUM_TOKENS?: string;
};

export default {
  fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    const allowedTokens = (env.AGENT_FORUM_TOKENS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    // Workers persistence needs a later Hyperdrive/edge repository adapter.
    const app = createApp({ allowedTokens });
    return app.fetch(request, env, executionContext);
  }
};
