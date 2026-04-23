"use client"

import { useEffect, useRef, useState } from "react"

const STORAGE_KEY = "update-last-visit-id"

export function useHasNewUpdates() {
  const [hasNew, setHasNew] = useState(false)
  // localStorageの読み取りをマウント時に1回だけ同期で行う
  const lastVisitId = useRef<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  )

  useEffect(() => {
    fetch("/update-history.json")
      .then((res) => {
        if (!res.ok) return
        return res.json()
      })
      .then((entries?: { id: string }[]) => {
        if (!entries || entries.length === 0) return
        const latestId = entries[0].id
        setHasNew(lastVisitId.current === null || latestId > lastVisitId.current)
      })
      .catch(() => {})

    // UpdateListがアップデートページへの訪問を記録したら既読に更新
    const handleRead = () => setHasNew(false)
    window.addEventListener('updates-read', handleRead)
    return () => window.removeEventListener('updates-read', handleRead)
  }, [])

  return hasNew
}
