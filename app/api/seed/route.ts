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
import practicesData from '@/data/practices.json'
import insuranceData from '@/data/insurance.json'
import eventAttendanceData from '@/data/event-attendance.json'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: '不正なリクエスト' }, { status: 403 })
  }

  if (body.practicesOnly) {
    await writeStorage('practices', practicesData)
  } else {
    await Promise.all([
      writeStorage('members', membersData),
      writeStorage('events', eventsData),
      writeStorage('payments', paymentsData),
      writeStorage('practices', practicesData),
      writeStorage('insurance', insuranceData),
      writeStorage('event-attendance', eventAttendanceData),
      writeStorage('attendance', {}),
    ])
  }

  return NextResponse.json({ ok: true, message: 'KVにデータを投入しました' })
}
