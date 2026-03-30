'use client'

import { useState } from 'react'
import { Event } from '@/lib/data'

const emptyEvent = (): Omit<Event, 'id'> => ({
  title: '',
  date: '',
  endDate: '',
  location: '',
  description: '',
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]})`
}

export default function AdminCalendarEditor({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents.sort((a, b) => a.date.localeCompare(b.date)))
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyEvent())
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
        setEvents((prev) => prev.map((e) => (e.id === editId ? updated : e)).sort((a, b) => a.date.localeCompare(b.date)))
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
        setEvents((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
        setAdding(false)
      }
    }
    setForm(emptyEvent())
    setSaving(false)
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('削除しますか？')) return
    const res = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const startEdit = (e: Event) => {
    setEditId(e.id)
    setForm({ title: e.title, date: e.date, endDate: e.endDate, location: e.location, description: e.description })
    setAdding(false)
  }

  const cancelForm = () => {
    setAdding(false)
    setEditId(null)
    setForm(emptyEvent())
  }

  const showForm = adding || editId !== null

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
          {editId === e.id ? (
            <EventForm form={form} setForm={setForm} onSave={saveEvent} onCancel={cancelForm} saving={saving} />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-gray-800">{e.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatDate(e.date)}{e.endDate && e.endDate !== e.date ? ` 〜 ${formatDate(e.endDate)}` : ''}
                  {e.location ? ` ／ ${e.location}` : ''}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(e)} className="text-xs text-blue-600 hover:underline px-2 py-1">編集</button>
                <button onClick={() => deleteEvent(e.id)} className="text-xs text-red-500 hover:underline px-2 py-1">削除</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && !editId && (
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <EventForm form={form} setForm={setForm} onSave={saveEvent} onCancel={cancelForm} saving={saving} />
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          ＋ 行事を追加
        </button>
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
  const field = (key: keyof Omit<Event, 'id'>, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}{required && ' *'}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </div>
  )
  return (
    <div className="space-y-2">
      {field('title', 'タイトル', 'text', true)}
      <div className="grid grid-cols-2 gap-2">
        {field('date', '開始日', 'date', true)}
        {field('endDate', '終了日', 'date')}
      </div>
      {field('location', '場所')}
      {field('description', 'メモ')}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="bg-blue-600 text-white text-sm rounded-lg px-4 py-1.5 hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
        <button onClick={onCancel} className="text-sm text-gray-500 px-3 py-1.5 hover:text-gray-700">キャンセル</button>
      </div>
    </div>
  )
}
