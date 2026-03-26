import type { FastifyInstance } from 'fastify'
import { verifyCUI } from '../services/anaf.js'

interface CuiParams {
  Params: { cui: string }
}

export async function utilRoutes(app: FastifyInstance): Promise<void> {
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
}
