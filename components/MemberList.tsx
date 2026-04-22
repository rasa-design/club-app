'use client'

import { useState, useEffect, useRef } from 'react'
import { Member, Event, EventRecords } from '@/lib/data'
import { gradeLabel, currentSchoolYear } from '@/lib/grade'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toHalfWidth, parseRecord, formatRecord } from '@/lib/record'
import MemberRecordChart from '@/components/MemberRecordChart'

type SortOrder = 'grade' | 'name'

function sortMembers(members: Member[], order: SortOrder): Member[] {
  return [...members].sort((a, b) => {
    if (order === 'grade') return a.grade - b.grade
    // 50音順: kana があればそれを優先、なければ name で機械的に比較（精度低）
    const aKey = a.kana ?? a.name
    const bKey = b.kana ?? b.name
    return aKey.localeCompare(bKey, 'ja')
  })
}

export default function MemberList({
  members: initialMembers,
  initialYear,
}: {
  members: Member[]
  initialYear: number
}) {
  const [schoolYear, setSchoolYear] = useState(initialYear)
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [sortOrder, setSortOrder] = useState<SortOrder>('grade')
  const [selectableYears, setSelectableYears] = useState<number[]>([initialYear])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [goals, setGoals] = useState<Record<string, string>>({})
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState<{ m: string; cm: string }>({ m: '', cm: '' })
  const [pbCounts, setPbCounts] = useState<Record<string, number | null>>({})
  const isFirstRender = useRef(true)

  useEffect(() => {
    fetch('/api/members/years')
      .then(r => r.json())
      .then((years: number[]) => setSelectableYears(years))
  }, [])

  useEffect(() => {
    fetch('/api/member-goals')
      .then(r => r.json())
      .then((data: Record<string, string>) => setGoals(data))
  }, [])

  useEffect(() => {
    const parseCm = (raw: string): number | null => {
      const s = raw.trim()
      const mCm = s.match(/^(\d+)m(\d+(?:\.\d+)?)cm$/)
      if (mCm) return Math.round(Number(mCm[1]) * 100 + Number(mCm[2]))
      const mOnly = s.match(/^(\d+)m(\d+(?:\.\d+)?)$/)
      if (mOnly) return Math.round(Number(mOnly[1]) * 100 + Number(mOnly[2]))
      const cmOnly = s.match(/^(\d+(?:\.\d+)?)cm$/)
      if (cmOnly) return Math.round(Number(cmOnly[1]))
      const dec = s.match(/^(\d+)\.(\d+)$/)
      if (dec) return Math.round(Number(s) * 100)
      return null
    }

    Promise.all([
      fetch('/api/events').then(r => r.json()) as Promise<Event[]>,
      fetch('/api/event-records').then(r => r.json()) as Promise<EventRecords>,
    ]).then(([events, records]) => {
      const sy = currentSchoolYear()
      const syStart = new Date(`${sy}-04-01`)
      const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
      const prevEvents   = sorted.filter(e => new Date(e.date) < syStart)
      const seasonEvents = sorted.filter(e => new Date(e.date) >= syStart)

      const counts: Record<string, number | null> = {}
      for (const member of members) {
        // 昨シーズン以前の自己ベスト
        let base: number | null = null
        for (const event of prevEvents) {
          const cm = parseCm(records[event.id]?.[member.id] ?? '')
          if (cm !== null && (base === null || cm > base)) base = cm
        }

        // 昨シーズンの記録がない場合は null（表示側で「昨シーズンの記録なし」）
        if (base === null) { counts[member.id] = null; continue }

        // 今シーズンのPB更新回数（baseからスタート）
        let best = base
        let pb = 0
        for (const event of seasonEvents) {
          const cm = parseCm(records[event.id]?.[member.id] ?? '')
          if (cm !== null && cm > best) { best = cm; pb++ }
        }
        counts[member.id] = pb
      }
      setPbCounts(counts)
    })
  }, [members])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    fetch(`/api/members?year=${schoolYear}`)
      .then(r => r.json())
      .then((data: Member[]) => setMembers(data))
  }, [schoolYear])

  const sorted = sortMembers(members, sortOrder)

  return (
    <div className="space-y-4">
      {/* 年度・ソート切り替え */}
      <div className="flex items-center justify-between gap-3">
        <Select
          value={String(schoolYear)}
          onValueChange={v => setSchoolYear(Number(v))}
        >
          <SelectTrigger className="flex-1 min-w-0">
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

        <div className="flex rounded-lg border overflow-hidden text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder('grade')}
            className={cn(
              'rounded-none h-9 w-16 border-0',
              sortOrder === 'grade' && 'bg-muted font-semibold'
            )}
          >
            学年順
          </Button>
          <div className="w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder('name')}
            className={cn(
              'rounded-none h-9 w-16 border-0',
              sortOrder === 'name' && 'bg-muted font-semibold'
            )}
          >
            五十音順
          </Button>
        </div>
      </div>

      {/* メンバー一覧 */}
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          この年度のメンバーは登録されていません
        </p>
      ) : (
        <div className="space-y-1">
          {sorted.map((member, i) => {
            const prevMember = i > 0 ? sorted[i - 1] : null
            const showGradeHeader =
              sortOrder === 'grade' && member.grade !== prevMember?.grade

            return (
              <div key={member.id}>
                {showGradeHeader && (
                  <div className="px-1 pt-3 pb-1 first:pt-0">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {gradeLabel(member.grade)}
                    </span>
                  </div>
                )}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border active:bg-muted cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  {sortOrder === 'name' && (
                    <span className="text-xs text-muted-foreground w-10 shrink-0 text-right">
                      {gradeLabel(member.grade)}
                    </span>
                  )}
                  <span className="text-sm font-medium flex-1">{member.name}</span>
                  <div className="flex flex-col items-end gap-0.5" style={{ minHeight: '2.5rem' }}>
                    <span className="text-xs font-mono font-medium" style={{ color: '#3BBFAD', visibility: goals[member.id] ? 'visible' : 'hidden' }}>
                      今シーズン目標 {goals[member.id] ?? '　'}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#6366f1', visibility: pbCounts[member.id] !== null && (pbCounts[member.id] ?? 0) > 0 ? 'visible' : 'hidden' }}>
                      自己ベスト更新 {pbCounts[member.id]}回
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {sorted.length}名登録
      </p>

      {/* メンバー記録ダイアログ */}
      <Dialog open={selectedMember !== null} onOpenChange={open => {
        if (!open) { setSelectedMember(null); setEditingGoal(false) }
      }}>
        <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selectedMember?.name} の大会記録</DialogTitle>
            {/* 今シーズン目標 */}
            {selectedMember && (
              <div className="space-y-1 pt-1">
              <div className="flex items-center gap-3">
                {editingGoal ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Input
                        inputMode="numeric"
                        className="h-7 text-base font-mono text-right w-14"
                        value={goalInput.m}
                        onChange={e => setGoalInput(prev => ({ ...prev, m: e.target.value }))}
                        onBlur={e => setGoalInput(prev => ({ ...prev, m: toHalfWidth(e.target.value).replace(/\D/g, '') }))}
                        autoFocus
                      />
                      <span className="text-sm shrink-0">m</span>
                      <Input
                        inputMode="numeric"
                        className="h-7 text-base font-mono text-right w-14"
                        value={goalInput.cm}
                        onChange={e => setGoalInput(prev => ({ ...prev, cm: e.target.value }))}
                        onBlur={e => setGoalInput(prev => ({ ...prev, cm: toHalfWidth(e.target.value).replace(/\D/g, '') }))}
                      />
                      <span className="text-sm shrink-0">cm</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={async () => {
                        const goal = formatRecord(goalInput.m, goalInput.cm)
                        await fetch('/api/member-goals', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ memberId: selectedMember.id, goal }),
                        })
                        setGoals(prev => {
                          const next = { ...prev }
                          if (goal === '') delete next[selectedMember.id]
                          else next[selectedMember.id] = goal
                          return next
                        })
                        setEditingGoal(false)
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1 rounded-md px-3 py-1" style={{ backgroundColor: '#3BBFAD' }}>
                      <span className="text-sm text-white">今シーズンの目標</span>
                      <span className="font-mono font-medium text-white flex-1">
                        {goals[selectedMember.id] ?? '未登録'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                        onClick={() => {
                          setGoalInput(parseRecord(goals[selectedMember.id] ?? ''))
                          setEditingGoal(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {pbCounts[selectedMember.id] === null ? (
                <p className="text-sm font-medium pt-1 px-3" style={{ color: '#6366f1' }}>
                  昨シーズンの記録なし
                </p>
              ) : (
                <p className="text-sm font-medium pt-1 px-3" style={{ color: '#6366f1' }}>
                  今シーズンの自己ベスト更新　<span className="font-mono">{pbCounts[selectedMember.id] ?? 0}</span>回
                </p>
              )}
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedMember && (
              <MemberRecordChart
                memberId={selectedMember.id}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
