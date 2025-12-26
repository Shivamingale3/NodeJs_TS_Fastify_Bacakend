import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  uniqueIndex,
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
    userName: text("user_name").notNull().unique(),

    // Email fields
    email: text("email").unique(), // Made optional for OAuth users
    emailVerified: boolean("email_verified").default(false).notNull(),

    // Mobile number fields with country code
    countryCode: text("country_code"), // e.g., "+1", "+91", "+44"
    mobileNumber: text("mobile_number"), // Phone number without country code
    phoneNumberVerified: boolean("phone_number_verified")
      .default(false)
      .notNull(),

    // Authentication
    password: text("password"), // Made optional for OAuth users

    // Authorization
    role: roleEnum("role").default(UserRole.USER).notNull(),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Composite unique index for country code + phone number
    // This ensures the combination is unique across the table
    phoneNumberIdx: uniqueIndex("phone_number_idx").on(
      table.countryCode,
      table.mobileNumber
    ),
  })
);
