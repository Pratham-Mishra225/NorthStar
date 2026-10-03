import { MongoClient, type Db } from "mongodb";
import { logger } from "../lib/logger";

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

export function getDatabaseUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required.");
  }
  return uri;
}

export function getDatabaseName(): string {
  return process.env.MONGODB_DATABASE || "ai_career_advisor";
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db && isConnected) {
    return { client, db };
  }

  const uri = getDatabaseUri();
  const dbName = getDatabaseName();

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(dbName);
    isConnected = true;

    logger.info({ database: dbName }, "Connected to MongoDB Atlas");
    await ensureIndexes(db);

    return { client, db };
  } catch (error) {
    isConnected = false;
    // Log sanitized error without exposing credentials
    logger.error("Failed to connect to MongoDB Atlas");
    throw error;
  }
}

export function getDatabase(): Db {
  if (!db || !isConnected) {
    throw new Error("Database is not connected. Call connectToDatabase() first.");
  }
  return db;
}

export function getMongoClient(): MongoClient {
  if (!client || !isConnected) {
    throw new Error("MongoClient is not connected. Call connectToDatabase() first.");
  }
  return client;
}

export function isDatabaseConnected(): boolean {
  return isConnected && Boolean(db);
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    isConnected = false;
    logger.info("Closed MongoDB Atlas connection");
  }
}

export async function ensureIndexes(database?: Db): Promise<void> {
  const targetDb = database || getDatabase();
  try {
    // 1. Users collection
    await targetDb.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });
    await targetDb.collection("users").createIndex({ id: 1 }, { unique: true, sparse: true });

    // 2. Skills collection
    await targetDb.collection("skills").createIndex({ normalizedName: 1 }, { unique: true });
    await targetDb.collection("skills").createIndex({ name: 1 });

    // 3. Roles collection
    await targetDb.collection("roles").createIndex({ id: 1 }, { unique: true });
    await targetDb.collection("roles").createIndex({ name: 1 });

    // 4. Jobs collection
    await targetDb.collection("jobs").createIndex({ id: 1 }, { unique: true });
    await targetDb.collection("jobs").createIndex({ category: 1 });
    await targetDb.collection("jobs").createIndex({ "location.city": 1 });
    await targetDb.collection("jobs").createIndex({ jobType: 1 });
    await targetDb.collection("jobs").createIndex({ workMode: 1 });
    await targetDb.collection("jobs").createIndex({ active: 1 });

    // 5. Resumes collection
    await targetDb.collection("resumes").createIndex({ userId: 1, uploadedAt: -1 });

    // 6. ATS Analyses collection
    await targetDb.collection("ats_analyses").createIndex({ userId: 1, targetRoleId: 1, analyzedAt: -1 });

    // 7. Recommendations collection
    await targetDb.collection("recommendations").createIndex({ userId: 1, targetRoleId: 1, generatedAt: -1 });

    // 8. Interactions collection
    await targetDb.collection("interactions").createIndex({ userId: 1, jobId: 1, action: 1 });
    await targetDb.collection("interactions").createIndex({ userId: 1, timestamp: -1 });

    logger.info("MongoDB indexes verified");
  } catch (error) {
    logger.warn({ err: error }, "Index creation encountered a warning or duplicate key condition");
  }
}
