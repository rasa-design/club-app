'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Practices, Attendance, Member, Event, EventAttendance, EventAbsences, Pole, EventPoles, EventExtraPoles, EventRecords, EventTrialRecords, MemberTrialData, GradeCategory } from '@/lib/data'
import { gradeLabel } from '@/lib/grade'
import { toHalfWidth, parseRecord, formatRecord } from '@/lib/record'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronLeft, ChevronRight, Clock, Check, MapPin, Plus, Trash2, User, CalendarClock, Pencil, MoreHorizontal, WandSparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

function formatHeight(cm: number): string {
  const m = Math.floor(cm / 100)
  const remainder = cm % 100
  return remainder === 0 ? `${m}m` : `${m}m${remainder}`
}

const GRADE_CATEGORIES: GradeCategory[] = ['小学生', '中学生', '高校生', '一般']

function getMemberGradeCategory(grade: number): GradeCategory {
  if (grade <= 6) return '小学生'
  if (grade <= 9) return '中学生'
  if (grade <= 12) return '高校生'
  return '一般'
}

function filterMembersByTargetGrades(members: Member[], targetGrades?: GradeCategory[]): Member[] {
  if (targetGrades === undefined) return members // 未設定の既存イベントは全員対象（後方互換）
  if (targetGrades.length === 0) return []
  return members.filter(m => targetGrades.includes(getMemberGradeCategory(m.grade)))
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_JA[d.getDay()]})`
}

function getEventsOnDate(events: Event[], dateStr: string): Event[] {
  return events.filter((e) => e.date <= dateStr && dateStr <= (e.endDate || e.date))
}

function getEventsStartingInMonth(events: Event[], year: number, month: number): Event[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return events
    .filter((e) => e.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date))
}

type MemberState = { attended: boolean; start: string; end: string }
type PracticeState = Record<string, MemberState>

type AddForm = { title: string; date: string; endDate: string; location: string; description: string; poleCarrier?: string; entryDeadline?: string; targetGrades: GradeCategory[] }

export default function UnifiedCalendar({
  initialPractices,
  initialAttendance,
  events: initialEvents,
  initialEventAttendance,
  initialEventAbsences = {},
  poles,
  initialEventPoles,
  initialEventExtraPoles = {},
  initialEventRecords,
  initialEventTrialRecords,
  members,
  isAdmin,
}: {
  initialPractices: Practices
  initialAttendance: Attendance
  events: Event[]
  initialEventAttendance: EventAttendance
  initialEventAbsences?: EventAbsences
  poles: Pole[]
  initialEventPoles: EventPoles
  initialEventExtraPoles?: EventExtraPoles
  initialEventRecords: EventRecords
  initialEventTrialRecords: EventTrialRecords
  members: Member[]
  isAdmin: boolean
  initialOpenEventId?: string | null
}) {
  const router = useRouter()
  const fromMemberIdRef = useRef<string | null>(null)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [practices] = useState<Practices>(initialPractices)
  const [attendance, setAttendance] = useState<Attendance>(initialAttendance)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [eventAttendance, setEventAttendance] = useState<EventAttendance>(initialEventAttendance)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [practiceState, setPracticeState] = useState<PracticeState>({})


  const [addForm, setAddForm] = useState<AddForm | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)

  const [addSaving, setAddSaving] = useState(false)
  const [eventPoles, setEventPoles] = useState<EventPoles>(initialEventPoles)
  const [eventAbsences, setEventAbsences] = useState<EventAbsences>(initialEventAbsences)
  // ポール選択ダイアログ
  const [poleDialog, setPoleDialog] = useState<{ event: Event } | null>(null)
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [poleViewMode, setPoleViewMode] = useState<'member' | 'pole'>('member')
  const [expandedPoleId, setExpandedPoleId] = useState<string | null>(null)
  const [eventExtraPoles, setEventExtraPoles] = useState<EventExtraPoles>(initialEventExtraPoles)
  const [extraPoleInput, setExtraPoleInput] = useState('')
  const [eventRecords, setEventRecords] = useState<EventRecords>(initialEventRecords)
  const [eventTrialRecords, setEventTrialRecords] = useState<EventTrialRecords>(initialEventTrialRecords)
  const [trialAddingHeight, setTrialAddingHeight] = useState(false)
  const [trialHeightInput, setTrialHeightInput] = useState('')
  const [trialEditMode, setTrialEditMode] = useState(false)
  const [recordDialog, setRecordDialog] = useState<Event | null>(null)
  // 記録入力の一時state: { [memberId]: { m, cm, status? } }
  const [recordInputs, setRecordInputs] = useState<Record<string, { m: string; cm: string; status?: 'NM' | 'DNS' }>>({})
  // 記録ダイアログで展開中のメンバーID
  const [expandedRecordMemberId, setExpandedRecordMemberId] = useState<string | null>(null)

      // ▼▼▼ 追加：state ▼▼▼
const [videoDialog, setVideoDialog] = useState<Member | null>(null)
const [videos, setVideos] = useState<Record<string, string[]>>({})
const [newUrl, setNewUrl] = useState('')
const [poleListDialog, setPoleListDialog] = useState<{ member: Member; eventId: string } | null>(null)

  // URLパラメータ ?event=&member=&from= で記録ダイアログを開く
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const eventId = params.get('event')
    if (!eventId) return
    const event = initialEvents.find(e => e.id === eventId)
    if (!event) return
    setRecordDialog(event)
    const memberId = params.get('member')
    if (memberId) setExpandedRecordMemberId(memberId)
    if (params.get('from') === 'members') fromMemberIdRef.current = params.get('member')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRecordDialogClose = () => {
    setRecordDialog(null)
    setExpandedRecordMemberId(null)
    const memberId = fromMemberIdRef.current
    if (memberId) {
      fromMemberIdRef.current = null
      router.push(`/members?member=${memberId}`)
    }
  }

// 動画機能は一旦延期。実装再開時はコメントを外す
// const toEmbedUrl = (url: string) => {
//   try {
//     const u = new URL(url)
//
//     // youtu.be
//     if (u.hostname.includes('youtu.be')) {
//       return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
//     }
//
//     // youtube.com/watch?v=
//     if (u.searchParams.get('v')) {
//       return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
//     }
//
//     // shorts / live 対応
//     const paths = u.pathname.split('/')
//     const id = paths[2]
//     if (['shorts', 'live', 'embed'].includes(paths[1]) && id) {
//       return `https://www.youtube.com/embed/${id}`
//     }
//
//     return url
//   } catch {
//     return url
//   }
// }

