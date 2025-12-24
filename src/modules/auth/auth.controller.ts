import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.schema";

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = registerSchema.parse(request.body);
    const result = await this.authService.register(body);
    return reply.status(201).send(result);
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    const result = await this.authService.login(body);
    return reply.send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return request.user;
  }
}
