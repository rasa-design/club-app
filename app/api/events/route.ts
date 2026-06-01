import { NextRequest, NextResponse } from 'next/server'
import { getEvents, saveEvents, Event } from '@/lib/data'

export async function GET() {
  const events = await getEvents()
  return NextResponse.json(events, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
  })
}

export async function POST(req: NextRequest) {
  const body: Event = await req.json()
  const events = await getEvents()
  const newEvent: Event = { ...body, id: Date.now().toString() }
  events.push(newEvent)
  await saveEvents(events)
  return NextResponse.json(newEvent, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body: Event = await req.json()
  const events = await getEvents()
  const idx = events.findIndex((e) => e.id === body.id)
  if (idx === -1) return NextResponse.json({ error: '見つかりません' }, { status: 404 })
  events[idx] = { ...events[idx], ...body } // targetGrades など既存フィールドを保持
  await saveEvents(events)
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const events = (await getEvents()).filter((e) => e.id !== id)
  await saveEvents(events)
  return NextResponse.json({ ok: true })
}
