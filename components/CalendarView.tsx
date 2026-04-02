'use client'

import { useState } from 'react'
import { Event } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react'

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]})`
}

function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getFullYear() === year && d.getMonth() === month
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

type AddForm = {
  title: string
  date: string
  endDate: string
  location: string
  description: string
}

export default function CalendarView({ events: initialEvents }: { events: Event[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<Event[]>(initialEvents)

  // ダイアログ
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddForm>({ title: '', date: '', endDate: '', location: '', description: '' })
  const [saving, setSaving] = useState(false)

  const monthEvents = events
    .filter((e) => isSameMonth(e.date, year, month))
    .sort((a, b) => a.date.localeCompare(b.date))

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstDay.getDay()

  const eventDays = new Set(
    events.filter((e) => isSameMonth(e.date, year, month)).map((e) => Number(e.date.split('-')[2]))
  )
  const todayDay =
    today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const openAddDialog = (day: number) => {
    const dateStr = toDateStr(year, month, day)
    setForm({ title: '', date: dateStr, endDate: dateStr, location: '', description: '' })
    setOpen(true)
  }

  const handleAdd = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const created: Event = await res.json()
      setEvents((prev) => [...prev, created])
      setOpen(false)
    }
    setSaving(false)
  }

  const update = (key: keyof AddForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const setField = (key: keyof AddForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="space-y-4">
      {/* 月ナビゲーション */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-base">{year}年 {month + 1}月</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* カレンダーグリッド */}
          <div className="mt-3">
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-xs font-medium py-1 ${
                    i === 0 ? 'text-destructive' : i === 6 ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => (
                <div key={i} className="aspect-square flex flex-col items-center justify-center relative">
                  {day !== null && (
                    <>
                      <button
                        onClick={() => openAddDialog(day)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors hover:bg-muted active:scale-95
                          ${day === todayDay ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : ''}
                          ${i % 7 === 0 && day !== todayDay ? 'text-destructive' : ''}
                          ${i % 7 === 6 && day !== todayDay ? 'text-primary' : ''}
                        `}
                      >
                        {day}
                      </button>
                      {eventDays.has(day) && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            日付をタップして予定を追加できます
          </p>
        </CardContent>
      </Card>

      {/* 行事一覧 */}
      <div className="space-y-2">
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">この月の予定はありません</p>
        ) : (
          monthEvents.map((e) => (
            <Card key={e.id} className="border-l-4 border-l-orange-400">
              <CardContent className="py-3 px-4">
                <div className="space-y-1">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
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

      {/* 予定追加ダイアログ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              予定を追加
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>タイトル <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={update('title')}
                placeholder="例：春季地区大会"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>開始日</Label>
                <DatePicker value={form.date} onChange={setField('date')} placeholder="開始日" />
              </div>
              <div className="space-y-1">
                <Label>終了日</Label>
                <DatePicker value={form.endDate} onChange={setField('endDate')} placeholder="終了日" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>場所</Label>
              <Input value={form.location} onChange={update('location')} placeholder="例：市立体育館" />
            </div>
            <div className="space-y-1">
              <Label>メモ</Label>
              <Input value={form.description} onChange={update('description')} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !form.title}
            >
              {saving ? '追加中...' : '追加する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
