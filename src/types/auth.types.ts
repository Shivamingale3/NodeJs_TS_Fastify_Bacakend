import { z } from "zod";
import { loginSchema as userLoginSchema } from "../schemas/user.schema";
import { UserRole } from "./user.types";

// Use centralized schemas for consistency
export const registerSchema = z.object({
  fullName: z.string(),
  userName: z.string(),
  email: z.string().email().optional(),
  password: z.string(),
  countryCode: z.string().optional(),
  mobileNumber: z.string().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.MANAGER]).optional(),
});

export const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
