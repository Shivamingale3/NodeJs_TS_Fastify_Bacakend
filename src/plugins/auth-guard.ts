/// <reference path="../types/fastify.d.ts" />
import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fjwt from "@fastify/jwt";
import { env } from "../config/env";
import { UserRole } from "../types/user.types";

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
  app.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check if route is public
      // @ts-ignore
      const routeConfig = request.routeOptions.config;

      // @ts-ignore
      if (request.routerPath === "/health" || request.url === "/health") return;

      if (routeConfig?.public) {
        return;
      }
      try {
        await request.jwtVerify();

        if (routeConfig?.roles) {
          const user = request.user as { role: UserRole };
          if (!user || !routeConfig.roles.includes(user.role as UserRole)) {
            return reply.status(403).send({
              success: false,
              message: "Forbidden",
              error: "Insufficient Permissions",
            });
          }
        }
      } catch (err) {
        reply.status(401).send({
          success: false,
          message: "Unauthorized",
          error: "Missing or Invalid Token",
        });
      }
    }
  );
};

export default fp(authGuardPlugin);
