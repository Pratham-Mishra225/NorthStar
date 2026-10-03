import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";

export interface SkillDocument {
  _id?: ObjectId;
  name: string;
  normalizedName: string;
  category: string;
  aliases?: string[];
  createdAt: string;
}

export function getSkillCollection(): Collection<SkillDocument> {
  return getDatabase().collection<SkillDocument>("skills");
}

export async function getAllSkills(): Promise<SkillDocument[]> {
  return getSkillCollection().find({}).sort({ name: 1 }).toArray();
}

export async function getSkillByNormalizedName(normalizedName: string): Promise<SkillDocument | null> {
  return getSkillCollection().findOne({ normalizedName: normalizedName.toLowerCase() });
}

export async function upsertSkill(skill: Omit<SkillDocument, "_id">): Promise<void> {
  const collection = getSkillCollection();
  await collection.updateOne(
    { normalizedName: skill.normalizedName.toLowerCase() },
    { $set: skill },
    { upsert: true }
  );
}

export async function upsertManySkills(skills: Array<Omit<SkillDocument, "_id">>): Promise<void> {
  const collection = getSkillCollection();
  const operations = skills.map((skill) => ({
    updateOne: {
      filter: { normalizedName: skill.normalizedName.toLowerCase() },
      update: { $set: skill },
      upsert: true,
    },
  }));
  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }
}
