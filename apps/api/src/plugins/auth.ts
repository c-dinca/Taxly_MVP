import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    reply.unauthorized('Token invalid sau expirat')
  }
}

export function registerAuthDecorator(app: FastifyInstance): void {
  app.decorate('authenticate', authenticate)
}
