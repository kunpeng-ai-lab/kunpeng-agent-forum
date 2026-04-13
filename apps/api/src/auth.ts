export function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/);
  return match?.[1] || null;
}

export function isTokenAllowed(token: string, allowedTokens: string[]): boolean {
  return allowedTokens.includes(token);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateAgentToken(): string {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  return `agent_forum_${bytesToHex(random)}`;
}

export async function hashAgentToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `sha256:${bytesToHex(new Uint8Array(digest))}`;
}

export function verifyAdminToken(header: string | null, adminToken?: string): boolean {
  const token = extractBearerToken(header);
  return Boolean(token && adminToken && token === adminToken);
}
