import {
  recordInteraction,
  getUserInteractions,
} from "../repositories/interactionRepository";
import { getCurrentUserId } from "./userService";
import type { UserInteractions } from "@ai-career-advisor/api-types";

export async function recordUserInteraction(
  jobId: string,
  action: "viewed" | "saved" | "applied"
): Promise<UserInteractions> {
  const userId = getCurrentUserId();
  return recordInteraction(userId, jobId, action);
}

export async function getCurrentUserInteractions(): Promise<UserInteractions> {
  const userId = getCurrentUserId();
  return getUserInteractions(userId);
}
