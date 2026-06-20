'use client'

import { useState, useEffect, useRef } from 'react'

type CharDef = { char: string; accent: string; angle: number; from: number; to: number }

const POLE_CHARS: CharDef[] = [
  { char: 'P', accent: 'var(--color-feature-admin)',    angle: 120, from: 20, to: 48 },
  { char: 'o', accent: 'var(--color-hero-sky)',         angle:  70, from: 60, to: 82 },
  { char: 'l', accent: 'var(--color-feature-poles)',    angle:  90, from: 35, to: 65 },
  { char: 'e', accent: 'var(--color-hero-green)',       angle: 100, from: 40, to: 65 },
]

const VAULT_CHARS: CharDef[] = [
  { char: 'V', accent: 'var(--color-feature-members)',  angle: 130, from: 25, to: 50 },
  { char: 'a', accent: 'var(--color-feature-calendar)', angle:  85, from: 50, to: 75 },
  { char: 'u', accent: 'var(--color-feature-admin)',    angle: 115, from: 20, to: 45 },
  { char: 'l', accent: 'var(--color-feature-poles)',    angle:  90, from: 55, to: 80 },
  { char: 't', accent: 'var(--color-hero-amber)',       angle: 105, from: 30, to: 55 },
]

// Pole: e→l→o→P の順（index 3,2,1,0）
const POLE_ORDER = [3, 2, 1, 0]
// Vault: V→a→u→l→t の順（index 0,1,2,3,4）
const VAULT_ORDER = [0, 1, 2, 3, 4]
const THRESHOLDS = [8, 16, 24, 32, 40]

function GradientChar({ char, accent, angle, from, to, flying }: CharDef & { flying: boolean }) {
  const gradient = [
    `linear-gradient(${angle}deg,`,
    `var(--muted-foreground) 0%, var(--muted-foreground) ${from}%,`,
    `${accent} ${from}%, ${accent} ${to}%,`,
    `var(--muted-foreground) ${to}%, var(--muted-foreground) 100%)`,
  ].join(' ')

  return (
    <span style={{
      display: 'inline-block',
      transform: flying ? 'translateY(-200px)' : 'translateY(0px)',
      opacity: flying ? 0 : 1,
      transition: `transform var(--dur-medium) var(--ease-standard), opacity var(--dur-medium) var(--ease-standard)`,
    }}>
      <span style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
      }}>
        {char}
      </span>
    </span>
  )
}

export default function HeroAnimatedText() {
  const [arrived, setArrived] = useState(false)
  const [poleFlying, setPoleFlying] = useState<Set<number>>(new Set())
  const [vaultFlying, setVaultFlying] = useState<Set<number>>(new Set())
  const arrivedRef = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setArrived(true)
      arrivedRef.current = true
      return
    }

    // スライドイン
    let raf1: number, raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setArrived(true)
        arrivedRef.current = true
      })
    })

    // スクロール監視
    const calcFlying = (y: number) => {
      const nextPole = new Set<number>()
      POLE_ORDER.forEach((charIdx, step) => {
        if (y >= THRESHOLDS[step]) nextPole.add(charIdx)
      })
      setPoleFlying(nextPole)

      const nextVault = new Set<number>()
      VAULT_ORDER.forEach((charIdx, step) => {
        if (y >= THRESHOLDS[step]) nextVault.add(charIdx)
      })
      setVaultFlying(nextVault)
    }

    const handleScroll = () => calcFlying(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const slideTransition = arrived ? `transform var(--dur-long) var(--ease-out)` : 'none'

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>

      <div style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }}>
        <div
          className="text-7xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-nunito)', transform: arrived ? 'translateX(0)' : 'translateX(-400px)', transition: slideTransition }}
        >
          {POLE_CHARS.map((c, i) => <GradientChar key={i} {...c} flying={poleFlying.has(i)} />)}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem' }}>
        <div
          className="text-7xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-nunito)', transform: arrived ? 'translateX(0)' : 'translateX(400px)', transition: slideTransition }}
        >
          {VAULT_CHARS.map((c, i) => <GradientChar key={i} {...c} flying={vaultFlying.has(i)} />)}
        </div>
      </div>

    </div>
  )
}
