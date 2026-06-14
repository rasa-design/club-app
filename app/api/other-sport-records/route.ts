import { NextRequest, NextResponse } from 'next/server'
import { getOtherSportRecords, saveOtherSportRecords, OtherSportRecord } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getOtherSportRecords())
}

export async function POST(req: NextRequest) {
  const { memberId, record }: { memberId: string; record: OtherSportRecord } = await req.json()
  const data = await getOtherSportRecords()
  data[memberId] = [...(data[memberId] ?? []), record]
  await saveOtherSportRecords(data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { memberId, recordId }: { memberId: string; recordId: string } = await req.json()
  const data = await getOtherSportRecords()
  data[memberId] = (data[memberId] ?? []).filter(r => r.id !== recordId)
  await saveOtherSportRecords(data)
  return NextResponse.json({ ok: true })
}
