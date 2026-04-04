import { NextRequest, NextResponse } from 'next/server'
import { getEventRecords, saveEventRecords } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getEventRecords())
}

export async function POST(req: NextRequest) {
  const { eventId, memberId, record }: {
    eventId: string
    memberId: string
    record: string
  } = await req.json()

  const data = await getEventRecords()
  if (!data[eventId]) data[eventId] = {}

  if (record.trim() === '') {
    delete data[eventId][memberId]
  } else {
    data[eventId][memberId] = record.trim()
  }

  await saveEventRecords(data)
  return NextResponse.json({ ok: true })
}
