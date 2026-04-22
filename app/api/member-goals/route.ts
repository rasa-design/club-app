import { NextRequest, NextResponse } from 'next/server'
import { getMemberGoals, saveMemberGoals } from '@/lib/data'

export async function GET() {
  return NextResponse.json(await getMemberGoals())
}

export async function POST(req: NextRequest) {
  const { memberId, goal }: { memberId: string; goal: string } = await req.json()

  const data = await getMemberGoals()

  if (goal.trim() === '') {
    delete data[memberId]
  } else {
    data[memberId] = goal.trim()
  }

  await saveMemberGoals(data)
  return NextResponse.json({ ok: true })
}
