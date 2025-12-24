import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  role: z.enum(["ADMIN", "MANAGER", "USER"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);
  const authController = new AuthController(authService);

  // We need to cast app to ZodTypeProvider enabled instance locally in this scope if strictly needed
  // But usually just using it on the route definition is enough if app is typed correctly.

  app.withTypeProvider<ZodTypeProvider>().post(
    "/register",
    {
      schema: { body: registerSchema },
      config: { public: true },
    },
    authController.register.bind(authController)
  );

  app.withTypeProvider<ZodTypeProvider>().post(
    "/login",
    {
      schema: { body: loginSchema },
      config: { public: true },
    },
    authController.login.bind(authController)
  );

  app.get("/me", authController.me.bind(authController));
}
