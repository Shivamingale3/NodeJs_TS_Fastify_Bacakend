import Fastify, { FastifyInstance } from "fastify";
import { logger } from "./utils/logger";
import { env } from "./config/env";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: logger, // Use our custom pino instance
    disableRequestLogging: false,
  });

  // Health Check Generic
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Zod Validation Errors (if strict mode fails somehow, though fastify-zod usually handles it)
    // or just generic error handling

    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    reply.status(statusCode).send({
      success: false,
      error: message,
      ...(env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    });
  });

  return app;
}
