'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 60_000 // 60秒ごとにバックグラウンドで再取得

export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    // フォーカス復帰時（ホーム画面アプリでバックグラウンドから戻った時など）に再取得
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 定期ポーリング（画面を開いたまま放置していても他ユーザーの変更を受け取る）
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }, POLL_INTERVAL_MS)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(timer)
    }
  }, [router])

  return null
}
