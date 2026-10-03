import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  roles,
  jobs,
  skillTaxonomy,
} from "../../artifacts/api-server/src/data/career-data.js";

// Resolve the repo-root .env regardless of which cwd pnpm uses
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || "ai_career_advisor";

if (!uri) {
  console.error("Error: MONGODB_URI environment variable is required for seeding.");
  process.exit(1);
}

async function seed() {
  console.log(`\n--- Seeding MongoDB Database: ${dbName} ---`);
  const client = new MongoClient(uri as string, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas.");
    const db = client.db(dbName);

    const now = new Date().toISOString();

    // 1. Seed Skills
    console.log(`Seeding ${skillTaxonomy.length} skills...`);
    const skillOps = skillTaxonomy.map((skill) => ({
      updateOne: {
        filter: { normalizedName: skill.name.toLowerCase() },
        update: {
          $set: {
            name: skill.name,
            normalizedName: skill.name.toLowerCase(),
            category: skill.category,
            aliases: skill.aliases ?? [],
            createdAt: now,
          },
        },
        upsert: true,
      },
    }));
    await db.collection("skills").bulkWrite(skillOps);
    await db.collection("skills").createIndex({ normalizedName: 1 }, { unique: true });
    await db.collection("skills").createIndex({ name: 1 });

    // 2. Seed Roles
    console.log(`Seeding ${roles.length} career roles...`);
    const roleOps = roles.map((role) => ({
      updateOne: {
        filter: { id: role.id },
        update: {
          $set: {
            id: role.id,
            name: role.name,
            category: role.category,
            description: role.description,
            skills: role.skills,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    }));
    await db.collection("roles").bulkWrite(roleOps);
    await db.collection("roles").createIndex({ id: 1 }, { unique: true });
    await db.collection("roles").createIndex({ name: 1 });

    // 3. Seed Jobs
    console.log(`Seeding ${jobs.length} synthetic demo jobs...`);
    const jobOps = jobs.map((job) => ({
      updateOne: {
        filter: { id: job.id },
        update: {
          $set: {
            id: job.id,
            title: job.title,
            company: job.company,
            city: job.city,
            workMode: job.workMode,
            category: job.category,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            description: job.description,
            salary: job.salary,
            skills: job.skills,
            source: "Demo Dataset",
            createdAt: job.createdAt,
            active: job.active,
          },
        },
        upsert: true,
      },
    }));
    await db.collection("jobs").bulkWrite(jobOps);
    await db.collection("jobs").createIndex({ id: 1 }, { unique: true });
    await db.collection("jobs").createIndex({ category: 1 });
    await db.collection("jobs").createIndex({ "location.city": 1 });
    await db.collection("jobs").createIndex({ jobType: 1 });
    await db.collection("jobs").createIndex({ workMode: 1 });
    await db.collection("jobs").createIndex({ active: 1 });

    // 4. Seed Demo User
    console.log("Seeding demo user (Alex Sharma)...");
    const demoUser = {
      id: "demo-user-alex-sharma",
      name: "Alex Sharma",
      email: "alex.sharma@example.com",
      targetRoleId: "data-analyst",
      preferredLocations: ["Remote", "Portland"],
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("users").updateOne(
      { id: demoUser.id },
      { $set: demoUser },
      { upsert: true }
    );
    await db.collection("users").createIndex({ id: 1 }, { unique: true, sparse: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });

    // 5. Initialize Resumes & ATS & Interactions Indexes
    await db.collection("resumes").createIndex({ userId: 1, uploadedAt: -1 });
    await db.collection("ats_analyses").createIndex({ userId: 1, targetRoleId: 1, analyzedAt: -1 });
    await db.collection("recommendations").createIndex({ userId: 1, targetRoleId: 1, generatedAt: -1 });
    await db.collection("interactions").createIndex({ userId: 1, jobId: 1, action: 1 });
    await db.collection("interactions").createIndex({ userId: 1, timestamp: -1 });

    // Verify Counts
    const skillCount = await db.collection("skills").countDocuments();
    const roleCount = await db.collection("roles").countDocuments();
    const jobCount = await db.collection("jobs").countDocuments();
    const userCount = await db.collection("users").countDocuments();

    console.log("\n==========================================");
    console.log("MongoDB Database Seeding Completed!");
    console.log(`- Users:  ${userCount}`);
    console.log(`- Roles:  ${roleCount}`);
    console.log(`- Skills: ${skillCount}`);
    console.log(`- Jobs:   ${jobCount}`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
