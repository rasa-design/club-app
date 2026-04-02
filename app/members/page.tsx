export const dynamic = 'force-dynamic'

import { getMembers, getLatestMembersYear } from '@/lib/data'
import MemberList from '@/components/MemberList'

export default async function MembersPage() {
  const year = await getLatestMembersYear()
  const members = await getMembers(year)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">クラブ生一覧</h2>
      <p className="text-xs text-gray-500 mb-4">在籍メンバーを確認できます</p>
      <MemberList members={members} initialYear={year} />
    </div>
  )
}
