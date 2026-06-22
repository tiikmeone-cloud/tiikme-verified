'use client'

import { useState } from 'react'

/**
 * TiikmeMark — the tiikme brand mark (folded-ribbon lowercase "t").
 *
 * PNG-FIRST: it tries your real render at `/public/logo.png`. The moment you
 * drop that file in, it shows EVERYWHERE automatically — no code change.
 * Until the file exists, it falls back to a vector approximation so nothing
 * is ever broken or blank.
 *
 * To use your exact image: save it to `tiikme-verified/public/logo.png`.
 *
 * Sizes: sm 18 · md 28 · lg 44 · xl 88   (or a number)
 */

type Size = 'sm' | 'md' | 'lg' | 'xl'
const SIZES: Record<Size, number> = { sm: 18, md: 28, lg: 44, xl: 88 }

interface Props {
  size?: Size | number
  showWordmark?: boolean
  alive?: boolean            // gentle breathing
  className?: string
  wordmarkClassName?: string
}

export default function TiikmeMark({
  size = 'md',
  showWordmark = false,
  alive = false,
  className = '',
  wordmarkClassName = '',
}: Props) {
  const px = typeof size === 'number' ? size : SIZES[size]
  const wordSize = Math.max(14, Math.round(px * 0.66))
  // PNG first; on 404 / load error, fall back to the SVG so it's never blank.
  const [pngFailed, setPngFailed] = useState(false)

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="relative inline-block shrink-0"
        style={{ width: px, height: px, animation: alive ? 'tk-mark-breathe 4s ease-in-out infinite' : undefined }}
        aria-hidden>
        {pngFailed ? (
          <RibbonT />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logo.png"
            alt="tiikme"
            className="w-full h-full object-contain"
            onError={() => setPngFailed(true)}
          />
        )}
        <style jsx>{`
          @keyframes tk-mark-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        `}</style>
      </span>

      {showWordmark && (
        <span
          className={`font-bold tracking-tight text-ink ${wordmarkClassName}`}
          style={{ fontSize: wordSize, lineHeight: 1, letterSpacing: '-0.03em' }}>
          tiikme
        </span>
      )}
    </span>
  )
}

/* The ribbon "t" — vertical stem + wrapping crossbar + curled foot. */
function RibbonT() {
  return (
    <svg viewBox="0 0 100 100" className="block w-full h-full" style={{ filter: 'drop-shadow(0 3px 6px rgba(180,50,10,.18))' }}>
      <defs>
        {/* Body: light top-left → deep bottom-right for the matte-3D look */}
        <linearGradient id="tk-body" x1="20%" y1="8%" x2="85%" y2="100%">
          <stop offset="0%"  stopColor="#FF7A3D" />
          <stop offset="42%" stopColor="#FF5C28" />
          <stop offset="100%" stopColor="#E8430F" />
        </linearGradient>
        {/* Ribbon sheen on the crossbar */}
        <linearGradient id="tk-bar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#FF8A50" />
          <stop offset="55%" stopColor="#FF5C28" />
          <stop offset="100%" stopColor="#F04E18" />
        </linearGradient>
        {/* Underside of the fold — darker */}
        <linearGradient id="tk-fold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#D63A0C" />
          <stop offset="100%" stopColor="#B82E08" />
        </linearGradient>
      </defs>

      {/* Stem + curled foot (the "t" stroke, slightly tilted) */}
      <path
        d="M 44 16
           C 44 13.5, 47 12, 50 12
           C 53 12, 56 13.5, 56 16
           L 56 70
           C 56 78, 60 83, 67 83
           C 71 83, 74 81.5, 75.5 78.5
           C 73.5 80, 70 79.5, 68.5 76.5
           C 67.5 74.5, 68 71.5, 68 69
           L 68 16
           C 68 13.5, 65 12, 62 12 Z"
        fill="url(#tk-body)"
        transform="rotate(-3 50 50)"
      />

      {/* Crossbar ribbon (wraps over the stem) */}
      <path
        d="M 30 44
           C 28 44, 26.5 45.5, 26.5 47.5
           L 26.5 53
           C 26.5 55, 28 56.5, 30 56.5
           L 74 56.5
           C 76 56.5, 77.5 55, 77.5 53
           L 77.5 47.5
           C 77.5 45.5, 76 44, 74 44 Z"
        fill="url(#tk-bar)"
        transform="rotate(-3 50 50)"
      />

      {/* Left fold loop — the ribbon curling under (darker underside) */}
      <path
        d="M 30 44
           C 25 44, 21 46.5, 21 51
           C 21 55.5, 25 58, 29.5 57.8
           C 26.5 57, 24.8 54.5, 24.8 51.2
           C 24.8 48, 26.8 45.4, 30 44.6 Z"
        fill="url(#tk-fold)"
        transform="rotate(-3 50 50)"
      />

      {/* Tiny top highlight on the crossbar for sheen */}
      <path
        d="M 32 46.5 L 70 46.5 C 71 46.5, 71.5 47, 71.5 47.8 L 32 47.8 Z"
        fill="rgba(255,255,255,.28)"
        transform="rotate(-3 50 50)"
      />
    </svg>
  )
}
