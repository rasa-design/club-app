export const dynamic = 'force-dynamic'

import { getMembersWithYear, getEvents, getEventRecords, getMemberGoals } from '@/lib/data'
import MemberList from '@/components/MemberList'
import { Users } from 'lucide-react'

export default async function MembersPage() {
  const [{ year, members, years }, events, eventRecords, goals] = await Promise.all([
    getMembersWithYear(),
    getEvents(),
    getEventRecords(),
    getMemberGoals(),
  ])

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-5 w-5 shrink-0" style={{ color: '#7C5CBF' }} />
        <h2 className="text-xl font-bold text-gray-800">クラブ生一覧</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">在籍メンバーを確認できます</p>
      <MemberList
        members={members}
        initialYear={year}
        initialYears={years}
        initialGoals={goals}
        initialEvents={events}
        initialEventRecords={eventRecords}
      />
    </div>
  )
}
