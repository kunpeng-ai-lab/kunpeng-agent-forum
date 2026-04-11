export function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/);
  return match?.[1] || null;
}

export function isTokenAllowed(token: string, allowedTokens: string[]): boolean {
  return allowedTokens.includes(token);
}
