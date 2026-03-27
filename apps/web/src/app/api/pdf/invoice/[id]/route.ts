import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { auth } from '@/lib/auth'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.accessToken) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params

  // Fetch invoice
  const invoiceRes = await fetch(`${API_URL}/api/invoices/${id}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  })
  if (!invoiceRes.ok) {
    return new NextResponse('Invoice not found', { status: invoiceRes.status })
  }
  const invoiceData = (await invoiceRes.json()) as {
    invoice: {
      _id: string
      type: string
      fullNumber?: string
      series?: string
      number?: string
      issueDate: string
      dueDate?: string
      totals: { currency: string }
      client: { name: string; cui?: string; regCom?: string; address?: string; city?: string; county?: string }
      lines: Array<{ description: string; unit?: string; quantity: number; unitPrice: number; vatRate: number; remise?: number }>
      remiseGenerala?: number
      acomptes?: Array<{ amount: number }>
      notes?: string
      originalInvoiceNumber?: string
    }
  }
  const invoice = invoiceData.invoice

  // Fetch user profile for emitent info — fall back to session name on failure
  let emitent: { name: string; cui?: string; regCom?: string; address?: string } = {
    name: session.user?.name ?? 'Emitent',
  }
  try {
    const profileRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
    if (profileRes.ok) {
      const profileData = (await profileRes.json()) as {
        user?: { companyName?: string; name?: string; cui?: string; regCom?: string; address?: string }
      }
      const u = profileData.user
      if (u) {
        emitent = {
          name: u.companyName ?? u.name ?? session.user?.name ?? 'Emitent',
          cui: u.cui,
          regCom: u.regCom,
          address: u.address,
        }
      }
    }
  } catch {
    // Use session fallback
  }

  const invoiceNumber = invoice.fullNumber ?? `${invoice.series ?? ''}${invoice.number ?? ''}`
  const acomptesTotal = (invoice.acomptes ?? []).reduce((s, a) => s + a.amount, 0)

  const pdfType = invoice.type === 'storno' ? 'nota_credit' : (invoice.type as 'factura' | 'nota_credit' | 'proforma' | 'deviz' | 'avans')

  const buffer = await renderToBuffer(
    createElement(InvoicePDF, {
      type: pdfType,
      number: invoiceNumber,
      issueDate: invoice.issueDate.split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : undefined,
      currency: invoice.totals.currency,
      client: {
        name: invoice.client.name,
        cui: invoice.client.cui,
        regCom: invoice.client.regCom,
        address: invoice.client.address,
        city: invoice.client.city,
        county: invoice.client.county,
      },
      emitent,
      lines: invoice.lines.map(l => ({
        description: l.description,
        unit: l.unit,
        quantity: l.quantity,
        unitPriceHT: l.unitPrice,
        tvaRate: l.vatRate,
        remise: l.remise,
      })),
      remiseGenerala: invoice.remiseGenerala ?? 0,
      acomptes: acomptesTotal,
      mentiuni: invoice.notes,
      originalInvoiceNumber: invoice.originalInvoiceNumber,
    }) as ReactElement<DocumentProps>,
  )

  const safeFileName = `factura-${invoiceNumber.replace(/[^a-zA-Z0-9\-_.]/g, '_')}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
    },
  })
}