// 動画機能は一旦延期。実装再開時はコメントを外す
// const addVideo = () => {
//   if (!videoDialog || !newUrl) return
//
//   if (!newUrl.includes('youtube') && !newUrl.includes('youtu.be')) {
//     alert('YouTubeのURLを入力してください')
//     return
//   }
//
//   const embedUrl = toEmbedUrl(newUrl)
//
//   console.log('入力URL:', newUrl)
//   console.log('変換後URL:', embedUrl)
//
//   setVideos(prev => ({
//     ...prev,
//     [videoDialog.id]: [...(prev[videoDialog.id] || []), embedUrl],
//   }))
//
//   setNewUrl('')
// }

const removeVideo = (memberId: string, index: number) => {
  setVideos(prev => {
    const list = [...(prev[memberId] || [])]
    list.splice(index, 1)
    return { ...prev, [memberId]: list }
  })
}
// ▲▲▲ 追加ここまで ▲▲▲

  const [editDialog, setEditDialog] = useState<Event | null>(null)
  const [editForm, setEditForm] = useState<Omit<Event, 'id'>>({ title: '', date: '', endDate: '', location: '', description: '', poleCarrier: '', entryDeadline: '', targetGrades: [] })
  const [editSaving, setEditSaving] = useState(false)

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextMonth()
      else prevMonth()
    }
    touchStartX.current = null
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)

  const openDay = (date: string) => {
    const slots = practices[date] ?? []
    const hasPractice = slots.length > 0
    const dayEvents = getEventsOnDate(events, date)
    const hasEvent = dayEvents.length > 0

    // 練習も大会もない日でも大会登録のためタップ可能

    if (hasPractice) {
      const defaultStart = slots[0]?.start ?? '09:00'
      const defaultEnd = slots[0]?.end ?? '12:00'
      const dateAttendance = attendance[date]
      const hasBeenSaved = dateAttendance !== undefined
      const state: PracticeState = {}
      for (const member of members) {
        const existing = dateAttendance?.[member.id]
        state[member.id] = existing
          ? { attended: true, start: existing.start, end: existing.end }
          : { attended: !hasBeenSaved, start: defaultStart, end: defaultEnd }
      }
      setPracticeState(state)
    }

    // 練習も大会もない日をタップした場合は直接追加フォームを開く
    const shouldOpenAddForm = !hasPractice && !hasEvent
    setAddForm(shouldOpenAddForm ? {
      title: '',
      date,
      endDate: date,
      location: '',
      description: '',
      targetGrades: [],
    } : null)
    setSelectedDate(date)
  }

  const saveAttendanceForMember = async (memberId: string, newState: { attended: boolean; start: string; end: string }) => {
    if (!selectedDate) return
    const existing = attendance[selectedDate] ?? {}
    const hadAttendance = !!existing[memberId]
    if (newState.attended) {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, memberId, start: newState.start, end: newState.end }),
      })
      setAttendance(prev => ({
        ...prev,
        [selectedDate]: { ...(prev[selectedDate] ?? {}), [memberId]: { start: newState.start, end: newState.end } },
      }))
    } else if (hadAttendance) {
      await fetch('/api/attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, memberId }),
      })
      setAttendance(prev => {
        const next = { ...prev }
        const dateRecord = { ...(next[selectedDate] ?? {}) }
        delete dateRecord[memberId]
        if (Object.keys(dateRecord).length === 0) delete next[selectedDate]
        else next[selectedDate] = dateRecord
        return next
      })
    }
  }

  const toggleMember = (memberId: string) => {
    const newAttended = !practiceState[memberId].attended
    const newState = { ...practiceState[memberId], attended: newAttended }
    setPracticeState(prev => ({ ...prev, [memberId]: newState }))
    saveAttendanceForMember(memberId, newState)
  }

  const updateTime = (memberId: string, field: 'start' | 'end', value: string) => {
    setPracticeState(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }))
  }

  const saveTimeForMember = (memberId: string) => {
    const state = practiceState[memberId]
    if (state?.attended) saveAttendanceForMember(memberId, state)
  }

  // ポール選択時の自動参加登録用（追加のみ、削除しない）
  const addEventMember = async (eventId: string, memberId: string) => {
    const isAlreadyAttending = (eventAttendance[eventId] ?? []).includes(memberId)
    if (isAlreadyAttending) return
    setEventAttendance(prev => {
      const current = prev[eventId] ?? []
      if (current.includes(memberId)) return prev
      return { ...prev, [eventId]: [...current, memberId] }
    })
    await fetch('/api/event-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, memberId }),
    })
  }

  const updateRecord = async (eventId: string, memberId: string, record: string) => {
    // 楽観的更新
    setEventRecords(prev => {
      const next = { ...prev, [eventId]: { ...(prev[eventId] ?? {}) } }
      if (record.trim() === '') {
        delete next[eventId][memberId]
      } else {
        next[eventId][memberId] = record.trim()
      }
      return next
    })
    await fetch('/api/event-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, memberId, record }),
    })
  }

  const updateTrialRecord = async (eventId: string, memberId: string, data: MemberTrialData) => {
    setEventTrialRecords(prev => ({
      ...prev,
      [eventId]: { ...(prev[eventId] ?? {}), [memberId]: data },
    }))
    await fetch('/api/event-trial-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, memberId, data }),
    })
  }

  const openEditDialog = (event: Event) => {
    setEditDialog(event)
    setEditForm({ title: event.title, date: event.date, endDate: event.endDate, location: event.location, description: event.description, poleCarrier: event.poleCarrier ?? '', entryDeadline: event.entryDeadline ?? '', targetGrades: event.targetGrades ?? [] })
  }

  const saveEditEvent = async () => {
    if (!editDialog || !editForm.title || !editForm.date) return
    setEditSaving(true)
    const updated = { ...editForm, id: editDialog.id }
    const res = await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === editDialog.id ? updated : e))
      setEditDialog(null)
    }
    setEditSaving(false)
  }

  const togglePole = async (eventId: string, memberId: string, poleId: string) => {
    const current = eventPoles[eventId]?.[memberId] ?? []
    const isAdding = !current.includes(poleId)
    const next = isAdding
      ? [...current, poleId]
      : current.filter(id => id !== poleId)
    // 楽観的更新
    setEventPoles(prev => ({
      ...prev,
      [eventId]: { ...(prev[eventId] ?? {}), [memberId]: next },
    }))
    await fetch('/api/event-poles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, memberId, poleIds: next }),
    })
    // ポール追加時、未参加なら自動で参加登録
    if (isAdding) {
      await addEventMember(eventId, memberId)
    }
  }

  const toggleAbsence = async (eventId: string, memberId: string) => {
    setEventAbsences(prev => {
      const current = (prev ?? {})[eventId] ?? []
      return {
        ...prev,
        [eventId]: current.includes(memberId)
          ? current.filter(id => id !== memberId)
          : [...current, memberId],
      }
    })
    await fetch('/api/event-absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, memberId }),
    })
  }

  const addExtraPole = async (eventId: string, memberId: string, size: string) => {
    const trimmed = size.trim()
    if (!trimmed) return
    const newPole: Pole = { id: `extra-${Date.now()}`, size: trimmed }
    const next = [...(eventExtraPoles?.[eventId] ?? []), newPole]
    setEventExtraPoles(prev => ({ ...prev, [eventId]: next }))
    setExtraPoleInput('')
    await fetch('/api/event-extra-poles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, poles: next }),
    })
    // 追加したポールをそのメンバーに自動割り当て
    await togglePole(eventId, memberId, newPole.id)
  }

  const removeExtraPole = async (eventId: string, poleId: string) => {
    const next = (eventExtraPoles?.[eventId] ?? []).filter(p => p.id !== poleId)
    setEventExtraPoles(prev => ({ ...prev, [eventId]: next }))
    // 割り当てからも削除
    const currentAssignments = eventPoles[eventId] ?? {}
    const updatedAssignments = Object.fromEntries(
      Object.entries(currentAssignments).map(([memberId, poleIds]) => [
        memberId, poleIds.filter(id => id !== poleId),
      ])
    )
    setEventPoles(prev => ({ ...prev, [eventId]: updatedAssignments }))
    await Promise.all([
      fetch('/api/event-extra-poles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, poles: next }),
      }),
      ...Object.entries(updatedAssignments).map(([memberId, poleIds]) =>
        fetch('/api/event-poles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, memberId, poleIds }),
        })
      ),
    ])
  }

  const deleteEvent = async (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    })
  }

  const startAddForm = () => {
    setAddForm({
      title: '',
      date: selectedDate ?? '',
      endDate: selectedDate ?? '',
      location: '',
      description: '',
      targetGrades: [],
    })
  }

  const saveEvent = async () => {
    if (!addForm || !addForm.title || !addForm.date) return
    setAddSaving(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    if (res.ok) {
      const created: Event = await res.json()
      setEvents(prev => [...prev, created])
      setAddForm(null)
    }
    setAddSaving(false)
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const monthEvents = getEventsStartingInMonth(events, year, month)

  const selectedSlots = selectedDate ? (practices[selectedDate] ?? []) : []
  const selectedEvents = selectedDate ? getEventsOnDate(events, selectedDate) : []
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
      <div
        className="grid grid-cols-7 border rounded-xl overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {DAYS_JA.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center text-xs font-semibold py-2 text-muted-foreground',
              i === 0 && 'text-destructive',
              i === 6 && 'text-primary',
            )}
          >
            {d}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="aspect-square" />

          const date = toDateStr(year, month, day)
          const dow = (firstDow + day - 1) % 7
          const hasPractice = (practices[date] ?? []).length > 0
          const dayEvents = getEventsOnDate(events, date)
          const hasEvent = dayEvents.length > 0
          const isToday = date === todayStr
          const tappable = true

          return (
            <button
              key={day}
              onClick={() => openDay(date)}
              disabled={!tappable}
              className={cn(
                'aspect-square p-1 flex flex-col items-center gap-0.5 rounded-lg transition-colors',
                tappable && 'cursor-pointer hover:bg-muted/50 active:bg-muted',
                !tappable && 'cursor-default',
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
              <div className="flex gap-0.5 items-center">
                {hasPractice && <span className="w-1.5 h-1.5 rounded-full bg-[#3BBFAD]" />}
                {hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#3BBFAD] inline-block" />
          練習日
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
          大会
        </span>
      </div>

      {/* ダイアログ */}
      <Dialog open={selectedDate !== null} onOpenChange={open => { if (!open) { setSelectedDate(null); setAddForm(null) } }}>
        <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">
              {selectedDate && `${sm}/${sd}（${DAYS_JA[selectedDow]}）`}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
            {/* 練習セクション */}
            {selectedSlots.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">練習</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.map(slot => (
                    <span key={slot.id} className="text-sm text-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#3BBFAD]" />
                      {slot.start}〜{slot.end}
                    </span>
                  ))}
                </div>
                {/* 参加チェック機能（将来のため残す・現在は非表示） */}
                {false && members.map(member => {
                  const state = practiceState[member.id]
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
                          state.attended ? 'bg-[#3BBFAD] border-[#3BBFAD]' : 'border-muted-foreground/40'
                        )}>
                          {state.attended && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{member.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{gradeLabel(member.grade)}</span>
                        </div>
                      </button>
                      {state.attended && (
                        <div className="space-y-2 px-3 pb-3 pl-12">
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={state.start}
                              onChange={e => updateTime(member.id, 'start', e.target.value)}
                              onBlur={() => saveTimeForMember(member.id)}
                              className="flex-1 h-9 text-sm"
                            />
                            <span className="text-muted-foreground text-sm shrink-0">〜</span>
                            <Input
                              type="time"
                              value={state.end}
                              onChange={e => updateTime(member.id, 'end', e.target.value)}
                              onBlur={() => saveTimeForMember(member.id)}
                              className="flex-1 h-9 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* 参加チェック機能（将来のため残す・現在は非表示）
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    登録されているメンバーがいません
                  </p>
                )}
                */}
              </div>
            )}

            {/* セクション区切り */}
            {selectedSlots.length > 0 && (
              <div className="border-t mx-0" />
            )}

            {/* 大会セクション */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">大会</p>

              {/* 登録済み大会カード */}
              {selectedEvents.map(event => (
                <div key={event.id} className="relative rounded-xl border border-orange-200 bg-orange-50/50">
                  {/* クリック可能なメインエリア（DropdownMenu を含まない） */}
                  <div
                    className="px-4 py-3 pr-10 space-y-1 cursor-pointer active:bg-orange-100/70 transition-colors rounded-[inherit]"
                    onClick={() => {
                      const isEventDay = event.date <= todayStr
                      if (isEventDay) {
                        const targetMembers = filterMembersByTargetGrades(members, event.targetGrades)
                          .filter(m => !(eventAbsences?.[event.id] ?? []).includes(m.id))
                        const inputs: Record<string, { m: string; cm: string; status?: 'NM' | 'DNS' }> = {}
                        targetMembers.forEach(m => {
                          const rec = eventRecords[event.id]?.[m.id] ?? ''
                          if (rec === 'NM' || rec === 'DNS') {
                            inputs[m.id] = { m: '', cm: '', status: rec }
                          } else {
                            inputs[m.id] = parseRecord(rec)
                          }
                        })
                        setRecordInputs(inputs)
                        setExpandedRecordMemberId(null)
                        setRecordDialog(event)
                      } else {
                        setPoleDialog({ event })
                        setExpandedMemberId(null)
                      }
                    }}
                  >
                    <p className="font-semibold text-sm">{event.title}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {formatDate(event.date)}
                        {event.endDate && event.endDate !== event.date
                          ? ` 〜 ${formatDate(event.endDate)}`
                          : ''}
                      </Badge>
                      {event.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                      {event.entryDeadline && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <CalendarClock className="h-3 w-3" />
                          締切 {formatDate(event.entryDeadline)}
                        </span>
                      )}
                      {event.poleCarrier && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <User className="h-3 w-3" />
                          運搬 {event.poleCarrier}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  {/* DropdownMenu — クリック領域の外に絶対配置 */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(event)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(event)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* 大会追加ボタン */}
              {!addForm && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={startAddForm}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  大会を追加
                </Button>
              )}

              {/* 大会追加フォーム */}
              {addForm && (
                <div className="rounded-xl border p-4 space-y-3">
                  <p className="text-sm font-medium">大会を追加</p>
                  <div className="space-y-1">
                    <Label className="text-xs">タイトル <span className="text-destructive">*</span></Label>
                    <Input
                      value={addForm.title}
                      onChange={e => setAddForm(f => f ? { ...f, title: e.target.value } : f)}
                      placeholder="例：春季地区大会"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">参加対象 <span className="text-destructive">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {GRADE_CATEGORIES.map(cat => {
                        const selected = addForm.targetGrades.includes(cat)
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setAddForm(f => f ? {
                              ...f,
                              targetGrades: selected
                                ? f.targetGrades.filter(g => g !== cat)
                                : [...f.targetGrades, cat]
                            } : f)}
                            className={cn(
                              'flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors',
                              selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input'
                            )}
                          >
                            {selected && <Check className="h-3 w-3" />}
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">開始日</Label>
                      <DatePicker
                        value={addForm.date}
                        onChange={v => setAddForm(f => f ? { ...f, date: v } : f)}
                        placeholder="開始日"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">終了日</Label>
                      <DatePicker
                        value={addForm.endDate}
                        onChange={v => setAddForm(f => f ? { ...f, endDate: v } : f)}
                        placeholder="終了日"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">場所</Label>
                    <Input
                      value={addForm.location}
                      onChange={e => setAddForm(f => f ? { ...f, location: e.target.value } : f)}
                      placeholder="例：市立体育館"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">申し込み締め切り日</Label>
                    <DatePicker
                      value={addForm.entryDeadline ?? ''}
                      onChange={v => setAddForm(f => f ? { ...f, entryDeadline: v } : f)}
                      placeholder="締め切り日"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ポール運搬担当者</Label>
                    <Input
                      value={addForm.poleCarrier ?? ''}
                      onChange={e => setAddForm(f => f ? { ...f, poleCarrier: e.target.value } : f)}
                      placeholder="例：山田さん"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">メモ</Label>
                    <Input
                      value={addForm.description}
                      onChange={e => setAddForm(f => f ? { ...f, description: e.target.value } : f)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      const hasPractice = (practices[selectedDate ?? ''] ?? []).length > 0
                      const hasEvent = getEventsOnDate(events, selectedDate ?? '').length > 0
                      if (!hasPractice && !hasEvent) setSelectedDate(null)
                      setAddForm(null)
                    }}>
                      キャンセル
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={saveEvent}
                      disabled={addSaving || !addForm.title || addForm.targetGrades.length === 0}
                    >
                      {addSaving ? '追加中...' : '追加する'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ（親Dialogの外に配置してoverlayが正しく重なるようにする） */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.title}」を削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) deleteEvent(deleteTarget.id); setDeleteTarget(null) }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 大会一覧 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">今月の大会</h3>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">この月の予定はありません</p>
        ) : (
          monthEvents.map((e) => {
            const allPoleIds = Object.values(eventPoles[e.id] ?? {}).flat()
            const uniqueSizes = new Set(allPoleIds.map(id => poles.find(p => p.id === id)?.size).filter(Boolean))
            const poleCount = uniqueSizes.size
            const recordCount = Object.keys(eventRecords[e.id] ?? {}).length
            const isEventDay = e.date <= todayStr
            return (
              <Card key={e.id} className="border-l-4 border-l-orange-400 relative">
                {/* クリック可能なメインエリア（DropdownMenu を含まない） */}
                <div
                  className="cursor-pointer hover:bg-muted/30 transition-colors rounded-[inherit]"
                  onClick={() => {
                    if (isEventDay) {
                      const targetMembers = filterMembersByTargetGrades(members, e.targetGrades)
                        .filter(m => !(eventAbsences?.[e.id] ?? []).includes(m.id))
                      const inputs: Record<string, { m: string; cm: string; status?: 'NM' | 'DNS' }> = {}
                      targetMembers.forEach(m => {
                        const rec = eventRecords[e.id]?.[m.id] ?? ''
                        if (rec === 'NM' || rec === 'DNS') {
                          inputs[m.id] = { m: '', cm: '', status: rec }
                        } else {
                          inputs[m.id] = parseRecord(rec)
                        }
                      })
                      setRecordInputs(inputs)
                      setExpandedRecordMemberId(null)
                      setRecordDialog(e)
                    } else {
                      setPoleDialog({ event: e })
                      setExpandedMemberId(null)
                    }
                  }}
                >
                  <CardContent className="py-3 px-4 pr-10">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm">{e.title}</div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {poleCount > 0 && (
                            <Badge variant="outline" className="text-xs text-orange-500 border-orange-300">
                              ポール選択本数{poleCount}
                            </Badge>
                          )}
                          {recordCount > 0 && (
                            <Badge variant="outline" className="text-xs text-blue-500 border-blue-300">
                              記録{recordCount}件
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {formatDate(e.date)}
                          {e.endDate && e.endDate !== e.date ? ` 〜 ${formatDate(e.endDate)}` : ''}
                        </Badge>
                        {e.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {e.location}
                          </span>
                        )}
                        {e.entryDeadline && (
                          <span className="flex items-center gap-0.5">
                            <CalendarClock className="h-3 w-3" />
                            締切 {formatDate(e.entryDeadline)}
                          </span>
                        )}
                        {e.poleCarrier && (
                          <span className="flex items-center gap-0.5">
                            <User className="h-3 w-3" />
                            運搬 {e.poleCarrier}
                          </span>
                        )}
                      </div>
                      {e.description && (
                        <p className="text-xs text-muted-foreground">{e.description}</p>
                      )}
                      <p className="text-xs text-orange-400 pt-1">
                        {isEventDay ? 'タップして記録を登録' : 'タップしてポールを登録'}
                      </p>
                    </div>
                  </CardContent>
                </div>
                {/* DropdownMenu — クリック領域の外に絶対配置 */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(e)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        編集
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(e)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* 記録入力ダイアログ */}
      <Dialog open={recordDialog !== null} onOpenChange={open => { if (!open) handleRecordDialogClose() }}>
        <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0" suppressAutoFocus>
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">{recordDialog?.title}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">クラブ生をタップし大会記録や使用したポールを確認</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            {recordDialog && (() => {
              const targetMembers = filterMembersByTargetGrades(members, recordDialog.targetGrades)
                .filter(m => !(eventAbsences?.[recordDialog.id] ?? []).includes(m.id))
              if (targetMembers.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    対象メンバーがいません
                  </p>
                )
              }
              return targetMembers.map(member => {
                const inputs = recordInputs[member.id] ?? { m: '', cm: '' }
                const hasStatus = inputs.status === 'NM' || inputs.status === 'DNS'
                const isExpanded = expandedRecordMemberId === member.id
                const currentRecord = eventRecords[recordDialog.id]?.[member.id] ?? ''
                const assignedIds = eventPoles[recordDialog.id]?.[member.id] ?? []
                const allPolesForRecord = [...poles, ...(eventExtraPoles?.[recordDialog.id] ?? [])]
                const assignedPoles = allPolesForRecord.filter(p => assignedIds.includes(p.id))
                const commitRecord = (m: string, cm: string) => {
                  updateRecord(recordDialog.id, member.id, formatRecord(m, cm))
                }
                const setStatus = (status: 'NM' | 'DNS') => {
                  if (inputs.status === status) {
                    setRecordInputs(prev => ({ ...prev, [member.id]: { m: '', cm: '' } }))
                    updateRecord(recordDialog.id, member.id, '')
                  } else {
                    setRecordInputs(prev => ({ ...prev, [member.id]: { m: '', cm: '', status } }))
                    updateRecord(recordDialog.id, member.id, status)
                  }
                }
                return (
                  <div key={member.id} className="rounded-xl border overflow-hidden">
                    {/* カードヘッダー（タップで展開） */}
                    <button
                      className="flex items-center gap-3 w-full text-left px-3 py-3"
                      onClick={() => {
                        setExpandedRecordMemberId(isExpanded ? null : member.id)
                        setTrialAddingHeight(false)
                        setTrialHeightInput('')
                        setTrialEditMode(false)
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{member.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{gradeLabel(member.grade)}</span>
                      </div>
                      {currentRecord ? (
                        <span className="font-mono text-sm shrink-0">{currentRecord}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">タップして結果登録</span>
                      )}
                    </button>

                    {/* 展開コンテンツ */}
                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-4 bg-muted/20">

                        {/* ── 記録セクション ── */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">この大会の最高記録</p>
                          {!hasStatus && (
                            <div className="flex items-center gap-2">
                              <Input
                                inputMode="numeric"
                                value={inputs.m}
                                onChange={e => setRecordInputs(prev => ({ ...prev, [member.id]: { ...inputs, m: e.target.value } }))}
                                onBlur={e => {
                                  const mH = toHalfWidth(e.target.value).replace(/\D/g, '')
                                  setRecordInputs(prev => ({ ...prev, [member.id]: { ...inputs, m: mH } }))
                                  commitRecord(mH, inputs.cm)
                                }}
                                placeholder=""
                                className="w-20 font-mono text-right h-10"
                              />
                              <span className="text-sm shrink-0">m</span>
                              <Input
                                inputMode="numeric"
                                value={inputs.cm}
                                onChange={e => setRecordInputs(prev => ({ ...prev, [member.id]: { ...inputs, cm: e.target.value } }))}
                                onBlur={e => {
                                  const cmH = toHalfWidth(e.target.value).replace(/\D/g, '')
                                  setRecordInputs(prev => ({ ...prev, [member.id]: { ...inputs, cm: cmH } }))
                                  commitRecord(inputs.m, cmH)
                                }}
                                placeholder=""
                                className="w-20 font-mono text-right h-10"
                              />
                              <span className="text-sm shrink-0">cm</span>
                            </div>
                          )}
                          {/* NM トグル */}
                          <button
                            onClick={() => setStatus('NM')}
                            className={cn(
                              'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                              inputs.status === 'NM' ? 'border-orange-300 bg-orange-50' : 'bg-background'
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                              inputs.status === 'NM' ? 'bg-orange-400 border-orange-400' : 'border-muted-foreground/40'
                            )}>
                              {inputs.status === 'NM' && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm font-medium">NM</span>
                            <span className="text-xs text-muted-foreground">※No Mark（有効記録なし）</span>
                          </button>
                          {/* DNS トグル */}
                          <button
                            onClick={() => setStatus('DNS')}
                            className={cn(
                              'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                              inputs.status === 'DNS' ? 'border-orange-300 bg-orange-50' : 'bg-background'
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                              inputs.status === 'DNS' ? 'bg-orange-400 border-orange-400' : 'border-muted-foreground/40'
                            )}>
                              {inputs.status === 'DNS' && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm font-medium">DNS</span>
                            <span className="text-xs text-muted-foreground">※Did Not Start（棄権/出場なし）</span>
                          </button>
                        </div>

                        {/* ── 試技記録セクション ── */}
                        {(() => {
                          const trialData = eventTrialRecords[recordDialog.id]?.[member.id] ?? { heights: [], trials: {} }
                          const { heights, trials } = trialData

                          const cycleMark = (heightCm: number, attemptIdx: number) => {
                            const marks = [...(trials[String(heightCm)] ?? [])]
                            while (marks.length <= attemptIdx) marks.push('')
                            const cur = marks[attemptIdx]
                            marks[attemptIdx] = cur === '' ? '○' : cur === '○' ? '✕' : cur === '✕' ? '-' : ''
                            updateTrialRecord(recordDialog.id, member.id, {
                              heights,
                              trials: { ...trials, [String(heightCm)]: marks },
                            })
                          }

                          const addHeight = () => {
                            const cm = parseInt(trialHeightInput, 10)
                            if (!cm || cm < 50 || cm > 700 || heights.includes(cm)) return
                            const newHeights = [...heights, cm].sort((a, b) => a - b)
                            updateTrialRecord(recordDialog.id, member.id, { heights: newHeights, trials })
                            setTrialHeightInput('')
                            setTrialAddingHeight(false)
                          }

                          const removeHeight = (heightCm: number) => {
                            const newHeights = heights.filter(h => h !== heightCm)
                            const newTrials = { ...trials }
                            delete newTrials[String(heightCm)]
                            updateTrialRecord(recordDialog.id, member.id, { heights: newHeights, trials: newTrials })
                          }

                          return (
                            <div className="border-t pt-4 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">試技記録表</p>

                              {heights.length > 0 && (
                                <>
                                  <div className="overflow-x-auto">
                                    <div className="inline-block">
                                      {/* ヘッダー行 */}
                                      <div className="flex items-end gap-1 mb-1">
                                        <div className="w-10 shrink-0" />
                                        {heights.map(h => (
                                          <div key={h} className="w-11 flex flex-col items-center gap-0.5 shrink-0">
                                            <span className="text-xs text-foreground whitespace-nowrap">{formatHeight(h)}</span>
                                            {trialEditMode && (
                                              <button
                                                onClick={() => removeHeight(h)}
                                                className="w-11 h-11 text-destructive flex items-center justify-center"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      {/* 試技行 */}
                                      {[0, 1, 2].map(i => (
                                        <div key={i} className="flex items-center gap-1 mb-1">
                                          <div className="w-10 shrink-0 text-xs text-muted-foreground whitespace-nowrap pr-1">
                                            {i + 1}回目
                                          </div>
                                          {heights.map(h => {
                                            const mark = (trials[String(h)] ?? [])[i] ?? ''
                                            return (
                                              <button
                                                key={h}
                                                onClick={() => cycleMark(h, i)}
                                                className={cn(
                                                  'w-11 h-11 rounded border text-base shrink-0 transition-colors',
                                                  mark === '○' ? 'border-green-400 bg-green-50 text-green-600' :
                                                  mark === '✕' ? 'border-red-400 bg-red-50 text-red-600' :
                                                  mark === '-' ? 'border-muted-foreground/40 bg-muted text-muted-foreground' :
                                                  'border-input bg-background'
                                                )}
                                              >
                                                {mark}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* 高さ追加UI */}
                              {trialAddingHeight ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={trialHeightInput}
                                    onChange={e => setTrialHeightInput(e.target.value)}
                                    placeholder="例：155"
                                    className="w-24 h-9 text-base font-mono"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && addHeight()}
                                  />
                                  <span className="text-sm text-muted-foreground shrink-0">cm</span>
                                  <Button size="sm" className="h-9 shrink-0" onClick={addHeight} disabled={!trialHeightInput}>
                                    追加
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 shrink-0"
                                    onClick={() => { setTrialAddingHeight(false); setTrialHeightInput('') }}
                                  >
                                    キャンセル
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-1.5 text-xs"
                                    onClick={() => { setTrialAddingHeight(true); setTrialEditMode(false) }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    バーの高さを追加
                                  </Button>
                                  {heights.length > 0 && (
                                    <Button
                                      variant={trialEditMode ? 'default' : 'outline'}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => setTrialEditMode(m => !m)}
                                    >
                                      {trialEditMode ? '完了' : '編集'}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {/* ── ポールセクション ── */}
                        <div className="border-t pt-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">この大会の使用ポール</p>
                          {assignedPoles.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-1">未登録</p>
                          ) : (
                            assignedPoles.map(pole => (
                              <div key={pole.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-background">
                                <span className="font-mono text-sm">{pole.size}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => togglePole(recordDialog.id, member.id, pole.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))
                          )}
                          {/* 動画機能は一旦延期。実装再開時は Video ボタンを追加する */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 text-xs"
                            onClick={() => setPoleListDialog({ member, eventId: recordDialog.id })}
                          >
                            <WandSparkles className="h-3.5 w-3.5" />
                            ポールを追加
                          </Button>
                        </div>

                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
          <div className="px-4 pb-4 pt-3 border-t shrink-0">
            <Button variant="outline" className="w-full" onClick={handleRecordDialogClose}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* 大会編集ダイアログ */}
      <Dialog open={editDialog !== null} onOpenChange={open => !open && setEditDialog(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">大会を編集</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">タイトル <span className="text-destructive">*</span></Label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">参加対象 <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {GRADE_CATEGORIES.map(cat => {
                  const selected = (editForm.targetGrades ?? []).includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditForm(f => ({
                        ...f,
                        targetGrades: selected
                          ? (f.targetGrades ?? []).filter(g => g !== cat)
                          : [...(f.targetGrades ?? []), cat]
                      }))}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors',
                        selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input'
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">開始日 <span className="text-destructive">*</span></Label>
                <DatePicker value={editForm.date} onChange={v => setEditForm(f => ({ ...f, date: v }))} placeholder="開始日" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">終了日</Label>
                <DatePicker value={editForm.endDate} onChange={v => setEditForm(f => ({ ...f, endDate: v }))} placeholder="終了日" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">場所</Label>
              <Input
                value={editForm.location}
                onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                placeholder="例：市立体育館"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">申し込み締め切り日</Label>
              <DatePicker value={editForm.entryDeadline ?? ''} onChange={v => setEditForm(f => ({ ...f, entryDeadline: v }))} placeholder="締め切り日" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ポール運搬担当者</Label>
              <Input
                value={editForm.poleCarrier ?? ''}
                onChange={e => setEditForm(f => ({ ...f, poleCarrier: e.target.value }))}
                placeholder="例：山田さん"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">メモ</Label>
              <Input
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="px-4 pb-4 pt-3 border-t shrink-0 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditDialog(null)}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={saveEditEvent}
              disabled={editSaving || !editForm.title || !editForm.date || (editForm.targetGrades ?? []).length === 0}
            >
              {editSaving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ポール割り当てダイアログ */}
      <Dialog
        open={poleDialog !== null}
        onOpenChange={open => { if (!open) { setPoleDialog(null); setExpandedMemberId(null); setExpandedPoleId(null); setExtraPoleInput('') } }}
      >
        <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">{poleDialog?.event.title}</DialogTitle>
            <div className="flex flex-wrap gap-2 items-center mt-1">
              <Badge variant="secondary" className="text-xs font-normal">
                {poleDialog && formatDate(poleDialog.event.date)}
                {poleDialog?.event.endDate && poleDialog.event.endDate !== poleDialog.event.date
                  ? ` 〜 ${formatDate(poleDialog.event.endDate)}`
                  : ''}
              </Badge>
              {poleDialog?.event.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {poleDialog.event.location}
                </span>
              )}
              {poleDialog?.event.entryDeadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <CalendarClock className="h-3 w-3" />
                  締切 {formatDate(poleDialog.event.entryDeadline)}
                </span>
              )}
              {poleDialog?.event.poleCarrier && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <User className="h-3 w-3" />
                  運搬 {poleDialog.event.poleCarrier}
                </span>
              )}
            </div>
          </DialogHeader>

          {/* 表示切り替えトグル */}
          <div className="px-4 mt-3">
            <div className="inline-flex rounded-md border overflow-hidden w-fit">
              <button
                onClick={() => { setPoleViewMode('member'); setExpandedMemberId(null); setExpandedPoleId(null) }}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                  poleViewMode === 'member' ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground hover:bg-muted/50'
                )}
              >
                クラブ生基準
              </button>
              <button
                onClick={() => { setPoleViewMode('pole'); setExpandedMemberId(null); setExpandedPoleId(null) }}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium whitespace-nowrap border-l transition-colors',
                  poleViewMode === 'pole' ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground hover:bg-muted/50'
                )}
              >
                ポール基準
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            {(() => {
              const eventId = poleDialog?.event.id ?? ''
              const allPoles = [...poles, ...(eventExtraPoles?.[eventId] ?? [])]
              return (
                <>
                  {poleViewMode === 'member' ? (
                    /* ── クラブ生軸ビュー ── */
                    (() => {
                      const targetMembers = filterMembersByTargetGrades(members, poleDialog?.event.targetGrades)
                      if (targetMembers.length === 0) return (
                        <p className="text-sm text-muted-foreground text-center py-4">対象メンバーがいません</p>
                      )
                      return (
                        <>
                          {targetMembers.map(member => {
                            const assignedIds = eventPoles[eventId]?.[member.id] ?? []
                            const assignedPoles = allPoles.filter(p => assignedIds.includes(p.id))
                            const isExpanded = expandedMemberId === member.id
                            const isAbsent = (eventAbsences?.[eventId] ?? []).includes(member.id)
                            return (
                              <div key={member.id} className="rounded-xl border overflow-hidden">
                                <button
                                  className="flex items-center gap-3 w-full text-left px-3 py-3"
                                  onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm">{member.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{gradeLabel(member.grade)}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap justify-end max-w-[55%]">
                                    {isAbsent ? (
                                      <Badge variant="secondary" className="text-xs">不参加</Badge>
                                    ) : assignedPoles.length === 0 ? (
                                      <span className="text-xs text-muted-foreground">未選択</span>
                                    ) : (
                                      assignedPoles.map(p => (
                                        <Badge key={p.id} variant="secondary" className="font-mono text-xs">{p.size}</Badge>
                                      ))
                                    )}
                                  </div>
                                </button>
                                {isExpanded && (
                                  <div className="border-t px-3 py-3 space-y-1.5 bg-muted/20">
                                    <p className="text-xs text-muted-foreground mb-2">使用するポールをタップして選択（複数可）</p>
                                    {/* 不参加チェック */}
                                    <button
                                      onClick={() => {
                                        toggleAbsence(eventId, member.id)
                                        if (!isAbsent) setExpandedMemberId(null)
                                      }}
                                      className={cn(
                                        'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                                        isAbsent ? 'border-gray-400 bg-gray-100' : 'bg-background'
                                      )}
                                    >
                                      <div className={cn(
                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                        isAbsent ? 'bg-gray-400 border-gray-400' : 'border-muted-foreground/40'
                                      )}>
                                        {isAbsent && <Check className="h-3 w-3 text-white" />}
                                      </div>
                                      <span className="text-sm font-medium">不参加</span>
                                    </button>
                                    {/* ポールリスト（不参加時は非表示） */}
                                    {!isAbsent && allPoles.map(pole => {
                                      const selected = assignedIds.includes(pole.id)
                                      const isExtra = (eventExtraPoles?.[eventId] ?? []).some(p => p.id === pole.id)
                                      return (
                                        <button
                                          key={pole.id}
                                          onClick={() => togglePole(eventId, member.id, pole.id)}
                                          className={cn(
                                            'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                                            selected ? 'border-orange-300 bg-orange-50' : 'bg-background'
                                          )}
                                        >
                                          <div className={cn(
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                            selected ? 'bg-orange-400 border-orange-400' : 'border-muted-foreground/40'
                                          )}>
                                            {selected && <Check className="h-3 w-3 text-white" />}
                                          </div>
                                          <span className="font-mono text-sm font-medium">{pole.size}</span>
                                          {isExtra && (
                                            <span className="text-xs text-muted-foreground ml-auto">管理外</span>
                                          )}
                                        </button>
                                      )
                                    })}
                                    {/* クラブ管理外ポールの追加（不参加時は非表示） */}
                                    {!isAbsent && (
                                      <div className="pt-2 mt-1 border-t border-dashed">
                                        <p className="text-xs text-muted-foreground mb-1.5">クラブ管理以外のポールを設定</p>
                                        <div className="flex gap-2">
                                          <Input
                                            value={expandedMemberId === member.id ? extraPoleInput : ''}
                                            onChange={e => setExtraPoleInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') addExtraPole(eventId, member.id, extraPoleInput) }}
                                            placeholder="例: 11.2-80"
                                            className="text-base flex-1 h-9"
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0 h-9"
                                            onClick={() => addExtraPole(eventId, member.id, extraPoleInput)}
                                            disabled={!extraPoleInput.trim()}
                                          >
                                            追加
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </>
                      )
                    })()
                  ) : (
                    /* ── ポール軸ビュー ── */
                    allPoles.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">登録されているポールがありません</p>
                    ) : allPoles.map(pole => {
                      const poleTargetMembers = filterMembersByTargetGrades(members, poleDialog?.event.targetGrades)
                        .filter(m => !(eventAbsences?.[eventId] ?? []).includes(m.id))
                      const assignedMembers = poleTargetMembers.filter(m =>
                        (eventPoles[eventId]?.[m.id] ?? []).includes(pole.id)
                      )
                      const isExpanded = expandedPoleId === pole.id
                      const isExtra = (eventExtraPoles?.[eventId] ?? []).some(p => p.id === pole.id)

                      return (
                        <div key={pole.id} className="rounded-xl border overflow-hidden">
                          <div className="flex items-center">
                            <button
                              className="flex items-center gap-3 flex-1 text-left px-3 py-3"
                              onClick={() => setExpandedPoleId(isExpanded ? null : pole.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-mono font-medium text-sm">{pole.size}</span>
                                {isExtra && (
                                  <span className="text-xs text-muted-foreground ml-2">この大会のみ</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-wrap justify-end max-w-[55%]">
                                {assignedMembers.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">未割当</span>
                                ) : (
                                  assignedMembers.map(m => (
                                    <Badge key={m.id} variant="secondary" className="text-xs">{m.name}</Badge>
                                  ))
                                )}
                              </div>
                            </button>
                            {isExtra && (
                              <button
                                className="pr-3 pl-1 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => removeExtraPole(eventId, pole.id)}
                                aria-label="このポールを削除"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="border-t px-3 py-3 space-y-1.5 bg-muted/20">
                              <p className="text-xs text-muted-foreground mb-2">使用するクラブ生をタップして選択（複数可）</p>
                              {poleTargetMembers.map(member => {
                                const selected = (eventPoles[eventId]?.[member.id] ?? []).includes(pole.id)
                                return (
                                  <button
                                    key={member.id}
                                    onClick={() => togglePole(eventId, member.id, pole.id)}
                                    className={cn(
                                      'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                                      selected ? 'border-orange-300 bg-orange-50' : 'bg-background'
                                    )}
                                  >
                                    <div className={cn(
                                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                      selected ? 'bg-orange-400 border-orange-400' : 'border-muted-foreground/40'
                                    )}>
                                      {selected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">{member.name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">{gradeLabel(member.grade)}</span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                </>
              )
            })()}
          </div>

          <div className="px-4 pb-4 pt-3 border-t shrink-0">
            <Button className="w-full" onClick={() => { setPoleDialog(null); setExpandedMemberId(null); setExpandedPoleId(null); setExtraPoleInput('') }}>
              保存する
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ▼▼▼ 動画ダイアログ ▼▼▼ */}
<Dialog open={videoDialog !== null} onOpenChange={open => !open && setVideoDialog(null)}>
  <DialogContent className="pointer-events-auto max-h-[85vh] overflow-y-auto"
  onPointerDown={(e) => e.stopPropagation()}>

    <DialogHeader>
      <DialogTitle>
        {videoDialog?.name} の動画
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">

      {/* 未登録 */}
      {videoDialog && (videos[videoDialog.id]?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">
          動画がまだ登録されていません
        </p>
      )}

      {/* 動画一覧 */}
      {videoDialog && (videos[videoDialog.id] || []).map((url, i) => (
        <div key={i} className="space-y-2">
          <div
  className="aspect-video"
  onClick={(e) => {
    e.stopPropagation()
  }}
  onMouseDown={(e) => {
    e.stopPropagation()
  }}
  onTouchStart={(e) => {
    e.stopPropagation()
  }}
>
<iframe
  src={url}
  className="w-full h-full rounded-lg"
  style={{ pointerEvents: 'auto' }}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
</div>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => removeVideo(videoDialog.id, i)}
          >
            削除
          </Button>
        </div>
      ))}

      {/* 追加UI */}
      <div className="space-y-2 pt-3 border-t">
        <p className="text-xs text-muted-foreground">動画を追加</p>
        <div className="flex gap-2">
          <Input
            placeholder="YouTubeのURLを貼る"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          {/* 動画機能は一旦延期。実装再開時はdisabledとコメントを外す */}
          <Button
            variant="default"
            size="default"
            disabled
            // onClick={addVideo}
            >
            追加
          </Button>
        </div>
      </div>

    </div>
  </DialogContent>
</Dialog>
{/* ▲▲▲ 動画ダイアログ ▲▲▲ */}

      {/* ▼▼▼ ポール一覧ダイアログ ▼▼▼ */}
      <Dialog open={poleListDialog !== null} onOpenChange={open => { if (!open) { setPoleListDialog(null); setExtraPoleInput('') } }}>
        <DialogContent className="pointer-events-auto max-h-[85vh] flex flex-col" onPointerDown={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              本大会での{poleListDialog?.member.name} の使用ポール
            </DialogTitle>
          </DialogHeader>
          {(() => {
            if (!poleListDialog) return null
            const { member, eventId } = poleListDialog
            const assignedIds = eventPoles[eventId]?.[member.id] ?? []
            const allPoles = [...poles, ...(eventExtraPoles?.[eventId] ?? [])]
            return (
              <div className="flex flex-col gap-3 overflow-y-auto">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">使用するポールをタップして選択（複数可）</p>
                  {allPoles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">登録されているポールがありません</p>
                  ) : allPoles.map(pole => {
                    const selected = assignedIds.includes(pole.id)
                    const isExtra = (eventExtraPoles?.[eventId] ?? []).some(p => p.id === pole.id)
                    return (
                      <button
                        key={pole.id}
                        onClick={() => togglePole(eventId, member.id, pole.id)}
                        className={cn(
                          'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                          selected ? 'border-orange-300 bg-orange-50' : 'bg-background'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          selected ? 'bg-orange-400 border-orange-400' : 'border-muted-foreground/40'
                        )}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-mono text-sm font-medium">{pole.size}</span>
                        {isExtra && (
                          <span className="text-xs text-muted-foreground ml-auto">管理外</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="border-t border-dashed pt-3">
                  <p className="text-xs text-muted-foreground mb-1.5">クラブ管理以外のポールを設定</p>
                  <div className="flex gap-2">
                    <Input
                      value={extraPoleInput}
                      onChange={e => setExtraPoleInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addExtraPole(eventId, member.id, extraPoleInput) }}
                      placeholder="例: 11.2-80"
                      className="text-base flex-1 h-9"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-9"
                      onClick={() => addExtraPole(eventId, member.id, extraPoleInput)}
                      disabled={!extraPoleInput.trim()}
                    >
                      追加
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
      {/* ▲▲▲ ポール一覧ダイアログ ▲▲▲ */}
    </div>
  )
}
