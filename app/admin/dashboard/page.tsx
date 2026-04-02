import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getMembers, getPayments, getEvents, getPractices, getLatestMembersYear } from '@/lib/data'
import AdminDashboard from '@/components/AdminDashboard'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.isAdmin) redirect('/admin')

  const year = await getLatestMembersYear()
  const [members, payments, events, practices] = await Promise.all([
    getMembers(year),
    getPayments(),
    getEvents(),
    getPractices(),
  ])

  return (
    <AdminDashboard
      members={members}
      payments={payments}
      events={events}
      practices={practices}
      initialYear={year}
    />
  )
}
