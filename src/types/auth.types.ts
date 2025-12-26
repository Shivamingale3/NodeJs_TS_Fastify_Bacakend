import { z } from "zod";
import { UserRole } from "./user.types";

// Use centralized schemas for consistency
export const registerSchema = z
  .object({
    fullName: z.string(),
    email: z.string().email().optional(),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    countryCode: z.string().optional(),
    mobileNumber: z.string().optional(),
    role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.MANAGER]).optional(),
  })
  .refine((data) => data.email || data.mobileNumber, {
    message: "Either email or mobile number is required",
    path: ["email"], // Show error on email field
  })
  .refine(
    (data) => {
      // If mobile number is provided, country code is also required
      if (data.mobileNumber && !data.countryCode) {
        return false;
      }
      // If country code is provided, mobile number is also required
      if (data.countryCode && !data.mobileNumber) {
        return false;
      }
      // If both are provided, validate their format
      if (data.countryCode && data.mobileNumber) {
        const isCountryCodeValid =
          data.countryCode.length >= 1 && data.countryCode.length <= 4;
        const isMobileValid =
          data.mobileNumber.length >= 10 && data.mobileNumber.length <= 15;
        return isCountryCodeValid && isMobileValid;
      }
      return true;
    },
    {
      message: "Invalid country code or mobile number format",
      path: ["mobileNumber"],
    }
  );

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    mobile: z
      .object({
        countryCode: z.string().min(1).max(4),
        mobileNumber: z.string().min(10).max(15),
      })
      .optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.email || data.mobile, {
    message: "Either email or mobile number is required",
    path: ["email"], // Show error on email field
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
