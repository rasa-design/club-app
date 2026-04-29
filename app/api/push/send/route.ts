import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sendPushToAll } from '@/lib/webpush'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, body, url } = await req.json()
  if (!title || !body) {
    return NextResponse.json({ error: 'title と body は必須です' }, { status: 400 })
  }

  await sendPushToAll({ title, body, url: url || '/updates' })
  return NextResponse.json({ ok: true })
}
