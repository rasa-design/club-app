import { NextRequest, NextResponse } from 'next/server'
import { getPayments, savePayments } from '@/lib/data'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(getPayments())
}

// Toggle payment: { memberId, yearMonth, paid }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { memberId, yearMonth, paid }: { memberId: string; yearMonth: string; paid: boolean } =
    await req.json()

  const payments = getPayments()
  if (!payments[memberId]) {
    payments[memberId] = {}
  }
  if (paid) {
    payments[memberId][yearMonth] = true
  } else {
    delete payments[memberId][yearMonth]
  }
  savePayments(payments)
  return NextResponse.json({ ok: true })
}
