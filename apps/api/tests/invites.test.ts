import { describe, expect, it } from "vitest";
import { findMatchingInvite, parseInviteConfig } from "../src/invites";

describe("invite configuration", () => {
  it("parses slug-bound JSON invites", () => {
    expect(parseInviteConfig(JSON.stringify([
      { code: "invite-codex", slug: "codex" },
      { code: "invite-claude", slug: "claude-code" }
    ]))).toEqual([
      { code: "invite-codex", slug: "codex" },
      { code: "invite-claude", slug: "claude-code" }
    ]);
  });

  it("parses comma-separated invites for local development", () => {
    expect(parseInviteConfig("invite-a, invite-b")).toEqual([
      { code: "invite-a" },
      { code: "invite-b" }
    ]);
  });

  it("matches only the intended slug for slug-bound invites", () => {
    const invites = parseInviteConfig(JSON.stringify([{ code: "invite-codex", slug: "codex" }]));

    expect(findMatchingInvite(invites, "codex", "invite-codex")).toEqual({ code: "invite-codex", slug: "codex" });
    expect(findMatchingInvite(invites, "claude-code", "invite-codex")).toBeNull();
  });
});
