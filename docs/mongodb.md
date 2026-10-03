# MongoDB Atlas Integration & Setup Guide

This guide details how to configure, connect, seed, and manage the **MongoDB Atlas** persistence layer for the **AI Career Advisor** platform.

---

## 1. Overview

The AI Career Advisor uses MongoDB Atlas as its authoritative runtime data store. All core application states—including user profiles, resume extractions, canonical skills, career roles, job catalogs, ATS evaluations, hybrid recommendation scores, and user interaction histories—are persisted in MongoDB.

---

## 2. MongoDB Atlas Setup Step-by-Step

### Step 1: Create a MongoDB Atlas Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new organization / project (or select an existing one).
3. Deploy a free **M0 Shared Cluster** (or dedicated tier) in your preferred AWS/GCP/Azure region.

### Step 2: Configure Network Access
1. In the Atlas sidebar, navigate to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. For local development, either add your current public IP address or add `0.0.0.0/0` (allow access from anywhere) if connecting from dynamic networks.

### Step 3: Create a Database User
1. Navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Select **Password Authentication**.
4. Set a username and secure password (e.g. `career_advisor_user`).
5. Under **Database User Privileges**, select **Read and write to any database** (or restrict to `ai_career_advisor`).

### Step 4: Obtain Connection String (URI)
1. In **Deployment** → **Database**, click **Connect** on your cluster.
2. Select **Drivers** (Node.js).
3. Copy the standard connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials.

---

## 3. Environment Configuration

Create a `.env` file in the root of the repository (or set environment variables in your deployment environment):

```env
# Server Configuration
PORT=5000
BASE_PATH=/

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=ai_career_advisor
```

> **Security Note**: Never commit actual database passwords or connection URIs to version control. The `.env` file is excluded in `.gitignore`.

---

## 4. Seeding the Database

Once `MONGODB_URI` is configured, run the idempotent database seeding script:

```bash
pnpm seed
```

### What the Seed Script Does:
1. Connects to MongoDB Atlas via the connection manager.
2. Creates and verifies unique/compound indexes for all collections.
3. Inserts/updates the canonical taxonomy of **60+ skills**.
4. Inserts/updates **12 career roles** with priority weights.
5. Inserts/updates **168 synthetic demo jobs**.
6. Creates/updates the demo user profile (**Alex Sharma**).
7. Sets up baseline resume analysis so the dashboard is immediately populated.

*Running `pnpm seed` multiple times is safe (idempotent upserts).*

---

## 5. Verifying the Connection

You can verify the database connection status via the health check endpoint:

```bash
curl http://127.0.0.1:5000/api/healthz
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

If the database is unreachable, the response will reflect:
```json
{
  "status": "ok",
  "database": "disconnected"
}
```

---

## 6. Collections & Indexes Summary

| Collection | Key Fields | Indexes |
| :--- | :--- | :--- |
| `users` | `id`, `name`, `email`, `targetRoleId` | `{ email: 1 }` (unique), `{ id: 1 }` (unique) |
| `skills` | `name`, `normalizedName`, `category`, `aliases` | `{ normalizedName: 1 }` (unique), `{ name: 1 }` |
| `roles` | `id`, `name`, `category`, `skills` | `{ id: 1 }` (unique), `{ name: 1 }` |
| `jobs` | `id`, `title`, `company`, `city`, `workMode`, `category`, `salary`, `skills` | `{ id: 1 }` (unique), `{ category: 1 }`, `{ jobType: 1 }`, `{ active: 1 }` |
| `resumes` | `userId`, `filename`, `extractedText`, `skills`, `uploadedAt` | `{ userId: 1, uploadedAt: -1 }` |
| `ats_analyses` | `userId`, `targetRoleId`, `ats`, `analyzedAt` | `{ userId: 1, targetRoleId: 1, analyzedAt: -1 }` |
| `recommendations`| `userId`, `targetRoleId`, `algorithmVersion`, `recommendations` | `{ userId: 1, targetRoleId: 1, generatedAt: -1 }` |
| `interactions` | `userId`, `jobId`, `action`, `timestamp` | `{ userId: 1, jobId: 1, action: 1 }`, `{ userId: 1, timestamp: -1 }` |
