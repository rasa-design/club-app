import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 })
  }

  const session = await getSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}
