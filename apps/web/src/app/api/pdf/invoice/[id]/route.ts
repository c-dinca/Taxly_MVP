import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { auth } from '@/lib/auth'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
      const text = await invoiceRes.text()
      console.error('[PDF] Invoice fetch failed:', invoiceRes.status, text)
      return new NextResponse('Invoice not found', { status: invoiceRes.status })
    }
    const invoiceData = (await invoiceRes.json()) as {
      invoice: {
        _id: string
        type: string
        fullNumber?: string
        series?: string
        number?: number
        issueDate: string
        dueDate?: string
        currency: string
        client: { name: string; cui?: string; regCom?: string; address?: string; city?: string; county?: string }
        lines: Array<{ description: string; unit?: string; quantity: number; unitPrice: number; vatRate: number; remise?: number }>
        remiseGenerala?: number
        acomptes?: Array<{ label?: string; amount: number }>
        acomptesTotal?: number
        notes?: string
        originalInvoiceNumber?: string
      }
    }
    const invoice = invoiceData.invoice

    // Fetch user profile for emitent info
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
    } catch (e) {
      console.warn('[PDF] Could not fetch user profile, using session fallback', e)
    }

    const invoiceNumber = invoice.fullNumber ?? `${invoice.series ?? 'TAXLY'}-${invoice.number ?? ''}`
    const acomptesTotal = invoice.acomptesTotal ?? (invoice.acomptes ?? []).reduce((s, a) => s + a.amount, 0)

    const pdfType = invoice.type === 'storno' ? 'nota_credit' : (invoice.type as 'factura' | 'nota_credit' | 'proforma' | 'deviz' | 'avans')

    const element = createElement(InvoicePDF, {
      type: pdfType,
      number: invoiceNumber,
      issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : '',
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : undefined,
      currency: invoice.currency ?? 'RON',
      client: {
        name: invoice.client?.name ?? '',
        cui: invoice.client?.cui,
        regCom: invoice.client?.regCom,
        address: invoice.client?.address,
        city: invoice.client?.city,
        county: invoice.client?.county,
      },
      emitent,
      lines: (invoice.lines ?? []).map(l => ({
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
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    const safeFileName = `factura-${invoiceNumber.replace(/[^a-zA-Z0-9\-_.]/g, '_')}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
      },
    })
  } catch (err) {
    console.error('[PDF] Unexpected error:', err)
    return new NextResponse(
      JSON.stringify({ error: 'PDF generation failed', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
