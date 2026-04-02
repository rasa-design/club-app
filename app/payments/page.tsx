export const dynamic = 'force-dynamic'

import { getMembers, getAttendance, getPractices, getLatestMembersYear } from '@/lib/data'
import PracticeCalendar from '@/components/PracticeCalendar'

export default async function PracticePage() {
  const year = await getLatestMembersYear()
  const [members, practices, attendance] = await Promise.all([
    getMembers(year),
    getPractices(),
    getAttendance(),
  ])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">練習日カレンダー</h2>
      <p className="text-xs text-gray-500 mb-4">練習日をタップして参加を登録できます</p>
      <PracticeCalendar
        initialPractices={practices}
        initialAttendance={attendance}
        members={members}
      />
    </div>
  )
}
