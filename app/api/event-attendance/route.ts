import { NextRequest, NextResponse } from 'next/server'
import { getEventAttendance, saveEventAttendance } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getEventAttendance())
}

export async function POST(req: NextRequest) {
  const { eventId, memberId }: { eventId: string; memberId: string } = await req.json()
  const data = await getEventAttendance()
  if (!data[eventId]) data[eventId] = []

  const idx = data[eventId].indexOf(memberId)
  if (idx >= 0) {
    data[eventId].splice(idx, 1)
  } else {
    data[eventId].push(memberId)
  }

  await saveEventAttendance(data)
  return NextResponse.json({ ok: true })
}
