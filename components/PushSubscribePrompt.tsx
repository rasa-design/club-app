'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'

const DISMISSED_KEY = 'push-prompt-dismissed'
const SUBSCRIBED_KEY = 'push-subscribed'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscribePrompt() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Service Worker / Push API 未対応環境はスキップ
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    // 既に購読済み or 非表示にした場合はスキップ
    if (localStorage.getItem(SUBSCRIBED_KEY) || localStorage.getItem(DISMISSED_KEY)) return
    // 既にブラウザで許可済みの場合は自動購読（プロンプト不要）
    if (Notification.permission === 'granted') {
      subscribeInBackground()
      return
    }
    if (Notification.permission === 'denied') return
    setShow(true)
  }, [])

  async function subscribeInBackground() {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        localStorage.setItem(SUBSCRIBED_KEY, '1')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      localStorage.setItem(SUBSCRIBED_KEY, '1')
    } catch {
      // 失敗しても無視
    }
  }

  async function handleAllow() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await subscribeInBackground()
        setShow(false)
      } else {
        setShow(false)
      }
    } catch {
      setShow(false)
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-popover rounded-xl ring-1 ring-foreground/10 shadow-xl p-4 flex gap-3 items-start">
        <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">アップデート通知を受け取りますか？</p>
          <p className="text-xs text-muted-foreground">新しいお知らせをプッシュ通知でお届けします</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAllow} disabled={loading} className="flex-1">
              {loading ? '設定中...' : '通知を受け取る'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              あとで
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
