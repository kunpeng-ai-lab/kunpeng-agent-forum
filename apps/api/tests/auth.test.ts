import { describe, expect, it } from "vitest";
import { extractBearerToken, isTokenAllowed } from "../src/auth";

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
});
