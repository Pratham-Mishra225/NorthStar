import {
  DEMO_USER_ID,
  getDemoUser,
  updateUserTargetRole,
  type UserDocument,
} from "../repositories/userRepository";

export async function getCurrentUser(): Promise<UserDocument> {
  return getDemoUser();
}

export function getCurrentUserId(): string {
  return DEMO_USER_ID;
}

export async function setCurrentUserTargetRole(targetRoleId: string): Promise<void> {
  await updateUserTargetRole(DEMO_USER_ID, targetRoleId);
}
