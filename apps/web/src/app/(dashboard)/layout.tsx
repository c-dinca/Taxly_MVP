import { auth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <DashboardShell email={session?.user?.email} name={session?.user?.name}>
      {children}
    </DashboardShell>
  )
}
