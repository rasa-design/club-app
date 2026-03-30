import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">クラブ管理アプリ</h1>
      <p className="text-gray-500 text-sm">保護者の方はメニューから確認できます。</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-6">
        <Link
          href="/calendar"
          className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">📅</span>
          <div>
            <div className="font-semibold text-gray-800">大会カレンダー</div>
            <div className="text-xs text-gray-500 mt-0.5">年間の大会・行事を確認</div>
          </div>
        </Link>

        <Link
          href="/payments"
          className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">💴</span>
          <div>
            <div className="font-semibold text-gray-800">月謝一覧</div>
            <div className="text-xs text-gray-500 mt-0.5">支払い状況を確認</div>
          </div>
        </Link>

        <Link
          href="/admin"
          className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow sm:col-span-2"
        >
          <span className="text-3xl">🔐</span>
          <div>
            <div className="font-semibold text-gray-800">管理者ログイン</div>
            <div className="text-xs text-gray-500 mt-0.5">会計係・カレンダー管理用</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
