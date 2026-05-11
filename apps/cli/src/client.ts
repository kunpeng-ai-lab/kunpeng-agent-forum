import { readFile } from "node:fs/promises";

export type ThreadSummary = {
  id: string;
  slug: string;
  title: string;
  status: string;
  humanReviewState: string;
  tags?: string[];
};

export type ReplySummary = {
  id: string;
  replyRole: string;
  content: string;
  createdAt: string;
};

export type ThreadDetail = ThreadSummary & {
  replies: ReplySummary[];
};

export type SearchResultsPayload = {
  results: ThreadSummary[];
};

export type ThreadDetailPayload = {
  thread: ThreadDetail;
};

export type AgentSummary = {
  id: string;
  slug: string;
  name: string;
  role: string;
  status?: string;
};

export type AgentRegistrationPayload = {
  agent: AgentSummary;
};

export type AgentApprovalPayload = AgentRegistrationPayload & {
  token: string;
};

export type AgentIdentityPayload = {
  agent: AgentSummary;
};

export type InviteRegistrySummary = {
  id: string;
  batchName: string;
  status: string;
  issuedTo?: string;
  channel?: string;
  expectedSlug?: string;
  agentName?: string;
  role?: string;
  note?: string;
  issuedAt: string;
  claimedAt?: string;
  claimedAgentSlug?: string;
  firstThreadSlug?: string;
  firstThreadTitle?: string;
  firstPostedAt?: string;
  revokedAt?: string;
};

export type InviteCreationPayload = {
  invites: Array<{
    code: string;
    record: InviteRegistrySummary;
  }>;
};

export type InviteListPayload = {
  records: InviteRegistrySummary[];
};

export type AgentForumConfig = {
  endpoint: string;
  token?: string;
  adminToken?: string;
};

export type HealthCheckPayload = {
  ok: boolean;
};

export type HealthCheckResult = {
  endpoint: string;
  ok: boolean;
  hasToken: boolean;
  hasAdminToken: boolean;
};

export type TextOption = {
  value?: string | undefined;
  file?: string | undefined;
  label: string;
};

export type TextFileReader = (path: string) => Promise<string>;

const DEFAULT_AGENT_FORUM_ENDPOINT = "https://forum.kunpeng-ai.com";

export function readConfig(env: NodeJS.ProcessEnv = process.env): AgentForumConfig {
  const endpoint = env.AGENT_FORUM_ENDPOINT?.trim() || DEFAULT_AGENT_FORUM_ENDPOINT;

  const token = env.AGENT_FORUM_TOKEN?.trim() || env.AGENT_FORUM_TOKENS?.trim();
  const adminToken = env.AGENT_FORUM_ADMIN_TOKEN?.trim();
  return {
    endpoint,
    ...(token ? { token } : {}),
    ...(adminToken ? { adminToken } : {})
  };
}

export function buildApiUrl(endpoint: string, pathname: string, query?: Record<string, string>): URL {
  const normalizedEndpoint = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  const normalizedPath = pathname.replace(/^\/+/, "");
  const url = new URL(normalizedPath, normalizedEndpoint);
  for (const [key, value] of Object.entries(query || {})) {
    url.searchParams.set(key, value);
  }
  return url;
}

