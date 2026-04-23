import { Megaphone } from 'lucide-react'
import UpdateList from '@/components/UpdateList'
import { readFile } from 'fs/promises'
import path from 'path'

type UpdateEntry = {
  id: string
  date: string
  title: string
  body: string
}

async function getHistory(): Promise<UpdateEntry[]> {
  const filePath = path.join(process.cwd(), 'public', 'update-history.json')
  const json = await readFile(filePath, 'utf-8')
  return JSON.parse(json)
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
