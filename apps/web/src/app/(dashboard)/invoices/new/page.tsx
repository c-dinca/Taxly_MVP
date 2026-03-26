import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'

export default async function NewInvoicePage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <InvoiceForm
      userName={session.user?.name}
    />
  )
}
