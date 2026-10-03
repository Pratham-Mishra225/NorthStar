import type { Collection, ObjectId, Filter } from "mongodb";
import { getDatabase } from "../db/mongodb";
import type { Job } from "@ai-career-advisor/api-types";

export interface JobDocument extends Omit<Job, "id"> {
  _id?: ObjectId;
  id: string;
}

export interface JobFilterOptions {
  q?: string;
  category?: string;
  location?: string;
  jobType?: string;
  workMode?: string;
  sort?: "best-match" | "highest-match" | "newest";
  limit?: number;
  page?: number;
}

export function getJobCollection(): Collection<JobDocument> {
  return getDatabase().collection<JobDocument>("jobs");
}

export async function getJobs(options: JobFilterOptions = {}): Promise<Job[]> {
  const collection = getJobCollection();
  const filter: Filter<JobDocument> = { active: true };

  if (options.category) {
    filter.category = { $regex: new RegExp(`^${options.category.trim()}$`, "i") };
  }

  if (options.location) {
    filter.city = { $regex: new RegExp(options.location.trim(), "i") };
  }

  if (options.jobType) {
    filter.jobType = { $regex: new RegExp(`^${options.jobType.trim()}$`, "i") };
  }

  if (options.workMode) {
    filter.workMode = { $regex: new RegExp(`^${options.workMode.trim()}$`, "i") };
  }

  if (options.q) {
    const qRegex = { $regex: new RegExp(options.q.trim(), "i") };
    filter.$or = [
      { title: qRegex },
      { company: qRegex },
      { city: qRegex },
      { category: qRegex },
      { description: qRegex },
      { "skills.name": qRegex },
    ];
  }

  let cursor = collection.find(filter);

  if (options.sort === "newest") {
    cursor = cursor.sort({ createdAt: -1 });
  } else {
    cursor = cursor.sort({ title: 1, company: 1 });
  }

  const limit = options.limit ?? 300;
  const page = options.page ?? 1;
  const skip = (page - 1) * limit;

  if (skip > 0) {
    cursor = cursor.skip(skip);
  }
  if (limit > 0) {
    cursor = cursor.limit(limit);
  }

  const docs = await cursor.toArray();
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    company: doc.company,
    city: doc.city,
    workMode: doc.workMode,
    category: doc.category,
    jobType: doc.jobType,
    experienceLevel: doc.experienceLevel,
    description: doc.description,
    salary: doc.salary,
    skills: doc.skills,
    source: doc.source || "Demo Dataset",
    createdAt: doc.createdAt,
    active: doc.active,
  }));
}

export async function getAllActiveJobs(): Promise<Job[]> {
  return getJobs({ limit: 1000 });
}

export async function getJobById(id: string): Promise<Job | null> {
  const doc = await getJobCollection().findOne({ id });
  if (!doc) return null;
  return {
    id: doc.id,
    title: doc.title,
    company: doc.company,
    city: doc.city,
    workMode: doc.workMode,
    category: doc.category,
    jobType: doc.jobType,
    experienceLevel: doc.experienceLevel,
    description: doc.description,
    salary: doc.salary,
    skills: doc.skills,
    source: doc.source || "Demo Dataset",
    createdAt: doc.createdAt,
    active: doc.active,
  };
}

export async function countJobs(options: JobFilterOptions = {}): Promise<number> {
  const collection = getJobCollection();
  const filter: Filter<JobDocument> = { active: true };
  if (options.category) {
    filter.category = { $regex: new RegExp(`^${options.category.trim()}$`, "i") };
  }
  return collection.countDocuments(filter);
}

export async function upsertJob(job: Omit<JobDocument, "_id">): Promise<void> {
  await getJobCollection().updateOne(
    { id: job.id },
    { $set: job },
    { upsert: true }
  );
}

export async function upsertManyJobs(jobs: Array<Omit<JobDocument, "_id">>): Promise<void> {
  const collection = getJobCollection();
  const operations = jobs.map((job) => ({
    updateOne: {
      filter: { id: job.id },
      update: { $set: job },
      upsert: true,
    },
  }));
  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }
}
