import { NextRequest, NextResponse } from 'next/server'
import { getMembersData, saveMembersData, Member, currentSchoolYear } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get('year') ?? currentSchoolYear())
  const data = await getMembersData()
  return NextResponse.json(data[String(year)] ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const body: Omit<Member, 'id'> & { year: number } = await req.json()
  const { year, ...memberFields } = body
  const data = await getMembersData()
  const yearKey = String(year)
  const newMember: Member = { ...memberFields, id: Date.now().toString() }
  data[yearKey] = [...(data[yearKey] ?? []), newMember]
  await saveMembersData(data)
  return NextResponse.json(newMember, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { id, year, name, kana, grade }: { id: string; year: number; name?: string; kana?: string; grade?: number } = await req.json()
  const data = await getMembersData()
  const yearKey = String(year)
  const members = data[yearKey] ?? []
  const idx = members.findIndex(m => m.id === id)
  if (idx === -1) return NextResponse.json({ error: 'メンバーが見つかりません' }, { status: 404 })

  const updated: Member = {
    ...members[idx],
    ...(name  !== undefined ? { name }  : {}),
    ...(kana  !== undefined ? { kana: kana.trim() || undefined } : {}),
    ...(grade !== undefined ? { grade } : {}),
  }
  members[idx] = updated
  data[yearKey] = members
  await saveMembersData(data)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { id, year } = await req.json()
  const data = await getMembersData()
  const yearKey = String(year)
  data[yearKey] = (data[yearKey] ?? []).filter((m) => m.id !== id)
  await saveMembersData(data)
  return NextResponse.json({ ok: true })
}
