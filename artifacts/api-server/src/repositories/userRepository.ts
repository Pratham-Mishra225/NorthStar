import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";

export const DEMO_USER_ID = "demo-user-alex-sharma";

export interface UserDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  email: string;
  targetRoleId: string;
  preferredLocations: string[];
  createdAt: string;
  updatedAt: string;
}

export function getUserCollection(): Collection<UserDocument> {
  return getDatabase().collection<UserDocument>("users");
}

export async function ensureDemoUser(): Promise<UserDocument> {
  const collection = getUserCollection();
  const existing = await collection.findOne({ id: DEMO_USER_ID });
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const demoUser: UserDocument = {
    id: DEMO_USER_ID,
    name: "Alex Sharma",
    email: "alex.sharma@example.com",
    targetRoleId: "data-analyst",
    preferredLocations: ["Remote", "Portland"],
    createdAt: now,
    updatedAt: now,
  };

  await collection.updateOne(
    { id: DEMO_USER_ID },
    { $set: demoUser },
    { upsert: true }
  );

  return demoUser;
}

export async function getDemoUser(): Promise<UserDocument> {
  return ensureDemoUser();
}

export async function getUserById(id: string): Promise<UserDocument | null> {
  return getUserCollection().findOne({ id });
}

export async function updateUserTargetRole(userId: string, targetRoleId: string): Promise<void> {
  const collection = getUserCollection();
  await collection.updateOne(
    { id: userId },
    {
      $set: {
        targetRoleId,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}
