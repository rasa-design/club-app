import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getMembers, getPayments, getEvents } from '@/lib/data'
import PaymentTable from '@/components/PaymentTable'
import AdminCalendarEditor from '@/components/AdminCalendarEditor'
import LogoutButton from '@/components/LogoutButton'
import MemberEditor from '@/components/MemberEditor'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.isAdmin) {
    redirect('/admin')
  }

  const members = getMembers()
  const payments = getPayments()
  const events = getEvents()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">管理者ダッシュボード</h2>
        <LogoutButton />
      </div>

      {/* 月謝管理 */}
      <section>
        <h3 className="text-base font-semibold text-gray-700 mb-2">月謝 支払い管理</h3>
        <p className="text-xs text-gray-500 mb-3">◯をタップして支払い済みにできます</p>
        <PaymentTable members={members} payments={payments} isAdmin={true} />
      </section>

      {/* 部員管理 */}
      <section>
        <h3 className="text-base font-semibold text-gray-700 mb-2">部員管理</h3>
        <MemberEditor initialMembers={members} />
      </section>

      {/* カレンダー管理 */}
      <section>
        <h3 className="text-base font-semibold text-gray-700 mb-2">大会・行事 管理</h3>
        <AdminCalendarEditor initialEvents={events} />
      </section>
    </div>
  )
}
