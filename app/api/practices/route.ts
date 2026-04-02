import { NextRequest, NextResponse } from 'next/server'
import { getPractices, savePractices, PracticeSlot } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await getPractices())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { date, start, end }: { date: string; start: string; end: string } = await req.json()
  const practices = await getPractices()
  const slot: PracticeSlot = { id: Date.now().toString(), start, end }
  practices[date] = [...(practices[date] ?? []), slot]
  await savePractices(practices)
  return NextResponse.json(slot, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { date, id }: { date: string; id: string } = await req.json()
  const practices = await getPractices()
  if (practices[date]) {
    practices[date] = practices[date].filter((s) => s.id !== id)
    if (practices[date].length === 0) delete practices[date]
  }
  await savePractices(practices)
  return NextResponse.json({ ok: true })
}
