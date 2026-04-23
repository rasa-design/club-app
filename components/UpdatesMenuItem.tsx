"use client"

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Megaphone } from 'lucide-react'
import { useHasNewUpdates } from '@/hooks/useHasNewUpdates'

export default function UpdatesMenuItem() {
  const hasNewUpdates = useHasNewUpdates()

  return (
    <Link href="/updates" className="sm:col-span-2">
      <Card className="shadow-sm hover:shadow-md hover:bg-muted/40 transition-all duration-200 cursor-pointer h-full">
        <CardContent className="flex items-center gap-4 py-5">
          <Megaphone className="h-7 w-7 shrink-0" style={{ color: '#6B7280' }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">アップデート情報</span>
              {hasNewUpdates && (
                <span className="text-[10px] font-semibold bg-red-500 text-white rounded-full px-1.5 leading-4">New</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">最新のお知らせを確認</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
