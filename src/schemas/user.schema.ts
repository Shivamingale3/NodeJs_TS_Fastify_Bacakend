import { z } from "zod";
import { UserRole } from "../types/user.types";

// Phone number validation regex (digits only, 6-15 characters)
const phoneRegex = /^\d{6,15}$/;

// Country code validation regex (+ followed by 1-4 digits)
const countryCodeRegex = /^\+\d{1,4}$/;

export const registerUserSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    userName: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),

    // Email (optional but validated if provided)
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),

    // Mobile number fields (optional but validated if provided)
    countryCode: z
      .string()
      .regex(countryCodeRegex, "Invalid country code format (e.g., +1, +91)")
      .optional()
      .or(z.literal("")),
    mobileNumber: z
      .string()
      .regex(phoneRegex, "Invalid phone number (6-15 digits)")
      .optional()
      .or(z.literal("")),

    // Password
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),

    // Role (optional, defaults to USER)
    role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]).optional(),
  })
  .refine(
    (data) => {
      // At least one contact method (email or phone) must be provided
      const hasEmail = data.email && data.email.trim() !== "";
      const hasPhone =
        data.countryCode &&
        data.countryCode.trim() !== "" &&
        data.mobileNumber &&
        data.mobileNumber.trim() !== "";

      return hasEmail || hasPhone;
    },
    {
      message: "Either email or phone number (with country code) is required",
      path: ["email"], // Show error on email field
    }
  )
  .refine(
    (data) => {
      // If country code is provided, mobile number must also be provided
      const hasCountryCode = data.countryCode && data.countryCode.trim() !== "";
      const hasMobileNumber =
        data.mobileNumber && data.mobileNumber.trim() !== "";

      if (hasCountryCode && !hasMobileNumber) {
        return false;
      }
      if (!hasCountryCode && hasMobileNumber) {
        return false;
      }
      return true;
    },
    {
      message: "Both country code and mobile number must be provided together",
      path: ["mobileNumber"],
    }
  );

export const loginSchema = z.object({
  // Allow login with either email or username
  identifier: z
    .string()
    .min(1, "Email or username is required")
    .max(100, "Identifier is too long"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters")
      .optional(),
    userName: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      )
      .optional(),

    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),

    countryCode: z
      .string()
      .regex(countryCodeRegex, "Invalid country code format (e.g., +1, +91)")
      .optional()
      .or(z.literal("")),
    mobileNumber: z
      .string()
      .regex(phoneRegex, "Invalid phone number (6-15 digits)")
      .optional()
      .or(z.literal("")),

    role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]).optional(),
  })
  .refine(
    (data) => {
      // If country code is provided, mobile number must also be provided
      const hasCountryCode = data.countryCode && data.countryCode.trim() !== "";
      const hasMobileNumber =
        data.mobileNumber && data.mobileNumber.trim() !== "";

      if (hasCountryCode && !hasMobileNumber) {
        return false;
      }
      if (!hasCountryCode && hasMobileNumber) {
        return false;
      }
      return true;
    },
    {
      message: "Both country code and mobile number must be provided together",
      path: ["mobileNumber"],
    }
  );
