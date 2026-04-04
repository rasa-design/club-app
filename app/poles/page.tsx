export const dynamic = 'force-dynamic'

import { getPoles } from '@/lib/data'
import PoleList from '@/components/PoleList'

export default async function PolesPage() {
  const poles = await getPoles()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">ポール一覧</h2>
      <p className="text-xs text-gray-500 mb-4">クラブが保有するポールを確認できます</p>
      <PoleList initialPoles={poles} />
    </div>
  )
}
