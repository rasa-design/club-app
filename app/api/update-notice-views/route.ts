import { NextRequest, NextResponse } from 'next/server'
import { readStorage, writeStorage } from '@/lib/storage'

const KEY = 'update-notice-views'

export async function GET() {
  const counts = await readStorage<Record<string, number>>(KEY, {})
  return NextResponse.json(counts)
}

export async function POST(req: NextRequest) {
  const { id }: { id: string } = await req.json()
  const counts = await readStorage<Record<string, number>>(KEY, {})
  counts[id] = (counts[id] ?? 0) + 1
  await writeStorage(KEY, counts)
  return NextResponse.json({ ok: true })
}
