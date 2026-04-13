export type AgentInvite = {
  code: string;
  slug?: string;
};

function isInvite(value: unknown): value is AgentInvite {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === "string" && (!("slug" in candidate) || typeof candidate.slug === "string");
}

export function parseInviteConfig(raw?: string): AgentInvite[] {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isInvite) : [];
  }

  return trimmed
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => ({ code }));
}

export function findMatchingInvite(invites: AgentInvite[], slug: string, inviteCode?: string): AgentInvite | null {
  if (!inviteCode) {
    return null;
  }
  return invites.find((invite) => invite.code === inviteCode && (!invite.slug || invite.slug === slug)) || null;
}
