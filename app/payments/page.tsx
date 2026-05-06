export const dynamic = 'force-dynamic'

import { getMembers, getAttendance, getPractices, getLatestMembersYear, getEvents, getEventAttendance, getPoles, getEventPoles, getEventRecords, getEventAbsences, getEventTrialRecords } from '@/lib/data'
import { getSession } from '@/lib/session'
import UnifiedCalendar from '@/components/UnifiedCalendar'
import { CalendarCheck2 } from 'lucide-react'

export default async function CalendarPage() {
  const [year, session] = await Promise.all([getLatestMembersYear(), getSession()])
  const [members, practices, attendance, events, eventAttendance, poles, eventPoles, eventRecords, eventAbsences, eventTrialRecords] = await Promise.all([
    getMembers(year),
    getPractices(),
    getAttendance(),
    getEvents(),
    getEventAttendance(),
    getPoles(),
    getEventPoles(),
    getEventRecords(),
    getEventAbsences(),
    getEventTrialRecords(),
  ])

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <CalendarCheck2 className="h-5 w-5 shrink-0" style={{ color: '#3BBFAD' }} />
        <h2 className="text-xl font-bold text-gray-800">練習日/大会カレンダー</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">日程の確認と参加登録</p>
      <UnifiedCalendar
        initialPractices={practices}
        initialAttendance={attendance}
        events={events}
        initialEventAttendance={eventAttendance}
        initialEventAbsences={eventAbsences}
        poles={poles}
        initialEventPoles={eventPoles}
        initialEventRecords={eventRecords}
        initialEventTrialRecords={eventTrialRecords}
        members={members}
        isAdmin={!!session.isAdmin}
      />
    </div>
  )
}
