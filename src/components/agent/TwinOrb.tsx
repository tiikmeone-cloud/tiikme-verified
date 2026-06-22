'use client'

/**
 * TwinOrb — the Twin mark.
 *
 * NOT a generic AI sphere. The design carries meaning:
 *
 *   · TWO lobes — warm (you) + cool (Twin)           — duality
 *   · The lens where they meet                       — insight
 *   · The vertical spine of light through the lens   — connection
 *   · Sparks rising through the lens                 — career growth
 *   · One top spark                                  — the realisation
 *
 * Pure CSS + SVG. State-reactive. Persona-aware. Scales 22–140px.
 *
 * States (props):
 *   active   (listening)   — lobes brighten, lean inward, lens pulses
 *   thinking (computing)   — lobes oscillate, sparks accelerate
 *   speaking (streaming)   — ripples emanate from the lens
 *   success  (one-shot)    — whole mark flashes white-orange
 *   personaTone (0/1/2)    — cool-lobe tone shifts (purple / teal / deep)
 */

import { useId } from 'react'

type Size = 'hero' | 'header' | 'inline' | 'pill'
const SIZES: Record<Size, number> = { hero: 140, header: 36, inline: 28, pill: 22 }

interface Props {
  size?: Size | number
  halo?: boolean
  breathing?: boolean
  active?: boolean
  thinking?: boolean
  speaking?: boolean
  success?: boolean
  personaTone?: 0 | 1 | 2
  className?: string
}

