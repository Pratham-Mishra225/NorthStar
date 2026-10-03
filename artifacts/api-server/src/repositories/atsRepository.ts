import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import type { AtsAnalysis } from "@ai-career-advisor/api-types";

export interface AtsAnalysisDocument {
  _id?: ObjectId;
  userId: string;
  resumeId?: string;
  targetRoleId: string;
  ats: AtsAnalysis;
  analyzedAt: string;
}

export function getAtsCollection(): Collection<AtsAnalysisDocument> {
  return getDatabase().collection<AtsAnalysisDocument>("ats_analyses");
}

export async function saveAtsAnalysis(doc: Omit<AtsAnalysisDocument, "_id">): Promise<AtsAnalysisDocument> {
  const collection = getAtsCollection();
  const res = await collection.insertOne(doc as AtsAnalysisDocument);
  return {
    ...doc,
    _id: res.insertedId,
  };
}

export async function getLatestAtsAnalysis(userId: string, targetRoleId?: string): Promise<AtsAnalysisDocument | null> {
  const filter: Record<string, unknown> = { userId };
  if (targetRoleId) {
    filter.targetRoleId = targetRoleId;
  }
  return getAtsCollection().findOne(filter, { sort: { analyzedAt: -1 } });
}
