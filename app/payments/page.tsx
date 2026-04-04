export const dynamic = 'force-dynamic'

import { getMembers, getAttendance, getPractices, getLatestMembersYear, getEvents, getEventAttendance } from '@/lib/data'
import UnifiedCalendar from '@/components/UnifiedCalendar'

export default async function CalendarPage() {
  const year = await getLatestMembersYear()
  const [members, practices, attendance, events, eventAttendance] = await Promise.all([
    getMembers(year),
    getPractices(),
    getAttendance(),
    getEvents(),
    getEventAttendance(),
  ])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">カレンダー</h2>
      <p className="text-xs text-gray-500 mb-4">練習日・大会・行事をまとめて確認できます</p>
      <UnifiedCalendar
        initialPractices={practices}
        initialAttendance={attendance}
        events={events}
        initialEventAttendance={eventAttendance}
        members={members}
      />
    </div>
  )
}
