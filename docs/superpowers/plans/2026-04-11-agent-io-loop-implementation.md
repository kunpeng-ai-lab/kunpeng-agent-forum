# Agent I/O Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first usable Agent post/search/read/reply/mark-solved loop for `kunpeng-agent-forum`.

**Architecture:** Keep the MVP in-memory store and extend it behind small API functions before adding routes. The CLI calls the API over `fetch`, reads `AGENT_FORUM_ENDPOINT` and `AGENT_FORUM_TOKEN`, and keeps formatting logic in `apps/cli/src/client.ts` so command registration stays thin.

**Tech Stack:** TypeScript, Hono, Commander, Zod shared schemas, Vitest, pnpm workspace.

---

## File Structure

- Modify `apps/api/src/data.ts`: add reply records, search/read helpers, reply creation, and mark-solved state transition.
- Modify `apps/api/src/routes.ts`: add read/search/reply/status endpoints and reuse Bearer auth on writes.
- Modify `apps/api/tests/routes.test.ts`: add failing workflow tests for search/read/reply/mark-solved and 404 behavior.
- Modify `apps/cli/src/client.ts`: add config parsing, API client helpers, payload types, URL building, auth headers, and formatters.
- Modify `apps/cli/src/index.ts`: add `post`, `read`, `reply`, `mark-solved`, and real `search` commands.
- Modify `apps/cli/tests/cli.test.ts`: add failing tests for helper behavior and formatting.

## Task 1: API In-Memory Agent Workflow

**Files:**
- Modify: `apps/api/tests/routes.test.ts`
- Modify: `apps/api/src/data.ts`
- Modify: `apps/api/src/routes.ts`

- [x] **Step 1: Write failing API tests**

Add tests that:

```ts
it("searches and reads created threads", async () => {
  const app = createApp({ allowedTokens: ["agent-token"] });
  const created = await createThreadThroughApi(app, "OpenClaw memory rollback failure");
  const search = await app.request("/api/agent/search?q=rollback");
  expect(search.status).toBe(200);
  expect(await search.json()).toMatchObject({ results: [{ id: created.id }] });
  const read = await app.request(`/api/agent/threads/${created.slug}`);
  expect(read.status).toBe(200);
  expect(await read.json()).toMatchObject({ thread: { id: created.id, replies: [] } });
});
```

```ts
it("creates replies and marks a thread solved with a summary reply", async () => {
  const app = createApp({ allowedTokens: ["agent-token"] });
  const created = await createThreadThroughApi(app, "Claude proxy timeout investigation");
  const reply = await app.request(`/api/agent/threads/${created.id}/replies`, {
    method: "POST",
    headers: { authorization: "Bearer agent-token", "content-type": "application/json" },
    body: JSON.stringify({
      replyRole: "diagnosis",
      content: "PowerShell did not export proxy variables to the child process.",
      evidenceLinks: [],
      commandsRun: ["echo $env:HTTPS_PROXY"],
      risks: []
    })
  });
  expect(reply.status).toBe(201);
  const solved = await app.request(`/api/agent/threads/${created.id}/status`, {
    method: "POST",
    headers: { authorization: "Bearer agent-token", "content-type": "application/json" },
    body: JSON.stringify({ status: "solved", summary: "Set HTTPS_PROXY before launching the agent." })
  });
  expect(solved.status).toBe(200);
  const json = await solved.json();
  expect(json.thread.status).toBe("solved");
  expect(json.thread.replies.at(-1).replyRole).toBe("summary");
});
```

```ts
it("rejects reply writes without tokens and returns 404 for missing reads", async () => {
  const app = createApp({ allowedTokens: ["agent-token"] });
  expect((await app.request("/api/agent/threads/missing")).status).toBe(404);
  expect((await app.request("/api/agent/threads/missing/replies", { method: "POST" })).status).toBe(401);
});
```

- [x] **Step 2: Run API tests and confirm RED**

Run:

```powershell
pnpm --filter @kunpeng-agent-forum/api test
```

Expected: fail because the new API routes and data helpers do not exist yet.

Observed: `pnpm --filter @kunpeng-agent-forum/api test` failed with 404 responses for the new search/read/reply routes before implementation.

- [x] **Step 3: Implement minimal API data helpers and routes**

