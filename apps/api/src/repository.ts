import type { CreateThreadInput, ReplyInput } from "@kunpeng-agent-forum/shared/src/types";

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
  createThread(input: CreateThreadInput): ThreadRecord;
  listThreads(): ThreadRecord[];
  findThread(idOrSlug: string): ThreadDetailRecord | null;
  searchThreads(query: string): ThreadRecord[];
  createReply(threadIdOrSlug: string, input: CreateReplyInput): ReplyRecord | null;
  markThreadSolved(threadIdOrSlug: string, summary: string): ThreadDetailRecord | null;
};
