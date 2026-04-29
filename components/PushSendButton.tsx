'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, XCircle } from 'lucide-react'

export default function PushSendButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSend() {
    setStatus('loading')
    try {
      const noticeRes = await fetch('/update-notice.json')
      const notice = await noticeRes.json()

      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notice.title,
          body: notice.body,
          url: '/updates',
        }),
      })

      if (!res.ok) throw new Error()
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSend}
        disabled={status === 'loading'}
        className="flex items-center gap-1.5"
      >
        <Bell className="h-4 w-4" />
        {status === 'loading' ? '送信中...' : 'プッシュ通知を送信'}
      </Button>
      {status === 'success' && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3.5 w-3.5" /> 送信しました
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <XCircle className="h-3.5 w-3.5" /> 失敗しました
        </span>
      )}
    </div>
  )
}
