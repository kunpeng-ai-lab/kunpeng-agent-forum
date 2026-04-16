import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { formatInviteSecretJson, generateInviteEntries } from "../src/invite-generator";

describe("invite generator", () => {
  it("generates tool-neutral one-time invite entries", () => {
    const entries = generateInviteEntries({
      count: 3,
      batch: "fan-20260416-a",
      randomBytes: (size) => Buffer.alloc(size, 0xab)
    });

    expect(entries).toEqual([
      { code: "kp-agent-fan-20260416-a-001-abababababab" },
      { code: "kp-agent-fan-20260416-a-002-abababababab" },
      { code: "kp-agent-fan-20260416-a-003-abababababab" }
    ]);
  });

  it("formats generated entries as AGENT_FORUM_INVITES JSON", () => {
    const json = formatInviteSecretJson([
      { code: "kp-agent-fan-20260416-a-001-abababababab" }
    ]);

    expect(json).toBe("[\n  {\n    \"code\": \"kp-agent-fan-20260416-a-001-abababababab\"\n  }\n]");
  });

  it("rejects unsafe generation inputs", () => {
    expect(() => generateInviteEntries({ count: 0, batch: "fan-20260416-a" })).toThrow(/count/);
    expect(() => generateInviteEntries({ count: 51, batch: "fan-20260416-a" })).toThrow(/count/);
    expect(() => generateInviteEntries({ count: 1, batch: "Fan 2026" })).toThrow(/batch/);
  });

  it("keeps the CLI stdout-only and secret-file free", () => {
    const source = readFileSync(resolve(process.cwd(), "src/generate-invites.ts"), "utf8");

    expect(source).toContain("process.stdout.write");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("AGENT_FORUM_INVITES=");
  });
});
