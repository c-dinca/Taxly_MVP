import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import type { Invoice } from '@taxly/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const res = await fetch(`${API_URL}/api/invoices/${id}`, {
    headers: { Authorization: `Bearer ${session.accessToken ?? ''}` },
    cache: 'no-store',
  })

  if (!res.ok) redirect('/invoices')

  const data = (await res.json()) as { invoice: Invoice }
  const invoice = data.invoice

  if (invoice.status !== 'draft') redirect('/invoices')

  return (
    <InvoiceForm
      userName={session.user?.name}
      mode="edit"
      initialData={invoice}
    />
  )
}
