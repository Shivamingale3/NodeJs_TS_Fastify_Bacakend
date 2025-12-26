import { and, eq, or } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { db } from "../db";
import { users } from "../db/schemas/users";
import { LoginInput, RegisterInput } from "../types/auth.types";
import { UserRole } from "../types/user.types";
import { comparePassword, hashPassword } from "../utils/auth";
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
          input.mobileNumber && input.countryCode
            ? and(
                eq(users.countryCode, input.countryCode),
                eq(users.mobileNumber, input.mobileNumber)
              )
            : undefined
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      throwValidationError(
        "user",
        "User already exists with this email or phone number"
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Prepare user data - handle empty strings as undefined
    const userData = {
      fullName: input.fullName,
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

    await db.insert(users).values(userData).returning();

    return {
      success: true,
      message: "User registered successfully",
      data: null,
    };
  }

  async login(input: LoginInput) {
    // Build where clause based on login method
    let whereClause;

    if (input.email) {
      // Login with email
      whereClause = eq(users.email, input.email);
    } else if (input.mobile) {
      // Login with mobile (country code + number)
      whereClause = and(
        eq(users.countryCode, input.mobile.countryCode),
        eq(users.mobileNumber, input.mobile.mobileNumber)
      );
    } else {
      throwValidationError(
        "email",
        "Either email or mobile number is required"
      );
    }

    // Find user
    const [user] = await db.select().from(users).where(whereClause).limit(1);

    if (!user) {
      throwValidationError(
        input.email ? "email" : "mobile",
        "Invalid credentials"
      );
    }

    // Check password
    if (!user.password) {
      throwValidationError(
        input.email ? "email" : "mobile",
        "This account uses OAuth login"
      );
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
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      message: "Login successful",
      token,
    };
  }
}
