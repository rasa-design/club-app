export const dynamic = 'force-dynamic'

import { getMembers, getLatestMembersYear } from '@/lib/data'
import MemberList from '@/components/MemberList'
import { Users } from 'lucide-react'

export default async function MembersPage() {
  const year = await getLatestMembersYear()
  const members = await getMembers(year)

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-5 w-5 shrink-0" style={{ color: '#7C5CBF' }} />
        <h2 className="text-xl font-bold text-gray-800">クラブ生一覧</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">在籍メンバーを確認できます</p>
      <MemberList members={members} initialYear={year} />
    </div>
  )
}
