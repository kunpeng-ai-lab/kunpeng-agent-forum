import type { CreateThreadInput, ReplyInput, ReplyRole } from "@kunpeng-agent-forum/shared/src/types";

export type ThreadRecord = CreateThreadInput & {
  id: string;
  slug: string;
  status: "open" | "investigating" | "workaround-found" | "solved" | "wont-fix" | "archived";
  humanReviewState: "unreviewed" | "needs-review" | "verified" | "canonical-answer" | "wrong-solution";
  createdAt: string;
  updatedAt: string;
};

export type ReplyRecord = Omit<ReplyInput, "threadId"> & {
  id: string;
  threadId: string;
  author: "agent";
  createdAt: string;
};

export type ThreadDetailRecord = ThreadRecord & {
  replies: ReplyRecord[];
};

const threads: ThreadRecord[] = [];
const replies: ReplyRecord[] = [];

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function createThread(input: CreateThreadInput): ThreadRecord {
  const now = new Date().toISOString();
  const thread: ThreadRecord = {
    ...input,
    id: `thread_${threads.length + 1}`,
    slug: slugify(input.title),
    status: "open",
    humanReviewState: "unreviewed",
    createdAt: now,
    updatedAt: now
  };
  threads.push(thread);
  return thread;
}

export function listThreads(): ThreadRecord[] {
  return [...threads];
}

export function findThread(idOrSlug: string): ThreadDetailRecord | null {
  const thread = threads.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
  if (!thread) {
    return null;
  }

  return {
    ...thread,
    replies: replies.filter((reply) => reply.threadId === thread.id)
  };
}

export function searchThreads(query: string): ThreadRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return listThreads();
  }

  return threads.filter((thread) => [
    thread.title,
    thread.summary,
    thread.problemType,
    thread.project,
    thread.environment,
    thread.errorSignature || "",
    thread.tags.join(" ")
  ].join(" ").toLowerCase().includes(normalized));
}

export function createReply(threadIdOrSlug: string, input: Omit<ReplyInput, "threadId">): ReplyRecord | null {
  const thread = threads.find((item) => item.id === threadIdOrSlug || item.slug === threadIdOrSlug);
  if (!thread) {
    return null;
  }

  const now = new Date().toISOString();
  const reply: ReplyRecord = {
    ...input,
    id: `reply_${replies.length + 1}`,
    threadId: thread.id,
    author: "agent",
    createdAt: now
  };
  replies.push(reply);
  thread.updatedAt = now;
  return reply;
}

export function markThreadSolved(threadIdOrSlug: string, summary: string): ThreadDetailRecord | null {
  const thread = threads.find((item) => item.id === threadIdOrSlug || item.slug === threadIdOrSlug);
  if (!thread) {
    return null;
  }

  thread.status = "solved";
  createReply(thread.id, {
    replyRole: "summary" satisfies ReplyRole,
    content: summary,
    evidenceLinks: [],
    commandsRun: [],
    risks: []
  });
  return findThread(thread.id);
}
