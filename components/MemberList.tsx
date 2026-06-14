'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Member, Event, EventRecords } from '@/lib/data'
import { gradeLabel, currentSchoolYear } from '@/lib/grade'

type MemberStats = { pbCount: number | null; bestRecord: string | null }

function calcMemberStats(
  members: Member[],
  events: Event[],
  records: EventRecords
): Record<string, MemberStats> {
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
  const formatCm = (cm: number): string => {
    const m = Math.floor(cm / 100)
    const c = cm % 100
    return `${m}m${c}cm`
  }
  const sy = currentSchoolYear()
  const syStart = new Date(`${sy}-04-01`)
  const sorted = [...(Array.isArray(events) ? events : [])].sort((a, b) => a.date.localeCompare(b.date))
  const prevEvents = sorted.filter(e => new Date(e.date) < syStart)
  const seasonEvents = sorted.filter(e => new Date(e.date) >= syStart)
  const stats: Record<string, MemberStats> = {}
  for (const member of members) {
    // 全大会を通じた自己ベスト
    let overallBest: number | null = null
    for (const event of sorted) {
      const cm = parseCm(records[event.id]?.[member.id] ?? '')
      if (cm !== null && (overallBest === null || cm > overallBest)) overallBest = cm
    }
    // 今シーズンの自己ベスト更新回数
    let base: number | null = null
    for (const event of prevEvents) {
      const cm = parseCm(records[event.id]?.[member.id] ?? '')
      if (cm !== null && (base === null || cm > base)) base = cm
    }
    let best = base
    let pb = 0
    for (const event of seasonEvents) {
      const cm = parseCm(records[event.id]?.[member.id] ?? '')
      if (cm !== null) {
        if (best === null) {
          best = cm
        } else if (cm > best) {
          best = cm
          pb++
        }
      }
    }
    stats[member.id] = {
      pbCount: best !== null ? pb : null,
      bestRecord: overallBest !== null ? formatCm(overallBest) : null,
    }
  }
  return stats
}
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
import OtherSportsTab from '@/components/OtherSportsTab'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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
  initialYears,
  initialGoals,
  initialEvents,
  initialEventRecords,
}: {
  members: Member[]
  initialYear: number
  initialYears: number[]
  initialGoals: Record<string, string>
  initialEvents: Event[]
  initialEventRecords: EventRecords
}) {
  const router = useRouter()
  const [schoolYear, setSchoolYear] = useState(initialYear)
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [sortOrder, setSortOrder] = useState<SortOrder>('grade')
  const [selectableYears] = useState<number[]>(initialYears ?? [initialYear])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [goals, setGoals] = useState<Record<string, string>>(initialGoals)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState<{ m: string; cm: string }>({ m: '', cm: '' })
  const [memberStats, setMemberStats] = useState<Record<string, MemberStats>>(() =>
    calcMemberStats(initialMembers, initialEvents, initialEventRecords)
  )
  const eventsData = initialEvents
  const recordsData = initialEventRecords
  const isFirstRender = useRef(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const memberId = params.get('member')
    if (memberId) {
      const member = initialMembers.find(m => m.id === memberId)
      if (member) setSelectedMember(member)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    fetch(`/api/members?year=${schoolYear}`)
      .then(r => r.json())
      .then((data: Member[]) => {
        setMembers(data)
        setMemberStats(calcMemberStats(data, initialEvents, initialEventRecords))
      })
  }, [schoolYear]) // eslint-disable-line react-hooks/exhaustive-deps

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
              sortOrder === 'grade' ? 'bg-muted-foreground/20 text-foreground font-semibold' : 'text-muted-foreground'
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
              sortOrder === 'name' ? 'bg-muted-foreground/20 text-foreground font-semibold' : 'text-muted-foreground'
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
                    <span className="text-sm font-bold text-foreground/60">
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
                  <div className="flex flex-col items-end gap-0.5">
                    {memberStats[member.id]?.bestRecord && (
                      <span className="text-xs font-mono font-medium" style={{ color: '#6366f1' }}>
                        自己ベスト {memberStats[member.id].bestRecord}
                      </span>
                    )}
                    {goals[member.id] && (
                      <span className="text-xs font-mono font-medium" style={{ color: '#3BBFAD' }}>
                        目標 {goals[member.id]}
                      </span>
                    )}
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
        <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden" suppressAutoFocus>
          <Tabs defaultValue="pole-vault" className="flex flex-col flex-1 overflow-hidden min-h-0">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selectedMember?.name} の大会記録</DialogTitle>
            <TabsList className="w-full mt-1">
              <TabsTrigger value="pole-vault" className="flex-1">棒高跳び</TabsTrigger>
              <TabsTrigger value="other" className="flex-1">他の競技</TabsTrigger>
            </TabsList>
          </DialogHeader>
          <TabsContent value="pole-vault" className="flex-1 overflow-y-auto min-h-0 mt-0">
            {/* 今シーズン目標 */}
            {selectedMember && (
              <div className="space-y-1 pt-1 px-1">
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
              <div className="flex items-center justify-between pt-1 px-3">
                {memberStats[selectedMember.id]?.bestRecord ? (
                  <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                    ★ 自己ベスト　<span className="font-mono">{memberStats[selectedMember.id].bestRecord}</span>
                  </p>
                ) : (
                  <span />
                )}
                {memberStats[selectedMember.id]?.pbCount === null ? (
                  <p className="text-sm font-medium" style={{ color: '#6366f1' }}>
                    今シーズンの記録がありません
                  </p>
                ) : (
                  <p className="text-sm font-medium" style={{ color: '#6366f1' }}>
                    今シーズン更新　<span className="font-mono">{memberStats[selectedMember.id]?.pbCount ?? 0}</span>回
                  </p>
                )}
              </div>
              </div>
            )}
            {selectedMember && (
              <MemberRecordChart
                memberId={selectedMember.id}
                goalCm={goals[selectedMember.id] ? (() => {
                  const { m, cm } = parseRecord(goals[selectedMember.id])
                  return m && cm ? Number(m) * 100 + Number(cm) : null
                })() : null}
                onEventClick={eventId => {
                  router.push(`/payments?event=${eventId}&member=${selectedMember.id}&from=members`)
                }}
                events={eventsData.length > 0 ? eventsData : undefined}
                eventRecords={Object.keys(recordsData).length > 0 ? recordsData : undefined}
              />
            )}
          </TabsContent>
          <TabsContent value="other" className="flex-1 overflow-y-auto min-h-0 mt-0">
            {selectedMember && <OtherSportsTab memberId={selectedMember.id} />}
          </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
