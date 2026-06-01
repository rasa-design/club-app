'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { ChartOptions, Plugin } from 'chart.js'
import type { Event, EventRecords } from '@/lib/data'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

type Props = {
  memberId: string
  goalCm?: number | null
  onEventClick?: (eventId: string) => void
  events?: Event[]
  eventRecords?: EventRecords
}

// ── ヘルパー ─────────────────────────────────────────────────────────────

function parseHeightToCm(raw: string): number | null {
  const s = raw.trim()
  const meterCm   = s.match(/^(\d+)m(\d+(?:\.\d+)?)cm$/)
  if (meterCm)    return Math.round(Number(meterCm[1])   * 100 + Number(meterCm[2]))
  const meterOnly = s.match(/^(\d+)m(\d+(?:\.\d+)?)$/)
  if (meterOnly)  return Math.round(Number(meterOnly[1]) * 100 + Number(meterOnly[2]))
  const cmOnly    = s.match(/^(\d+(?:\.\d+)?)cm$/)
  if (cmOnly)     return Math.round(Number(cmOnly[1]))
  const decimal   = s.match(/^(\d+)\.(\d+)$/)
  if (decimal)    return Math.round(Number(s) * 100)
  return null
}

function formatCm(cm: number): string {
  const m    = Math.floor(cm / 100)
  const rest = cm % 100
  return rest === 0 ? `${m}m` : `${m}m${rest}cm`
}

type ChartPoint = { label: string; value: number; eventTitle: string; isPb: boolean }
type ListItem   =
  | { kind: 'record'; label: string; eventTitle: string; value: number; eventId: string; isPb: boolean }
  | { kind: 'NM' | 'DNS'; label: string; eventTitle: string; eventId: string }
type TickPx     = { value: number; px: number }
type XTickPx    = { label: string;  px: number }

// ── 定数 ────────────────────────────────────────────────────────────────

const CHART_HEIGHT  = 240
const X_AXIS_HEIGHT = 36
const Y_AXIS_WIDTH  = 72
const CHART_PADDING = 14  // データチャートの上下 padding

// ── グリッドプラグイン（モジュールスコープで固定） ────────────────────────
// Y/X 両軸を display:false にした上で、チャート自身の scale から
// ピクセル座標を取得してグリッド線を描画する。

const manualGridPlugin: Plugin<'line'> = {
  id: 'manualGrid',
  beforeDatasetsDraw(chart) {
    const xs = chart.scales['x']
    const ys = chart.scales['y']
    if (!xs || !ys) return
    const { ctx } = chart
    const { left, right, top, bottom } = chart.chartArea

    ctx.save()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth   = 1

    ys.ticks.forEach((_, i) => {
      const y = ys.getPixelForTick(i)
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke()
    })
    xs.ticks.forEach((_, i) => {
      const x = xs.getPixelForTick(i)
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke()
    })

    ctx.restore()
  },
}

// ── コンポーネント ──────────────────────────────────────────────────────

