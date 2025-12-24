import { FastifyInstance } from "fastify";
import { UserController } from "./user.controller";

export async function userRoutes(app: FastifyInstance) {
  const userController = new UserController();

  // No specific role check needed if all authenticated users can access,
  // but if strictly USER role only:
  /*
  app.addHook('onRequest', async (request, reply) => {
    // @ts-ignore
    if (request.user?.role !== 'USER') ...
  });
  */

  app.get("/profile", userController.profile.bind(userController));
}
