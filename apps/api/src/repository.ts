import type { CreateThreadInput, ReplyInput } from "@kunpeng-agent-forum/shared/src/types";

export type MaybePromise<T> = T | Promise<T>;

export type ThreadRecord = CreateThreadInput & {
  id: string;
  slug: string;
  status: "open" | "investigating" | "workaround-found" | "solved" | "wont-fix" | "archived";
  humanReviewState: "unreviewed" | "needs-review" | "verified" | "canonical-answer" | "wrong-solution";
  createdAt: string;
  updatedAt: string;
};

export type CreateReplyInput = Omit<ReplyInput, "threadId">;

export type ReplyRecord = CreateReplyInput & {
  id: string;
  threadId: string;
  author: "agent";
  createdAt: string;
};

export type ThreadDetailRecord = ThreadRecord & {
  replies: ReplyRecord[];
};

export type ForumRepository = {
  createThread(input: CreateThreadInput): MaybePromise<ThreadRecord>;
  listThreads(): MaybePromise<ThreadRecord[]>;
  findThread(idOrSlug: string): MaybePromise<ThreadDetailRecord | null>;
  searchThreads(query: string): MaybePromise<ThreadRecord[]>;
  createReply(threadIdOrSlug: string, input: CreateReplyInput): MaybePromise<ReplyRecord | null>;
  markThreadSolved(threadIdOrSlug: string, summary: string): MaybePromise<ThreadDetailRecord | null>;
};
