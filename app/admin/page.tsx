import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export default async function AdminPage() {
  const session = await getSession()
  if (session.isAdmin) {
    redirect('/admin/dashboard')
  }
  return (
    <div className="max-w-sm mx-auto mt-10">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">管理者ログイン</h2>
      <LoginForm />
    </div>
  )
}
