/**
 * KV初期データ投入用API（デプロイ後に一度だけ叩く）
 * POST /api/seed  body: { secret: "SEED_SECRET の値" }
 */
import { NextRequest, NextResponse } from 'next/server'
import { readStorage, writeStorage } from '@/lib/storage'

// data/*.json の内容をここに埋め込む
import membersData from '@/data/members.json'
import eventsData from '@/data/events.json'
import paymentsData from '@/data/payments.json'
import practicesData from '@/data/practices.json'
import insuranceData from '@/data/insurance.json'
import eventAttendanceData from '@/data/event-attendance.json'
import polesData from '@/data/poles.json'
import eventPolesData from '@/data/event-poles.json'
import eventRecordsData from '@/data/event-records.json'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: '不正なリクエスト' }, { status: 403 })
  }

  if (body.pruneOldMembers) {
    // 指定年度より前のメンバーデータを削除
    const cutoff: number = body.cutoffYear ?? 2025
    const members = await readStorage<Record<string, unknown>>('members', {})
    for (const key of Object.keys(members)) {
      if (Number(key) < cutoff) delete members[key]
    }
    await writeStorage('members', members)
    return NextResponse.json({ ok: true, message: `${cutoff}年度より前のメンバーデータを削除しました` })
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
      writeStorage('poles', polesData),
      writeStorage('event-poles', eventPolesData),
      writeStorage('event-records', eventRecordsData),
      writeStorage('attendance', {}),
    ])
  }

  return NextResponse.json({ ok: true, message: 'KVにデータを投入しました' })
}
