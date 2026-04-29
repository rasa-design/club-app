import webpush from 'web-push'
import { readStorage, writeStorage } from './storage'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type PushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

const STORAGE_KEY = 'push-subscriptions'

export async function getSubscriptions(): Promise<PushSubscription[]> {
  return readStorage<PushSubscription[]>(STORAGE_KEY, [])
}

export async function saveSubscription(sub: PushSubscription): Promise<void> {
  const subs = await getSubscriptions()
  const exists = subs.some((s) => s.endpoint === sub.endpoint)
  if (!exists) {
    await writeStorage(STORAGE_KEY, [...subs, sub])
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const subs = await getSubscriptions()
  await writeStorage(STORAGE_KEY, subs.filter((s) => s.endpoint !== endpoint))
}

export async function sendPushToAll(payload: { title: string; body: string; url?: string }): Promise<void> {
  const subs = await getSubscriptions()
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(sub, JSON.stringify(payload))
    )
  )

  // 無効になったsubscriptionを削除
  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        expiredEndpoints.push(subs[i].endpoint)
      }
    }
  })
  if (expiredEndpoints.length > 0) {
    const fresh = subs.filter((s) => !expiredEndpoints.includes(s.endpoint))
    await writeStorage(STORAGE_KEY, fresh)
  }
}
