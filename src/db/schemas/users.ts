import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { UserRole } from "../../types/user.types";

// Drizzle requires the valid values array for pgEnum
export const roleEnum = pgEnum("role", [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.USER,
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    countryCode: text("country_code"),
    mobileNumber: text("mobile_number"),
    mobileNumberVerified: boolean("mobile_number_verified")
      .default(false)
      .notNull(),
    password: text("password"),
    role: roleEnum("role").default(UserRole.USER).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    phoneNumberIdx: uniqueIndex("phone_number_idx").on(
      table.countryCode,
      table.mobileNumber
    ),
  })
);
