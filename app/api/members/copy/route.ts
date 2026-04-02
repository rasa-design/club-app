import { NextRequest, NextResponse } from 'next/server'
import { getMembersData, saveMembersData } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { fromYear, toYear }: { fromYear: number; toYear: number } = await req.json()
  const data = await getMembersData()
  const fromKey = String(fromYear)
  const toKey = String(toYear)

  if (data[toKey] && data[toKey].length > 0) {
    return NextResponse.json({ error: `${toYear}年度にはすでに部員データが存在します` }, { status: 409 })
  }

  const source = data[fromKey] ?? []
  if (source.length === 0) {
    return NextResponse.json({ error: `${fromYear}年度の部員データがありません` }, { status: 404 })
  }

  data[toKey] = source.map((m) => ({ ...m, grade: Math.min(m.grade + 1, 16) }))
  await saveMembersData(data)
  return NextResponse.json(data[toKey])
}
