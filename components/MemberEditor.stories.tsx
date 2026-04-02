import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import MemberEditor from './MemberEditor'
import type { Member } from '@/lib/data'

const meta: Meta<typeof MemberEditor> = {
  title: 'App/MemberEditor',
  component: MemberEditor,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof MemberEditor>

const members: Member[] = [
  { id: '1', name: '山田太郎', grade: 1 },
  { id: '2', name: '鈴木花子', grade: 2 },
  { id: '3', name: '田中一郎', grade: 3 },
]

export const 部員あり: Story = {
  args: { initialMembers: members },
}

export const 部員なし: Story = {
  args: { initialMembers: [] },
}
