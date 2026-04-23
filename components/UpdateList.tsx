"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

type UpdateEntry = {
  id: string
  date: string
  title: string
  body: string
}

const STORAGE_KEY = "update-last-visit-id"

export default function UpdateList({ entries }: { entries: UpdateEntry[] }) {
  // localStorageの読み取りをレンダー前に1回だけ行う（StrictModeの二重実行に影響されない）
  const [lastVisitId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEY)
  })

  useEffect(() => {
    // 訪問記録の書き込みはuseEffect内（読み取りとは分離）
    if (entries.length > 0) {
      localStorage.setItem(STORAGE_KEY, entries[0].id)
      // NavなどのuseHasNewUpdatesに既読を通知
      window.dispatchEvent(new Event('updates-read'))
    }
  }, [entries])

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isNew = lastVisitId === null || entry.id > lastVisitId
        return (
          <div key={entry.id} className="rounded-xl border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{entry.date}</span>
              {isNew && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-500 hover:bg-red-500 text-white">
                  New
                </Badge>
              )}
            </div>
            <div className="font-medium">{entry.title}</div>
            <p className="text-sm text-foreground whitespace-pre-line">{entry.body}</p>
          </div>
        )
      })}
    </div>
  )
}
