'use client'

import { useState } from 'react'
import { Event } from '@/lib/data'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]})`
}

function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getFullYear() === year && d.getMonth() === month
}

export default function CalendarView({ events }: { events: Event[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const monthEvents = events.filter((e) => isSameMonth(e.date, year, month))

  // Build calendar grid
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstDay.getDay()

  const eventDays = new Set(
    events.filter((e) => isSameMonth(e.date, year, month)).map((e) => Number(e.date.split('-')[2]))
  )
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">‹</button>
        <span className="font-semibold text-gray-800">{year}年 {month + 1}月</span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">›</button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={d} className={`text-center text-xs py-2 font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div
              key={i}
              className={`aspect-square flex flex-col items-center justify-center text-sm relative
                ${day === null ? '' : 'hover:bg-gray-50'}
                ${i % 7 === 0 && day ? 'text-red-500' : i % 7 === 6 && day ? 'text-blue-500' : 'text-gray-700'}
              `}
            >
              {day !== null && (
                <>
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm
                    ${day === todayDay ? 'bg-blue-600 text-white font-bold' : ''}
                  `}>{day}</span>
                  {eventDays.has(day) && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {monthEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">この月の行事はありません</p>
        ) : (
          monthEvents
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-orange-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-orange-400 mt-0.5">●</span>
                  <div>
                    <div className="font-semibold text-gray-800">{e.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(e.date)}
                      {e.endDate && e.endDate !== e.date ? ` 〜 ${formatDate(e.endDate)}` : ''}
                      {e.location ? ` ／ ${e.location}` : ''}
                    </div>
                    {e.description && <div className="text-xs text-gray-500 mt-1">{e.description}</div>}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
