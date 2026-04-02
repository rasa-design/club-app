import { getSession } from '@/lib/session'
import LoginForm from '@/components/LoginForm'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminPage() {
  const session = await getSession()

  if (session.isAdmin) {
    return (
      <div className="max-w-sm mx-auto mt-10 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 text-center">管理者メニュー</h2>
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
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">管理者ログイン</h2>
      <LoginForm />
    </div>
  )
}
