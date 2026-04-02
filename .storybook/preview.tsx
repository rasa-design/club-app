import type { Preview } from '@storybook/nextjs-vite'
import { Noto_Sans_JP } from 'next/font/google'
import React from 'react'
import '../app/globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
})

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className={`${notoSansJP.variable} font-sans`}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    nextjs: {
      appDirectory: true,
    },
  },
}

export default preview
