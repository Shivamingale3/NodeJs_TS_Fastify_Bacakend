export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
}

export type UserType = {
  id: string;
  fullName: string;
  userName: string;

  // Email fields
  email?: string;
  emailVerified: boolean;

  // Mobile number fields
  countryCode?: string; // e.g., "+1", "+91", "+44"
  mobileNumber?: string; // Phone number without country code
  phoneNumberVerified: boolean;

  // Authentication & Authorization
  password?: string; // Optional for response types where pw is omitted
  role: UserRole;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserType = {
  fullName: string;
  userName: string;

  // At least one contact method required (email or phone)
  email?: string;
  countryCode?: string;
  mobileNumber?: string;

  // Authentication & Authorization
  password: string;
  role?: "ADMIN" | "MANAGER" | "USER"; // Match Zod schema type
};
