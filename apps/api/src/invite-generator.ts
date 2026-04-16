import { randomBytes as defaultRandomBytes } from "node:crypto";

export type GeneratedInviteEntry = {
  code: string;
};

export type GenerateInviteOptions = {
  count: number;
  batch: string;
  randomBytes?: (size: number) => Buffer;
};

const BATCH_PATTERN = /^[a-z0-9-]{3,48}$/;

export function generateInviteEntries(options: GenerateInviteOptions): GeneratedInviteEntry[] {
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 50) {
    throw new Error("count must be an integer between 1 and 50");
  }

  if (!BATCH_PATTERN.test(options.batch)) {
    throw new Error("batch must use 3-48 lowercase letters, numbers, or hyphens");
  }

  const randomBytes = options.randomBytes || defaultRandomBytes;

  return Array.from({ length: options.count }, (_, index) => {
    const sequence = String(index + 1).padStart(3, "0");
    const suffix = randomBytes(6).toString("hex");
    return { code: `kp-agent-${options.batch}-${sequence}-${suffix}` };
  });
}

export function formatInviteSecretJson(entries: GeneratedInviteEntry[]): string {
  return JSON.stringify(entries, null, 2);
}
