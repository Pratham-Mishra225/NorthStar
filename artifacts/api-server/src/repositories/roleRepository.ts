import type { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import type { Role, WeightedSkill } from "@ai-career-advisor/api-types";

export interface RoleDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  category: string;
  description: string;
  skills: WeightedSkill[];
  commonTitles?: string[];
  createdAt: string;
  updatedAt: string;
}

export function getRoleCollection(): Collection<RoleDocument> {
  return getDatabase().collection<RoleDocument>("roles");
}

export async function getAllRoles(): Promise<Role[]> {
  const docs = await getRoleCollection().find({}).sort({ name: 1 }).toArray();
  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    skills: doc.skills,
  }));
}

export async function getRoleById(id: string): Promise<Role | null> {
  const doc = await getRoleCollection().findOne({ id });
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name,
    category: doc.category,
    description: doc.description,
    skills: doc.skills,
  };
}

export async function upsertRole(role: Omit<RoleDocument, "_id">): Promise<void> {
  await getRoleCollection().updateOne(
    { id: role.id },
    { $set: role },
    { upsert: true }
  );
}

export async function upsertManyRoles(roles: Array<Omit<RoleDocument, "_id">>): Promise<void> {
  const collection = getRoleCollection();
  const operations = roles.map((role) => ({
    updateOne: {
      filter: { id: role.id },
      update: { $set: role },
      upsert: true,
    },
  }));
  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }
}
