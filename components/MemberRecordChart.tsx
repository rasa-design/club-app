'use client'

import { useRef, useState, useEffect } from 'react'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

type Props = { memberId: string }

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

type ChartPoint = { label: string; value: number; eventTitle: string }
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

export default function MemberRecordChart({ memberId }: Props) {
  const [points,  setPoints]  = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  // チャートの Y/X scale からピクセル座標を取得して HTML ラベルに使う
  const [yTicks, setYTicks] = useState<TickPx[]>([])
  const [xTicks, setXTicks] = useState<XTickPx[]>([])

  const chartRef = useRef<ChartJS<'line'>>(null)

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
    Promise.all([
      fetch('/api/events').then(r => r.json())        as Promise<Event[]>,
      fetch('/api/event-records').then(r => r.json()) as Promise<EventRecords>,
    ]).then(([events, records]) => {
      const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
      const pts: ChartPoint[] = []
      for (const event of sorted) {
        const record = records[event.id]?.[memberId]
        if (!record) continue
        const cm = parseHeightToCm(record)
        if (cm === null) continue
        const d     = new Date(event.date)
        const label = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
        pts.push({ label, value: cm, eventTitle: event.title })
      }
      setPoints(pts)
      setLoading(false)
    })
  }, [memberId])

  if (loading)          return <p className="text-sm text-muted-foreground text-center py-6">読み込み中…</p>
  if (!points.length)   return <p className="text-sm text-muted-foreground text-center py-6">記録がまだありません</p>

  const minColWidth = 72
  const chartWidth  = Math.max(320, points.length * minColWidth)
  const values      = points.map(p => p.value)
  const yMin        = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10)
  const yMax        = Math.ceil( Math.max(...values)  / 10) * 10 + 10

  const lineData = {
    labels: points.map(p => p.label),
    datasets: [{
      data: values,
      borderColor: '#6366f1', backgroundColor: '#6366f1',
      pointRadius: 5, pointHoverRadius: 7, tension: 0.3,
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
      <p className="text-xs text-muted-foreground mb-1">横にスクロールできます</p>

      {/* 単一の横スクロールコンテナ */}
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                plugins={[manualGridPlugin, readScalesPlugin]}
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

      {/* 記録一覧（グラフとは独立して縦スクロール） */}
      <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
        {points.map((p, i) => (
          <div key={i} className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground truncate">{p.label}　{p.eventTitle}</span>
            <span className="font-medium tabular-nums shrink-0">{formatCm(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
