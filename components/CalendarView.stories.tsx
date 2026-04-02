import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CalendarView from './CalendarView'
import type { Event } from '@/lib/data'

const meta: Meta<typeof CalendarView> = {
  title: 'App/CalendarView',
  component: CalendarView,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof CalendarView>

const sampleEvents: Event[] = [
  {
    id: '1',
    title: '春季地区大会',
    date: '2026-04-18',
    endDate: '2026-04-19',
    location: '市立体育館',
    description: '',
  },
  {
    id: '2',
    title: '県大会予選',
    date: '2026-06-06',
    endDate: '2026-06-07',
    location: '県立武道館',
    description: '雨天中止の場合は翌週',
  },
]

export const 行事あり: Story = {
  args: { events: sampleEvents },
}

export const 行事なし: Story = {
  args: { events: [] },
}
