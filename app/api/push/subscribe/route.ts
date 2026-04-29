import { NextRequest, NextResponse } from 'next/server'
import { saveSubscription, removeSubscription } from '@/lib/webpush'

export async function POST(req: NextRequest) {
  const sub = await req.json()
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }
  await saveSubscription(sub)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
  }
  await removeSubscription(endpoint)
  return NextResponse.json({ ok: true })
}
