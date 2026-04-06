'use client'

import { Nunito } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-nunito',
})

const ACCENTS = ['#7C5CBF', '#F4A62A', '#3BBFAD', '#E85FA0', '#F7D33E', '#5BB8F5', '#E8503A', '#4CAF82']

// スペースを含む文字列。スペースはそのまま出力、文字にグラデーションを適用
const CHARS: {
  char: string
  accent?: string
  angle?: number
  from?: number
  to?: number
}[] = [
  { char: 'G', accent: ACCENTS[0], angle: 110, from: 45, to: 68 },
  { char: 'i', accent: ACCENTS[1], angle:  90, from: 15, to: 45 },
  { char: 'f', accent: ACCENTS[2], angle: 135, from: 55, to: 80 },
  { char: 'u', accent: ACCENTS[3], angle:  80, from: 30, to: 55 },
  { char: ' ' },
  { char: 'P', accent: ACCENTS[4], angle: 120, from: 20, to: 48 },
  { char: 'o', accent: ACCENTS[5], angle:  70, from: 60, to: 82 },
  { char: 'l', accent: ACCENTS[6], angle:  90, from: 35, to: 65 },
  { char: 'e', accent: ACCENTS[7], angle: 100, from: 40, to: 65 },
  { char: ' ' },
  { char: 'V', accent: ACCENTS[7], angle: 130, from: 25, to: 50 },
  { char: 'a', accent: ACCENTS[2], angle:  85, from: 50, to: 75 },
  { char: 'u', accent: ACCENTS[4], angle: 115, from: 20, to: 45 },
  { char: 'l', accent: ACCENTS[6], angle:  90, from: 55, to: 80 },
  { char: 't', accent: ACCENTS[1], angle: 105, from: 30, to: 55 },
  { char: 'e', accent: ACCENTS[5], angle:  95, from: 40, to: 65 },
  { char: 'r', accent: ACCENTS[3], angle:  85, from: 25, to: 50 },
  { char: 's', accent: ACCENTS[1], angle: 110, from: 50, to: 75 },
  { char: ' ' },
  { char: 'C', accent: ACCENTS[5], angle: 125, from: 45, to: 70 },
  { char: 'l', accent: ACCENTS[3], angle:  90, from: 20, to: 50 },
  { char: 'u', accent: ACCENTS[7], angle:  95, from: 55, to: 78 },
  { char: 'b', accent: ACCENTS[0], angle: 115, from: 35, to: 60 },
]

export default function LogoText({ className }: { className?: string }) {
  return (
    <span
      className={`${nunito.className} ${className ?? ''}`}
      aria-label="Gifu Pole Vaulters Club"
    >
      {CHARS.map((c, i) => {
        if (c.char === ' ') {
          return <span key={i}>&nbsp;</span>
        }

        const gradient = [
          `linear-gradient(`,
          `${c.angle}deg,`,
          `var(--muted-foreground) 0%,`,
          `var(--muted-foreground) ${c.from}%,`,
          `${c.accent} ${c.from}%,`,
          `${c.accent} ${c.to}%,`,
          `var(--muted-foreground) ${c.to}%,`,
          `var(--muted-foreground) 100%`,
          `)`,
        ].join(' ')

        return (
          <span
            key={i}
            style={{
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}
          >
            {c.char}
          </span>
        )
      })}
    </span>
  )
}
