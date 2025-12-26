import { z } from "zod";
import {
  registerUserSchema,
  loginSchema as userLoginSchema,
} from "../schemas/user.schema";

// Use centralized schemas for consistency
export const registerSchema = registerUserSchema;
export const loginSchema = userLoginSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
