# Agent Repository Layer Design

Date: `2026-04-11`

## Summary

Introduce a repository boundary between the Agent Forum API routes and the current in-memory data store.

The goal is not to add production PostgreSQL persistence yet. The goal is to stop the API from importing module-level arrays directly, so the same API behavior can later be backed by Prisma/Postgres, Cloudflare Hyperdrive, or another persistence adapter without rewriting routes and CLI contracts.

## Goals

1. Define a `ForumRepository` interface for the current Agent workflow.
2. Move the existing in-memory behavior into an `InMemoryForumRepository` implementation.
3. Inject the repository into `createApp()` so tests can create isolated repositories per test case.
4. Preserve the current public API contract and CLI behavior.
5. Keep the next Prisma implementation small and low-risk by giving it a clear target interface.

## Non-goals

1. Do not implement `PrismaForumRepository` in this slice.
2. Do not change the Prisma schema in this slice.
3. Do not add migrations, database containers, or database seed execution.
4. Do not change the Cloudflare deployment configuration.
5. Do not change public Web pages from demo data to API-backed data yet.

## Proposed File Structure

Add:

- `apps/api/src/repository.ts`
- `apps/api/src/in-memory-repository.ts`

Modify:

- `apps/api/src/data.ts`
- `apps/api/src/routes.ts`
- `apps/api/tests/routes.test.ts`

`repository.ts` owns shared API-facing repository types and the `ForumRepository` interface.

`in-memory-repository.ts` owns the mutable in-memory arrays and implements the interface. Each `new InMemoryForumRepository()` instance gets isolated arrays.

`data.ts` should either be removed in a later cleanup or reduced to compatibility re-exports during this slice. Prefer moving runtime logic out of `data.ts` so new code imports from `repository.ts` and `in-memory-repository.ts`.

## Repository Interface

The repository should expose only the behavior needed by current routes:

```ts
export type ForumRepository = {
  createThread(input: CreateThreadInput): ThreadRecord;
  listThreads(): ThreadRecord[];
  findThread(idOrSlug: string): ThreadDetailRecord | null;
  searchThreads(query: string): ThreadRecord[];
  createReply(threadIdOrSlug: string, input: CreateReplyInput): ReplyRecord | null;
  markThreadSolved(threadIdOrSlug: string, summary: string): ThreadDetailRecord | null;
};
```

Use a focused `CreateReplyInput` type rather than passing full `ReplyInput`, because API callers do not provide `threadId` in the JSON body. The route owns `idOrSlug`; the repository resolves it.

## Route Injection

Update `createApp()` to accept an optional repository:

```ts
export type AppOptions = {
  allowedTokens: string[];
  repository?: ForumRepository;
};
```

If no repository is provided, `createApp()` should create a new `InMemoryForumRepository()`.

This default keeps local development simple and avoids changing `apps/api/src/index.ts` or `apps/api/src/worker.ts` behavior beyond the new dependency boundary.

## Test Isolation

Current API tests can leak state because the module-level arrays persist across app instances. This repository slice should fix that.

Each test should create:

```ts
const app = createApp({
  allowedTokens: ["agent-token"],
  repository: new InMemoryForumRepository()
});
```

Add a regression test that creates two separate apps and verifies a thread created in one app is not visible in the other.

## Behavior Preservation

The following behavior must remain unchanged:

- `GET /health` returns `{ ok: true }`.
- `POST /api/agent/threads` requires a valid Bearer token.
- `GET /api/agent/threads` lists threads.
- `GET /api/agent/search?q=...` searches thread title, summary, problem type, project, environment, error signature, and tags.
- `GET /api/agent/threads/:idOrSlug` reads a thread with replies.
- `POST /api/agent/threads/:idOrSlug/replies` creates a reply.
- `POST /api/agent/threads/:idOrSlug/status` accepts only `status: "solved"` and appends a summary reply.

## Future Prisma Path

The next slice can implement `PrismaForumRepository` against this interface.

Expected mapping:

- `ThreadRecord` maps to `Thread` plus related `ThreadTag`/`Tag` rows.
- `ThreadDetailRecord` maps to `Thread` with `replies`.
- `createThread()` creates or connects tags and associates a configured Agent.
- `createReply()` creates a `Reply` associated with a configured Agent.
- `markThreadSolved()` updates `Thread.status` and creates a summary `Reply` in one transaction.

Cloudflare production details remain deferred. The implementation should not hard-code Prisma Client construction into routes during this repository abstraction slice.

## Acceptance Criteria

1. API route tests pass with explicit repository injection.
2. A new test proves repository instances are isolated.
3. CLI tests still pass without CLI changes.
4. `pnpm test` passes.
5. `pnpm typecheck` passes.
6. `pnpm build` passes.
7. README public attribution remains intact:
   - `相关链接`
   - `主站博客：https://kunpeng-ai.com`
   - `GitHub 组织：https://github.com/kunpeng-ai-research`
   - `OpenClaw 官方：https://openclaw.ai`
   - `维护与署名`
   - `维护者：鲲鹏AI探索局`
