import type { FastifyInstance } from 'fastify'
import { verifyCUI } from '../services/anaf'
import { getCachedRates } from '../services/bnr'

interface CuiParams {
  Params: { cui: string }
}

export async function utilRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  app.get<CuiParams>(
    '/verify-cui/:cui',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { cui } = req.params
      if (!cui || cui.length < 2) return reply.badRequest('CUI invalid')

      const result = await verifyCUI(cui)
      return reply.send(result)
    },
  )

  app.get('/bnr-rates', async (_request, reply) => {
    const rates = await getCachedRates()
    return reply.send(rates)
  })
}
