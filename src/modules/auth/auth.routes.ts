import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);
  const authController = new AuthController(authService);

  app.post(
    "/register",
    {
      config: { public: true },
    },
    authController.register.bind(authController)
  );

  app.post(
    "/login",
    {
      config: { public: true },
    },
    authController.login.bind(authController)
  );

  app.get("/me", authController.me.bind(authController));
}
