import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fjwt from "@fastify/jwt";
import { env } from "../config/env";

// Extend FastifyContextConfig to include public flag
declare module "fastify" {
  interface FastifyContextConfig {
    public?: boolean;
    roles?: string[]; // For RBAC
  }
}

const authGuardPlugin: FastifyPluginAsync = async (app) => {
  // Register JWT plugin
  app.register(fjwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );

  // Global Hook: Secure by Default
  app.addHook("onRequest", async (request, reply) => {
    // Check if route is public
    const config = request.routeSchema.config || {}; // Access route config
    // Note: Fastify puts config in routeOptions.config usually, but check latest API.
    // Actually, inside onRequest, we can access context config via `request.context.config`

    // However, `request.context` might not be fully populated in onRequest depending on fastify version?
    // Let's use `request.routeOptions.config`.

    // Wait, `request.routeOptions` is available in Fastify v4+.

    // If it's a documentation route or special route (like /health), we might want to bypass too?
    // But better to be explicit.

    if (request.routerPath === "/health") return; // Explicitly allow health check if defined globally?
    // Usually health check should have config: { public: true }

    if (request.routeOptions.config?.public) {
      return;
    }

    try {
      await request.jwtVerify();
    } catch (err) {
      reply
        .status(401)
        .send({
          success: false,
          message: "Unauthorized",
          error: "Missing or Invalid Token",
        });
    }
  });
};

export default fp(authGuardPlugin);
