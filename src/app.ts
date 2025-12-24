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
  app.register(authRoutes, { prefix: "/auth" });
  app.register(adminRoutes, { prefix: "/api/admin" });
  app.register(userRoutes, { prefix: "/api/user" });

  // Health Check Generic
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Global Error Handler
  app.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      app.log.error(error);

      // Zod Validation Errors

      const statusCode = error.statusCode || 500;
      const message = error.message || "Internal Server Error";

      reply.status(statusCode).send({
        success: false,
        error: message,
        ...(env.NODE_ENV === "development" ? { stack: error.stack } : {}),
      });
    }
  );

  return app;
}
