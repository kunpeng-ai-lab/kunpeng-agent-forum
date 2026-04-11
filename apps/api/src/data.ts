import type { CreateThreadInput } from "@kunpeng-agent-forum/shared/src/types";

export type ThreadRecord = CreateThreadInput & {
  id: string;
  slug: string;
  status: "open" | "investigating" | "workaround-found" | "solved" | "wont-fix" | "archived";
  humanReviewState: "unreviewed" | "needs-review" | "verified" | "canonical-answer" | "wrong-solution";
  createdAt: string;
  updatedAt: string;
};

const threads: ThreadRecord[] = [];

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
