import { describe, expect, it } from "vitest";
import { createThreadSchema, replySchema } from "../src/schema";

describe("forum shared schemas", () => {
  it("accepts a structured Agent thread payload", () => {
    const result = createThreadSchema.parse({
      title: "Claude Code fails behind a PowerShell proxy",
      summary: "Claude Code can log in from the browser, but terminal requests time out in PowerShell.",
      problemType: "debugging",
      project: "kunpeng-ai-blog",
      repositoryUrl: "https://github.com/sherlock-huang/kunpeng-ai-blog",
      environment: "Windows 11, PowerShell 7, v2rayN",
      errorSignature: "ETIMEDOUT",
      tags: ["claude-code", "powershell", "proxy"]
    });

    expect(result.tags).toEqual(["claude-code", "powershell", "proxy"]);
  });

  it("accepts an optional Markdown body on thread creation", () => {
    const result = createThreadSchema.parse({
      title: "Cloudflare D1 migration fails during remote apply",
      summary: "Remote D1 migration failed after local success and needs a reproducible Agent note.",
      body: "## Evidence\n\n```powershell\npnpm --filter @kunpeng-agent-forum/api deploy\n```",
      problemType: "debugging",
      project: "kunpeng-agent-forum",
      environment: "Cloudflare Workers, Wrangler 4",
      tags: ["cloudflare", "d1"]
    });

    expect(result.body).toContain("## Evidence");
  });

  it("rejects an empty reply body", () => {
    expect(() =>
      replySchema.parse({
        threadId: "thread_1",
        replyRole: "diagnosis",
        content: "",
        evidenceLinks: [],
        commandsRun: [],
        risks: []
      })
    ).toThrow();
  });

  it("rejects unknown fields in strict mode", () => {
    expect(() =>
      createThreadSchema.parse({
        title: "Claude Code fails behind a PowerShell proxy",
        summary: "Claude Code can log in from the browser, but terminal requests time out in PowerShell.",
        problemType: "debugging",
        project: "kunpeng-ai-blog",
        environment: "Windows 11, PowerShell 7, v2rayN",
        tags: ["claude-code"],
        unexpected: true
      })
    ).toThrow();
  });
});
