import { Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { label: '岐阜陸上競技協会HP',             href: 'https://www.gifu-riku.com' },
  { label: '日本陸連HPランキングページ',       href: 'https://www.jaaf.or.jp/remote/juniorhighschool/2025/ranking/?search=1&event_id=113&name=' },
  { label: '岐阜メモリアルセンター',           href: 'https://gifu-sports.org/gmc/' },
  { label: 'TYK星ケ台競技場（多治見）',        href: 'https://information.konamisportsclub.jp/trust/tajimi/stadium/' },
  { label: '中津川公園競技場',                 href: 'https://www.city.nakatsugawa.lg.jp/soshikikarasagasu/shogaigakushusportska/4/1/2451.html' },
  { label: '浅中公園総合グランド（大垣）',     href: 'https://www.ogaki-tairen.jp/?page_id=868' },
]

export default function LinksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 shrink-0" style={{ color: '#F59E0B' }} />
        <h2 className="text-xl font-bold text-gray-800">よく使うリンク</h2>
      </div>

      {/* -mr-4 で右端まで線を伸ばしつつ overflow-x-hidden でスクロール防止 */}
      <div className="space-y-3 -mr-4 overflow-x-hidden">
        {links.map((link, i) => {
          const isLeft = i % 2 === 0
          return (
            <div key={link.href} className="flex items-center">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex-none w-[72%] rounded-2xl border bg-card px-4 py-4 hover:bg-muted/40 transition-colors',
                  !isLeft && 'ml-[14%]'
                )}
              >
                <span className="text-sm font-medium leading-snug">{link.label}</span>
              </a>
              {/* カード右側から伸びる横線 */}
              <div className="flex-1 h-px bg-border" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
