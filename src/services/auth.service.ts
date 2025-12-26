import { FastifyInstance } from "fastify";
import { db } from "../db";
import { users } from "../db/schemas/users";
import { eq, or } from "drizzle-orm";
import { hashPassword, comparePassword } from "../utils/auth";
import { RegisterInput, LoginInput } from "../types/auth.types";
import { UserRole } from "../types/user.types";
import { throwValidationError } from "../utils/validation-error";

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async register(input: RegisterInput) {
    // Check if user already exists by email, username, or phone number
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          input.email ? eq(users.email, input.email) : undefined,
          eq(users.userName, input.userName),
          input.mobileNumber && input.countryCode
            ? eq(users.mobileNumber, input.mobileNumber)
            : undefined
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      throwValidationError(
        "user",
        "User already exists with this email, username, or phone number"
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Prepare user data - handle empty strings as undefined
    const userData = {
      fullName: input.fullName,
      userName: input.userName,
      email: input.email && input.email.trim() !== "" ? input.email : undefined,
      countryCode:
        input.countryCode && input.countryCode.trim() !== ""
          ? input.countryCode
          : undefined,
      mobileNumber:
        input.mobileNumber && input.mobileNumber.trim() !== ""
          ? input.mobileNumber
          : undefined,
      password: hashedPassword,
      role: input.role || UserRole.USER,
      emailVerified: false,
      mobileNumberVerified: false,
    };

    // Insert user
    const [newUser] = await db.insert(users).values(userData).returning();

    // Generate JWT token
    const token = this.app.jwt.sign({
      id: newUser.id,
      userName: newUser.userName,
      role: newUser.role,
    });

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;

    return {
      success: true,
      message: "User registered successfully",
      data: {
        user: userWithoutPassword,
        token,
      },
    };
  }

  async login(input: LoginInput) {
    // Find user by email or username
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, input.identifier),
          eq(users.userName, input.identifier)
        )
      )
      .limit(1);

    if (!user) {
      throwValidationError("identifier", "Invalid credentials");
    }

    // Check password
    if (!user.password) {
      throwValidationError("identifier", "This account uses OAuth login");
    }

    const isPasswordValid = await comparePassword(
      input.password,
      user.password
    );

    if (!isPasswordValid) {
      throwValidationError("password", "Invalid credentials");
    }

    // Generate JWT token
    const token = this.app.jwt.sign({
      id: user.id,
      userName: user.userName,
      role: user.role,
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    };
  }
}
