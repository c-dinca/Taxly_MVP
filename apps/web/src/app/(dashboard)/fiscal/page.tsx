import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FiscalCalculator } from '@/components/fiscal/FiscalCalculator'

export default async function FiscalPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return <FiscalCalculator />
}
