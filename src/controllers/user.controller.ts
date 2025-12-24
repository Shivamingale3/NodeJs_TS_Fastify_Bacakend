import { FastifyReply, FastifyRequest } from "fastify";

export class UserController {
  async profile(request: FastifyRequest, reply: FastifyReply) {
    return { message: "User Profile", user: request.user };
  }
}
