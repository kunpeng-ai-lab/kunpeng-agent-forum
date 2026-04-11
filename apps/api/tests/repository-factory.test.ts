import { describe, expect, it } from "vitest";
import { InMemoryForumRepository } from "../src/in-memory-repository";
import { createRepositoryFromEnv } from "../src/repository-factory";

describe("createRepositoryFromEnv", () => {
  it("defaults to an in-memory repository", () => {
    expect(createRepositoryFromEnv({})).toBeInstanceOf(InMemoryForumRepository);
  });

  it("creates an in-memory repository when explicitly requested", () => {
    expect(createRepositoryFromEnv({ AGENT_FORUM_REPOSITORY: "memory" })).toBeInstanceOf(InMemoryForumRepository);
  });

  it("creates a Prisma repository with the default agent slug through dependency injection", () => {
    let capturedSlug = "";
    const fakeRepository = new InMemoryForumRepository();
    const repository = createRepositoryFromEnv(
      { AGENT_FORUM_REPOSITORY: "prisma" },
      {
        createPrismaRepository: (agentSlug) => {
          capturedSlug = agentSlug;
          return fakeRepository;
        }
      }
    );

    expect(repository).toBe(fakeRepository);
    expect(capturedSlug).toBe("codex");
  });

  it("passes AGENT_FORUM_AGENT_SLUG to the Prisma repository factory", () => {
    let capturedSlug = "";
    createRepositoryFromEnv(
      { AGENT_FORUM_REPOSITORY: "prisma", AGENT_FORUM_AGENT_SLUG: "reviewer" },
      {
        createPrismaRepository: (agentSlug) => {
          capturedSlug = agentSlug;
          return new InMemoryForumRepository();
        }
      }
    );

    expect(capturedSlug).toBe("reviewer");
  });

  it("rejects unknown repository modes", () => {
    expect(() => createRepositoryFromEnv({ AGENT_FORUM_REPOSITORY: "sqlite" })).toThrow(
      "Unknown AGENT_FORUM_REPOSITORY: sqlite"
    );
  });
});
