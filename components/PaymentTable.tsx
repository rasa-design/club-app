'use client'

import { useState, useEffect, useRef } from 'react'
import { Member, Payments, PaymentStatus, InsurancePayments } from '@/lib/data'
import { gradeLabel, currentSchoolYear } from '@/lib/grade'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type SortOrder = 'name' | 'grade'
type Mode = 'monthly' | 'insurance'

function sortMembers(members: Member[], order: SortOrder): Member[] {
  return [...members].sort((a, b) => {
    if (order === 'name') return a.name.localeCompare(b.name, 'ja')
    return a.grade - b.grade
  })
}

function getSchoolYearMonths(schoolYear: number): { year: number; month: number; label: string }[] {
  const months = []
  for (let m = 4; m <= 12; m++) {
    months.push({ year: schoolYear, month: m, label: `${m}月` })
  }
  for (let m = 1; m <= 3; m++) {
    months.push({ year: schoolYear + 1, month: m, label: `${m}月` })
  }
  return months
}

function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}


// 3段階トグル: undefined → paid → 退会 → undefined
function nextStatus(current: PaymentStatus | undefined): 'paid' | 'withdrawn' | 'clear' {
  if (current === undefined) return 'paid'
  if (current === true) return 'withdrawn'
  return 'clear'
}

// 保険料: undefined → paid（今月） → 退会 → undefined
function nextInsuranceStatus(current: number | '退会' | undefined): 'paid' | 'withdrawn' | 'clear' {
  if (current === undefined) return 'paid'
  if (typeof current === 'number') return 'withdrawn'
  return 'clear'
}

