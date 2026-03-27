import type { FastifyInstance } from 'fastify'
import { Invoice } from '../models/Invoice'

interface JwtUser { sub: string }

// 2025 Romanian fiscal constants
const SALARIU_MINIM_LUNAR = 4050 // RON
const CAS_RATE = 0.25
const CASS_RATE = 0.10
const IMPOZIT_RATE = 0.10
const CAS_CAP_MULTIPLIER = 24
const CASS_CAP_MULTIPLIER = 60

export async function fiscalRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/fiscal/calculator?year=2025
  // Returns calculated taxes based on actual invoices for the year
  app.get<{ Querystring: { year?: string; cheltuieli?: string } }>(
    '/calculator',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { sub } = request.user as JwtUser
      const year = parseInt(request.query.year ?? String(new Date().getFullYear()))
      const cheltuieliDeductibile = parseFloat(request.query.cheltuieli ?? '0')

      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31T23:59:59`)

      // Sum all paid/emitted invoices for the year (only 'incasata' and 'emisa' status)
      const invoices = await Invoice.find({
        userId: sub,
        issueDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['incasata', 'emisa', 'partial_incasata'] },
        type: { $ne: 'storno' },
      })

      const venitBrut = invoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0)
      const venitNet = Math.max(0, venitBrut - cheltuieliDeductibile)

      const casCap = CAS_CAP_MULTIPLIER * SALARIU_MINIM_LUNAR
      const cassCap = CASS_CAP_MULTIPLIER * SALARIU_MINIM_LUNAR

      const casBase = Math.min(venitNet, casCap)
      const cassBase = Math.min(venitBrut, cassCap)

      const cas = Math.round(casBase * CAS_RATE * 100) / 100
      const cass = Math.round(cassBase * CASS_RATE * 100) / 100

      const impozitBase = Math.max(0, venitNet - cas - cass)
      const impozit = Math.round(impozitBase * IMPOZIT_RATE * 100) / 100

      const totalTaxe = cas + cass + impozit
      const restInBuzunar = Math.max(0, venitNet - totalTaxe)

      // Monthly breakdown
      const monthly: Record<number, { venit: number; count: number }> = {}
      for (let m = 1; m <= 12; m++) monthly[m] = { venit: 0, count: 0 }
      for (const inv of invoices) {
        const m = new Date(inv.issueDate).getMonth() + 1
        monthly[m].venit += inv.total ?? 0
        monthly[m].count += 1
      }

      return reply.send({
        year,
        venitBrut: Math.round(venitBrut * 100) / 100,
        cheltuieliDeductibile,
        venitNet: Math.round(venitNet * 100) / 100,
        cas,
        cass,
        impozit,
        totalTaxe: Math.round(totalTaxe * 100) / 100,
        restInBuzunar: Math.round(restInBuzunar * 100) / 100,
        efectivRate: venitBrut > 0 ? Math.round((totalTaxe / venitBrut) * 10000) / 100 : 0,
        constants: {
          casRate: CAS_RATE,
          cassRate: CASS_RATE,
          impozitRate: IMPOZIT_RATE,
          casCap,
          cassCap,
          salariuMinimLunar: SALARIU_MINIM_LUNAR,
        },
        monthly: Object.entries(monthly).map(([month, data]) => ({
          month: parseInt(month),
          venit: Math.round(data.venit * 100) / 100,
          count: data.count,
        })),
        invoiceCount: invoices.length,
      })
    }
  )

  // GET /api/fiscal/summary — quick summary for dashboard
  app.get(
    '/summary',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { sub } = request.user as JwtUser
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      const startYear = new Date(`${year}-01-01`)
      const startMonth = new Date(year, month, 1)
      const endMonth = new Date(year, month + 1, 0, 23, 59, 59)

      const [invoicesYear, invoicesMonth] = await Promise.all([
        Invoice.find({
          userId: sub,
          issueDate: { $gte: startYear },
          status: { $in: ['incasata', 'emisa', 'partial_incasata'] },
          type: { $ne: 'storno' },
        }),
        Invoice.find({
          userId: sub,
          issueDate: { $gte: startMonth, $lte: endMonth },
          type: { $ne: 'storno' },
        }),
      ])

      const venitBrut = invoicesYear.reduce((s, i) => s + (i.total ?? 0), 0)
      const venitLuna = invoicesMonth.reduce((s, i) => s + (i.total ?? 0), 0)

      const casCap = CAS_CAP_MULTIPLIER * SALARIU_MINIM_LUNAR
      const cassCap = CASS_CAP_MULTIPLIER * SALARIU_MINIM_LUNAR
      const cas = Math.round(Math.min(venitBrut, casCap) * CAS_RATE * 100) / 100
      const cass = Math.round(Math.min(venitBrut, cassCap) * CASS_RATE * 100) / 100
      const impozitBase = Math.max(0, venitBrut - cas - cass)
      const impozit = Math.round(impozitBase * IMPOZIT_RATE * 100) / 100
      const totalTaxe = cas + cass + impozit

      return reply.send({
        venitBrut: Math.round(venitBrut * 100) / 100,
        venitLunaAceasta: Math.round(venitLuna * 100) / 100,
        totalTaxe: Math.round(totalTaxe * 100) / 100,
        restInBuzunar: Math.max(0, Math.round((venitBrut - totalTaxe) * 100) / 100),
        facturaLunaAceasta: invoicesMonth.length,
        facturaAnAcesta: invoicesYear.length,
      })
    }
  )
}
