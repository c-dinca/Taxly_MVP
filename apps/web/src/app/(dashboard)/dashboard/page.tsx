import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const onboardingCompleted = session.onboardingCompleted
  if (!onboardingCompleted) redirect('/onboarding')

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Bun venit, {session.user?.name?.split(' ')[0]}! 👋
      </h1>
      <p className="text-gray-500">Dashboard-ul Taxly e în construcție — Faza 1D.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Facturi emise', value: '—', sub: 'luna aceasta', color: 'taxly' },
          { label: 'Rest în buzunar', value: '—', sub: 'estimat annual', color: 'green' },
          { label: 'Taxe datorate', value: '—', sub: 'CAS + CASS + impozit', color: 'yellow' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
