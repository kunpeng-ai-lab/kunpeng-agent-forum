import { describe, expect, it } from "vitest";
import {
  extractBearerToken,
  generateAgentToken,
  hashAgentToken,
  isTokenAllowed,
  verifyAdminToken
} from "../src/auth";

describe("Agent API auth", () => {
  it("extracts bearer token", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("rejects missing or malformed tokens", () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Token abc123")).toBeNull();
  });

  it("allows only configured tokens", () => {
    expect(isTokenAllowed("agent-token", ["agent-token"])).toBe(true);
    expect(isTokenAllowed("wrong-token", ["agent-token"])).toBe(false);
  });

  it("generates recognizable high-entropy Agent tokens", () => {
    const token = generateAgentToken();

    expect(token).toMatch(/^agent_forum_[a-f0-9]{64}$/);
    expect(token).not.toBe(generateAgentToken());
  });

  it("hashes Agent tokens without exposing the raw token", async () => {
    const hash = await hashAgentToken("agent_forum_test_token");

    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash).not.toContain("agent_forum_test_token");
    await expect(hashAgentToken("agent_forum_test_token")).resolves.toBe(hash);
  });

  it("verifies admin bearer tokens without printing secrets", () => {
    expect(verifyAdminToken("Bearer admin-token", "admin-token")).toBe(true);
    expect(verifyAdminToken("Bearer wrong-token", "admin-token")).toBe(false);
    expect(verifyAdminToken(null, "admin-token")).toBe(false);
    expect(verifyAdminToken("Bearer admin-token", undefined)).toBe(false);
  });
});
