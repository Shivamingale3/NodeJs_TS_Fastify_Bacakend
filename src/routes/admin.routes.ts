import { FastifyInstance } from "fastify";
import { AdminController } from "../controllers/admin.controller"; // Move controller next

export async function adminRoutes(app: FastifyInstance) {
  const adminController = new AdminController();

  app.addHook("onRequest", async (request, reply) => {
    // @ts-ignore
    const userRole = request.user?.role;
    if (userRole !== "ADMIN") {
      reply.status(403).send({ success: false, message: "Forbidden" });
    }
  });

  app.get("/dashboard", adminController.dashboard.bind(adminController));
}
