import { buildApp } from "./app";
import { env } from "./config/env";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { logger } from "./utils/logger";

const start = async () => {
  const app = buildApp();

  try {
    // 1. Verify DB Connection
    await db.execute(sql`select 1`);
    logger.info("✅ Database connected successfully");

    // 2. Start Server
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.error(err, "❌ Failed to start server");
    process.exit(1);
  }
};

start();