export default function MemberRecordChart({ memberId, goalCm, onEventClick, events: eventsProp, eventRecords: eventRecordsProp }: Props) {
  const router = useRouter()
  const [points,    setPoints]    = useState<ChartPoint[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [loading,   setLoading]   = useState(true)

  // チャートの Y/X scale からピクセル座標を取得して HTML ラベルに使う
  const [yTicks, setYTicks] = useState<TickPx[]>([])
  const [xTicks, setXTicks] = useState<XTickPx[]>([])

  const chartRef = useRef<ChartJS<'line'>>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pbIndexRef = useRef<number>(-1)
  const goalCmRef = useRef<number | null | undefined>(goalCm)
  useEffect(() => {
    goalCmRef.current = goalCm
    chartRef.current?.update('none')
  }, [goalCm])

  const pbStarPlugin = useRef<Plugin<'line'>>({
    id: 'pbStar',
    afterDatasetsDraw(chart) {
      const idx = pbIndexRef.current
      if (idx < 0) return
      const meta = chart.getDatasetMeta(0)
      const pt = meta.data[idx]
      if (!pt) return
      const { x, y } = pt.getProps(['x', 'y'], true) as { x: number; y: number }
      const { ctx } = chart
      const outerR = 10, innerR = outerR * 0.42, spikes = 5
      let angle = -Math.PI / 2
      const step = Math.PI / spikes
      ctx.save()
      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r)
        angle += step
      }
      ctx.closePath()
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.restore()
    },
  }).current

  const goalLinePlugin = useRef<Plugin<'line'>>({
    id: 'goalLine',
    afterDatasetsDraw(chart) {
      const goal = goalCmRef.current
      if (!goal) return
      const ys = chart.scales['y']
      if (!ys) return
      if (goal < ys.min || goal > ys.max) return
      const { ctx } = chart
      const { left, right } = chart.chartArea
      const y = ys.getPixelForValue(goal)
      ctx.save()
      ctx.strokeStyle = '#3BBFAD'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke()
      ctx.restore()
    },
  }).current

  // afterRender で scale のピクセル座標を読み取り HTML ラベルを更新する。
  // useRef で固定することで毎レンダーに新しいオブジェクトが生まれるのを防ぐ。
  // 比較して変化なければ prev を返すことで無限ループを防ぐ。
  const readScalesPlugin = useRef<Plugin<'line'>>({
    id: 'readScales',
    afterRender(chart) {
      const ys = chart.scales['y']
      const xs = chart.scales['x']
      if (!ys || !xs) return

      const newY: TickPx[]  = ys.ticks.map((t, i) => ({ value: t.value as number, px: ys.getPixelForTick(i) }))
      const newX: XTickPx[] = xs.ticks.map((t, i) => ({
        label: Array.isArray(t.label) ? (t.label[0] as string) : String(t.label ?? ''),
        px: xs.getPixelForTick(i),
      }))

      setYTicks(prev =>
        prev.length === newY.length && prev.every((t, i) => t.px === newY[i].px && t.value === newY[i].value)
          ? prev : newY
      )
      setXTicks(prev =>
        prev.length === newX.length && prev.every((t, i) => t.px === newX[i].px && t.label === newX[i].label)
          ? prev : newX
      )
    },
  }).current

  useEffect(() => {
    function process(events: Event[], records: EventRecords) {
      const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
      const pts:   ChartPoint[] = []
      const items: ListItem[]   = []
      for (const event of sorted) {
        const record = records[event.id]?.[memberId]
        if (!record) continue
        const d     = new Date(event.date)
        const label = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
        if (record === 'NM' || record === 'DNS') {
          items.push({ kind: record, label, eventTitle: event.title, eventId: event.id })
        } else {
          const cm = parseHeightToCm(record)
          if (cm === null) continue
          pts.push({ label, value: cm, eventTitle: event.title, isPb: false })
          items.push({ kind: 'record', label, eventTitle: event.title, value: cm, eventId: event.id, isPb: false })
        }
      }
      // 全記録中の最高値のみ自己ベストとしてマーク
      if (pts.length > 0) {
        const maxVal = Math.max(...pts.map(p => p.value))
        const firstPbIdx = pts.map((p, i) => p.value === maxVal ? i : -1).filter(i => i >= 0).at(0)!
        pts[firstPbIdx].isPb = true
        const listRecord = items.filter((it): it is ListItem & { kind: 'record' } => it.kind === 'record')
        const firstListPbIdx = listRecord.map((it, i) => it.value === maxVal ? i : -1).filter(i => i >= 0).at(0)
        if (firstListPbIdx !== undefined) listRecord[firstListPbIdx].isPb = true
      }
      setPoints(pts)
      setListItems(items)
      setLoading(false)
      // データ確定後、スクロール位置を右端に移動
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
      })
    }

    if (eventsProp && eventRecordsProp) {
      process(eventsProp, eventRecordsProp)
      return
    }

    Promise.all([
      fetch('/api/events').then(r => r.json())        as Promise<Event[]>,
      fetch('/api/event-records').then(r => r.json()) as Promise<EventRecords>,
    ]).then(([events, records]) => process(events, records))
  }, [memberId, eventsProp, eventRecordsProp])

  // xTicks 更新（チャート描画完了）のタイミングで右端スクロールを確定
  useEffect(() => {
    if (xTicks.length > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [xTicks])

  // 大会リストが揃ったら /payments ページをプリフェッチ（遷移を高速化）
  useEffect(() => {
    if (!onEventClick || listItems.length === 0) return
    listItems.forEach(item => {
      router.prefetch(`/payments?event=${item.eventId}&member=${memberId}&from=members`)
    })
  }, [listItems, memberId, onEventClick, router])

  if (loading)            return <p className="text-sm text-muted-foreground text-center py-6">読み込み中…</p>
  if (!listItems.length)  return <p className="text-sm text-muted-foreground text-center py-6">記録がまだありません</p>

  const minColWidth = 72
  const chartWidth  = Math.max(320, points.length * minColWidth)
  const values      = points.map(p => p.value)
  const yMin        = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10)
  const yMaxBase    = Math.max(...values, goalCm ?? 0)
  const yMax        = Math.ceil(yMaxBase / 10) * 10 + 10

  // PBインデックスをプラグインに伝える
  pbIndexRef.current = points.findIndex(p => p.isPb)

  const lineData = {
    labels: points.map(p => p.label),
    datasets: [{
      data: values,
      borderColor: '#6366f1', backgroundColor: '#6366f1',
      // PBポイントはカスタムプラグインで描画するため非表示
      pointRadius:      points.map(p => p.isPb ? 0 : 5),
      pointHoverRadius: points.map(p => p.isPb ? 0 : 7),
      pointHitRadius: 24, tension: 0,
    }],
  }

  const dataOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    layout: { padding: { top: CHART_PADDING, bottom: CHART_PADDING, left: 0, right: 8 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => points[items[0].dataIndex].eventTitle,
          label: (item: { raw: unknown }) => formatCm(item.raw as number),
        },
      },
    },
    scales: {
      // 両軸とも display:false でゼロサイズ化。
      // グリッドは manualGridPlugin、ラベルは HTML で描画。
      x: { display: false },
      y: { display: false, min: yMin, max: yMax, ticks: { stepSize: 10 } },
    },
  }

  return (
    <div>
      {points.length > 0 && <>
      <p className="text-xs text-muted-foreground mb-1">横にスクロールできます</p>

      {/* 単一の横スクロールコンテナ */}
      <div ref={scrollRef} className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: chartWidth + Y_AXIS_WIDTH }}>

          {/* ── チャート行 ── */}
          <div style={{ display: 'flex', height: CHART_HEIGHT }}>

            {/*
              Y軸ラベル（HTML）
              position:sticky + left:0 で横スクロール時に左端に固定。
              ラベル座標は afterRender で読んだ chart.scales.y のピクセル値をそのまま使うため
              グリッド線と完全に一致する。
            */}
            <div style={{ position: 'sticky', left: 0, zIndex: 10, width: Y_AXIS_WIDTH, flexShrink: 0, background: 'white' }}>
              <div style={{ position: 'relative', height: CHART_HEIGHT }}>
                {/* 右ボーダー */}
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: '#e5e7eb' }} />
                {yTicks.map((tick, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: tick.px,
                      transform: 'translateY(-50%)',
                      fontSize: 11,
                      lineHeight: 1,
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCm(tick.value)}
                  </div>
                ))}
              </div>
            </div>

            {/* データチャート（軸なし・グリッドのみ） */}
            <div style={{ width: chartWidth, flexShrink: 0, height: CHART_HEIGHT }}>
              <Line
                ref={chartRef}
                data={lineData}
                options={dataOptions}
                plugins={[manualGridPlugin, readScalesPlugin, goalLinePlugin, pbStarPlugin]}
              />
            </div>
          </div>

          {/* ── X軸ラベル行 ── */}
          <div style={{ display: 'flex', height: X_AXIS_HEIGHT }}>

            {/* Y軸幅分のスペーサー（Y軸エリアと揃える・sticky で固定） */}
            <div style={{ position: 'sticky', left: 0, zIndex: 10, width: Y_AXIS_WIDTH, flexShrink: 0, background: 'white' }} />

            {/* X軸ラベル（HTML、チャートと同幅で自動的に横スクロールに追従） */}
            <div style={{ width: chartWidth, flexShrink: 0, position: 'relative', height: X_AXIS_HEIGHT }}>
              {xTicks.map((tick, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: tick.px,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 11,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tick.label}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      </>}

      {/* 記録一覧（グラフとは独立して縦スクロール） */}
      <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
        {[...listItems].reverse().map((item, i) => (
          <button
            key={i}
            className={cn(
              'flex items-center gap-2 w-full text-left text-sm px-3 py-3 rounded-lg',
              onEventClick ? 'active:bg-muted cursor-pointer' : 'cursor-default'
            )}
            onClick={() => onEventClick?.(item.eventId)}
            disabled={!onEventClick}
          >
            <span className="text-muted-foreground truncate flex-1">{item.label}　{item.eventTitle}</span>
            {item.kind === 'record' ? (
              <span className="flex items-center gap-1 shrink-0">
                <span className="font-medium tabular-nums">{formatCm(item.value)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground font-mono shrink-0">{item.kind}</span>
            )}
            {onEventClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}
