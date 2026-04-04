'use client'

import { useState } from 'react'
import { Practices, Attendance, Member, AttendanceRecord, Event, EventAttendance } from '@/lib/data'
import { gradeLabel } from '@/lib/grade'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronLeft, ChevronRight, Clock, Check, MapPin, Plus, Trash2 } from 'lucide-react'
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
type TabMode = 'practice' | 'event'

type AddForm = { title: string; date: string; endDate: string; location: string; description: string }

export default function UnifiedCalendar({
  initialPractices,
  initialAttendance,
  events: initialEvents,
  initialEventAttendance,
  members,
  isAdmin,
}: {
  initialPractices: Practices
  initialAttendance: Attendance
  events: Event[]
  initialEventAttendance: EventAttendance
  members: Member[]
  isAdmin: boolean
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [practices] = useState<Practices>(initialPractices)
  const [attendance, setAttendance] = useState<Attendance>(initialAttendance)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [eventAttendance, setEventAttendance] = useState<EventAttendance>(initialEventAttendance)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [practiceState, setPracticeState] = useState<PracticeState>({})
  const [saving, setSaving] = useState(false)
  const [tabMode, setTabMode] = useState<TabMode>('practice')
  const [addForm, setAddForm] = useState<AddForm | null>(null)
  const [addSaving, setAddSaving] = useState(false)

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
    const hasPractice = slots.length > 0
    const dayEvents = getEventsOnDate(events, date)
    const hasEvent = dayEvents.length > 0

    // 一般ユーザーは練習日か大会のある日のみタップ可能
    if (!isAdmin && !hasPractice && !hasEvent) return

    if (hasPractice) {
      const defaultStart = slots[0]?.start ?? '09:00'
      const defaultEnd = slots[0]?.end ?? '12:00'
      const state: PracticeState = {}
      for (const member of members) {
        const existing = attendance[date]?.[member.id]
        state[member.id] = existing
          ? { attended: true, start: existing.start, end: existing.end }
          : { attended: true, start: defaultStart, end: defaultEnd }
      }
      setPracticeState(state)
    }

    setAddForm(null)
    setTabMode(hasPractice ? 'practice' : 'event')
    setSelectedDate(date)
  }

  const toggleMember = (memberId: string) => {
    setPracticeState(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], attended: !prev[memberId].attended },
    }))
  }

  const updateTime = (memberId: string, field: 'start' | 'end', value: string) => {
    setPracticeState(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }))
  }

  const savePractice = async () => {
    if (!selectedDate) return
    setSaving(true)
    const existing = attendance[selectedDate] ?? {}
    const promises: Promise<unknown>[] = []

    for (const member of members) {
      const state = practiceState[member.id]
      const hadAttendance = !!existing[member.id]
      if (state.attended) {
        promises.push(
          fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, memberId: member.id, start: state.start, end: state.end }),
          })
        )
      } else if (!state.attended && hadAttendance) {
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

    setAttendance(prev => {
      const next = { ...prev }
      const dateRecord: Record<string, AttendanceRecord> = {}
      for (const member of members) {
        const state = practiceState[member.id]
        if (state.attended) dateRecord[member.id] = { start: state.start, end: state.end }
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

  const toggleEventMember = async (eventId: string, memberId: string) => {
    setEventAttendance(prev => {
      const current = prev[eventId] ?? []
      const next = current.includes(memberId)
        ? current.filter(id => id !== memberId)
        : [...current, memberId]
      return { ...prev, [eventId]: next }
    })
    await fetch('/api/event-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, memberId }),
    })
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

  const hasPracticeTab = selectedSlots.length > 0
  const hasEventTab = selectedEvents.length > 0 || isAdmin
  const hasBothTabs = hasPracticeTab && hasEventTab

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
          const attendCount = Object.keys(attendance[date] ?? {}).length
          const tappable = hasPractice || hasEvent || isAdmin

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
              {hasPractice && attendCount > 0 && (
                <span className="text-[9px] text-[#3BBFAD] font-medium leading-none">
                  {attendCount}人
                </span>
              )}
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
          大会・行事
        </span>
      </div>

      {/* ダイアログ */}
      <Dialog open={selectedDate !== null} onOpenChange={open => { if (!open) { setSelectedDate(null); setAddForm(null) } }}>
        <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">
              {selectedDate && `${sm}/${sd}（${DAYS_JA[selectedDow]}）`}
            </DialogTitle>

            {/* 練習/大会タブ */}
            {hasBothTabs && (
              <div className="flex rounded-md border overflow-hidden w-fit mt-2">
                <button
                  onClick={() => { setTabMode('practice'); setAddForm(null) }}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium transition-colors',
                    tabMode === 'practice' ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground'
                  )}
                >
                  練習
                </button>
                <button
                  onClick={() => setTabMode('event')}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium border-l transition-colors',
                    tabMode === 'event' ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground'
                  )}
                >
                  大会・行事
                </button>
              </div>
            )}

            {tabMode === 'practice' && selectedSlots.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedSlots.map(slot => (
                  <span key={slot.id} className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {slot.start}〜{slot.end}
                  </span>
                ))}
              </div>
            )}
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            {/* 練習タブ */}
            {tabMode === 'practice' && members.map(member => {
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

            {/* 大会タブ */}
            {tabMode === 'event' && (
              <div className="space-y-4">
                {/* 既存イベント一覧 */}
                {selectedEvents.map(event => {
                  const attendingIds = eventAttendance[event.id] ?? []
                  return (
                    <div key={event.id} className="space-y-2">
                      <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm">{event.title}</p>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                  />
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    「{event.title}」を削除します。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteEvent(event.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    削除する
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
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
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                      </div>

                      {members.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground px-1">参加登録</p>
                          {members.map(member => {
                            const attending = attendingIds.includes(member.id)
                            return (
                              <button
                                key={member.id}
                                onClick={() => toggleEventMember(event.id, member.id)}
                                className={cn(
                                  'flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl border transition-colors',
                                  attending ? 'border-orange-300 bg-orange-50' : 'bg-card'
                                )}
                              >
                                <div className={cn(
                                  'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                  attending ? 'bg-orange-400 border-orange-400' : 'border-muted-foreground/40'
                                )}>
                                  {attending && <Check className="h-3.5 w-3.5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-sm">{member.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">{gradeLabel(member.grade)}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* 管理者：行事追加 */}
                {isAdmin && !addForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={startAddForm}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    行事を追加
                  </Button>
                )}

                {isAdmin && addForm && (
                  <div className="rounded-xl border p-4 space-y-3">
                    <p className="text-sm font-medium">行事を追加</p>
                    <div className="space-y-1">
                      <Label className="text-xs">タイトル <span className="text-destructive">*</span></Label>
                      <Input
                        value={addForm.title}
                        onChange={e => setAddForm(f => f ? { ...f, title: e.target.value } : f)}
                        placeholder="例：春季地区大会"
                        autoFocus
                      />
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
                      <Label className="text-xs">メモ</Label>
                      <Input
                        value={addForm.description}
                        onChange={e => setAddForm(f => f ? { ...f, description: e.target.value } : f)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setAddForm(null)}>
                        キャンセル
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={saveEvent}
                        disabled={addSaving || !addForm.title}
                      >
                        {addSaving ? '追加中...' : '追加する'}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEvents.length === 0 && !addForm && !isAdmin && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    この日の大会・行事はありません
                  </p>
                )}
              </div>
            )}

            {members.length === 0 && tabMode === 'practice' && (
              <p className="text-sm text-muted-foreground text-center py-4">
                登録されているメンバーがいません
              </p>
            )}
          </div>

          {/* フッターボタン */}
          {tabMode === 'practice' && (
            <div className="px-4 pb-4 pt-3 border-t shrink-0">
              <Button
                onClick={savePractice}
                disabled={saving}
                className="w-full bg-[#3BBFAD] hover:bg-[#3BBFAD]/90 text-white"
              >
                {saving ? '保存中...' : '保存する'}
              </Button>
            </div>
          )}

          {tabMode === 'event' && !addForm && (
            <div className="px-4 pb-4 pt-3 border-t shrink-0">
              <Button
                variant="outline"
                onClick={() => { setSelectedDate(null); setAddForm(null) }}
                className="w-full"
              >
                閉じる
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 大会・行事一覧 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">今月の大会・行事</h3>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">この月の予定はありません</p>
        ) : (
          monthEvents.map((e) => (
            <Card key={e.id} className="border-l-4 border-l-orange-400">
              <CardContent className="py-3 px-4">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{e.title}</div>
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
                  </div>
                  {e.description && (
                    <p className="text-xs text-muted-foreground">{e.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
