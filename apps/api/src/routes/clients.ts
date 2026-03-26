import type { FastifyInstance } from 'fastify'

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async () => ({ module: 'clients', status: 'ready' }))
  // CRUD clienți + catalog articole — implementate în Faza 1B
}
