import type { FastifyInstance } from 'fastify'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async () => ({ module: 'auth', status: 'ready' }))
  // POST /register, /login, /logout, /refresh — implementate în Faza 1A
}
