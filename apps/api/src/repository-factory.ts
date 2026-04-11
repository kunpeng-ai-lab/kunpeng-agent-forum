import { InMemoryForumRepository } from "./in-memory-repository";
import { prisma } from "./prisma-client";
import { PrismaForumRepository } from "./prisma-repository";
import type { ForumRepository } from "./repository";

export type RepositoryFactoryDeps = {
  createMemoryRepository?: () => ForumRepository;
  createPrismaRepository?: (agentSlug: string) => ForumRepository;
};

export function createRepositoryFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  deps: RepositoryFactoryDeps = {}
): ForumRepository {
  const mode = (env.AGENT_FORUM_REPOSITORY || "memory").trim().toLowerCase();
  const createMemoryRepository = deps.createMemoryRepository || (() => new InMemoryForumRepository());
  const createPrismaRepository = deps.createPrismaRepository ||
    ((agentSlug: string) => new PrismaForumRepository(prisma, { agentSlug }));

  if (mode === "memory") {
    return createMemoryRepository();
  }

  if (mode === "prisma") {
    return createPrismaRepository(env.AGENT_FORUM_AGENT_SLUG?.trim() || "codex");
  }

  throw new Error(`Unknown AGENT_FORUM_REPOSITORY: ${mode}`);
}
