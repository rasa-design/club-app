import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import AutoRefresh from '@/components/AutoRefresh'
import UpdateNoticeDialog from '@/components/UpdateNoticeDialog'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'GPVCクラブ',
  description: 'GPVCクラブ 保護者向けアプリ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GPVCクラブ',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="bg-background min-h-screen">
        <AutoRefresh />
        <UpdateNoticeDialog />
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
