import { NextRequest, NextResponse } from 'next/server'
import { getEventAbsences, saveEventAbsences } from '@/lib/data'

export async function GET() {
  const data = await getEventAbsences()
  return NextResponse.json(data)
}

// { eventId, memberId } をトグル
export async function POST(req: NextRequest) {
  const { eventId, memberId } = await req.json()
  const data = await getEventAbsences()
  const current = data[eventId] ?? []
  data[eventId] = current.includes(memberId)
    ? current.filter((id) => id !== memberId)
    : [...current, memberId]
  await saveEventAbsences(data)
  return NextResponse.json({ ok: true })
}
