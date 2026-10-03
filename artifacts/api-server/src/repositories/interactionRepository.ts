import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import type { Interaction, UserInteractions } from "@ai-career-advisor/api-types";

export interface InteractionDocument {
  _id?: ObjectId;
  id: string;
  userId: string;
  jobId: string;
  action: "viewed" | "saved" | "applied";
  timestamp: string;
}

export function getInteractionCollection(): Collection<InteractionDocument> {
  return getDatabase().collection<InteractionDocument>("interactions");
}

export async function recordInteraction(
  userId: string,
  jobId: string,
  action: "viewed" | "saved" | "applied"
): Promise<UserInteractions> {
  const collection = getInteractionCollection();

  // If toggling "saved"
  if (action === "saved") {
    const existingSaved = await collection.findOne({ userId, jobId, action: "saved" });
    if (existingSaved) {
      await collection.deleteOne({ _id: existingSaved._id });
      return getUserInteractions(userId);
    }
  }

  // Check if action already logged to prevent duplicates
  const existing = await collection.findOne({ userId, jobId, action });
  if (!existing) {
    const doc: InteractionDocument = {
      id: `${userId}-${jobId}-${action}-${Date.now()}`,
      userId,
      jobId,
      action,
      timestamp: new Date().toISOString(),
    };
    await collection.insertOne(doc);
  }

  return getUserInteractions(userId);
}

export async function getUserInteractions(userId: string): Promise<UserInteractions> {
  const collection = getInteractionCollection();
  const docs = await collection.find({ userId }).sort({ timestamp: -1 }).toArray();

  const interactions: Record<string, string[]> = {};
  const activityLog: Interaction[] = docs.map((doc) => ({
    id: doc.id || String(doc._id),
    userId: doc.userId,
    jobId: doc.jobId,
    action: doc.action,
    timestamp: doc.timestamp,
  }));

  for (const doc of docs) {
    if (!interactions[doc.jobId]) {
      interactions[doc.jobId] = [];
    }
    if (!interactions[doc.jobId].includes(doc.action)) {
      interactions[doc.jobId].push(doc.action);
    }
  }

  return {
    interactions,
    activityLog,
  };
}

export async function getAllUserInteractions(userId: string): Promise<InteractionDocument[]> {
  return getInteractionCollection().find({ userId }).sort({ timestamp: 1 }).toArray();
}
