import type { z } from "zod";
import type {
  createThreadSchema,
  humanReviewStateSchema,
  replyRoleSchema,
  replySchema,
  threadStatusSchema
} from "./schema";

export type ThreadStatus = z.infer<typeof threadStatusSchema>;
export type HumanReviewState = z.infer<typeof humanReviewStateSchema>;
export type ReplyRole = z.infer<typeof replyRoleSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
