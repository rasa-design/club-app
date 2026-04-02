'use client'

import { useState } from 'react'
import { Member, Payments, Practices } from '@/lib/data'
import type { Event } from '@/lib/data'
import PaymentTable from '@/components/PaymentTable'
import MemberEditor from '@/components/MemberEditor'
import PracticeEditor from '@/components/PracticeEditor'
import AdminCalendarEditor from '@/components/AdminCalendarEditor'
import LogoutButton from '@/components/LogoutButton'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'payment',   label: '月謝管理' },
  { id: 'members',   label: 'クラブ生' },
  { id: 'practice',  label: '練習日' },
  { id: 'calendar',  label: '大会行事' },
] as const

type TabId = typeof TABS[number]['id']

export default function AdminDashboard({
  members,
  payments,
  events,
  practices,
  initialYear,
}: {
  members: Member[]
  payments: Payments
  events: Event[]
  practices: Practices
  initialYear: number
}) {
  const [activeTab, setActiveTab] = useState<TabId>('payment')

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800">管理者ダッシュボード</h2>
        <LogoutButton />
      </div>

      {/* タブナビゲーション */}
      <div className="flex border-b">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="pt-1">
        {activeTab === 'payment' && (
          <section className="space-y-2">
            <p className="text-xs text-gray-500">◯をタップして支払い済みにできます</p>
            <PaymentTable members={members} payments={payments} isAdmin={true} initialYear={initialYear} />
          </section>
        )}

        {activeTab === 'members' && (
          <section>
            <MemberEditor />
          </section>
        )}

        {activeTab === 'practice' && (
          <section>
            <PracticeEditor initialPractices={practices} />
          </section>
        )}

        {activeTab === 'calendar' && (
          <section>
            <AdminCalendarEditor initialEvents={events} />
          </section>
        )}
      </div>
    </div>
  )
}
