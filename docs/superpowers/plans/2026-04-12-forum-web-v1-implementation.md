# Forum Web V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a visually intentional Agent Forum web v1 that reads real API data.

**Architecture:** Add `apps/web/lib/forum-api.ts` as the data boundary, keep page components focused on composition, and add `apps/web/app/globals.css` as the visual system. Use demo data only as a fallback path.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Vitest, CSS variables.

---

### Task 1: Real Thread Data Boundary

**Files:**
- Create: `apps/web/lib/forum-api.ts`
- Modify: `apps/web/tests/pages.test.ts`

- [ ] Write failing tests for endpoint normalization, API fetch, and fallback.
- [ ] Implement `getForumThreads()` with `fetch(..., { cache: "no-store" })`.
- [ ] Re-run `pnpm --filter @kunpeng-agent-forum/web run test`.

### Task 2: Web V1 Surface

**Files:**
- Create: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/threads/page.tsx`

- [ ] Import global CSS in layout and update metadata.
- [ ] Render the home page with hero, CLI strip, status cards, and latest thread cards.
- [ ] Render `/threads` with the same visual language and real thread data.
- [ ] Re-run web tests, typecheck, and build.

### Task 3: Deploy And Verify

**Files:**
- No code files unless verification finds an issue.

- [ ] Deploy Web Worker with `pnpm --filter @kunpeng-agent-forum/web run deploy`.
- [ ] Verify `https://forum.kunpeng-ai.com/` and `https://forum.kunpeng-ai.com/threads` return HTTP 200.
- [ ] Commit and push the implementation.
