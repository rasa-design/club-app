export const dynamic = 'force-dynamic'

import { getPoles } from '@/lib/data'
import PoleList from '@/components/PoleList'
import { WandSparkles } from 'lucide-react'

export default async function PolesPage() {
  const poles = await getPoles()

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <WandSparkles className="h-5 w-5 shrink-0" style={{ color: '#E8503A' }} />
        <h2 className="text-xl font-bold text-gray-800">ポール一覧</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">クラブが保有するポールを確認できます</p>
      <PoleList initialPoles={poles} />
    </div>
  )
}
