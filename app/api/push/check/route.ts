import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { readStorage, writeStorage } from '@/lib/storage'
import { sendPushToAll, getSubscriptions } from '@/lib/webpush'

const SENT_ID_KEY = 'push-last-sent-id'

type UpdateNotice = {
  id: string
  active: boolean
  title: string
  body: string
}

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'update-notice.json')
  const notice: UpdateNotice = JSON.parse(await readFile(filePath, 'utf-8'))

  if (!notice.active) return NextResponse.json({ sent: false, reason: 'inactive' })

  const subs = await getSubscriptions()
  if (subs.length === 0) return NextResponse.json({ sent: false, reason: 'no subscribers' })

  const lastSentId = await readStorage<string | null>(SENT_ID_KEY, null)
  if (lastSentId === notice.id) return NextResponse.json({ sent: false, reason: 'already sent' })

  await sendPushToAll({ title: notice.title, body: notice.body, url: '/updates' })
  await writeStorage(SENT_ID_KEY, notice.id)

  return NextResponse.json({ sent: true })
}
