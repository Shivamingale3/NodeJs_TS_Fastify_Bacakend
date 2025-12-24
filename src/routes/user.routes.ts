import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/user.controller";

export async function userRoutes(app: FastifyInstance) {
  const userController = new UserController();

  app.get("/profile", userController.profile.bind(userController));
}
