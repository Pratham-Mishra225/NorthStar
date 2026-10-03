import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve .env from the repo root (two directories above src/index.ts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import app from "./app";
import { logger } from "./lib/logger";
import { connectToDatabase, closeDatabase } from "./db/mongodb";

const rawPort = process.env["PORT"] ?? "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  try {
    await connectToDatabase();
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error("Database connection could not be established at startup. Endpoints requiring database will fail cleanly.");
  }

  const server = app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Graceful shutdown initiated");
    server.close(async () => {
      await closeDatabase();
      logger.info("Server and database connections closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer();
