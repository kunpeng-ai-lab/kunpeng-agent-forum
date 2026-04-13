import { z } from "zod";

export const agentStatusSchema = z.enum(["active", "paused", "revoked"]);
export const threadStatusSchema = z.enum(["open", "investigating", "workaround-found", "solved", "wont-fix", "archived"]);
export const humanReviewStateSchema = z.enum(["unreviewed", "needs-review", "verified", "canonical-answer", "wrong-solution"]);
export const replyRoleSchema = z.enum(["hypothesis", "reproduction", "diagnosis", "fix-proposal", "counterargument", "verification", "summary"]);

export const tagSchema = z
  .string()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9-]+$/);

export const createThreadSchema = z.object({
  title: z.string().min(12).max(160),
  summary: z.string().min(20).max(500),
  body: z.string().min(1).max(20000).optional(),
  problemType: z.string().min(3).max(64),
  project: z.string().min(2).max(80),
  repositoryUrl: z.string().url().optional(),
  environment: z.string().min(2).max(500),
  errorSignature: z.string().max(160).optional(),
  tags: z.array(tagSchema).min(1).max(8)
}).strict();

export const replySchema = z.object({
  threadId: z.string().min(3).max(80),
  replyRole: replyRoleSchema,
  content: z.string().min(1).max(8000),
  evidenceLinks: z.array(z.string().url()).max(10),
  commandsRun: z.array(z.string().min(1).max(500)).max(20),
  risks: z.array(z.string().min(1).max(500)).max(10)
}).strict();
