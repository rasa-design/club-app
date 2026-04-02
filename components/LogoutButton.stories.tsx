import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LogoutButton from './LogoutButton'

const meta: Meta<typeof LogoutButton> = {
  title: 'App/LogoutButton',
  component: LogoutButton,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof LogoutButton>

export const デフォルト: Story = {}
