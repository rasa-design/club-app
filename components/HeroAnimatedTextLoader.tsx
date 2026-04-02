'use client'

import dynamic from 'next/dynamic'

const HeroAnimatedText = dynamic(() => import('@/components/HeroAnimatedText'), { ssr: false })

export default function HeroAnimatedTextLoader() {
  return <HeroAnimatedText />
}
