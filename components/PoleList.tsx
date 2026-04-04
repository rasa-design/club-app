'use client'

import { useState } from 'react'
import { Pole } from '@/lib/data'
import { Badge } from '@/components/ui/badge'

function parseSize(size: string): { length: number; weight: number } {
  const [l, w] = size.split('-').map(Number)
  return { length: l ?? 0, weight: w ?? 0 }
}

function sortPoles(poles: Pole[]): Pole[] {
  return [...poles].sort((a, b) => {
    const pa = parseSize(a.size)
    const pb = parseSize(b.size)
    if (pa.length !== pb.length) return pa.length - pb.length
    return pa.weight - pb.weight
  })
}

function groupPoles(poles: Pole[]): { size: string; poles: Pole[] }[] {
  const map = new Map<string, Pole[]>()
  for (const pole of sortPoles(poles)) {
    const arr = map.get(pole.size) ?? []
    arr.push(pole)
    map.set(pole.size, arr)
  }
  return Array.from(map.entries()).map(([size, poles]) => ({ size, poles }))
}

export default function PoleList({ initialPoles }: { initialPoles: Pole[] }) {
  const [poles] = useState<Pole[]>(initialPoles)
  const groups = groupPoles(poles)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        計 <span className="font-semibold text-foreground">{poles.length}</span> 本
        （<span className="font-semibold text-foreground">{groups.length}</span> サイズ）
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">ポールが登録されていません</p>
      ) : (
        <div className="space-y-2">
          {groups.map(({ size, poles: groupPoles }) => (
            <div key={size} className="rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <span className="font-mono font-semibold text-base tracking-wide">{size}</span>
                <Badge variant="secondary" className="text-xs">
                  {groupPoles.length}本
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
