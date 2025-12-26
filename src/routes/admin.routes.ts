import { FastifyInstance } from "fastify";
import { AdminController } from "../controllers/admin.controller"; // Move controller next
import { UserRole } from "../types/user.types";

export async function adminRoutes(app: FastifyInstance) {
  const adminController = new AdminController();

  app.get(
    "/dashboard",
    {
      config: { roles: [UserRole.ADMIN] },
    },
    adminController.dashboard.bind(adminController)
  );
}