export default function TwinOrb({
  size = 'header',
  halo,
  breathing,
  active = false,
  thinking = false,
  speaking = false,
  success = false,
  personaTone = 0,
  className = '',
}: Props) {
  const px = typeof size === 'number' ? size : SIZES[size]
  const isHero = size === 'hero'
  const showHalo = halo ?? isHero
  const breathe = breathing ?? (isHero || size === 'header')

  const id = useId().replace(/[^a-zA-Z0-9]/g, '')

  // The "cool" lobe shifts by persona — Twin's tone for you
  const cool = personaTone === 1 ? '#43C9BA'  // student — teal
            : personaTone === 2 ? '#8053E0'   // org — deep purple
            : '#6D4BD8'                       // professional — purple
  const coolDeep = personaTone === 1 ? '#1F8C82'
                 : personaTone === 2 ? '#5530B0'
                 : '#3F2592'

  // Speeds
  const lobeAnim   = breathe ? `tk-twin-breathe ${success ? '0.9s' : '4s'} ease-in-out ${success ? '1' : 'infinite'}` : 'none'
  const sparkSpeed = thinking ? '1.6s' : active ? '2.8s' : '5s'
  const spineSpeed = thinking ? '1.2s' : active ? '1.8s' : '2.6s'

  // gradient ids
  const gWarm  = `w${id}`
  const gCool  = `c${id}`
  const gLens  = `l${id}`
  const gHalo  = `h${id}`
  const gSpine = `sp${id}`

  // Hide complexity at small sizes — keeps the mark legible
  const showSparks  = px >= 36
  const showSpine   = px >= 24
  const showInsight = px >= 28
  const showHaloRim = px >= 32

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: px, height: px }}
      aria-hidden>

      {/* Outer halo — twin-tinted, warm left + cool right */}
      {showHalo && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(255,92,40,.50) 0%, rgba(255,255,255,0) 50%, ${cool}88 100%)`,
            filter: `blur(${Math.max(8, px * 0.22)}px)`,
            transform: `scale(${1 + Math.min(0.65, px / 240)})`,
            opacity: active || thinking ? 0.95 : 0.7,
            transition: 'opacity 240ms ease-out',
          }}
        />
      )}

      {/* Atmosphere ring (only at larger sizes) */}
      {showHaloRim && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, transparent 60%, rgba(255,255,255,.04) 85%, transparent 100%)`,
          }}
        />
      )}

      {/* Speaking ripples — emerge from the lens */}
      {speaking && (
        <>
          <span className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: '1.4px solid rgba(255,92,40,.55)', animation: 'tk-twin-ripple 1.8s ease-out infinite' }} />
          <span className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `1.4px solid ${cool}80`, animation: 'tk-twin-ripple 1.8s ease-out .6s infinite' }} />
        </>
      )}

      {/* Success flash */}
      {success && (
        <span className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,.92), rgba(255,92,40,.55) 50%, transparent 72%)',
            animation: 'tk-twin-flash .9s ease-out',
          }}
        />
      )}

      {/* The mark itself */}
      <svg viewBox="0 0 100 100" className="relative block w-full h-full"
        style={{ animation: lobeAnim }}>

        <defs>
          {/* Warm lobe — YOU */}
          <linearGradient id={gWarm} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#FFD4B5" />
            <stop offset="35%"  stopColor="#FF8348" />
            <stop offset="75%"  stopColor="#FF5C28" />
            <stop offset="100%" stopColor="#B22A0A" />
          </linearGradient>

          {/* Cool lobe — TWIN */}
          <linearGradient id={gCool} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={lighten(cool, 0.55)} />
            <stop offset="40%"  stopColor={cool} />
            <stop offset="80%"  stopColor={coolDeep} />
            <stop offset="100%" stopColor="#1A0E36" />
          </linearGradient>

          {/* Lens — where they meet — hot white-orange luminous core */}
          <radialGradient id={gLens} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.98)" />
            <stop offset="35%"  stopColor="rgba(255,222,180,.85)" />
            <stop offset="70%"  stopColor="rgba(255,92,40,.40)" />
            <stop offset="100%" stopColor="rgba(255,92,40,0)" />
          </radialGradient>

          {/* Spine of light — vertical glow through the lens */}
          <linearGradient id={gSpine} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="35%"  stopColor="rgba(255,232,210,.85)" />
            <stop offset="65%"  stopColor="rgba(255,232,210,.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Soft inner glow for the lobes */}
          <radialGradient id={gHalo} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.35)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Clip path for the central lens (vesica) — to mask the spine */}
          <clipPath id={`lensClip${id}`}>
            <path d="M 50 14 C 40 30, 40 70, 50 86 C 60 70, 60 30, 50 14 Z" />
          </clipPath>
        </defs>

        {/* LEFT LOBE — warm "you" — leaf-like petal, narrower on the right (toward center) */}
        <g style={{ transformOrigin: '50px 50px', animation: active ? 'tk-lobe-lean-l 4s ease-in-out infinite' : undefined }}>
          <path
            d="M 50 14
               C 30 22, 18 36, 18 50
               C 18 64, 30 78, 50 86
               C 44 70, 42 60, 42 50
               C 42 40, 44 30, 50 14 Z"
            fill={`url(#${gWarm})`}
            opacity={active || thinking ? 1 : 0.95}
          />
          <path
            d="M 50 14
               C 30 22, 18 36, 18 50
               C 18 64, 30 78, 50 86
               C 44 70, 42 60, 42 50
               C 42 40, 44 30, 50 14 Z"
            fill={`url(#${gHalo})`}
          />
        </g>

        {/* RIGHT LOBE — cool "twin" — mirror of left */}
        <g style={{ transformOrigin: '50px 50px', animation: active ? 'tk-lobe-lean-r 4s ease-in-out infinite' : undefined }}>
          <path
            d="M 50 14
               C 70 22, 82 36, 82 50
               C 82 64, 70 78, 50 86
               C 56 70, 58 60, 58 50
               C 58 40, 56 30, 50 14 Z"
            fill={`url(#${gCool})`}
            opacity={active || thinking ? 1 : 0.95}
          />
          <path
            d="M 50 14
               C 70 22, 82 36, 82 50
               C 82 64, 70 78, 50 86
               C 56 70, 58 60, 58 50
               C 58 40, 56 30, 50 14 Z"
            fill={`url(#${gHalo})`}
          />
        </g>

        {/* LENS — vesica piscis: where YOU and TWIN meet */}
        <ellipse
          cx="50" cy="50" rx="9" ry="36"
          fill={`url(#${gLens})`}
          opacity={active || thinking || speaking ? 1 : 0.92}
          style={{ animation: `tk-lens-pulse ${spineSpeed} ease-in-out infinite` }}
        />

        {/* SPINE — luminous vertical line through the lens */}
        {showSpine && (
          <rect
            x="49.4" y="14" width="1.2" height="72"
            fill={`url(#${gSpine})`}
            style={{ animation: `tk-spine ${spineSpeed} ease-in-out infinite` }}
          />
        )}

        {/* ASCENDING SPARKS — career growth through the lens */}
        {showSparks && (
          <g clipPath={`url(#lensClip${id})`}>
            {[0, 1, 2, 3].map(i => (
              <circle
                key={i}
                cx="50"
                cy={88 - i * 6}
                r={1.4}
                fill="rgba(255,232,210,.95)"
                style={{
                  animation: `tk-spark-rise ${sparkSpeed} linear ${i * 0.4}s infinite`,
                  filter: 'drop-shadow(0 0 2px rgba(255,196,140,.9))',
                }}
              />
            ))}
          </g>
        )}

        {/* INSIGHT SPARK — top */}
        {showInsight && (
          <g style={{ animation: `tk-insight ${thinking ? '1.4s' : '3s'} ease-in-out infinite` }}>
            <circle cx="50" cy="13" r="2"   fill="rgba(255,255,255,.95)"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(255,196,140,.9))' }} />
            <circle cx="50" cy="13" r="3.6" fill="rgba(255,255,255,.25)" />
          </g>
        )}

        {/* Hairline rim seam — gives the lens its edge */}
        <path
          d="M 50 14 C 40 30, 40 70, 50 86 C 60 70, 60 30, 50 14 Z"
          fill="none"
          stroke="rgba(255,255,255,.10)"
          strokeWidth="0.4"
        />
      </svg>

      {/* Listening dot — confirms Twin heard you */}
      {active && px >= 30 && (
        <span
          className="absolute rounded-full"
          style={{
            right: '4%',
            bottom: '4%',
            width: Math.max(7, px * 0.10),
            height: Math.max(7, px * 0.10),
            background: '#43C9BA',
            boxShadow: '0 0 0 2px var(--color-card), 0 0 14px rgba(67,201,186,.85)',
            animation: 'tk-twin-pulse 1.4s ease-in-out infinite',
          }}
        />
      )}

      <style jsx>{`
        @keyframes tk-twin-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @keyframes tk-twin-pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%      { transform: scale(1.22); opacity: .60; }
        }
        @keyframes tk-twin-ripple {
          0%   { transform: scale(0.96); opacity: .9; }
          80%  { transform: scale(1.45); opacity: 0; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes tk-twin-flash {
          0%   { opacity: 0;   transform: scale(.9); }
          25%  { opacity: 1;   transform: scale(1.08); }
          100% { opacity: 0;   transform: scale(1.2); }
        }
        @keyframes tk-lens-pulse {
          0%, 100% { transform: scaleY(1);    opacity: .92; }
          50%      { transform: scaleY(1.04); opacity: 1; }
        }
        @keyframes tk-spine {
          0%, 100% { opacity: .65; }
          50%      { opacity: 1; }
        }
        @keyframes tk-spark-rise {
          0%   { opacity: 0; transform: translateY(0); }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-72px); }
        }
        @keyframes tk-insight {
          0%, 100% { transform: scale(1);    opacity: .95; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
        @keyframes tk-lobe-lean-l {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(-2deg); }
        }
        @keyframes tk-lobe-lean-r {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(2deg); }
        }
      `}</style>
    </span>
  )
}

/** Lighten a hex color by a 0–1 factor toward white. */
function lighten(hex: string, factor: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const lr = Math.round(r + (255 - r) * factor)
  const lg = Math.round(g + (255 - g) * factor)
  const lb = Math.round(b + (255 - b) * factor)
  return `#${((1 << 24) | (lr << 16) | (lg << 8) | lb).toString(16).slice(1)}`
}
