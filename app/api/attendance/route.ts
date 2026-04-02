import { NextRequest, NextResponse } from 'next/server'
import { getAttendance, saveAttendance } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getAttendance())
}

export async function POST(req: NextRequest) {
  const { date, memberId, start, end }: {
    date: string; memberId: string; start: string; end: string
  } = await req.json()

  const attendance = await getAttendance()
  if (!attendance[date]) attendance[date] = {}
  attendance[date][memberId] = { start, end }
  await saveAttendance(attendance)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { date, memberId }: { date: string; memberId: string } = await req.json()
  const attendance = await getAttendance()
  if (attendance[date]) {
    delete attendance[date][memberId]
    if (Object.keys(attendance[date]).length === 0) delete attendance[date]
  }
  await saveAttendance(attendance)
  return NextResponse.json({ ok: true })
}
