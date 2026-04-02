import { NextRequest, NextResponse } from 'next/server'
import { getPayments, savePayments, PaymentStatus } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await getPayments())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { memberId, yearMonth, status }: {
    memberId: string; yearMonth: string; status: 'paid' | 'withdrawn' | 'clear'
  } = await req.json()

  const payments = await getPayments()
  if (!payments[memberId]) payments[memberId] = {}

  if (status === 'clear') {
    delete payments[memberId][yearMonth]
  } else {
    const value: PaymentStatus = status === 'paid' ? true : '退会'
    payments[memberId][yearMonth] = value
  }

  await savePayments(payments)
  return NextResponse.json({ ok: true })
}
