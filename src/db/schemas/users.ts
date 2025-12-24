import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { UserRole } from "../../types/user.types";

// Drizzle requires the valid values array for pgEnum
export const roleEnum = pgEnum("role", [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.USER,
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default(UserRole.USER).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
