import { NextRequest, NextResponse } from 'next/server'
import { getEventTrialRecords, saveEventTrialRecords, MemberTrialData } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getEventTrialRecords())
}

export async function POST(req: NextRequest) {
  const { eventId, memberId, data }: {
    eventId: string
    memberId: string
    data: MemberTrialData
  } = await req.json()

  const records = await getEventTrialRecords()
  if (!records[eventId]) records[eventId] = {}
  records[eventId][memberId] = data

  await saveEventTrialRecords(records)
  return NextResponse.json({ ok: true })
}