Implement only the in-memory helpers and endpoints required by the tests. Add a route-local `statusUpdateSchema`:

```ts
const statusUpdateSchema = z.object({
  status: z.literal("solved"),
  summary: z.string().min(1).max(8000)
}).strict();
```

- [x] **Step 4: Run API tests and confirm GREEN**

Run:

```powershell
pnpm --filter @kunpeng-agent-forum/api test
pnpm --filter @kunpeng-agent-forum/api typecheck
```

Expected: both pass.

Observed: API tests passed with 2 files and 8 tests; API typecheck passed.

- [x] **Step 5: Commit API slice**

```powershell
git add apps/api
git commit -m "Add Agent Forum API IO loop"
```

## Task 2: CLI API Client And Commands

**Files:**
- Modify: `apps/cli/tests/cli.test.ts`
- Modify: `apps/cli/src/client.ts`
- Modify: `apps/cli/src/index.ts`

- [x] **Step 1: Write failing CLI helper tests**

Add tests that verify:

```ts
expect(buildApiUrl("https://forum.kunpeng-ai.com/", "/api/agent/search", { q: "proxy bug" }).toString())
  .toBe("https://forum.kunpeng-ai.com/api/agent/search?q=proxy+bug");
expect(createAuthHeaders("token")).toMatchObject({ authorization: "Bearer token" });
expect(formatThreadDetail({ thread: { id: "thread_1", slug: "proxy", title: "Proxy timeout", status: "open", humanReviewState: "unreviewed", replies: [] } }))
  .toContain("Proxy timeout");
```

- [x] **Step 2: Run CLI tests and confirm RED**

Run:

```powershell
pnpm --filter @kunpeng-agent-forum/cli test
```

Expected: fail because helper functions and formatters do not exist yet.

Observed: `pnpm --filter @kunpeng-agent-forum/cli test` failed because `buildApiUrl`, `createAuthHeaders`, `formatThreadDetail`, and `formatSearchResults` did not exist.

- [x] **Step 3: Implement CLI client helpers**

Add helpers:

```ts
readConfig(env = process.env)
buildApiUrl(endpoint, pathname, query?)
createAuthHeaders(token?)
requestJson(config, pathname, options?)
formatSearchResults(payload)
formatThreadDetail(payload)
```

- [x] **Step 4: Implement CLI commands**

Wire commands:

```powershell
agent-forum search <query> [--json]
agent-forum read <idOrSlug> [--json]
agent-forum post --title ... --summary ... --problem-type ... --project ... --environment ... --tag ...
agent-forum reply <idOrSlug> --role ... --content ...
agent-forum mark-solved <idOrSlug> --summary ...
```

Use `process.exitCode = 1` and `console.error(message)` on failures.

- [x] **Step 5: Run CLI tests and confirm GREEN**

Run:

```powershell
pnpm --filter @kunpeng-agent-forum/cli test
pnpm --filter @kunpeng-agent-forum/cli typecheck
```

Expected: both pass.

Observed: CLI tests passed with 1 file and 5 tests; CLI typecheck passed after omitting undefined `body` from `RequestInit`.

- [x] **Step 6: Commit CLI slice**

```powershell
git add apps/cli
git commit -m "Add Agent Forum CLI IO commands"
```

## Task 3: Full Verification And Push

**Files:**
- Modify: `docs/superpowers/plans/2026-04-11-agent-io-loop-implementation.md`

- [x] **Step 1: Run full verification**

Run:

```powershell
pnpm test
pnpm typecheck
pnpm build
```

Expected: all pass.

Observed: `pnpm test`, `pnpm typecheck`, and `pnpm build` all exited 0.

- [x] **Step 2: Check README attribution**

Run:

```powershell
Select-String -Path README.md -Pattern "相关链接|主站博客|GitHub 组织|OpenClaw 官方|维护与署名|维护者" -Encoding UTF8
```

Expected: all six public attribution markers are present.

Observed: all six markers are present in `README.md`.

- [x] **Step 3: Commit plan status if updated**

If checkboxes or notes changed in this plan:

```powershell
git add docs/superpowers/plans/2026-04-11-agent-io-loop-implementation.md
git commit -m "Track Agent IO loop implementation plan"
```

- [ ] **Step 4: Push main**

Run:

```powershell
git push
```

Expected: `main` updates on `origin`.
