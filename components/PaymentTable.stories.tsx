import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PaymentTable from './PaymentTable'
import type { Member, Payments } from '@/lib/data'

const meta: Meta<typeof PaymentTable> = {
  title: 'App/PaymentTable',
  component: PaymentTable,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof PaymentTable>

const members: Member[] = [
  { id: '1', name: '山田太郎', grade: 1 },
  { id: '2', name: '鈴木花子', grade: 1 },
  { id: '3', name: '田中一郎', grade: 2 },
  { id: '4', name: '佐藤次郎', grade: 3 },
]

const payments: Payments = {
  '1': { '2025-04': true, '2025-05': true, '2025-06': true },
  '2': { '2025-04': true },
  '3': {},
}

export const 閲覧のみ_保護者: Story = {
  args: { members, payments, isAdmin: false },
}

export const 編集可能_管理者: Story = {
  args: { members, payments, isAdmin: true },
}

export const 部員なし: Story = {
  args: { members: [], payments: {}, isAdmin: false },
}
