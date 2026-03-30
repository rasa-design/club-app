import { NextRequest, NextResponse } from 'next/server'
import { getEvents, saveEvents, Event } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  const events = getEvents()
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const body: Event = await req.json()
  const events = getEvents()
  const newEvent: Event = {
    ...body,
    id: Date.now().toString(),
  }
  events.push(newEvent)
  saveEvents(events)
  return NextResponse.json(newEvent, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const body: Event = await req.json()
  const events = getEvents()
  const idx = events.findIndex((e) => e.id === body.id)
  if (idx === -1) {
    return NextResponse.json({ error: '見つかりません' }, { status: 404 })
  }
  events[idx] = body
  saveEvents(events)
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { id } = await req.json()
  const events = getEvents().filter((e) => e.id !== id)
  saveEvents(events)
  return NextResponse.json({ ok: true })
}
