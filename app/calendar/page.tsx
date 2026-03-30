import { getEvents } from '@/lib/data'
import CalendarView from '@/components/CalendarView'

export default function CalendarPage() {
  const events = getEvents()
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">大会カレンダー</h2>
      <CalendarView events={events} />
    </div>
  )
}
