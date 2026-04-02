import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Nav from './Nav'

const meta: Meta<typeof Nav> = {
  title: 'App/Nav',
  component: Nav,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Nav>

export const ホーム: Story = {
  parameters: { nextjs: { navigation: { pathname: '/' } } },
}

export const カレンダー: Story = {
  parameters: { nextjs: { navigation: { pathname: '/calendar' } } },
}

export const 月謝: Story = {
  parameters: { nextjs: { navigation: { pathname: '/payments' } } },
}
