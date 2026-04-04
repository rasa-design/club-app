'use client'

import { useState } from 'react'
import { Practices, Attendance, Member, AttendanceRecord } from '@/lib/data'
import { gradeLabel } from '@/lib/grade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

type MemberState = { attended: boolean; start: string; end: string }
type AttendanceState = Record<string, MemberState>

export default function PracticeCalendar({
  initialPractices,
  initialAttendance,
  members,
}: {
  initialPractices: Practices
  initialAttendance: Attendance
  members: Member[]
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [practices] = useState<Practices>(initialPractices)
  const [attendance, setAttendance] = useState<Attendance>(initialAttendance)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({})
  const [saving, setSaving] = useState(false)

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)

  const openDay = (date: string) => {
    const slots = practices[date] ?? []
    if (slots.length === 0) return
    const defaultStart = slots[0]?.start ?? '09:00'
    const defaultEnd = slots[0]?.end ?? '12:00'
    const state: AttendanceState = {}
    for (const member of members) {
      const existing = attendance[date]?.[member.id]
      state[member.id] = existing
        ? { attended: true, start: existing.start, end: existing.end }
        : { attended: true, start: defaultStart, end: defaultEnd }
    }
    setAttendanceState(state)
    setSelectedDate(date)
  }

  const toggleMember = (memberId: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], attended: !prev[memberId].attended },
    }))
  }

  const updateTime = (memberId: string, field: 'start' | 'end', value: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }))
  }

  const save = async () => {
    if (!selectedDate) return
    setSaving(true)

    const existing = attendance[selectedDate] ?? {}
    const promises: Promise<unknown>[] = []

    for (const member of members) {
      const state = attendanceState[member.id]
      const hadAttendance = !!existing[member.id]

      if (state.attended) {
        // POST (create or overwrite)
        promises.push(
          fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, memberId: member.id, start: state.start, end: state.end }),
          })
        )
      } else if (!state.attended && hadAttendance) {
        // DELETE
        promises.push(
          fetch('/api/attendance', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, memberId: member.id }),
          })
        )
      }
    }

    await Promise.all(promises)

    // Update local attendance state
    setAttendance(prev => {
      const next = { ...prev }
      const dateRecord: Record<string, AttendanceRecord> = {}
      for (const member of members) {
        const state = attendanceState[member.id]
        if (state.attended) {
          dateRecord[member.id] = { start: state.start, end: state.end }
        }
      }
      if (Object.keys(dateRecord).length === 0) {
        delete next[selectedDate]
      } else {
        next[selectedDate] = dateRecord
      }
      return next
    })

    setSaving(false)
    setSelectedDate(null)
  }

  // Build calendar grid cells
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const selectedSlots = selectedDate ? (practices[selectedDate] ?? []) : []
  const [sy, sm, sd] = selectedDate ? selectedDate.split('-').map(Number) : [0, 0, 0]
  const selectedDow = selectedDate ? new Date(sy, sm - 1, sd).getDay() : 0

  return (
    <div className="space-y-4">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-base">{year}年{month}月</span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 border rounded-xl overflow-hidden">
        {/* 曜日ヘッダー */}
        {DAYS_JA.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center text-xs font-semibold py-2',
              i === 0 && 'text-destructive',
              i === 6 && 'text-primary',
              'text-muted-foreground'
            )}
          >
            {d}
          </div>
        ))}

        {/* 日付セル */}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} className="aspect-square" />
          }

          const date = toDateStr(year, month, day)
          const dow = (firstDow + day - 1) % 7
          const hasPractice = (practices[date] ?? []).length > 0
          const attendCount = Object.keys(attendance[date] ?? {}).length
          const isToday = date === todayStr

          return (
            <button
              key={day}
              onClick={() => openDay(date)}
              disabled={!hasPractice}
              className={cn(
                'aspect-square p-1 flex flex-col items-center gap-0.5 rounded-lg transition-colors',
                hasPractice && 'cursor-pointer hover:bg-[#3BBFAD]/8 active:bg-[#3BBFAD]/15',
                !hasPractice && 'cursor-default',
              )}
            >
              <span className={cn(
                'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                isToday && 'bg-primary text-primary-foreground',
                !isToday && dow === 0 && 'text-destructive',
                !isToday && dow === 6 && 'text-primary',
                !isToday && dow !== 0 && dow !== 6 && 'text-foreground',
              )}>
                {day}
              </span>
              {hasPractice && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3BBFAD]" />
                  {attendCount > 0 && (
                    <span className="text-[10px] text-[#3BBFAD] font-medium leading-none">
                      {attendCount}人
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        ● のある日は練習日です。タップして参加を登録できます
      </p>

      {/* 参加登録ダイアログ */}
      <Dialog open={selectedDate !== null} onOpenChange={open => !open && setSelectedDate(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">
              {selectedDate && `${sm}/${sd}（${DAYS_JA[selectedDow]}）参加登録`}
            </DialogTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedSlots.map(slot => (
                <span key={slot.id} className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {slot.start}〜{slot.end}
                </span>
              ))}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            {members.map(member => {
              const state = attendanceState[member.id]
              if (!state) return null
              return (
                <div
                  key={member.id}
                  className={cn(
                    'rounded-xl border transition-colors',
                    state.attended ? 'border-[#3BBFAD]/50 bg-[#3BBFAD]/5' : 'bg-card'
                  )}
                >
                  <button
                    className="flex items-center gap-3 w-full text-left px-3 py-3"
                    onClick={() => toggleMember(member.id)}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      state.attended
                        ? 'bg-[#3BBFAD] border-[#3BBFAD]'
                        : 'border-muted-foreground/40'
                    )}>
                      {state.attended && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{member.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{gradeLabel(member.grade)}</span>
                    </div>
                  </button>

                  {state.attended && (
                    <div className="flex items-center gap-2 px-3 pb-3 pl-12">
                      <Input
                        type="time"
                        value={state.start}
                        onChange={e => updateTime(member.id, 'start', e.target.value)}
                        className="flex-1 h-9 text-sm"
                      />
                      <span className="text-muted-foreground text-sm shrink-0">〜</span>
                      <Input
                        type="time"
                        value={state.end}
                        onChange={e => updateTime(member.id, 'end', e.target.value)}
                        className="flex-1 h-9 text-sm"
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                登録されているメンバーがいません
              </p>
            )}
          </div>

          <div className="px-4 pb-4 pt-3 border-t shrink-0">
            <Button
              onClick={save}
              disabled={saving}
              className="w-full bg-[#3BBFAD] hover:bg-[#3BBFAD]/90 text-white"
            >
              {saving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
