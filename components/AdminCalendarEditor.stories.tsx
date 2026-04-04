import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from '@storybook/test'
import AdminCalendarEditor from './AdminCalendarEditor'
import type { Event } from '@/lib/data'

const meta: Meta<typeof AdminCalendarEditor> = {
  title: 'App/AdminCalendarEditor',
  component: AdminCalendarEditor,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof AdminCalendarEditor>

const events: Event[] = [
  {
    id: '1',
    title: '春季地区大会',
    date: '2025-04-19',
    endDate: '2025-04-20',
    location: '市立体育館',
    description: '',
  },
  {
    id: '2',
    title: '県大会予選',
    date: '2025-06-07',
    endDate: '2025-06-08',
    location: '県立武道館',
    description: '雨天中止の場合は翌週',
  },
]

export const 行事あり: Story = {
  args: { events, setEvents: fn() },
}

export const 行事なし: Story = {
  args: { events: [], setEvents: fn() },
}
