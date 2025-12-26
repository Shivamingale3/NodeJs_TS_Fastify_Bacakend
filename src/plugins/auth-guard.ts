import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fjwt from "@fastify/jwt";
import { env } from "../config/env";

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
