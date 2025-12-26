export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
}

export type UserType = {
  id: string;
  fullName: string;
  userName: string;
  email?: string;
  emailVerified: boolean;
  countryCode?: string;
  mobileNumber?: string;
  mobileNumberVerified: boolean;
  password?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserType = {
  fullName: string;
  userName: string;
  email?: string;
  countryCode?: string;
  mobileNumber?: string;
  password: string;
  role?: UserRole;
};
