import { Megaphone } from 'lucide-react'
import UpdateList from '@/components/UpdateList'

type UpdateEntry = {
  id: string
  date: string
  title: string
  body: string
}

async function getHistory(): Promise<UpdateEntry[]> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/update-history.json`, { cache: 'no-store' })
  return res.json()
}

export default async function UpdatesPage() {
  const history = await getHistory()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">アップデート情報</h1>
      </div>
      <UpdateList entries={history} />
    </div>
  )
}
