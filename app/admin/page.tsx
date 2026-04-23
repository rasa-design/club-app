import { getSession } from '@/lib/session'
import LoginForm from '@/components/LoginForm'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export default async function AdminPage() {
  const session = await getSession()

  if (session.isAdmin) {
    return (
      <div className="max-w-sm mx-auto mt-10 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 shrink-0" style={{ color: '#F7D33E' }} />
          <h2 className="text-xl font-bold text-gray-800">管理者メニュー</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center">ログイン済みです</p>
        <div className="flex flex-col gap-2">
          <Link href="/admin/dashboard">
            <Button size="lg" className="w-full">管理者ダッシュボードへ</Button>
          </Link>
          <LogoutButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Lock className="h-5 w-5 shrink-0" style={{ color: '#F7D33E' }} />
        <h2 className="text-xl font-bold text-gray-800">管理者ログイン</h2>
      </div>
      <LoginForm />
    </div>
  )
}
