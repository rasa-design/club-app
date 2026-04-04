import { NextRequest, NextResponse } from 'next/server'
import { getPoles, savePoles, Pole } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await getPoles())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { size }: { size: string } = await req.json()
  const poles = await getPoles()
  const newPole: Pole = { id: Date.now().toString(), size: size.trim() }
  poles.push(newPole)
  await savePoles(poles)
  return NextResponse.json(newPole, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { id } = await req.json()
  const poles = (await getPoles()).filter((p) => p.id !== id)
  await savePoles(poles)
  return NextResponse.json({ ok: true })
}
