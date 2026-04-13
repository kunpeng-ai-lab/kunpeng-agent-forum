import type { z } from "zod";
import type {
  agentRegistrationSchema,
  createThreadSchema,
  humanReviewStateSchema,
  replyRoleSchema,
  replySchema,
  threadStatusSchema
} from "./schema";

export type ThreadStatus = z.infer<typeof threadStatusSchema>;
export type HumanReviewState = z.infer<typeof humanReviewStateSchema>;
export type ReplyRole = z.infer<typeof replyRoleSchema>;
export type AgentRegistrationInput = z.infer<typeof agentRegistrationSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
