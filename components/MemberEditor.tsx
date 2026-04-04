'use client'

import { useState, useEffect } from 'react'
import { Member } from '@/lib/data'
import { GRADE_OPTIONS, gradeLabel, currentSchoolYear } from '@/lib/grade'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Trash2, UserPlus, Copy } from 'lucide-react'

function getSelectableYears(): number[] {
  const cur = currentSchoolYear()
  return [cur - 2, cur - 1, cur, cur + 1, cur + 2]
}

export default function MemberEditor() {
  const [year, setYear] = useState(currentSchoolYear())
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('7')
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [copying, setCopying] = useState(false)
  const [copyError, setCopyError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/members?year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data)
        setLoading(false)
      })
  }, [year])

  const add = async () => {
    if (!name.trim()) return
    setSaving(true)
    setAddError('')
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), grade: Number(grade), year }),
      })
      if (res.ok) {
        const m: Member = await res.json()
        setMembers((prev) => [...prev, m])
        setName('')
      } else {
        const data = await res.json().catch(() => ({}))
        setAddError(data.error ?? `エラーが発生しました（${res.status}）`)
      }
    } catch {
      setAddError('通信エラーが発生しました')
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    const res = await fetch('/api/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, year }),
    })
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const copyFromPrev = async () => {
    setCopyError('')
    setCopying(true)
    const res = await fetch('/api/members/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromYear: year - 1, toYear: year }),
    })
    const data = await res.json()
    if (res.ok) {
      setMembers(data)
    } else {
      setCopyError(data.error ?? 'コピーに失敗しました')
    }
    setCopying(false)
  }

  return (
    <div className="space-y-3">
      {/* 年度セレクター */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">年度</span>
        <Select
          value={String(year)}
          onValueChange={(v) => {
            if (v !== null) {
              setYear(Number(v))
              setCopyError('')
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getSelectableYears().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}年度（{y}/4〜{y + 1}/3）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-2">読み込み中...</p>
      ) : (
        <>
          {/* 部員一覧 */}
          {members.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">{year}年度の部員データがありません</p>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline" size="sm" disabled={copying} />
                  }
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  {year - 1}年度からコピー
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>前年度からコピーしますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      {year - 1}年度の部員データをコピーし、学年を1つ上げて{year}年度として登録します。
                      コピー後に不要なメンバーを削除できます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={copyFromPrev}>コピーする</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {copyError && <p className="text-sm text-destructive">{copyError}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="py-2.5 px-4 flex items-center justify-between">
                    <span className="font-medium">
                      {m.name}
                      <Badge variant="outline" className="ml-1.5 text-xs font-normal py-0">
                        {gradeLabel(m.grade)}
                      </Badge>
                    </span>
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
                          <AlertDialogTitle>部員を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{m.name}」を{year}年度の部員から削除します。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove(m.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 追加フォーム */}
          <Card className="border-dashed">
            <CardContent className="py-3 px-4 flex items-center gap-2">
              <Input
                placeholder="氏名を入力"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Select value={grade} onValueChange={(v) => v !== null && setGrade(v)}>
                <SelectTrigger className="w-20">
                  <SelectValue>{gradeLabel(Number(grade))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={add} disabled={saving || !name.trim()} size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </CardContent>
          </Card>
          {addError && <p className="text-sm text-destructive">{addError}</p>}
        </>
      )}
    </div>
  )
}
