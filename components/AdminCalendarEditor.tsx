'use client'

import { useState, useRef, useEffect } from 'react'
import { Event } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
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
import { MapPin, Plus, Pencil, Trash2, User, CalendarClock } from 'lucide-react'

const emptyForm = (): Omit<Event, 'id'> => ({
  title: '',
  date: '',
  endDate: '',
  location: '',
  description: '',
  poleCarrier: '',
  entryDeadline: '',
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]})`
}

export default function AdminCalendarEditor({ events, setEvents }: { events: Event[]; setEvents: React.Dispatch<React.SetStateAction<Event[]>> }) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const addFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adding && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [adding])

  const saveEvent = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    if (editId) {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editId }),
      })
      if (res.ok) {
        const updated: Event = await res.json()
        setEvents((prev) =>
          prev.map((e) => (e.id === editId ? updated : e)).sort((a, b) => a.date.localeCompare(b.date))
        )
        setEditId(null)
      }
    } else {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const created: Event = await res.json()
        setEvents((prev) =>
          [...prev, created].sort((a, b) => a.date.localeCompare(b.date))
        )
        setAdding(false)
      }
    }
    setForm(emptyForm())
    setSaving(false)
  }

  const deleteEvent = async (id: string) => {
    const res = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const startEdit = (e: Event) => {
    setEditId(e.id)
    setForm({ title: e.title, date: e.date, endDate: e.endDate, location: e.location, description: e.description, poleCarrier: e.poleCarrier ?? '', entryDeadline: e.entryDeadline ?? '' })
    setAdding(false)
  }

  const cancelForm = () => {
    setAdding(false)
    setEditId(null)
    setForm(emptyForm())
  }

  return (
    <div className="space-y-2">
      {events.map((e) => (
        <Card key={e.id}>
          <CardContent className="py-3 px-4">
            {editId === e.id ? (
              <EventForm form={form} setForm={setForm} onSave={saveEvent} onCancel={cancelForm} saving={saving} />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold truncate">{e.title}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {formatDate(e.date)}
                      {e.endDate && e.endDate !== e.date ? ` 〜 ${formatDate(e.endDate)}` : ''}
                    </Badge>
                    {e.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {e.location}
                      </span>
                    )}
                    {e.entryDeadline && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <CalendarClock className="h-3 w-3" />
                        締切 {formatDate(e.entryDeadline)}
                      </span>
                    )}
                    {e.poleCarrier && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <User className="h-3 w-3" />
                        運搬 {e.poleCarrier}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" />
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>行事を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{e.title}」を削除します。この操作は取り消せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEvent(e.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {adding && (
        <Card className="border-primary/30" ref={addFormRef}>
          <CardContent className="py-3 px-4">
            <EventForm form={form} setForm={setForm} onSave={saveEvent} onCancel={cancelForm} saving={saving} />
          </CardContent>
        </Card>
      )}

      {!adding && editId === null && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => { setAdding(true); setForm(emptyForm()) }}
        >
          <Plus className="h-4 w-4 mr-1" />
          行事を追加
        </Button>
      )}
    </div>
  )
}

function EventForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: Omit<Event, 'id'>
  setForm: React.Dispatch<React.SetStateAction<Omit<Event, 'id'>>>
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const update = (key: keyof Omit<Event, 'id'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const setField = (key: keyof Omit<Event, 'id'>) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>タイトル <span className="text-destructive">*</span></Label>
        <Input value={form.title} onChange={update('title')} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>開始日 <span className="text-destructive">*</span></Label>
          <DatePicker inline value={form.date} onChange={setField('date')} placeholder="開始日" />
        </div>
        <div className="space-y-1">
          <Label>終了日</Label>
          <DatePicker inline value={form.endDate} onChange={setField('endDate')} placeholder="終了日" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>場所</Label>
        <Input value={form.location} onChange={update('location')} />
      </div>
      <div className="space-y-1">
        <Label>申し込み締め切り日</Label>
        <DatePicker inline value={form.entryDeadline ?? ''} onChange={setField('entryDeadline')} placeholder="締め切り日" />
      </div>
      <div className="space-y-1">
        <Label>ポール運搬担当者</Label>
        <Input value={form.poleCarrier ?? ''} onChange={update('poleCarrier')} placeholder="例：山田さん" />
      </div>
      <div className="space-y-1">
        <Label>メモ</Label>
        <Input value={form.description} onChange={update('description')} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={saving || !form.title || !form.date} className="flex-1">
          {saving ? '保存中...' : '保存'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          キャンセル
        </Button>
      </div>
    </div>
  )
}
