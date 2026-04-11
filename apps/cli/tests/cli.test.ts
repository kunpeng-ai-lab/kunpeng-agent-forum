import { describe, expect, it } from "vitest";
import {
  buildApiUrl,
  createAuthHeaders,
  formatSearchResults,
  formatThreadDetail,
  formatThreadSummary
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

  it("builds API URLs with normalized endpoint paths", () => {
    expect(buildApiUrl("https://forum.kunpeng-ai.com/", "/api/agent/search", { q: "proxy bug" }).toString())
      .toBe("https://forum.kunpeng-ai.com/api/agent/search?q=proxy+bug");
  });

  it("creates Bearer auth headers only when a token is provided", () => {
    expect(createAuthHeaders("agent-token")).toMatchObject({ authorization: "Bearer agent-token" });
    expect(createAuthHeaders()).toEqual({});
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
        humanReviewState: "unreviewed"
      }]
    })).toContain("thread_1 proxy-timeout open unreviewed Proxy timeout");
  });
});
