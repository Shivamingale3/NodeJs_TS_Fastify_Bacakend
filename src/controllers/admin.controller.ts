import { FastifyReply, FastifyRequest } from "fastify";

export class AdminController {
  async dashboard(request: FastifyRequest, reply: FastifyReply) {
    return { message: "Admin Dashboard", user: request.user };
  }
}
