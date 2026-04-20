'use client'

import { useState, useEffect, useRef } from 'react'
import { Member } from '@/lib/data'
import { gradeLabel } from '@/lib/grade'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
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
  const isFirstRender = useRef(true)

  useEffect(() => {
    fetch('/api/members/years')
      .then(r => r.json())
      .then((years: number[]) => setSelectableYears(years))
  }, [])

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
                  <span className="text-sm font-medium">{member.name}</span>
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
      <Dialog open={selectedMember !== null} onOpenChange={open => !open && setSelectedMember(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selectedMember?.name} の大会記録</DialogTitle>
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
