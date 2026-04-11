# Cloudflare Deployment Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cloudflare-ready deployment configuration for the Agent Forum web app and API without committing production secrets.

**Architecture:** Keep the existing monorepo split: `apps/web` deploys as a Next.js app through OpenNext on Cloudflare Workers, while `apps/api` deploys as a separate Hono Worker. Local Node API development remains available through `apps/api/src/index.ts`; production Workers use a new `apps/api/src/worker.ts` entry.

**Tech Stack:** pnpm workspace, Next.js 15, OpenNext Cloudflare adapter, Hono, Wrangler, Prisma/PostgreSQL via future Hyperdrive binding.

---

### Task 1: Add Hono Worker Deployment Entry

**Files:**
- Create: `apps/api/src/worker.ts`
- Create: `apps/api/wrangler.jsonc`
- Modify: `apps/api/package.json`

- [x] **Step 1: Add a Worker entry that reads environment bindings**

Create `apps/api/src/worker.ts`:

```ts
import { createApp } from "./routes";

type Env = {
  AGENT_FORUM_TOKENS?: string;
};

export default {
  fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    const allowedTokens = (env.AGENT_FORUM_TOKENS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const app = createApp({ allowedTokens });
    return app.fetch(request, env, executionContext);
  }
};
```

- [x] **Step 2: Add Wrangler configuration for the API Worker**

Create `apps/api/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "kunpeng-agent-forum-api",
  "main": "src/worker.ts",
  "compatibility_date": "2026-04-11",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  }
}
```

- [x] **Step 3: Add API deploy scripts**

Add `deploy` and `deploy:dry-run` scripts to `apps/api/package.json`.

### Task 2: Add Next.js OpenNext Cloudflare Configuration

**Files:**
- Create: `apps/web/open-next.config.ts`
- Create: `apps/web/wrangler.jsonc`
- Modify: `apps/web/package.json`
- Modify: `apps/web/next.config.mjs`

- [x] **Step 1: Install Cloudflare deployment dependencies**

Run:

```powershell
pnpm --filter @kunpeng-agent-forum/web add -D @opennextjs/cloudflare wrangler
pnpm --filter @kunpeng-agent-forum/api add -D wrangler
```

- [x] **Step 2: Add OpenNext config**

Create `apps/web/open-next.config.ts`:

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

- [x] **Step 3: Add Wrangler config for the web Worker**

Create `apps/web/wrangler.jsonc` with `.open-next/assets` as the asset directory.

- [x] **Step 4: Add web deploy scripts**

Add `cf:build`, `deploy`, `deploy:dry-run`, and `preview` scripts to `apps/web/package.json`.

### Task 3: Document Deployment Flow

**Files:**
- Create: `docs/cloudflare-deployment.md`
- Modify: `README.md`

- [x] **Step 1: Document required Cloudflare setup**

Record the web/API split, the need for Cloudflare auth, environment variables, and future Hyperdrive binding.

- [x] **Step 2: Link the deployment doc from README**

Add a short deployment section pointing to `docs/cloudflare-deployment.md`.

### Task 4: Verify and Commit

**Files:**
- All files changed above.

- [x] **Step 1: Run type checks**

Run:

```powershell
pnpm typecheck
```

- [x] **Step 2: Run tests**

Run:

```powershell
pnpm test
```

- [x] **Step 3: Run production build**

Run:

```powershell
pnpm build
```

- [x] **Step 4: Run Cloudflare dry-run where possible**

Run:

```powershell
pnpm --filter @kunpeng-agent-forum/api deploy:dry-run
pnpm --filter @kunpeng-agent-forum/web deploy:dry-run
```

Expected: the API dry-run bundles on Windows. The web dry-run may require WSL/Linux CI or Windows symlink privileges because OpenNext creates traced-file symlinks during the standalone Next.js build.

Observed on 2026-04-11: API dry-run passed. Web dry-run reached the OpenNext Next.js build phase and failed on Windows with `EPERM: operation not permitted, symlink`; a direct symlink probe in this workspace also returned `Administrator privilege required for this operation`.

- [ ] **Step 5: Commit and push**

Commit the deployment adapter changes and push `main` to `origin`.
