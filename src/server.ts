import { buildApp } from "./app";
import { env } from "./config/env";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { logger } from "./utils/logger";
import { mailService } from "./services/mail.service";

const start = async () => {
  const app = buildApp();

  try {
    // 1. Verify DB Connection
    await db.execute(sql`select 1`);
    logger.info("✅ Database connected successfully");

    // 2. Verify Email Service Connection
    try {
      await mailService.verifyConnection();
      logger.info("✅ Email service connected successfully");
    } catch (error) {
      logger.warn(
        "⚠️  Email service connection failed - emails will not be sent"
      );
      logger.warn(
        `SMTP Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // 3. Start Server
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.error(err, "❌ Failed to start server");
    process.exit(1);
  }
};

start();
