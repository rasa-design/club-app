'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-gray-500 hover:text-red-500 transition-colors border border-gray-200 rounded-lg px-3 py-1"
    >
      ログアウト
    </button>
  )
}
