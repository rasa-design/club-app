/**
 * ストレージ抽象化
 * - ローカル開発: data/*.json ファイル（既存の動作を維持）
 * - Vercel本番: Vercel KV（Upstash Redis）
 */

const useKV = !!process.env.KV_REST_API_URL

export async function readStorage<T>(key: string, fallback: T): Promise<T> {
  if (useKV) {
    const { kv } = await import('@vercel/kv')
    const val = await kv.get<T>(key)
    return val ?? fallback
  }
  // ローカル: ファイルシステム
  const fs = await import('fs')
  const path = await import('path')
  const file = path.join(process.cwd(), 'data', `${key}.json`)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export async function writeStorage<T>(key: string, data: T): Promise<void> {
  if (useKV) {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, data)
    return
  }
  // ローカル: ファイルシステム
  const fs = await import('fs')
  const path = await import('path')
  const file = path.join(process.cwd(), 'data', `${key}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}