export default function PaymentTable({
  members: initialMembers,
  payments: initialPayments,
  insurance: initialInsurance,
  isAdmin,
  initialYear,
}: {
  members: Member[]
  payments: Payments
  insurance: InsurancePayments
  isAdmin: boolean
  initialYear?: number
}) {
  const [schoolYear, setSchoolYear] = useState(initialYear ?? currentSchoolYear())
  const months = getSchoolYearMonths(schoolYear)
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [payments, setPayments] = useState<Payments>(initialPayments)
  const [insurance, setInsurance] = useState<InsurancePayments>(initialInsurance)
  const [sortOrder, setSortOrder] = useState<SortOrder>('grade')
  const [mode, setMode] = useState<Mode>('monthly')
  const [selectableYears, setSelectableYears] = useState<number[]>([currentSchoolYear()])
  const isFirstRender = useRef(true)

  useEffect(() => {
    fetch('/api/members/years')
      .then(r => r.json())
      .then((years: number[]) => setSelectableYears(years))
  }, [])

  const sortedMembers = sortMembers(members, sortOrder)

  // 年度切替時にメンバーを再取得
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetch(`/api/members?year=${schoolYear}`)
      .then((r) => r.json())
      .then(setMembers)
  }, [schoolYear])

  const toggle = async (memberId: string, year: number, month: number) => {
    if (!isAdmin) return
    const ym = toYearMonth(year, month)
    const current = payments[memberId]?.[ym]
    const status = nextStatus(current)

    // 楽観的更新：先にUIを更新
    const newValue = status === 'paid' ? true : status === 'withdrawn' ? '退会' : undefined
    setPayments((prev) => {
      const next = { ...prev, [memberId]: { ...(prev[memberId] ?? {}) } }
      if (newValue === undefined) {
        delete next[memberId][ym]
      } else {
        next[memberId][ym] = newValue
      }
      return next
    })

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, yearMonth: ym, status }),
    })
    // 失敗時は元に戻す
    if (!res.ok) {
      setPayments((prev) => {
        const next = { ...prev, [memberId]: { ...(prev[memberId] ?? {}) } }
        if (current === undefined) {
          delete next[memberId][ym]
        } else {
          next[memberId][ym] = current
        }
        return next
      })
    }
  }

  const toggleInsurance = async (memberId: string) => {
    if (!isAdmin) return
    const yearKey = String(schoolYear)
    const current = insurance[memberId]?.[yearKey]
    const status = nextInsuranceStatus(current)
    const today = new Date()
    const paidMonth = today.getMonth() + 1

    // 楽観的更新：先にUIを更新
    const newValue = status === 'paid' ? paidMonth : status === 'withdrawn' ? '退会' : undefined
    setInsurance((prev) => {
      const next = { ...prev, [memberId]: { ...(prev[memberId] ?? {}) } }
      if (newValue === undefined) {
        delete next[memberId][yearKey]
      } else {
        next[memberId][yearKey] = newValue
      }
      return next
    })

    const res = await fetch('/api/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, schoolYear: yearKey, status, month: paidMonth }),
    })
    // 失敗時は元に戻す
    if (!res.ok) {
      setInsurance((prev) => {
        const next = { ...prev, [memberId]: { ...(prev[memberId] ?? {}) } }
        if (current === undefined) {
          delete next[memberId][yearKey]
        } else {
          next[memberId][yearKey] = current
        }
        return next
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* 月謝/保険料トグル */}
      <div className="flex rounded-md border overflow-hidden w-fit">
        <button
          onClick={() => setMode('monthly')}
          className={cn(
            'px-4 py-1.5 text-xs font-medium transition-colors',
            mode === 'monthly'
              ? 'bg-muted text-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted/50'
          )}
        >
          月謝
        </button>
        <button
          onClick={() => setMode('insurance')}
          className={cn(
            'px-4 py-1.5 text-xs font-medium border-l transition-colors',
            mode === 'insurance'
              ? 'bg-muted text-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted/50'
          )}
        >
          保険料
        </button>
      </div>

      {/* 年度セレクター + 並び替え */}
      <div className="flex items-center gap-2">
        <Select
          value={String(schoolYear)}
          onValueChange={(v) => v !== null && setSchoolYear(Number(v))}
        >
          <SelectTrigger className="flex-1 min-w-0 text-xs">
            <span>{schoolYear}年度（{schoolYear}/4〜{schoolYear + 1}/3）</span>
          </SelectTrigger>
          <SelectContent className="w-full">
            {selectableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}年度（{y}/4〜{y + 1}/3）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border overflow-hidden ml-auto shrink-0">
          <button
            onClick={() => setSortOrder('grade')}
            className={cn(
              'w-16 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              sortOrder === 'grade'
                ? 'bg-muted text-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted/50'
            )}
          >
            学年順
          </button>
          <button
            onClick={() => setSortOrder('name')}
            className={cn(
              'w-16 py-1.5 text-xs font-medium border-l transition-colors whitespace-nowrap',
              sortOrder === 'name'
                ? 'bg-muted text-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted/50'
            )}
          >
            五十音順
          </button>
        </div>
      </div>

      {mode === 'monthly' ? (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted whitespace-nowrap min-w-[100px] z-10">
                    氏名
                  </TableHead>
                  {months.map((m) => (
                    <TableHead
                      key={toYearMonth(m.year, m.month)}
                      className="text-center px-1 min-w-[40px]"
                    >
                      {m.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={months.length + 1}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      {schoolYear}年度の部員データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="sticky left-0 bg-background font-medium whitespace-nowrap z-10">
                        {member.name}
                        <Badge variant="outline" className="ml-1 text-xs font-normal py-0">
                          {gradeLabel(member.grade)}
                        </Badge>
                      </TableCell>
                      {months.map((m) => {
                        const ym = toYearMonth(m.year, m.month)
                        const status = payments[member.id]?.[ym]
                        const isPaid = status === true
                        const isWithdrawn = status === '退会'
                        return (
                          <TableCell key={ym} className="text-center px-1 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-8 w-8 rounded-full',
                                isPaid
                                  ? 'text-sm font-bold bg-transparent hover:bg-muted text-[#3BBFAD]'
                                  : isWithdrawn
                                    ? 'text-[10px] font-medium bg-transparent hover:bg-muted text-muted-foreground/60'
                                    : isAdmin
                                      ? 'text-sm text-muted-foreground hover:bg-muted'
                                      : 'text-sm cursor-default text-muted'
                              )}
                              onClick={() => toggle(member.id, m.year, m.month)}
                              disabled={!isAdmin}
                            >
                              {isPaid ? '○' : isWithdrawn ? '退会' : '−'}
                            </Button>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {isAdmin && (
            <p className="text-xs text-muted-foreground">
              タップで切り替え：− → ○（支払済）→ 退会 → −
            </p>
          )}
        </>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted whitespace-nowrap min-w-[100px] z-10">
                    氏名
                  </TableHead>
                  <TableHead className="text-center px-2 min-w-[80px]">
                    {schoolYear}年度
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      {schoolYear}年度の部員データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedMembers.map((member) => {
                    const yearKey = String(schoolYear)
                    const status = insurance[member.id]?.[yearKey]
                    const isPaid = typeof status === 'number'
                    const isWithdrawn = status === '退会'
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="sticky left-0 bg-background font-medium whitespace-nowrap z-10">
                          {member.name}
                          <Badge variant="outline" className="ml-1 text-xs font-normal py-0">
                            {gradeLabel(member.grade)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center px-2 py-2">
                          <Button
                            variant="ghost"
                            className={cn(
                              'h-8 px-2 rounded-full text-sm font-medium',
                              isPaid
                                ? 'text-[#3BBFAD] bg-transparent hover:bg-muted'
                                : isWithdrawn
                                  ? 'text-[10px] text-muted-foreground/60 bg-transparent hover:bg-muted'
                                  : isAdmin
                                    ? 'text-muted-foreground hover:bg-muted'
                                    : 'cursor-default text-muted'
                            )}
                            onClick={() => toggleInsurance(member.id)}
                            disabled={!isAdmin}
                          >
                            {isPaid ? `○ ${status}月` : isWithdrawn ? '退会' : '−'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {isAdmin && (
            <p className="text-xs text-muted-foreground">
              タップで切り替え：− → ○（今月支払済）→ 退会 → −
            </p>
          )}
        </>
      )}
    </div>
  )
}
