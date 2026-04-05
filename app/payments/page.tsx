export const dynamic = 'force-dynamic'

import { getMembers, getAttendance, getPractices, getLatestMembersYear, getEvents, getEventAttendance, getPoles, getEventPoles, getEventRecords } from '@/lib/data'
import { getSession } from '@/lib/session'
import UnifiedCalendar from '@/components/UnifiedCalendar'

export default async function CalendarPage() {
  const [year, session] = await Promise.all([getLatestMembersYear(), getSession()])
  const [members, practices, attendance, events, eventAttendance, poles, eventPoles, eventRecords] = await Promise.all([
    getMembers(year),
    getPractices(),
    getAttendance(),
    getEvents(),
    getEventAttendance(),
    getPoles(),
    getEventPoles(),
    getEventRecords(),
  ])

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold text-gray-800 mb-1">練習日/大会カレンダー</h2>
      <p className="text-xs text-gray-500 mb-6">日程の確認と参加登録</p>
      <UnifiedCalendar
        initialPractices={practices}
        initialAttendance={attendance}
        events={events}
        initialEventAttendance={eventAttendance}
        poles={poles}
        initialEventPoles={eventPoles}
        initialEventRecords={eventRecords}
        members={members}
        isAdmin={!!session.isAdmin}
      />
    </div>
  )
}
