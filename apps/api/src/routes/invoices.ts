import type { FastifyInstance } from 'fastify'

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async () => ({ module: 'invoices', status: 'ready' }))
  // CRUD complet + e-Factura ANAF — implementate în Faza 1B + 1C
}
