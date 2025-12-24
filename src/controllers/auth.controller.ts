import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service";
// Still reusing schema for now or move?
// Let's refactor schemas too in next step, but import from module for now to save time,
// OR better invoke separate schema file later.
// For now I will inline or keep import. I'll move schemas to types/schemas ideally or similar.

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    // We can cast body, validation happens at route level usually if schema provided
    // But explicit parse is also fine.
    const body = request.body as any;
    const result = await this.authService.register(body);
    return reply.status(201).send(result);
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    const result = await this.authService.login(body);
    return reply.send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return request.user;
  }
}
