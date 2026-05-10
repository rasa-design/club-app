import { NextRequest, NextResponse } from 'next/server'
import { getEventExtraPoles, saveEventExtraPoles, Pole } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getEventExtraPoles())
}

export async function POST(req: NextRequest) {
  const { eventId, poles }: { eventId: string; poles: Pole[] } = await req.json()
  const data = await getEventExtraPoles()
  data[eventId] = poles
  await saveEventExtraPoles(data)
  return NextResponse.json({ ok: true })
}
