import type { FastifyInstance } from 'fastify'

export async function fiscalRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async () => ({ module: 'fiscal', status: 'ready' }))
  // Calculator CAS/CASS/impozit, reguli fiscale — implementate în Faza 1D
}
