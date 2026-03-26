import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import mongoose from 'mongoose'
import { Client } from '../models/Client'
import { CreateClientSchema } from '@taxly/schemas'
import { verifyCUI } from '../services/anaf'

interface JwtUser {
  sub: string
  email: string
  name: string
}

interface IdParams {
  Params: { id: string }
}

interface SearchQuery {
  Querystring: { search?: string }
}

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/clients
  app.get<SearchQuery>(
    '/',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<SearchQuery>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { search } = request.query

      const filter: Record<string, unknown> = { userId: sub, isActive: true }
      if (search) {
        filter['name'] = { $regex: search, $options: 'i' }
      }

      const clients = await Client.find(filter).sort({ name: 1 })
      return reply.send({ clients })
    },
  )

  // POST /api/clients
  app.post(
    '/',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const result = CreateClientSchema.safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }

      const client = await Client.create({ ...result.data, userId: sub })
      return reply.code(201).send({ client })
    },
  )

  // GET /api/clients/:id
  app.get<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const client = await Client.findById(id)
      if (!client) return reply.notFound('Clientul nu a fost găsit')
      if (client.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      return reply.send({ client })
    },
  )

  // PUT /api/clients/:id
  app.put<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const client = await Client.findById(id)
      if (!client) return reply.notFound('Clientul nu a fost găsit')
      if (client.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      const result = CreateClientSchema.partial().safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }

      const updated = await Client.findByIdAndUpdate(id, result.data, { new: true })
      return reply.send({ client: updated })
    },
  )

  // DELETE /api/clients/:id — soft delete
  app.delete<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const client = await Client.findById(id)
      if (!client) return reply.notFound('Clientul nu a fost găsit')
      if (client.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      await Client.findByIdAndUpdate(id, { isActive: false })
      return reply.send({ success: true })
    },
  )

  // GET /api/clients/:id/anaf
  app.get<IdParams>(
    '/:id/anaf',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const client = await Client.findById(id)
      if (!client) return reply.notFound('Clientul nu a fost găsit')
      if (client.userId.toString() !== sub) return reply.forbidden('Acces interzis')
      if (!client.cui) return reply.code(400).send({ error: 'Clientul nu are CUI' })

      const result = await verifyCUI(client.cui)
      return reply.send(result)
    },
  )
}
