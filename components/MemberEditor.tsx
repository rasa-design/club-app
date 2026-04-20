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
import { Trash2, UserPlus, Copy, Pencil, Check, X } from 'lucide-react'

// ── インライン編集行 ────────────────────────────────────────────────────────

function MemberRow({
  member,
  year,
  onUpdated,
  onRemoved,
}: {
  member: Member
  year: number
  onUpdated: (m: Member) => void
  onRemoved: (id: string) => void
}) {
  const [editing, setEditing]     = useState(false)
  const [editName, setEditName]   = useState(member.name)
  const [editKana, setEditKana]   = useState(member.kana ?? '')
  const [editGrade, setEditGrade] = useState(String(member.grade))
  const [saving, setSaving]       = useState(false)

  const startEdit = () => {
    setEditName(member.name)
    setEditKana(member.kana ?? '')
    setEditGrade(String(member.grade))
    setEditing(true)
  }

  const cancel = () => setEditing(false)

  const save = async () => {
    if (!editName.trim()) return
    setSaving(true)
    const res = await fetch('/api/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: member.id,
        year,
        name:  editName.trim(),
        kana:  editKana.trim() || undefined,
        grade: Number(editGrade),
      }),
    })
    if (res.ok) {
      const updated: Member = await res.json()
      onUpdated(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="py-2.5 px-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="氏名"
              className="flex-1"
            />
            <Input
              value={editKana}
              onChange={e => setEditKana(e.target.value)}
              placeholder="ふりがな"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={editGrade} onValueChange={v => v && setEditGrade(v)}>
              <SelectTrigger className="w-24">
                <SelectValue>{gradeLabel(Number(editGrade))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={save} disabled={saving || !editName.trim()} className="ml-auto">
              <Check className="h-3.5 w-3.5 mr-1" />
              保存
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
              <X className="h-3.5 w-3.5 mr-1" />
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-2.5 px-4 flex items-center justify-between">
        <span className="font-medium">
          {member.name}
          <Badge variant="outline" className="ml-1.5 text-xs font-normal py-0">
            {gradeLabel(member.grade)}
          </Badge>
          {member.kana && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {member.kana}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEdit}>
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
                <AlertDialogTitle>部員を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{member.name}」を{year}年度の部員から削除します。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRemoved(member.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

// ── メインコンポーネント ────────────────────────────────────────────────────

export default function MemberEditor() {
  const [year, setYear]                   = useState(currentSchoolYear())
  const [selectableYears, setSelectableYears] = useState<number[]>([currentSchoolYear(), currentSchoolYear() + 1])
  const [members, setMembers]             = useState<Member[]>([])
  const [loading, setLoading]             = useState(true)
  const [name, setName]                   = useState('')
  const [kana, setKana]                   = useState('')
  const [grade, setGrade]                 = useState('7')
  const [saving, setSaving]               = useState(false)
  const [addError, setAddError]           = useState('')
  const [copying, setCopying]             = useState(false)
  const [copyError, setCopyError]         = useState('')

  useEffect(() => {
    fetch('/api/members/years')
      .then(r => r.json())
      .then((years: number[]) => setSelectableYears(years))
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/members?year=${year}`)
      .then(r => r.json())
      .then(data => { setMembers(data); setLoading(false) })
  }, [year])

  const add = async () => {
    if (!name.trim()) return
    setSaving(true)
    setAddError('')
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), kana: kana.trim() || undefined, grade: Number(grade), year }),
      })
      if (res.ok) {
        const m: Member = await res.json()
        setMembers(prev => [...prev, m])
        setName('')
        setKana('')
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
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== id))
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
      fetch('/api/members/years')
        .then(r => r.json())
        .then((years: number[]) => setSelectableYears(years))
    } else {
      setCopyError(data.error ?? 'コピーに失敗しました')
    }
    setCopying(false)
  }

  return (
    <div className="space-y-3">
      {/* 年度セレクター */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground shrink-0">年度</span>
        <Select
          value={String(year)}
          onValueChange={v => { if (v) { setYear(Number(v)); setCopyError('') } }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectableYears.map(y => (
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
                <AlertDialogTrigger render={<Button variant="outline" disabled={copying} />}>
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
              {members.map(m => (
                <MemberRow
                  key={m.id}
                  member={m}
                  year={year}
                  onUpdated={updated => setMembers(prev => prev.map(x => x.id === updated.id ? updated : x))}
                  onRemoved={remove}
                />
              ))}
            </div>
          )}

          {/* 追加フォーム */}
          <Card className="border-dashed">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="氏名を入力"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="ふりがな（任意）"
                  value={kana}
                  onChange={e => setKana(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={grade} onValueChange={v => v && setGrade(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue>{gradeLabel(Number(grade))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={add} disabled={saving || !name.trim()} className="ml-auto">
                  <UserPlus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
            </CardContent>
          </Card>
          {addError && <p className="text-sm text-destructive">{addError}</p>}
        </>
      )}
    </div>
  )
}
