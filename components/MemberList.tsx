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
import { cn } from '@/lib/utils'

type SortOrder = 'grade' | 'name'

function sortMembers(members: Member[], order: SortOrder): Member[] {
  return [...members].sort((a, b) =>
    order === 'name' ? a.name.localeCompare(b.name, 'ja') : a.grade - b.grade
  )
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
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border">
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
    </div>
  )
}
