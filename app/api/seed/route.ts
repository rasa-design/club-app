/**
 * KV初期データ投入用API（デプロイ後に一度だけ叩く）
 * POST /api/seed  body: { secret: "SEED_SECRET の値" }
 */
import { NextRequest, NextResponse } from 'next/server'
import { writeStorage } from '@/lib/storage'

// data/*.json の内容をここに埋め込む
import membersData from '@/data/members.json'
import eventsData from '@/data/events.json'
import paymentsData from '@/data/payments.json'

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: '不正なリクエスト' }, { status: 403 })
  }

  await Promise.all([
    writeStorage('members', membersData),
    writeStorage('events', eventsData),
    writeStorage('payments', paymentsData),
    writeStorage('practices', {}),
    writeStorage('attendance', {}),
  ])

  return NextResponse.json({ ok: true, message: 'KVにデータを投入しました' })
}
