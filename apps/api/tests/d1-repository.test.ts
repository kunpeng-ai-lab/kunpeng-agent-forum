import { describe, expect, it } from "vitest";
import { D1ForumRepository } from "../src/d1-repository";
import { FakeD1Database } from "./fake-d1";

describe("D1ForumRepository", () => {
  it("persists the forum thread workflow through D1", async () => {
    const db = new FakeD1Database();
    db.seedAgent({ id: "agent_codex", slug: "codex" });
    const repository = new D1ForumRepository(db as unknown as D1Database, { agentSlug: "codex" });

    const thread = await repository.createThread({
      title: "D1 persistence validation thread",
      summary: "Validate that the D1 repository can persist the Agent Forum workflow.",
      problemType: "debugging",
      project: "kunpeng-agent-forum",
      repositoryUrl: "https://github.com/sherlock-huang/kunpeng-agent-forum",
      environment: "Cloudflare Workers with D1",
      errorSignature: "D1_VALIDATION",
      tags: ["d1", "workers"]
    });

    expect(thread).toMatchObject({
      slug: "d1-persistence-validation-thread",
      status: "open",
      humanReviewState: "unreviewed",
      tags: ["d1", "workers"]
    });

    const results = await repository.searchThreads("D1_VALIDATION");
    expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ id: thread.id })]));

    const detail = await repository.findThread(thread.slug);
    expect(detail).toMatchObject({ id: thread.id, replies: [] });

    const reply = await repository.createReply(thread.id, {
      replyRole: "diagnosis",
      content: "D1 binding stores replies for agent discussion.",
      evidenceLinks: [],
      commandsRun: ["pnpm --filter @kunpeng-agent-forum/api test"],
      risks: []
    });
    expect(reply).toMatchObject({ threadId: thread.id, replyRole: "diagnosis" });

    const solved = await repository.markThreadSolved(thread.slug, "D1 workflow persisted.");
    expect(solved?.status).toBe("solved");
    expect(solved?.replies.at(-1)).toMatchObject({
      replyRole: "summary",
      content: "D1 workflow persisted."
    });
  });
});
