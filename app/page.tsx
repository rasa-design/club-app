import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import HeroAnimatedTextLoader from '@/components/HeroAnimatedTextLoader'
import { CalendarCheck2, Lock, Heart, Users, WandSparkles, Link2 } from 'lucide-react'
import UpdatesMenuItem from '@/components/UpdatesMenuItem'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Tier = 'primary' | 'admin'

const menuItemsBefore: { href: string; icon: LucideIcon; iconColor: string; label: string; desc: string; tier?: Tier }[] = [
  { href: '/payments', icon: CalendarCheck2, iconColor: 'var(--color-feature-calendar)', label: '練習日/大会カレンダー', desc: '日程の確認と登録', tier: 'primary' },
  { href: '/members',  icon: Users,          iconColor: 'var(--color-feature-members)',  label: 'クラブ生成長記録',     desc: '在籍メンバーの大会記録を確認', tier: 'primary' },
  { href: '/poles',    icon: WandSparkles,   iconColor: 'var(--color-feature-poles)',    label: 'ポール一覧',           desc: 'クラブ保有ポールを確認' },
]

const menuItemsAfter: { href: string; icon: LucideIcon; iconColor: string; label: string; desc: string; wide?: boolean; tier?: Tier }[] = [
  { href: '/mindset',  icon: Heart,          iconColor: 'var(--color-feature-mindset)', label: 'マインドセット',       desc: '本番で力を発揮するために' },
  { href: '/links',    icon: Link2,          iconColor: 'var(--color-feature-links)',    label: 'よく使うリンク',       desc: '関連サイトまとめ' },
  { href: '/admin',    icon: Lock,           iconColor: 'var(--color-feature-admin)',    label: '管理者メニュー',       desc: '※コーチ・会計係専用', wide: true, tier: 'admin' },
]

export default function Home() {
  return (
    <div className="space-y-6">
      {/* ヒーロー画像 */}
      <div className="-mx-4 -mt-6 relative" style={{ aspectRatio: '896 / 1200' }}>
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.png"
            alt="GPVCクラブのヒーロー写真"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 50%' }}
          />
        </div>
        <HeroAnimatedTextLoader />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {menuItemsBefore.map((item) => {
          const Icon = item.icon
          const isPrimary = item.tier === 'primary'
          return (
            <Link key={item.href} href={item.href}>
              <Card className={cn(
                'shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full',
                isPrimary ? 'bg-muted/25 hover:bg-muted/50' : 'hover:bg-muted/40'
              )}>
                <CardContent className="flex items-center gap-4 py-5">
                  <Icon
                    className={cn('shrink-0', isPrimary ? 'h-8 w-8' : 'h-7 w-7')}
                    style={{ color: item.iconColor }}
                  />
                  <div>
                    <div className={cn('text-base', isPrimary ? 'font-bold' : 'font-semibold')}>{item.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        <UpdatesMenuItem />
        {menuItemsAfter.map((item) => {
          const Icon = item.icon
          const isAdmin = item.tier === 'admin'
          return (
            <Link key={item.href} href={item.href} className={item.wide ? 'sm:col-span-2' : undefined}>
              <Card className={cn(
                'shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full',
                isAdmin ? 'border-dashed hover:bg-muted/40' : 'hover:bg-muted/40'
              )}>
                <CardContent className="flex items-center gap-4 py-5">
                  <Icon
                    className={cn('h-7 w-7 shrink-0', isAdmin && 'text-muted-foreground')}
                    style={isAdmin ? undefined : { color: item.iconColor }}
                  />
                  <div>
                    <div className={cn(
                      'font-semibold text-base',
                      isAdmin && 'text-sm text-muted-foreground font-medium'
                    )}>{item.label}</div>
                    <div className={cn(
                      'text-sm text-muted-foreground mt-0.5',
                      isAdmin && 'text-xs'
                    )}>{item.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* フッターロゴ */}
      <div className="flex justify-center pt-2 pb-4">
        <Image
          src="/RasaDesignLogo.svg"
          alt="Rasa Design"
          width={420}
          height={294}
          className="w-1/4 h-auto"
        />
      </div>
    </div>
  )
}
