'use client'

import { useState } from 'react'
import { Member, Payments } from '@/lib/data'

// School year: April of current year to March of next year
function getSchoolYearMonths(): { year: number; month: number; label: string }[] {
  const today = new Date()
  const schoolYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  const months = []
  for (let m = 4; m <= 12; m++) {
    months.push({ year: schoolYear, month: m, label: `${m}月` })
  }
  for (let m = 1; m <= 3; m++) {
    months.push({ year: schoolYear + 1, month: m, label: `${m}月` })
  }
  return months
}

function yearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export default function PaymentTable({
  members,
  payments: initialPayments,
  isAdmin,
}: {
  members: Member[]
  payments: Payments
  isAdmin: boolean
}) {
  const months = getSchoolYearMonths()
  const [payments, setPayments] = useState<Payments>(initialPayments)
  const [loading, setLoading] = useState<string | null>(null)

  const toggle = async (memberId: string, year: number, month: number) => {
    if (!isAdmin) return
    const ym = yearMonth(year, month)
    const current = payments[memberId]?.[ym] ?? false
    const key = `${memberId}-${ym}`
    setLoading(key)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, yearMonth: ym, paid: !current }),
    })
    if (res.ok) {
      setPayments((prev) => {
        const next = { ...prev, [memberId]: { ...(prev[memberId] ?? {}) } }
        if (!current) next[memberId][ym] = true
        else delete next[memberId][ym]
        return next
      })
    }
    setLoading(null)
  }

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="sticky left-0 bg-gray-100 text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">氏名</th>
            {months.map((m) => (
              <th key={`${m.year}-${m.month}`} className="px-2 py-2 font-medium text-gray-600 text-center min-w-[40px]">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => (
            <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className={`sticky left-0 px-4 py-2 font-medium text-gray-800 whitespace-nowrap ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                {member.name}
                <span className="ml-1 text-xs text-gray-400">{member.grade}年</span>
              </td>
              {months.map((m) => {
                const ym = yearMonth(m.year, m.month)
                const paid = payments[member.id]?.[ym] ?? false
                const key = `${member.id}-${ym}`
                return (
                  <td key={ym} className="px-1 py-2 text-center">
                    <button
                      onClick={() => toggle(member.id, m.year, m.month)}
                      disabled={!isAdmin || loading === key}
                      className={`w-8 h-8 rounded-full text-base font-bold transition-all
                        ${paid
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : isAdmin
                            ? 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                            : 'bg-transparent text-gray-200 cursor-default'
                        }
                        ${loading === key ? 'opacity-50' : ''}
                      `}
                    >
                      {paid ? '○' : '−'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
