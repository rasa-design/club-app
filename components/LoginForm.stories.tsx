import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LoginForm from './LoginForm'

const meta: Meta<typeof LoginForm> = {
  title: 'App/LoginForm',
  component: LoginForm,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof LoginForm>

export const デフォルト: Story = {}
