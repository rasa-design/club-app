import { NextRequest, NextResponse } from 'next/server'
import { getInsurancePayments, saveInsurancePayments } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await getInsurancePayments())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { memberId, schoolYear, status, month }: {
    memberId: string
    schoolYear: string
    status: 'paid' | 'withdrawn' | 'clear'
    month?: number
  } = await req.json()

  const data = await getInsurancePayments()
  if (!data[memberId]) data[memberId] = {}

  if (status === 'clear') {
    delete data[memberId][schoolYear]
  } else if (status === 'paid' && month !== undefined) {
    data[memberId][schoolYear] = month
  } else if (status === 'withdrawn') {
    data[memberId][schoolYear] = '退会'
  }

  await saveInsurancePayments(data)
  return NextResponse.json({ ok: true })
}
