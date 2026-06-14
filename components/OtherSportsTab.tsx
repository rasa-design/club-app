'use client'

import { useState, useEffect } from 'react'
import type { OtherSportCategory, OtherSportRecord, OtherSportRecords } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
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
import { Plus, Trash2 } from 'lucide-react'

type Props = {
  memberId: string
}

const CATEGORY_LABELS: Record<OtherSportCategory, string> = {
  track: 'トラック',
  field: 'フィールド',
}

const VALUE_LABEL: Record<OtherSportCategory, string> = {
  track: 'タイム（例: 12秒34）',
  field: '距離・高さ（例: 8m45cm）',
}

type FormState = {
  category: OtherSportCategory
  eventName: string
  value: string
  date: string
}

const emptyForm = (): FormState => ({
  category: 'track',
  eventName: '',
  value: '',
  date: new Date().toISOString().slice(0, 10),
})

export default function OtherSportsTab({ memberId }: Props) {
  const [records, setRecords] = useState<OtherSportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/other-sport-records')
      .then(r => r.json() as Promise<OtherSportRecords>)
      .then(data => {
        setRecords(data[memberId] ?? [])
        setLoading(false)
      })
  }, [memberId])

  async function handleSave() {
    if (!form.eventName.trim() || !form.value.trim()) return
    setSaving(true)
    const record: OtherSportRecord = {
      id: crypto.randomUUID(),
      category: form.category,
      eventName: form.eventName.trim(),
      value: form.value.trim(),
      date: form.date,
    }
    await fetch('/api/other-sport-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, record }),
    })
    setRecords(prev => [...prev, record])
    setForm(emptyForm())
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(recordId: string) {
    await fetch('/api/other-sport-records', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, recordId }),
    })
    setRecords(prev => prev.filter(r => r.id !== recordId))
  }

  if (loading) return <p className="text-sm text-muted-foreground text-center py-6">読み込み中…</p>

  return (
    <div className="py-2">
      {/* 記録一覧 */}
      {records.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">記録がまだありません</p>
      )}
      {records.length > 0 && (
        <div className="space-y-2 mb-3">
          {[...records].reverse().map(record => (
            <div key={record.id} className="rounded-lg border px-4 py-3">
              {/* 1行目: バッジ + 競技名 + 削除 */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  {CATEGORY_LABELS[record.category]}
                </span>
                <span className="text-sm font-medium flex-1 truncate">{record.eventName}</span>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<button className="shrink-0 text-muted-foreground active:text-destructive p-1 -mr-1" />}
                  >
                    <Trash2 className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>記録を削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>
                        {record.eventName}（{record.value}）を削除します。この操作は取り消せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(record.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        削除する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {/* 2行目: 記録値 + 日付 */}
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-base font-mono font-medium">{record.value}</span>
                <span className="text-xs text-muted-foreground">
                  {record.date.replace(/-/g, '/').replace(/\/0(\d)/g, '/$1')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新規登録フォーム */}
      {showForm ? (
        <div className="border rounded-lg p-4 space-y-3">
          {/* トラック / フィールド 選択 */}
          <div className="flex gap-2">
            {(['track', 'field'] as OtherSportCategory[]).map(cat => (
              <button
                key={cat}
                className={[
                  'flex-1 py-2 rounded-md text-sm font-medium border transition-colors',
                  form.category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border',
                ].join(' ')}
                onClick={() => setForm(prev => ({ ...prev, category: cat }))}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* 競技名 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">競技名</label>
            <Input
              className="text-base"
              placeholder={form.category === 'track' ? '例: 100m、リレー' : '例: 砲丸投げ、走り高跳び'}
              value={form.eventName}
              onChange={e => setForm(prev => ({ ...prev, eventName: e.target.value }))}
            />
          </div>

          {/* タイム / 距離・高さ */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {form.category === 'track' ? 'タイム' : '距離・高さ'}
            </label>
            <Input
              className="text-base font-mono"
              placeholder={VALUE_LABEL[form.category]}
              value={form.value}
              onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
            />
          </div>

          {/* 記録日 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">記録日</label>
            <DatePicker
              value={form.date}
              onChange={date => setForm(prev => ({ ...prev, date }))}
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setShowForm(false); setForm(emptyForm()) }}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={!form.eventName.trim() || !form.value.trim() || saving}
              onClick={handleSave}
            >
              {saving ? '保存中…' : '登録'}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          新規登録
        </Button>
      )}
    </div>
  )
}
