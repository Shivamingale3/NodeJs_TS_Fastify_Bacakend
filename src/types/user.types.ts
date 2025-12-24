export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
}

export type UserType = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Optional for response types where pw is omitted
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserType = {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
};