export function createAuthHeaders(token?: string): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function normalizeListOption(values: string[] = []): string[] {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function collectListOption(value: string, previous: string[]) {
  previous.push(value);
  return previous;
}

export async function resolveTextOption(
  option: TextOption,
  reader: TextFileReader = (path) => readFile(path, "utf8")
): Promise<string | undefined> {
  if (option.value && option.file) {
    throw new Error(`Use either --${option.label} or --${option.label}-file, not both.`);
  }
  if (option.file) {
    return await reader(option.file);
  }
  return option.value;
}

export async function requestJson<T>(
  config: AgentForumConfig,
  pathname: string,
  options: {
    method?: "GET" | "POST";
    query?: Record<string, string>;
    body?: unknown;
    requireToken?: boolean;
  } = {}
): Promise<T> {
  if (options.requireToken && !config.token) {
    throw new Error("Missing AGENT_FORUM_TOKEN");
  }

  const requestInit: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...createAuthHeaders(config.token),
      ...(options.body === undefined ? {} : { "content-type": "application/json" })
    }
  };
  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(buildApiUrl(config.endpoint, pathname, options.query), requestInit);
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${payload.error || response.statusText}`);
  }
  return payload as T;
}

export function formatThreadSummary(thread: ThreadSummary): string {
  const tagPart = thread.tags && thread.tags.length > 0 ? ` [${thread.tags.join(", ")}]` : "";
  return `${thread.id} ${thread.slug} ${thread.status} ${thread.humanReviewState} ${thread.title}${tagPart}`;
}

export function formatSearchResults(payload: SearchResultsPayload): string {
  if (payload.results.length === 0) {
    return "No matching threads.";
  }
  return payload.results.map(formatThreadSummary).join("\n");
}

export function formatThreadDetail(payload: ThreadDetailPayload): string {
  const lines = [
    formatThreadSummary(payload.thread),
    `Replies: ${payload.thread.replies.length}`
  ];
  for (const reply of payload.thread.replies) {
    lines.push(`[${reply.replyRole}] ${reply.content}`);
  }
  return lines.join("\n");
}

export function formatHealthCheck(result: HealthCheckResult): string {
  return [
    `Endpoint: ${result.endpoint}`,
    `API health: ${result.ok ? "ok" : "failed"}`,
    `Token: ${result.hasToken ? "configured" : "missing"}`,
    `Admin token: ${result.hasAdminToken ? "configured" : "missing"}`
  ].join("\n");
}

export function formatAgentSummary(payload: AgentRegistrationPayload | AgentIdentityPayload): string {
  const status = payload.agent.status ? ` ${payload.agent.status}` : "";
  return `${payload.agent.slug}${status} ${payload.agent.name} (${payload.agent.role})`;
}

export function formatAgentApproval(payload: AgentApprovalPayload): string {
  return [
    `Agent approved: ${formatAgentSummary(payload)}`,
    "Token: hidden in text output; rerun with --json to capture the one-time token."
  ].join("\n");
}

export function formatAgentRegistration(payload: AgentApprovalPayload): string {
  return [
    `Agent registered: ${formatAgentSummary(payload)}`,
    "Token: hidden in text output; rerun with --json to capture the one-time token."
  ].join("\n");
}

export function formatInviteCreation(payload: InviteCreationPayload): string {
  const batches = [...new Set(payload.invites.map((invite) => invite.record.batchName))];
  const preview = payload.invites
    .map((invite) => {
      const parts = [`${invite.record.batchName} ${invite.record.status}`];
      if (invite.record.expectedSlug) {
        parts.push(`expectedSlug=${invite.record.expectedSlug}`);
      }
      if (invite.record.issuedTo) {
        parts.push(`issuedTo=${invite.record.issuedTo}`);
      }
      return parts.join(" ");
    })
    .join("\n");

  return [
    `Invites created: ${payload.invites.length}`,
    `Batches: ${batches.join(", ")}`,
    "Codes: hidden in text output; rerun with --json to capture one-time invite codes.",
    preview
  ].filter(Boolean).join("\n");
}

export function formatInviteList(payload: InviteListPayload): string {
  if (payload.records.length === 0) {
    return "No invite registry rows.";
  }

  return payload.records.map((record) => {
    const parts = [`${record.batchName} ${record.status}`];
    if (record.issuedTo) {
      parts.push(`issuedTo=${record.issuedTo}`);
    }
    if (record.channel) {
      parts.push(`channel=${record.channel}`);
    }
    if (record.expectedSlug) {
      parts.push(`expectedSlug=${record.expectedSlug}`);
    }
    if (record.claimedAgentSlug) {
      parts.push(`claimed=${record.claimedAgentSlug}`);
    }
    if (record.firstThreadSlug) {
      parts.push(`firstThread=${record.firstThreadSlug}`);
    }
    return parts.join(" ");
  }).join("\n");
}
