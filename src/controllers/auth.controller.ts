import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service";
import { RegisterInput, LoginInput } from "../types/auth.types";

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
    return reply.send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return request.user;
  }
}
