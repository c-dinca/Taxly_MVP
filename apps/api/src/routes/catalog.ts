import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import mongoose from 'mongoose'
import { CatalogItem } from '../models/CatalogItem'
import { z } from 'zod'

interface JwtUser {
  sub: string
  email: string
  name: string
}

interface IdParams {
  Params: { id: string }
}

const CreateCatalogItemSchema = z.object({
  name: z.string().min(1, 'Numele articolului este obligatoriu'),
  description: z.string().optional(),
  defaultPrice: z.number().nonnegative('Prețul nu poate fi negativ'),
  defaultVatRate: z.number().min(0).max(100).default(19),
  unit: z.string().default('buc'),
})

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/catalog
  app.get(
    '/',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const items = await CatalogItem.find({ userId: sub, isActive: true }).sort({ name: 1 })
      return reply.send({ items })
    },
  )

  // POST /api/catalog
  app.post(
    '/',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const result = CreateCatalogItemSchema.safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }

      const item = await CatalogItem.create({ ...result.data, userId: sub })
      return reply.code(201).send({ item })
    },
  )

  // PUT /api/catalog/:id
  app.put<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const item = await CatalogItem.findById(id)
      if (!item) return reply.notFound('Articolul nu a fost găsit')
      if (item.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      const result = CreateCatalogItemSchema.partial().safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }

      const updated = await CatalogItem.findByIdAndUpdate(id, result.data, { new: true })
      return reply.send({ item: updated })
    },
  )

  // DELETE /api/catalog/:id — soft delete
  app.delete<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const item = await CatalogItem.findById(id)
      if (!item) return reply.notFound('Articolul nu a fost găsit')
      if (item.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      await CatalogItem.findByIdAndUpdate(id, { isActive: false })
      return reply.send({ success: true })
    },
  )
}
