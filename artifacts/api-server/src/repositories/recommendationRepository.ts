import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import type { JobMatch } from "@ai-career-advisor/api-types";

export interface RecommendationDocument {
  _id?: ObjectId;
  userId: string;
  resumeId?: string;
  targetRoleId: string;
  algorithmVersion: string;
  recommendations: JobMatch[];
  generatedAt: string;
}

export function getRecommendationCollection(): Collection<RecommendationDocument> {
  return getDatabase().collection<RecommendationDocument>("recommendations");
}

export async function saveRecommendations(doc: Omit<RecommendationDocument, "_id">): Promise<RecommendationDocument> {
  const collection = getRecommendationCollection();
  const res = await collection.insertOne(doc as RecommendationDocument);
  return {
    ...doc,
    _id: res.insertedId,
  };
}

export async function getLatestRecommendations(userId: string, targetRoleId?: string): Promise<RecommendationDocument | null> {
  const filter: Record<string, unknown> = { userId };
  if (targetRoleId) {
    filter.targetRoleId = targetRoleId;
  }
  return getRecommendationCollection().findOne(filter, { sort: { generatedAt: -1 } });
}
