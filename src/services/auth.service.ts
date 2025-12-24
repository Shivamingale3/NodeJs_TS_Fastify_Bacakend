import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schemas/users";
import { hashPassword, comparePassword } from "../utils/auth";
import { CreateUserType } from "../types/user.types";
import { FastifyInstance } from "fastify";
import { UserRole } from "../types/user.types";

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async register(
    input: CreateUserType
  ): Promise<{
    user: { id: string; email: string; role: string; name: string };
    token: string;
  }> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(input.password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role || UserRole.USER,
      })
      .returning();

    const token = this.app.jwt.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const { password, createdAt, updatedAt, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, token };
  }

  async login(
    input: Pick<CreateUserType, "email" | "password">
  ): Promise<{
    user: { id: string; email: string; role: string; name: string };
    token: string;
  }> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user || !(await comparePassword(input.password, user.password))) {
      throw { statusCode: 401, message: "Invalid email or password" };
    }

    const token = this.app.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, createdAt, updatedAt, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }
}
