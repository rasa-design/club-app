import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import HeroAnimatedTextLoader from '@/components/HeroAnimatedTextLoader'
import { CalendarCheck2, Lock, Heart, Users, WandSparkles, Link2 } from 'lucide-react'
import UpdatesMenuItem from '@/components/UpdatesMenuItem'
import type { LucideIcon } from 'lucide-react'

const menuItemsBefore: { href: string; icon: LucideIcon; iconColor: string; label: string; desc: string }[] = [
  { href: '/payments', icon: CalendarCheck2, iconColor: '#3BBFAD', label: '練習日/大会カレンダー', desc: '日程の確認と参加登録' },
  { href: '/members',  icon: Users,          iconColor: '#7C5CBF', label: 'クラブ生一覧',           desc: '在籍メンバーを確認' },
  { href: '/poles',    icon: WandSparkles,   iconColor: '#E8503A', label: 'ポール一覧',             desc: 'クラブ保有ポールを確認' },
]

const menuItemsAfter: { href: string; icon: LucideIcon; iconColor: string; label: string; desc: string; wide?: boolean }[] = [
  { href: '/mindset',  icon: Heart,          iconColor: '#E85FA0', label: 'マインドセット',         desc: '本番で力を発揮するために' },
  { href: '/links',    icon: Link2,          iconColor: '#F59E0B', label: 'よく使うリンク',         desc: '関連サイトまとめ' },
  { href: '/admin',    icon: Lock,           iconColor: '#F7D33E', label: '管理者メニュー',         desc: '※コーチ・会計係専用', wide: true },
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
            alt="GPVCクラブ"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 50%' }}
          />
        </div>
        <HeroAnimatedTextLoader />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {menuItemsBefore.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="shadow-sm hover:shadow-md hover:bg-muted/40 transition-all duration-200 cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 py-5">
                  <Icon className="h-7 w-7 shrink-0" style={{ color: item.iconColor }} />
                  <div>
                    <div className="font-semibold text-base">{item.label}</div>
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
          return (
            <Link key={item.href} href={item.href} className={item.wide ? 'sm:col-span-2' : undefined}>
              <Card className="shadow-sm hover:shadow-md hover:bg-muted/40 transition-all duration-200 cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 py-5">
                  <Icon className="h-7 w-7 shrink-0" style={{ color: item.iconColor }} />
                  <div>
                    <div className="font-semibold text-base">{item.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.desc}</div>
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
