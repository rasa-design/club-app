'use client'

import { useState } from 'react'
import { Pole } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Trash2, Plus } from 'lucide-react'

function parseSize(size: string): { length: number; weight: number } {
  const [l, w] = size.split('-').map(Number)
  return { length: l ?? 0, weight: w ?? 0 }
}

function sortPoles(poles: Pole[]): Pole[] {
  return [...poles].sort((a, b) => {
    const pa = parseSize(a.size)
    const pb = parseSize(b.size)
    if (pa.length !== pb.length) return pa.length - pb.length
    return pa.weight - pb.weight
  })
}

function groupPoles(poles: Pole[]): { size: string; poles: Pole[] }[] {
  const map = new Map<string, Pole[]>()
  for (const pole of sortPoles(poles)) {
    const arr = map.get(pole.size) ?? []
    arr.push(pole)
    map.set(pole.size, arr)
  }
  return Array.from(map.entries()).map(([size, poles]) => ({ size, poles }))
}

export default function PoleEditor({ initialPoles }: { initialPoles: Pole[] }) {
  const [poles, setPoles] = useState<Pole[]>(initialPoles)
  const [size, setSize] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const groups = groupPoles(poles)

  const add = async () => {
    if (!size.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/poles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size }),
      })
      if (res.ok) {
        const pole: Pole = await res.json()
        setPoles(prev => [...prev, pole])
        setSize('')
        setAdding(false)
      } else {
        setError('追加に失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    }
    setSaving(false)
  }

  const remove = (id: string) => {
    setPoles(prev => prev.filter(p => p.id !== id))
    fetch('/api/poles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          計 <span className="font-semibold text-foreground">{poles.length}</span> 本
          （<span className="font-semibold text-foreground">{groups.length}</span> サイズ）
        </p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            追加
          </Button>
        )}
      </div>

      {/* 追加フォーム */}
      {adding && (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-medium">ポールを追加</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">サイズ（例：11.2-80）</p>
            <Input
              value={size}
              onChange={e => setSize(e.target.value)}
              placeholder="11.2-80"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => { setAdding(false); setSize(''); setError('') }}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={add}
              disabled={saving || !size.trim()}
            >
              {saving ? '追加中...' : '追加する'}
            </Button>
          </div>
        </div>
      )}

      {/* サイズ別一覧 */}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">ポールが登録されていません</p>
      ) : (
        <div className="space-y-2">
          {groups.map(({ size: groupSize, poles: groupPoles }) => (
            <div key={groupSize} className="rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                <span className="font-mono font-semibold text-base tracking-wide">{groupSize}</span>
                <Badge variant="secondary" className="text-xs">{groupPoles.length}本</Badge>
              </div>
              <div className="divide-y">
                {groupPoles.map((pole, i) => (
                  <div key={pole.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">#{i + 1}</span>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          />
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            ポール「{pole.size}」（#{i + 1}）を削除します。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove(pole.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
