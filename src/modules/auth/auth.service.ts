import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, NewUser, User } from "../../db/schema";
import { hashPassword, comparePassword } from "../../utils/auth";
import { LoginInput, RegisterInput } from "./auth.schema";
import { FastifyInstance } from "fastify";

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async register(
    input: RegisterInput
  ): Promise<{ user: Omit<User, "password">; token: string }> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(input.password);

    const [newUser] = await db
      .insert(users)
      .values({
        ...input,
        password: hashedPassword,
        role: input.role || "USER",
      })
      .returning();

    const token = this.app.jwt.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const { password, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, token };
  }

  async login(
    input: LoginInput
  ): Promise<{ user: Omit<User, "password">; token: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user || !(await comparePassword(input.password, user.password))) {
      throw { statusCode: 401, message: "Invalid email or password" };
    }

    const token = this.app.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }
}
