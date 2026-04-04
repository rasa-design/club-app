import { NextRequest, NextResponse } from 'next/server'
import { getEventPoles, saveEventPoles } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getEventPoles())
}

export async function POST(req: NextRequest) {
  const { eventId, memberId, poleIds }: {
    eventId: string
    memberId: string
    poleIds: string[]
  } = await req.json()

  const data = await getEventPoles()
  if (!data[eventId]) data[eventId] = {}
  data[eventId][memberId] = poleIds

  await saveEventPoles(data)
  return NextResponse.json({ ok: true })
}
