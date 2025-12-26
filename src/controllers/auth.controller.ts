import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service";
import { LoginInput, RegisterInput } from "../types/auth.types";

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    const body = request.body;
    const result = await this.authService.register(body);
    return reply.status(201).send(result);
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    const body = request.body;
    const result = await this.authService.login(body);

    // Set token in HTTP-only cookie
    reply.setCookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    // Return response without token (it's in cookie)
    return reply.send({
      success: true,
      message: result.message,
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send(request.user);
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    // Clear the token cookie
    reply.clearCookie("token", {
      path: "/",
    });

    return reply.send({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  }
}
