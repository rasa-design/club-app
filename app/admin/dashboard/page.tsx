import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getMembers, getPayments, getEvents, getPractices, getInsurancePayments, getPoles, getLatestMembersYear } from '@/lib/data'
import AdminDashboard from '@/components/AdminDashboard'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.isAdmin) redirect('/admin')

  const year = await getLatestMembersYear()
  const [members, payments, events, practices, insurance, poles] = await Promise.all([
    getMembers(year),
    getPayments(),
    getEvents(),
    getPractices(),
    getInsurancePayments(),
    getPoles(),
  ])

  return (
    <AdminDashboard
      members={members}
      payments={payments}
      insurance={insurance}
      events={events}
      practices={practices}
      poles={poles}
      initialYear={year}
    />
  )
}
