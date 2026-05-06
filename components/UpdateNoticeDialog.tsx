"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type UpdateNotice = {
  id: string
  active: boolean
  title: string
  body: string
  image?: string
}

const STORAGE_KEY = "update-notice-read-id"

// StrictModeの二重実行を防ぐモジュールレベルフラグ
let fetchInitiated = false

export default function UpdateNoticeDialog() {
  const [notice, setNotice] = useState<UpdateNotice | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (fetchInitiated) return
    fetchInitiated = true

    fetch("/update-notice.json", { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data: UpdateNotice) => {
        if (!data.active) return
        const readId = localStorage.getItem(STORAGE_KEY)
        if (readId === data.id) {
          // 既読済みでもバッジが残っている可能性があるためクリア
          if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch(() => {})
          }
          return
        }
        setNotice(data)
        setOpen(true)
        // 未読通知があるときホーム画面アイコンにバッジをセット
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(1).catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  function handleClose() {
    if (notice) {
      localStorage.setItem(STORAGE_KEY, notice.id)
    }
    // バッジをクリア（対応ブラウザのみ）
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {})
    }
    setOpen(false)
  }

  if (!open || !notice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 supports-backdrop-filter:backdrop-blur-xs">
      <div className="bg-popover rounded-xl w-full max-w-sm ring-1 ring-foreground/10 shadow-xl text-sm text-popover-foreground pointer-events-auto">
        <div className="px-4 pt-4 pb-2 font-medium text-base">{notice.title}</div>
        <div className="px-4 pb-4 space-y-3">
          <p className="whitespace-pre-line">{notice.body}</p>
          {notice.image && (
            <img src={notice.image} alt="" className="w-full h-auto rounded-lg" />
          )}
        </div>
        <div className="px-4 py-3 border-t bg-muted/50 rounded-b-xl">
          <Button variant="outline" onClick={handleClose} className="w-full">閉じる</Button>
        </div>
      </div>
    </div>
  )
}
