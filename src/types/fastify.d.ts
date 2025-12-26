import "fastify";
import { UserRole } from "./user.types";

declare module "fastify" {
  interface FastifyContextConfig {
    public?: boolean;
    roles?: UserRole[]; // For RBAC
  }
}
