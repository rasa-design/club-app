'use client'

import { useState, useEffect } from 'react'
import { PracticeSlot, Practices } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

function toYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay()
}

export default function PracticeEditor({ initialPractices }: { initialPractices: Practices }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [practices, setPractices] = useState<Practices>(initialPractices)
  const [dialogDate, setDialogDate] = useState<string | null>(null)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('12:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)

  const openDialog = (date: string) => {
    const dow = new Date(date + 'T00:00:00').getDay()
    const isTueThu = dow === 2 || dow === 4
    setDialogDate(date)
    setStart(isTueThu ? '16:00' : '08:30')
    setEnd(isTueThu ? '18:00' : '11:30')
    setError('')
  }

  const addSlot = async () => {
    if (!dialogDate) return
    if (start >= end) {
      setError('終了時刻は開始時刻より後にしてください')
      return
    }
    setSaving(true)
    const res = await fetch('/api/practices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dialogDate, start, end }),
    })
    if (res.ok) {
      const slot: PracticeSlot = await res.json()
      setPractices(prev => ({
        ...prev,
        [dialogDate]: [...(prev[dialogDate] ?? []), slot],
      }))
      setDialogDate(null)
    }
    setSaving(false)
  }

  const deleteSlot = async (date: string, id: string) => {
    const res = await fetch('/api/practices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, id }),
    })
    if (res.ok) {
      setPractices(prev => {
        const next = { ...prev }
        next[date] = (next[date] ?? []).filter(s => s.id !== id)
        if (next[date].length === 0) delete next[date]
        return next
      })
    }
  }

  return (
    <div className="space-y-3">
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

      {/* 日一覧 */}
      <div className="space-y-1">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const date = toDateStr(year, month, day)
          const dow = getDayOfWeek(year, month, day)
          const slots = practices[date] ?? []
          const isToday = date === toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())

          return (
            <div
              key={day}
              className={cn(
                'rounded-lg border px-3 py-2',
                slots.length > 0 ? 'border-[#4CAF82]/40 bg-[#4CAF82]/5' : 'bg-card',
                isToday && 'ring-1 ring-primary'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-sm font-medium w-14 shrink-0',
                  dow === 0 && 'text-destructive',
                  dow === 6 && 'text-primary',
                )}>
                  {month}/{day}（{DAYS_JA[dow]}）
                </span>

                <div className="flex-1 flex flex-wrap gap-1 mx-2">
                  {slots.map(slot => (
                    <div key={slot.id} className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {slot.start}〜{slot.end}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <button className="text-muted-foreground/50 hover:text-destructive transition-colors" />
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>練習を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {month}/{day} {slot.start}〜{slot.end} の練習を削除します。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSlot(date, slot.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              削除する
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openDialog(date)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 追加ダイアログ */}
      <Dialog open={dialogDate !== null} onOpenChange={open => !open && setDialogDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogDate
                ? `${parseInt(dialogDate.split('-')[1])}/${parseInt(dialogDate.split('-')[2])} 練習を追加`
                : '練習を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start">開始時刻</Label>
                <Input
                  id="start"
                  type="time"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">終了時刻</Label>
                <Input
                  id="end"
                  type="time"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={addSlot} disabled={saving} className="w-full">
              {saving ? '登録中...' : '登録する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
