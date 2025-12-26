import Fastify, {
  FastifyInstance,
  FastifyError,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { loggerConfig } from "./utils/logger";
import { env } from "./config/env";
import authGuardPlugin from "./plugins/auth-guard";
import { authRoutes } from "./routes/auth.routes";
import { adminRoutes } from "./routes/admin.routes";
import { userRoutes } from "./routes/user.routes";
import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { mailService } from "./services/mail.service";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sanitizeStackTrace } from "./utils/error-sanitizer";

import cors from "@fastify/cors";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: loggerConfig,
    disableRequestLogging: false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps/curl requests)
      if (!origin) return cb(null, true);

      const allowedOrigins = env.CORS_ORIGIN.split(",");
      if (env.CORS_ORIGIN === "*" || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed"), false);
    },
  });

  app.register(authGuardPlugin);
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(adminRoutes, { prefix: "/api/admin" });
  app.register(userRoutes, { prefix: "/api/user" });

  // Health Check with service statuses
  app.get("/health", async () => {
    const emailConnected = mailService.getConnectionStatus();

    let dbConnected = false;
    try {
      await db.execute(sql`select 1`);
      dbConnected = true;
    } catch (error) {
      dbConnected = false;
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? "connected" : "disconnected",
        email: emailConnected ? "connected" : "disconnected",
      },
    };
  });

  // Global Error Handler
  app.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      // Log the full error with stack trace for debugging
      app.log.error(error);

      const statusCode = error.statusCode || 500;

      // Check if this is a validation error from fastify-type-provider-zod
      const isValidationError =
        error.validation !== undefined || error.statusCode === 400;

      if (isValidationError && error.validation) {
        // Format Zod validation errors into structured response
        const validationErrors = error.validation.map((err: any) => ({
          field:
            err.instancePath?.replace(/^\//, "").replace(/\//g, ".") ||
            err.params?.missingProperty ||
            "unknown",
          message: err.message || "Validation failed",
        }));

        const response = {
          success: false,
          error: "Validation failed",
          errors: validationErrors,
        };

        // Add sanitized stack in development
        if (env.NODE_ENV === "development" && error.stack) {
          (response as any).stack = sanitizeStackTrace(error.stack);
        }

        return reply.status(400).send(response);
      }

      // Handle custom ValidationError from services
      if ((error as any).errors && Array.isArray((error as any).errors)) {
        const response = {
          success: false,
          error: error.message || "Validation failed",
          errors: (error as any).errors,
        };

        if (env.NODE_ENV === "development" && error.stack) {
          (response as any).stack = sanitizeStackTrace(error.stack);
        }

        return reply.status(statusCode).send(response);
      }

      // Handle all other errors
      const message = error.message || "Internal Server Error";

      const response: {
        success: boolean;
        error: string;
        stack?: string;
      } = {
        success: false,
        error: message,
      };

      // Only include sanitized stack in development
      if (env.NODE_ENV === "development" && error.stack) {
        response.stack = sanitizeStackTrace(error.stack);
      }

      reply.status(statusCode).send(response);
    }
  );

  return app;
}
