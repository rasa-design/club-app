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
