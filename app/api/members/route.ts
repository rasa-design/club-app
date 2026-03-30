import { NextRequest, NextResponse } from 'next/server'
import { getMembers, saveMembers, Member } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(getMembers())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const body: Omit<Member, 'id'> = await req.json()
  const members = getMembers()
  const newMember: Member = { ...body, id: Date.now().toString() }
  members.push(newMember)
  saveMembers(members)
  return NextResponse.json(newMember, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { id } = await req.json()
  saveMembers(getMembers().filter((m) => m.id !== id))
  return NextResponse.json({ ok: true })
}
