import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="flex min-h-screen bg-[#F4F6FB]">
      <Sidebar email={session?.user?.email} name={session?.user?.name} />
      <main className="flex-1 ml-60">
        {children}
      </main>
    </div>
  )
}
