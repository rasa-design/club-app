'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LogoText from '@/components/LogoText'

const links = [
  { href: '/',         label: 'ホーム',                   color: 'var(--primary)' },
  { href: '/payments', label: '練習日/大会カレンダー',   color: '#3BBFAD' },
  { href: '/mindset',  label: 'マインドセット',           color: '#E85FA0' },
  { href: '/members',  label: 'クラブ生一覧',             color: '#7C5CBF' },
  { href: '/admin',    label: '管理者メニュー',           color: '#F7D33E' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="bg-background/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          {pathname === '/' ? (
            <LogoText className="font-bold text-xl tracking-tight" />
          ) : (
            <Link href="/" aria-label="トップへ戻る">
              <LogoText className="font-bold text-xl tracking-tight" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <Menu
              className={cn(
                'h-5 w-5 absolute transition-all duration-200',
                open ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
              )}
            />
            <X
              className={cn(
                'h-5 w-5 absolute transition-all duration-200',
                open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
              )}
            />
          </Button>
        </div>
      </header>

      {/* オーバーレイ */}
      <div
        className={cn(
          'fixed inset-0 z-20 bg-black/30 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpen(false)}
      />

      {/* 右サイドドロワー */}
      <div
        className={cn(
          'fixed top-0 right-0 z-30 h-full w-64 bg-background shadow-xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <span className="font-bold text-muted-foreground">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                'px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                pathname === l.href
                  ? 'bg-muted font-semibold'
                  : 'text-foreground hover:bg-muted'
              )}
              style={pathname === l.href ? { color: l.color } : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
