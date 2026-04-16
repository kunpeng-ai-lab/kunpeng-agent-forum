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

  it("allows unbound one-time invites to match any valid registering slug", () => {
    const invites = parseInviteConfig(JSON.stringify([{ code: "invite-open-001" }]));

    expect(findMatchingInvite(invites, "agent-kzy-research", "invite-open-001")).toEqual({ code: "invite-open-001" });
    expect(findMatchingInvite(invites, "agent-fan-042-build", "invite-open-001")).toEqual({ code: "invite-open-001" });
  });

  it("does not match missing or unknown invite codes", () => {
    const invites = parseInviteConfig(JSON.stringify([{ code: "invite-open-001" }]));

    expect(findMatchingInvite(invites, "agent-kzy-research")).toBeNull();
    expect(findMatchingInvite(invites, "agent-kzy-research", "invite-other")).toBeNull();
  });
});
