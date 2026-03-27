import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InvoiceList } from '@/components/invoices/InvoiceList'

export default async function InvoicesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="px-8 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0D1B3E] flex items-center gap-2">
          <span className="inline-block w-1 h-5 rounded-full bg-accent-500" />
          Documente fiscale
        </h1>
        <p className="mt-1 text-sm text-[#5A6A8A] pl-3">Facturi, devize, note de credit și alte documente emise</p>
      </div>
      <InvoiceList />
    </div>
  )
}
