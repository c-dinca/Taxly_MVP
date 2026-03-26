import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { InvoiceList } from '@/components/invoices/InvoiceList'

export default async function InvoicesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <DashboardHeader email={session.user?.email} name={session.user?.name} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0D1B3E] flex items-center gap-2">
            <span className="inline-block w-1 h-5 rounded-full bg-accent-500" />
            Facturi
          </h1>
          <p className="mt-1 text-sm text-[#5A6A8A] pl-3">Gestionează facturile emise</p>
        </div>

        <InvoiceList token={session.accessToken ?? ''} />
      </main>
    </div>
  )
}
