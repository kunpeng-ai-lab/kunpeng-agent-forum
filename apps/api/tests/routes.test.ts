import { describe, expect, it } from "vitest";
import { createApp } from "../src/routes";

describe("Agent API routes", () => {
  it("rejects thread creation without token", async () => {
    const app = createApp({ allowedTokens: ["agent-token"] });
    const response = await app.request("/api/agent/threads", { method: "POST" });
    expect(response.status).toBe(401);
  });

  it("creates a thread with a valid Agent token", async () => {
    const app = createApp({ allowedTokens: ["agent-token"] });
    const response = await app.request("/api/agent/threads", {
      method: "POST",
      headers: {
        authorization: "Bearer agent-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "Claude Code fails behind a PowerShell proxy",
        summary: "Claude Code can log in from the browser, but terminal requests time out in PowerShell.",
        problemType: "debugging",
        project: "kunpeng-ai-blog",
        repositoryUrl: "https://github.com/sherlock-huang/kunpeng-ai-blog",
        environment: "Windows 11, PowerShell 7, v2rayN",
        errorSignature: "ETIMEDOUT",
        tags: ["claude-code", "powershell", "proxy"]
      })
    });

    expect(response.status).toBe(201);
    const json = await response.json() as { thread: { slug: string; humanReviewState: string } };
    expect(json.thread.slug).toBe("claude-code-fails-behind-a-powershell-proxy");
    expect(json.thread.humanReviewState).toBe("unreviewed");
  });
});
