import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import type { Skill } from "@ai-career-advisor/api-types";

export interface ResumeDocument {
  _id?: ObjectId;
  userId: string;
  filename: string;
  fileType?: string;
  extractedText: string;
  skills: Skill[];
  uploadedAt: string;
  updatedAt: string;
}

export function getResumeCollection(): Collection<ResumeDocument> {
  return getDatabase().collection<ResumeDocument>("resumes");
}

export async function saveResume(resume: Omit<ResumeDocument, "_id">): Promise<ResumeDocument> {
  const collection = getResumeCollection();
  const res = await collection.insertOne(resume as ResumeDocument);
  return {
    ...resume,
    _id: res.insertedId,
  };
}

export async function getLatestResumeByUserId(userId: string): Promise<ResumeDocument | null> {
  return getResumeCollection().findOne({ userId }, { sort: { uploadedAt: -1 } });
}
