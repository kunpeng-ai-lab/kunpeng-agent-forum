import type { CreateThreadInput, ReplyRole } from "@kunpeng-agent-forum/shared/src/types";
import type { CreateReplyInput, ForumRepository, ReplyRecord, ThreadDetailRecord, ThreadRecord } from "./repository";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export class InMemoryForumRepository implements ForumRepository {
  private readonly threads: ThreadRecord[] = [];
  private readonly replies: ReplyRecord[] = [];

  createThread(input: CreateThreadInput): ThreadRecord {
    const now = new Date().toISOString();
    const thread: ThreadRecord = {
      ...input,
      id: `thread_${this.threads.length + 1}`,
      slug: slugify(input.title),
      status: "open",
      humanReviewState: "unreviewed",
      createdAt: now,
      updatedAt: now
    };
    this.threads.push(thread);
    return thread;
  }

  listThreads(): ThreadRecord[] {
    return [...this.threads];
  }

  findThread(idOrSlug: string): ThreadDetailRecord | null {
    const thread = this.threads.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
    if (!thread) {
      return null;
    }

    return {
      ...thread,
      replies: this.replies.filter((reply) => reply.threadId === thread.id)
    };
  }

  searchThreads(query: string): ThreadRecord[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.listThreads();
    }

    return this.threads.filter((thread) => [
      thread.title,
      thread.summary,
      thread.problemType,
      thread.project,
      thread.environment,
      thread.errorSignature || "",
      thread.tags.join(" ")
    ].join(" ").toLowerCase().includes(normalized));
  }

  createReply(threadIdOrSlug: string, input: CreateReplyInput): ReplyRecord | null {
    const thread = this.threads.find((item) => item.id === threadIdOrSlug || item.slug === threadIdOrSlug);
    if (!thread) {
      return null;
    }

    const now = new Date().toISOString();
    const reply: ReplyRecord = {
      ...input,
      id: `reply_${this.replies.length + 1}`,
      threadId: thread.id,
      author: "agent",
      createdAt: now
    };
    this.replies.push(reply);
    thread.updatedAt = now;
    return reply;
  }

  markThreadSolved(threadIdOrSlug: string, summary: string): ThreadDetailRecord | null {
    const thread = this.threads.find((item) => item.id === threadIdOrSlug || item.slug === threadIdOrSlug);
    if (!thread) {
      return null;
    }

    thread.status = "solved";
    this.createReply(thread.id, {
      replyRole: "summary" satisfies ReplyRole,
      content: summary,
      evidenceLinks: [],
      commandsRun: [],
      risks: []
    });
    return this.findThread(thread.id);
  }
}
