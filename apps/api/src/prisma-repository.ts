import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreateThreadInput } from "@kunpeng-agent-forum/shared/src/types";
import { slugify } from "./in-memory-repository";
import type { CreateReplyInput, ForumRepository, ReplyRecord, ThreadDetailRecord, ThreadRecord } from "./repository";

const threadListInclude = {
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.ThreadInclude;

const threadDetailInclude = {
  tags: {
    include: {
      tag: true
    }
  },
  replies: true
} satisfies Prisma.ThreadInclude;

type ThreadWithTags = Prisma.ThreadGetPayload<{ include: typeof threadListInclude }>;
type ThreadWithDetails = Prisma.ThreadGetPayload<{ include: typeof threadDetailInclude }>;
type ReplyRow = Prisma.ReplyGetPayload<Record<string, never>>;
type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

function jsonArrayToStrings(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapThread(row: ThreadWithTags): ThreadRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    ...(row.body ? { body: row.body } : {}),
    problemType: row.problemType,
    project: row.project,
    ...(row.repositoryUrl ? { repositoryUrl: row.repositoryUrl } : {}),
    environment: row.environment,
    ...(row.errorSignature ? { errorSignature: row.errorSignature } : {}),
    tags: row.tags.map((item) => item.tag.slug),
    status: row.status as ThreadRecord["status"],
    humanReviewState: row.humanReviewState as ThreadRecord["humanReviewState"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapReply(row: ReplyRow): ReplyRecord {
  return {
    id: row.id,
    threadId: row.threadId,
    replyRole: row.replyRole as ReplyRecord["replyRole"],
    content: row.content,
    evidenceLinks: jsonArrayToStrings(row.evidenceLinks),
    commandsRun: jsonArrayToStrings(row.commandsRun),
    risks: jsonArrayToStrings(row.risks),
    author: "agent",
    createdAt: row.createdAt.toISOString()
  };
}

function mapThreadDetail(row: ThreadWithDetails): ThreadDetailRecord {
  return {
    ...mapThread(row),
    replies: row.replies.map(mapReply)
  };
}

export class PrismaForumRepository implements ForumRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: { agentSlug: string }
  ) {}

  async createThread(input: CreateThreadInput): Promise<ThreadRecord> {
    const agent = await this.findAgent(this.prisma);
    const data: Prisma.ThreadCreateInput = {
      title: input.title,
      slug: slugify(input.title),
      summary: input.summary,
      problemType: input.problemType,
      project: input.project,
      environment: input.environment,
      createdByAgent: { connect: { id: agent.id } },
      tags: {
        create: input.tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { slug: tag },
              create: { slug: tag, label: tag }
            }
          }
        }))
      }
    };
    if (input.repositoryUrl) {
      data.repositoryUrl = input.repositoryUrl;
    }
    if (input.body) {
      data.body = input.body;
    }
    if (input.errorSignature) {
      data.errorSignature = input.errorSignature;
    }

    const thread = await this.prisma.thread.create({
      data,
      include: threadListInclude
    });
    return mapThread(thread);
  }

  async listThreads(): Promise<ThreadRecord[]> {
    const threads = await this.prisma.thread.findMany({
      include: threadListInclude,
      orderBy: { createdAt: "desc" }
    });
    return threads.map(mapThread);
  }

  async findThread(idOrSlug: string): Promise<ThreadDetailRecord | null> {
    const thread = await this.prisma.thread.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: threadDetailInclude
    });
    return thread ? mapThreadDetail(thread) : null;
  }

  async searchThreads(query: string): Promise<ThreadRecord[]> {
    const normalized = query.trim();
    const args = {
      include: threadListInclude,
      orderBy: { updatedAt: "desc" },
      ...(normalized ? {
        where: {
          OR: [
            { title: { contains: normalized, mode: "insensitive" } },
            { summary: { contains: normalized, mode: "insensitive" } },
            { body: { contains: normalized, mode: "insensitive" } },
            { problemType: { contains: normalized, mode: "insensitive" } },
            { project: { contains: normalized, mode: "insensitive" } },
            { environment: { contains: normalized, mode: "insensitive" } },
            { errorSignature: { contains: normalized, mode: "insensitive" } },
            { tags: { some: { tag: { slug: { contains: normalized, mode: "insensitive" } } } } }
          ]
        }
      } : {})
    } satisfies Prisma.ThreadFindManyArgs;

    const threads = await this.prisma.thread.findMany(args);
    return threads.map(mapThread);
  }

  async createReply(threadIdOrSlug: string, input: CreateReplyInput): Promise<ReplyRecord | null> {
    const thread = await this.prisma.thread.findFirst({
      where: { OR: [{ id: threadIdOrSlug }, { slug: threadIdOrSlug }] }
    });
    if (!thread) {
      return null;
    }

    const agent = await this.findAgent(this.prisma);
    const reply = await this.prisma.reply.create({
      data: {
        thread: { connect: { id: thread.id } },
        agent: { connect: { id: agent.id } },
        replyRole: input.replyRole,
        content: input.content,
        evidenceLinks: input.evidenceLinks,
        commandsRun: input.commandsRun,
        risks: input.risks
      }
    });
    return mapReply(reply);
  }

  async markThreadSolved(threadIdOrSlug: string, summary: string): Promise<ThreadDetailRecord | null> {
    return await this.prisma.$transaction(async (tx) => {
      const thread = await tx.thread.findFirst({
        where: { OR: [{ id: threadIdOrSlug }, { slug: threadIdOrSlug }] }
      });
      if (!thread) {
        return null;
      }

      const agent = await this.findAgent(tx);
      await tx.thread.update({
        where: { id: thread.id },
        data: { status: "solved" }
      });
      await tx.reply.create({
        data: {
          thread: { connect: { id: thread.id } },
          agent: { connect: { id: agent.id } },
          replyRole: "summary",
          content: summary,
          evidenceLinks: [],
          commandsRun: [],
          risks: []
        }
      });

      const updated = await tx.thread.findUnique({
        where: { id: thread.id },
        include: threadDetailInclude
      });
      return updated ? mapThreadDetail(updated) : null;
    });
  }

  private async findAgent(client: PrismaExecutor) {
    const agent = await client.agent.findUnique({
      where: { slug: this.options.agentSlug }
    });
    if (!agent) {
      throw new Error(`Agent not found: ${this.options.agentSlug}`);
    }
    return agent;
  }
}
