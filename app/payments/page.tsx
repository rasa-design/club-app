export const dynamic = 'force-dynamic'

import { getMembersWithYear, getAttendance, getPractices, getEvents, getEventAttendance, getPoles, getEventPoles, getEventRecords, getEventAbsences, getEventTrialRecords, getEventExtraPoles } from '@/lib/data'
import { getSession } from '@/lib/session'
import UnifiedCalendar from '@/components/UnifiedCalendar'
import { CalendarCheck2 } from 'lucide-react'

export default async function CalendarPage() {
  const [{ members }, session, practices, attendance, events, eventAttendance, poles, eventPoles, eventRecords, eventAbsences, eventTrialRecords, eventExtraPoles] = await Promise.all([
    getMembersWithYear(),
    getSession(),
    getPractices(),
    getAttendance(),
    getEvents(),
    getEventAttendance(),
    getPoles(),
    getEventPoles(),
    getEventRecords(),
    getEventAbsences(),
    getEventTrialRecords(),
    getEventExtraPoles(),
  ])

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <CalendarCheck2 className="h-5 w-5 shrink-0" style={{ color: 'var(--color-feature-calendar)' }} />
        <h2 className="text-xl font-bold text-foreground">練習日/大会カレンダー</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">日程の確認と登録</p>
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
        initialEventExtraPoles={eventExtraPoles}
        members={members}
        isAdmin={!!session.isAdmin}
      />
    </div>
  )
}
