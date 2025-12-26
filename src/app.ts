import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { env } from "./config/env";
import authGuard from "./plugins/auth-guard";
import { getHumanReadableDbError } from "./utils/db-error-handler";
import { sanitizeStackTrace } from "./utils/error-sanitizer";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

// Import routes
import { authRoutes } from "./routes/auth.routes";
import { userRoutes } from "./routes/user.routes";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? {
              targets: [
                {
                  target: "pino-pretty",
                  options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                  },
                  level: "debug",
                },
                ...(env.LOKI_HOST
                  ? [
                      {
                        target: "pino-loki",
                        options: {
                          batching: true,
                          interval: 5,
                          host: env.LOKI_HOST,
                          labels: { application: "fastify-backend" },
                        },
                        level: "info",
                      },
                    ]
                  : []),
              ],
            }
          : env.LOKI_HOST
          ? {
              target: "pino-loki",
              options: {
                batching: true,
                interval: 5,
                host: env.LOKI_HOST,
                labels: { application: "fastify-backend" },
              },
            }
          : undefined,
    },
  });

  // Set up Zod validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register plugins
  app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.register(cookie, {
    secret: env.JWT_SECRET, // for signed cookies
    parseOptions: {}, // options for cookie parsing
  });

  app.register(authGuard);

  // Register routes
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(userRoutes, { prefix: "/api/users" });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    // Cast error for TypeScript
    const err = error as any;

    // Log the full error for debugging
    request.log.error(error);

    const timestamp = new Date().toISOString();

    // Check if it's a database error (Drizzle or PostgreSQL)
    const errorCode = err.code;
    const errorMessage = err.message;
    if (
      errorMessage?.includes("Failed query") ||
      errorCode?.startsWith("23") || // PostgreSQL integrity constraints
      errorCode?.startsWith("42") || // PostgreSQL syntax/schema errors
      errorCode?.startsWith("22") // PostgreSQL data exceptions
    ) {
      const { message, field } = getHumanReadableDbError(error);

      // Determine status code
      let statusCode = 500;
      if (errorCode === "23505") statusCode = 409; // Conflict
      if (errorCode === "23503") statusCode = 400; // Bad Request
      if (errorCode === "42703" || errorCode === "42P01") {
        statusCode = 500; // Schema issues
      }

      return reply.status(statusCode).send({
        success: false,
        error: {
          type: "DatabaseError",
          message,
          ...(field && { errors: [{ field, message }] }),
        },
        timestamp,
      });
    }

    // Handle Fastify/Zod validation errors
    if (err.validation) {
      const errors = err.validation.map((v: any) => ({
        field:
          v.instancePath?.replace(/^\//, "") ||
          v.params?.missingProperty ||
          "unknown",
        message: v.message || "Invalid value",
        code: v.keyword,
      }));

      return reply.status(400).send({
        success: false,
        error: {
          type: "ValidationError",
          message: "Validation failed",
          errors,
        },
        timestamp,
      });
    }

    // Handle custom validation errors (from throwValidationError)
    if (err.name === "ValidationError" && err.errors) {
      return reply.status(422).send({
        success: false,
        error: {
          type: "ValidationError",
          message: err.message,
          errors: err.errors,
        },
        timestamp,
      });
    }

    // Handle JWT errors
    if (err.message?.includes("jwt") || err.message?.includes("token")) {
      return reply.status(401).send({
        success: false,
        error: {
          type: "AuthenticationError",
          message: "Invalid or expired token",
        },
        timestamp,
      });
    }

    // Handle 404 errors
    if (err.statusCode === 404) {
      return reply.status(404).send({
        success: false,
        error: {
          type: "NotFoundError",
          message: "Resource not found",
        },
        timestamp,
      });
    }

    // Generic error response (production vs development)
    const isDevelopment = env.NODE_ENV === "development";

    return reply.status(err.statusCode || 500).send({
      success: false,
      error: {
        type: "ServerError",
        message: isDevelopment ? err.message : "An unexpected error occurred",
        ...(isDevelopment && {
          metadata: {
            stack: sanitizeStackTrace(err.stack),
          },
        }),
      },
      timestamp,
    });
  });

  return app;
}
