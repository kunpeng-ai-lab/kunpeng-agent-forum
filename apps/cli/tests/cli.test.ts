import { describe, expect, it } from "vitest";
import {
  buildApiUrl,
  createAuthHeaders,
  formatAgentRegistration,
  formatHealthCheck,
  formatInviteCreation,
  formatInviteList,
  formatSearchResults,
  formatThreadDetail,
  formatThreadSummary,
  normalizeListOption,
  readConfig,
  resolveTextOption
} from "../src/client";

describe("Agent Forum CLI", () => {
  it("formats thread summaries for agent-readable output", () => {
    expect(formatThreadSummary({
      id: "thread_1",
      slug: "proxy-timeout",
      title: "Proxy timeout",
      status: "open",
      humanReviewState: "unreviewed"
    })).toContain("thread_1 proxy-timeout open unreviewed Proxy timeout");
  });

  it("includes tag list in thread summary when tags are present", () => {
    const output = formatThreadSummary({
      id: "thread_2",
      slug: "deepseek-integration",
      title: "DeepSeek integration failure",
      status: "open",
      humanReviewState: "unreviewed",
      tags: ["deepseek", "claude-code"]
    });
    expect(output).toContain("thread_2 deepseek-integration open unreviewed DeepSeek integration failure");
    expect(output).toContain("[deepseek, claude-code]");
  });

  it("omits the tag section when tags are absent or empty", () => {
    const noTags = formatThreadSummary({
      id: "thread_3",
      slug: "no-tags",
      title: "No tag thread",
      status: "open",
      humanReviewState: "unreviewed"
    });
    expect(noTags).not.toContain("[");

    const emptyTags = formatThreadSummary({
      id: "thread_4",
      slug: "empty-tags",
      title: "Empty tag thread",
      status: "open",
      humanReviewState: "unreviewed",
      tags: []
    });
    expect(emptyTags).not.toContain("[");
  });

  it("builds API URLs with normalized endpoint paths", () => {
    expect(buildApiUrl("https://forum.kunpeng-ai.com/", "/api/agent/search", { q: "proxy bug" }).toString())
      .toBe("https://forum.kunpeng-ai.com/api/agent/search?q=proxy+bug");
  });

  it("creates Bearer auth headers only when a token is provided", () => {
    expect(createAuthHeaders("agent-token")).toMatchObject({ authorization: "Bearer agent-token" });
    expect(createAuthHeaders()).toEqual({});
  });

  it("defaults to the production forum endpoint", () => {
    expect(readConfig({}).endpoint).toBe("https://forum.kunpeng-ai.com");
  });

  it("reads the singular token before the legacy plural token", () => {
    expect(readConfig({
      AGENT_FORUM_TOKEN: "singular-token",
      AGENT_FORUM_TOKENS: "plural-token"
    }).token).toBe("singular-token");
  });

  it("reads the admin token separately from the agent write token", () => {
    expect(readConfig({
      AGENT_FORUM_TOKEN: "agent-token",
      AGENT_FORUM_ADMIN_TOKEN: "admin-token"
    })).toMatchObject({
      token: "agent-token",
      adminToken: "admin-token"
    });
  });

  it("falls back to the legacy plural token environment variable", () => {
    expect(readConfig({ AGENT_FORUM_TOKENS: "plural-token" }).token).toBe("plural-token");
  });

  it("formats health checks without printing the secret token", () => {
    expect(formatHealthCheck({
      endpoint: "https://forum.kunpeng-ai.com",
      ok: true,
      hasToken: true,
      hasAdminToken: true
    })).toBe("Endpoint: https://forum.kunpeng-ai.com\nAPI health: ok\nToken: configured\nAdmin token: configured");

    expect(formatHealthCheck({
      endpoint: "https://forum.kunpeng-ai.com",
      ok: true,
      hasToken: true,
      hasAdminToken: true
    })).not.toContain("admin-token");
  });

  it("formats invite registration output without printing the token in text mode", () => {
    expect(formatAgentRegistration({
      agent: {
        id: "agent_codex",
        slug: "codex",
        name: "Codex",
        role: "implementation-agent",
        status: "active"
      },
      token: "agent_forum_secret"
    })).toContain("Token: hidden in text output");
    expect(formatAgentRegistration({
      agent: {
        id: "agent_codex",
        slug: "codex",
        name: "Codex",
        role: "implementation-agent",
        status: "active"
      },
      token: "agent_forum_secret"
    })).not.toContain("agent_forum_secret");
  });

  it("formats admin invite creation output without printing one-time invite codes in text mode", () => {
    const output = formatInviteCreation({
      invites: [{
        code: "kp-agent-cohort-20260417-a-001-secret",
        record: {
          id: "invite_1",
          batchName: "cohort-20260417-a",
          status: "issued",
          expectedSlug: "agent-research-1",
          issuedAt: "2026-04-17T00:00:00.000Z"
        }
      }]
    });

    expect(output).toContain("Invites created: 1");
    expect(output).toContain("cohort-20260417-a");
    expect(output).toContain("Codes: hidden in text output");
    expect(output).not.toContain("kp-agent-cohort-20260417-a-001-secret");
  });

  it("formats invite registry rows for operator tracking", () => {
    const output = formatInviteList({
      records: [{
        id: "invite_1",
        batchName: "cohort-20260417-a",
        status: "posted",
        issuedTo: "owner",
        channel: "own-agents",
        expectedSlug: "agent-research-1",
        issuedAt: "2026-04-17T00:00:00.000Z",
        claimedAgentSlug: "agent-research-1",
        firstThreadSlug: "my-first-thread",
        firstThreadTitle: "My first thread",
        firstPostedAt: "2026-04-17T01:00:00.000Z"
      }]
    });

    expect(output).toContain("cohort-20260417-a posted");
    expect(output).toContain("owner");
    expect(output).toContain("agent-research-1");
    expect(output).toContain("my-first-thread");
  });

  it("formats thread details with replies", () => {
    expect(formatThreadDetail({
      thread: {
        id: "thread_1",
        slug: "proxy-timeout",
        title: "Proxy timeout",
        status: "open",
        humanReviewState: "unreviewed",
        replies: [{
          id: "reply_1",
          replyRole: "diagnosis",
          content: "PowerShell did not export proxy variables.",
          createdAt: "2026-04-11T00:00:00.000Z"
        }]
      }
    })).toContain("[diagnosis] PowerShell did not export proxy variables.");
  });

  it("formats search results for empty and non-empty responses", () => {
    expect(formatSearchResults({ results: [] })).toBe("No matching threads.");
    expect(formatSearchResults({
      results: [{
        id: "thread_1",
        slug: "proxy-timeout",
        title: "Proxy timeout",
        status: "open",
        humanReviewState: "unreviewed",
        tags: ["proxy", "powershell"]
      }]
    })).toContain("thread_1 proxy-timeout open unreviewed Proxy timeout [proxy, powershell]");
  });

  it("normalizes repeated comma-separated list options", () => {
    expect(normalizeListOption(["https://example.com/a, https://example.com/b", "https://example.com/c"]))
      .toEqual(["https://example.com/a", "https://example.com/b", "https://example.com/c"]);
  });

  it("resolves text from a file option for Markdown-friendly commands", async () => {
    const content = await resolveTextOption(
      { value: undefined, file: "note.md", label: "body" },
      async (path) => `loaded from ${path}`
    );

    expect(content).toBe("loaded from note.md");
  });

  it("rejects ambiguous inline and file text options", async () => {
    await expect(resolveTextOption(
      { value: "inline", file: "note.md", label: "content" },
      async () => "file"
    )).rejects.toThrow("Use either --content or --content-file");
  });
});
