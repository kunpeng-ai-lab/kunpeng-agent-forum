import { afterEach, describe, expect, it, vi } from "vitest";
import { demoThreads } from "../lib/forum-data";
import { getForumThread, getForumThreads, getPublicForumEndpoint } from "../lib/forum-api";
import { getForumCopy, getLanguageLinks, resolveForumLanguage } from "../lib/forum-i18n";

const originalEndpoint = process.env.AGENT_FORUM_PUBLIC_ENDPOINT;

afterEach(() => {
  process.env.AGENT_FORUM_PUBLIC_ENDPOINT = originalEndpoint;
  vi.restoreAllMocks();
});

describe("public forum data", () => {
  it("marks demo threads as Agent-generated and unreviewed by default", () => {
    expect(demoThreads[0]?.sourceLabel).toBe("Agent-generated");
    expect(demoThreads[0]?.humanReviewState).toBe("unreviewed");
  });

  it("defaults to the production forum endpoint for public web reads", () => {
    delete process.env.AGENT_FORUM_PUBLIC_ENDPOINT;
    expect(getPublicForumEndpoint()).toBe("https://forum.kunpeng-ai.com");
  });

  it("fetches real forum threads from the API", async () => {
    process.env.AGENT_FORUM_PUBLIC_ENDPOINT = "https://forum.example.test/";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      threads: [{
        id: "thread_1",
        slug: "real-agent-thread",
        title: "Real Agent thread",
        summary: "This thread came from the API rather than bundled demo data.",
        problemType: "debugging",
        project: "kunpeng-agent-forum",
        environment: "Cloudflare Workers",
        tags: ["worker"],
        status: "open",
        humanReviewState: "unreviewed",
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z"
      }]
    }), { status: 200 })));

    const threads = await getForumThreads();

    expect(threads[0]?.slug).toBe("real-agent-thread");
    expect(fetch).toHaveBeenCalledWith("https://forum.example.test/api/agent/threads", { cache: "no-store" });
  });

  it("falls back to demo threads when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));

    await expect(getForumThreads()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: "claude-code-powershell-proxy-timeout" })
    ]));
  });

  it("fetches a real thread detail by slug", async () => {
    process.env.AGENT_FORUM_PUBLIC_ENDPOINT = "https://forum.example.test/";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      thread: {
        id: "thread_1",
        slug: "real-agent-thread",
        title: "Real Agent thread",
        summary: "This detail came from the API rather than bundled demo data.",
        problemType: "debugging",
        project: "kunpeng-agent-forum",
        environment: "Cloudflare Workers",
        tags: ["worker"],
        status: "open",
        humanReviewState: "unreviewed",
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z",
        replies: []
      }
    }), { status: 200 })));

    const thread = await getForumThread("real-agent-thread");

    expect(thread?.slug).toBe("real-agent-thread");
    expect(fetch).toHaveBeenCalledWith("https://forum.example.test/api/agent/threads/real-agent-thread", { cache: "no-store" });
  });
});

describe("forum language support", () => {
  it("defaults to English and accepts Chinese through the lang query parameter", () => {
    expect(resolveForumLanguage()).toBe("en");
    expect(resolveForumLanguage("zh")).toBe("zh");
    expect(resolveForumLanguage("en")).toBe("en");
    expect(resolveForumLanguage("fr")).toBe("en");
  });

  it("builds shareable language switch links for the current path", () => {
    expect(getLanguageLinks("/threads/cloudflare-workers-d1")).toEqual({
      en: "/threads/cloudflare-workers-d1?lang=en",
      zh: "/threads/cloudflare-workers-d1?lang=zh"
    });
  });

  it("provides Chinese copy for the forum home page", () => {
    expect(getForumCopy("zh").home.heroTitle).toContain("给下一个 Agent");
    expect(getForumCopy("en").home.heroTitle).toContain("Where AI agents");
  });
});
