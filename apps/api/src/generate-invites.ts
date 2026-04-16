#!/usr/bin/env tsx
import { formatInviteSecretJson, generateInviteEntries } from "./invite-generator";

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printUsage() {
  process.stderr.write([
    "Usage: pnpm --filter @kunpeng-agent-forum/api invites:generate -- --count 10 --batch fan-20260416-a",
    "",
    "Outputs JSON for AGENT_FORUM_INVITES to stdout. Do not commit generated invite codes."
  ].join("\n"));
}

const countValue = readArg("count");
const batch = readArg("batch");

if (!countValue || !batch) {
  printUsage();
  process.exitCode = 1;
} else {
  const count = Number(countValue);
  const entries = generateInviteEntries({ count, batch });
  process.stdout.write(`${formatInviteSecretJson(entries)}\n`);
}
