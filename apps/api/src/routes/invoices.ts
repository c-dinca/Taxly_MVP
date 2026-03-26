import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import mongoose from 'mongoose'
import { Invoice } from '../models/Invoice'
import { Client } from '../models/Client'
import { CreateInvoiceSchema, PaymentSchema } from '@taxly/schemas'
import { getCachedRates } from '../services/bnr'
import { z } from 'zod'

interface JwtUser {
  sub: string
  email: string
  name: string
}

interface IdParams {
  Params: { id: string }
}

interface ListQuery {
  Querystring: {
    status?: string
    type?: string
    page?: string
    limit?: string
  }
}

async function getNextInvoiceNumber(userId: string, year: number): Promise<number> {
  const lastInvoice = await Invoice.findOne({
    userId,
    fullNumber: { $regex: `^TAXLY-${year}-` },
  })
    .sort({ number: -1 })
    .select('number')

  return lastInvoice ? lastInvoice.number + 1 : 1
}

async function buildInvoiceFields(data: ReturnType<typeof CreateInvoiceSchema.parse>, client: { _id: unknown; name: string; cui?: string; address: string; email?: string; county?: string; country: string }) {
  const lines = data.lines.map(line => {
    const total = parseFloat((line.quantity * line.unitPrice).toFixed(2))
    const vatAmount = parseFloat((total * line.vatRate / 100).toFixed(2))
    return { ...line, total, vatAmount }
  })

  const factor = 1 - data.remiseGenerala / 100
  const subtotal = parseFloat((lines.reduce((acc, l) => acc + l.total, 0) * factor).toFixed(2))
  const vatTotal = parseFloat(lines.reduce((acc, l) => acc + (l.total * factor * l.vatRate / 100), 0).toFixed(2))
  const total = parseFloat((subtotal + vatTotal).toFixed(2))

  let exchangeRate: number | undefined
  let totalRON = total
  if (data.currency !== 'RON') {
    const rates = await getCachedRates()
    exchangeRate = rates[data.currency as 'EUR' | 'USD']
    totalRON = parseFloat((total * exchangeRate).toFixed(2))
  }

  return {
    lines,
    subtotal,
    vatTotal,
    total,
    totalRON,
    exchangeRate,
    clientSnapshot: {
      _id: client._id,
      name: client.name,
      cui: client.cui,
      address: client.address,
      email: client.email,
      county: client.county,
      country: client.country,
    },
  }
}

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/invoices
  app.get<ListQuery>(
    '/',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<ListQuery>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { status, type, page = '1', limit = '20' } = request.query

      const filter: Record<string, unknown> = { userId: sub }
      if (status) filter['status'] = status
      if (type) filter['type'] = type

      const pageNum = Math.max(1, parseInt(page, 10))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
      const skip = (pageNum - 1) * limitNum

      const [invoices, total] = await Promise.all([
        Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Invoice.countDocuments(filter),
      ])

      return reply.send({
        invoices,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      })
    },
  )

  // POST /api/invoices
  app.post(
    '/',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser

      const result = CreateInvoiceSchema.safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }
      const data = result.data

      if (!mongoose.isValidObjectId(data.clientId)) {
        return reply.code(400).send({ error: 'clientId invalid' })
      }

      const client = await Client.findById(data.clientId)
      if (!client) return reply.notFound('Clientul nu a fost găsit')
      if (client.userId.toString() !== sub) return reply.forbidden('Acces interzis')
      if (!client.isActive) return reply.code(400).send({ error: 'Clientul este inactiv' })

      const year = new Date(data.issueDate).getFullYear()
      const number = await getNextInvoiceNumber(sub, year)
      const fullNumber = `TAXLY-${year}-${String(number).padStart(4, '0')}`

      const built = await buildInvoiceFields(data, client)

      const invoice = await Invoice.create({
        userId: sub,
        number,
        series: 'TAXLY',
        fullNumber,
        type: data.type,
        status: data.status,
        issueDate: new Date(data.issueDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        client: built.clientSnapshot,
        lines: built.lines,
        subtotal: built.subtotal,
        vatTotal: built.vatTotal,
        total: built.total,
        currency: data.currency,
        exchangeRate: built.exchangeRate,
        totalRON: built.totalRON,
        remiseGenerala: data.remiseGenerala,
        acomptes: data.acomptes.map(a => ({ ...a, date: new Date(a.date) })),
        acomptesTotal: parseFloat(data.acomptes.reduce((s, a) => s + a.amount, 0).toFixed(2)),
        notes: data.notes,
        internalNote: data.internalNote,
        originalInvoiceId: data.originalInvoiceId,
        stornoType: data.stornoType,
      })

      return reply.code(201).send({ invoice })
    },
  )

  // GET /api/invoices/:id
  app.get<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const invoice = await Invoice.findById(id)
      if (!invoice) return reply.notFound('Factura nu a fost găsită')
      if (invoice.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      return reply.send({ invoice })
    },
  )

  // PUT /api/invoices/:id — full update, only allowed for draft
  app.put<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const invoice = await Invoice.findById(id)
      if (!invoice) return reply.notFound('Factura nu a fost găsită')
      if (invoice.userId.toString() !== sub) return reply.forbidden('Acces interzis')
      if (invoice.status !== 'draft') {
        return reply.code(400).send({ error: 'Doar facturile draft pot fi modificate' })
      }

      const result = CreateInvoiceSchema.safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }
      const data = result.data

      // Status transition guard: from draft, only draft or emisa allowed via this route
      if (data.status !== 'draft' && data.status !== 'emisa') {
        return reply.badRequest('Status invalid pentru această operație')
      }

      if (!mongoose.isValidObjectId(data.clientId)) {
        return reply.code(400).send({ error: 'clientId invalid' })
      }

      const client = await Client.findById(data.clientId)
      if (!client) return reply.notFound('Clientul nu a fost găsit')
      if (client.userId.toString() !== sub) return reply.forbidden('Acces interzis')
      if (!client.isActive) return reply.code(400).send({ error: 'Clientul este inactiv' })

      const built = await buildInvoiceFields(data, client)

      const updated = await Invoice.findByIdAndUpdate(
        id,
        {
          type: data.type,
          status: data.status,
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          client: built.clientSnapshot,
          lines: built.lines,
          subtotal: built.subtotal,
          vatTotal: built.vatTotal,
          total: built.total,
          currency: data.currency,
          exchangeRate: built.exchangeRate,
          totalRON: built.totalRON,
          remiseGenerala: data.remiseGenerala,
          acomptes: data.acomptes.map(a => ({ ...a, date: new Date(a.date) })),
          acomptesTotal: parseFloat(data.acomptes.reduce((s, a) => s + a.amount, 0).toFixed(2)),
          notes: data.notes,
          internalNote: data.internalNote,
        },
        { new: true },
      )

      return reply.send({ invoice: updated })
    },
  )

  // PUT /api/invoices/:id/status
  const UpdateStatusSchema = z.object({
    status: z.enum(['draft', 'emisa', 'trimisa_anaf', 'validata_anaf', 'respinsa_anaf', 'incasata', 'anulata']),
    payment: PaymentSchema.optional(),
  })

  app.put<IdParams>(
    '/:id/status',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const invoice = await Invoice.findById(id)
      if (!invoice) return reply.notFound('Factura nu a fost găsită')
      if (invoice.userId.toString() !== sub) return reply.forbidden('Acces interzis')

      const result = UpdateStatusSchema.safeParse(request.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Status invalid')
      }

      const { status, payment } = result.data

      if (status === 'incasata' && !payment) {
        return reply.badRequest('Detaliile de plată sunt obligatorii pentru status Încasată')
      }

      const update: Record<string, unknown> = { status }
      if (status === 'incasata' && payment) {
        update['payment'] = { ...payment, date: new Date(payment.date) }
      }

      const updated = await Invoice.findByIdAndUpdate(id, update, { new: true })
      return reply.send({ invoice: updated })
    },
  )

  // DELETE /api/invoices/:id — anulare (soft)
  app.delete<IdParams>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const invoice = await Invoice.findById(id)
      if (!invoice) return reply.notFound('Factura nu a fost găsită')
      if (invoice.userId.toString() !== sub) return reply.forbidden('Acces interzis')
      if (invoice.status === 'anulata') return reply.code(400).send({ error: 'Factura este deja anulată' })

      const updated = await Invoice.findByIdAndUpdate(id, { status: 'anulata' }, { new: true })
      return reply.send({ invoice: updated })
    },
  )

  // POST /api/invoices/:id/storno — creează o notă de credit bazată pe factura originală
  const StornoBodySchema = z.object({
    stornoType: z.enum(['total', 'partial']),
    lines: z.array(z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      vatRate: z.number(),
      unit: z.string().default('buc'),
    })).optional(),
    reason: z.string().optional(),
  })

  app.post<IdParams>(
    '/:id/storno',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest<IdParams>, reply: FastifyReply) => {
      const { sub } = request.user as JwtUser
      const { id } = request.params

      if (!mongoose.isValidObjectId(id)) {
        return reply.code(400).send({ error: 'ID invalid' })
      }

      const original = await Invoice.findById(id)
      if (!original) return reply.notFound('Factura nu a fost găsită')
      if (original.userId.toString() !== sub) return reply.forbidden('Acces interzis')
      if (original.status === 'anulata') {
        return reply.code(400).send({ error: 'Factura este deja anulată și nu poate fi stornată' })
      }
      if (original.type === 'storno') {
        return reply.code(400).send({ error: 'O factură storno nu poate fi stornată din nou' })
      }

      const bodyResult = StornoBodySchema.safeParse(request.body)
      if (!bodyResult.success) {
        return reply.badRequest(bodyResult.error.issues[0]?.message ?? 'Date invalide')
      }
      const { stornoType, lines: partialLines, reason } = bodyResult.data

      // Build storno lines (negative quantities for total, or provided lines for partial)
      const stornoLines = stornoType === 'total'
        ? original.lines.map(l => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: parseFloat((-Math.abs(l.unitPrice)).toFixed(2)),
            vatRate: l.vatRate,
            unit: l.unit,
            total: parseFloat((-Math.abs(l.total)).toFixed(2)),
            vatAmount: parseFloat((-Math.abs(l.vatAmount)).toFixed(2)),
          }))
        : (partialLines ?? []).map(l => {
            const total = parseFloat((l.quantity * l.unitPrice).toFixed(2))
            const vatAmount = parseFloat((total * l.vatRate / 100).toFixed(2))
            return { ...l, total, vatAmount }
          })

      const factor = 1 - original.remiseGenerala / 100
      const subtotal = parseFloat((stornoLines.reduce((acc, l) => acc + l.total, 0) * factor).toFixed(2))
      const vatTotal = parseFloat(stornoLines.reduce((acc, l) => acc + (l.total * factor * l.vatRate / 100), 0).toFixed(2))
      const total = parseFloat((subtotal + vatTotal).toFixed(2))

      let exchangeRate: number | undefined = original.exchangeRate
      let totalRON = total
      if (original.currency !== 'RON' && exchangeRate) {
        totalRON = parseFloat((total * exchangeRate).toFixed(2))
      }

      const year = new Date().getFullYear()
      const number = await getNextInvoiceNumber(sub, year)
      const fullNumber = `TAXLY-${year}-${String(number).padStart(4, '0')}`

      const stornoInvoice = await Invoice.create({
        userId: sub,
        number,
        series: 'TAXLY',
        fullNumber,
        type: 'storno',
        status: 'emisa',
        issueDate: new Date(),
        client: original.client,
        lines: stornoLines,
        remiseGenerala: original.remiseGenerala,
        acomptes: [],
        acomptesTotal: 0,
        subtotal,
        vatTotal,
        total,
        currency: original.currency,
        exchangeRate,
        totalRON,
        notes: reason ?? `Notă de credit pentru factura ${original.fullNumber}`,
        originalInvoiceId: original._id,
        originalInvoiceNumber: original.fullNumber,
        stornoType,
      })

      // Dacă storno total, anulează factura originală
      if (stornoType === 'total') {
        await Invoice.findByIdAndUpdate(id, { status: 'anulata' })
      }

      return reply.code(201).send({ invoice: stornoInvoice })
    },
  )
}
