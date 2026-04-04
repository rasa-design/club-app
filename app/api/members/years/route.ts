import { NextResponse } from 'next/server'
import { getMembersData, currentSchoolYear } from '@/lib/data'

// データが存在する年度一覧 + 来年度（1〜3月は翌々年度も）を返す
export async function GET() {
  const data = await getMembersData()
  const existingYears = Object.keys(data)
    .map(Number)
    .filter((y) => data[String(y)].length > 0)

  const cur = currentSchoolYear()
  const calMonth = new Date().getMonth() + 1 // 1〜12
  const base = [cur]
  // 1〜3月のみ翌年度を追加（新年度準備期間）
  if (calMonth <= 3) base.push(cur + 1)

  const allYears = Array.from(new Set([...existingYears, ...base])).sort((a, b) => a - b)

  return NextResponse.json(allYears)
}
