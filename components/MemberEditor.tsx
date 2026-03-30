'use client'

import { useState } from 'react'
import { Member } from '@/lib/data'

export default function MemberEditor({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(1)
  const [saving, setSaving] = useState(false)

  const add = async () => {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), grade }),
    })
    if (res.ok) {
      const m: Member = await res.json()
      setMembers((prev) => [...prev, m])
      setName('')
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('削除しますか？')) return
    const res = await fetch('/api/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div key={m.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-800">{m.name} <span className="text-gray-400 text-xs">{m.grade}年</span></span>
          <button onClick={() => remove(m.id)} className="text-xs text-red-500 hover:underline">削除</button>
        </div>
      ))}
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="氏名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
        >
          <option value={1}>1年</option>
          <option value={2}>2年</option>
          <option value={3}>3年</option>
        </select>
        <button
          onClick={add}
          disabled={saving || !name.trim()}
          className="bg-blue-600 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
        >
          追加
        </button>
      </div>
    </div>
  )
}
