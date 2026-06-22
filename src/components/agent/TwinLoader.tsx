'use client'

/**
 * TwinLoader — five named loaders, each with its own personality.
 *
 * Tries a `.riv` asset for richer animation. If absent (or wherever),
 * falls back to a designed CSS+SVG animation — never a generic spinner.
 *
 *   kind="thinking"   → sparkles + ellipsis (Twin is computing)
 *   kind="matching"   → cards flipping (Twin is matching candidates)
 *   kind="applying"   → paper plane arc (sending application)
 *   kind="auditing"   → magnifier orbit (audit in progress)
 *   kind="building"   → blocks stacking (Flex being built)
 */

import { useEffect, useState } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas'

export type LoaderKind = 'thinking' | 'matching' | 'applying' | 'auditing' | 'building'

const FILE: Record<LoaderKind, string> = {
  thinking: '/anim/loader-thinking.riv',
  matching: '/anim/loader-matching.riv',
  applying: '/anim/loader-applying.riv',
  auditing: '/anim/loader-auditing.riv',
  building: '/anim/loader-building.riv',
}

const LABEL: Record<LoaderKind, string> = {
  thinking: 'Thinking',
  matching: 'Matching',
  applying: 'Sending',
  auditing: 'Auditing',
  building: 'Building your Flex',
}

interface Props {
  kind: LoaderKind
  size?: number
  label?: string
  /** Hide the inline text label */
  iconOnly?: boolean
  className?: string
}

export default function TwinLoader({ kind, size = 32, label, iconOnly, className = '' }: Props) {
  const src = FILE[kind]
  const [hasRiv, setHasRiv] = useState<boolean | null>(null)

  useEffect(() => {
    let cancel = false
    fetch(src, { method: 'HEAD' })
      .then(r => { if (!cancel) setHasRiv(r.ok) })
      .catch(() => { if (!cancel) setHasRiv(false) })
    return () => { cancel = true }
  }, [src])

  const { RiveComponent } = useRive({
    src,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  if (hasRiv === true) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} aria-hidden>
        <span className="inline-block" style={{ width: size, height: size }}>
          <RiveComponent style={{ width: '100%', height: '100%' }} />
        </span>
        {!iconOnly && <span className="text-[11.5px] font-medium text-ink-2">{label ?? LABEL[kind]}…</span>}
      </span>
    )
  }

  // CSS+SVG fallbacks per kind
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-hidden>
      {kind === 'thinking' && <Thinking size={size} />}
      {kind === 'matching' && <Matching size={size} />}
      {kind === 'applying' && <Applying size={size} />}
      {kind === 'auditing' && <Auditing size={size} />}
      {kind === 'building' && <Building size={size} />}
      {!iconOnly && <span className="text-[11.5px] font-medium text-ink-2">{label ?? LABEL[kind]}…</span>}
    </span>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Designed CSS+SVG fallbacks                                          */
/* ──────────────────────────────────────────────────────────────────── */

function Thinking({ size }: { size: number }) {
  // Three sparkles that pulse around a soft core
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <defs>
          <radialGradient id="tk-think-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,92,40,.45)" />
            <stop offset="60%" stopColor="rgba(255,92,40,.10)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="14" fill="url(#tk-think-core)" />
        {[0, 120, 240].map((deg, i) => (
          <g key={i} transform={`rotate(${deg} 20 20)`}>
            <path
              d="M20 6 L21 11 L26 12 L21 13 L20 18 L19 13 L14 12 L19 11 Z"
              fill="#FF5C28"
              style={{ animation: `tk-think-pulse 1.4s ease-in-out ${i * 0.16}s infinite`, transformOrigin: '20px 12px' }}
            />
          </g>
        ))}
      </svg>
      <style jsx>{`
        @keyframes tk-think-pulse {
          0%, 100% { opacity: .35; transform: scale(.7); }
          50%      { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </span>
  )
}

function Matching({ size }: { size: number }) {
  // Two cards flipping in alternation
  return (
    <span className="relative inline-block" style={{ width: size, height: size, perspective: 60 }}>
      <span className="absolute" style={{ left: '15%', top: '20%', width: '32%', height: '60%' }}>
        <span className="block w-full h-full rounded-[3px]"
              style={{ background: 'linear-gradient(180deg, #FF5C28, #FF7A4A)', animation: 'tk-flip 1.6s ease-in-out infinite' }} />
      </span>
      <span className="absolute" style={{ right: '15%', top: '20%', width: '32%', height: '60%' }}>
        <span className="block w-full h-full rounded-[3px]"
              style={{ background: 'linear-gradient(180deg, #6D4BD8, #8053E0)', animation: 'tk-flip 1.6s ease-in-out .4s infinite' }} />
      </span>
      <style jsx>{`
        @keyframes tk-flip {
          0%, 100% { transform: rotateY(0deg); }
          50%      { transform: rotateY(180deg); }
        }
      `}</style>
    </span>
  )
}

function Applying({ size }: { size: number }) {
  // Paper plane that arcs across, then a check
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <g style={{ animation: 'tk-plane 2.2s ease-in-out infinite' }}>
          <polygon points="0,0 16,7 6,9 5,16 2,11" fill="#FF5C28"
                   transform="translate(8 8) rotate(-12)" />
        </g>
        <g style={{ animation: 'tk-trail 2.2s ease-in-out infinite' }}>
          <path d="M5 25 Q 15 18, 25 22" stroke="rgba(255,92,40,.25)" strokeWidth="1.2" fill="none" strokeDasharray="2 2" />
        </g>
      </svg>
      <style jsx>{`
        @keyframes tk-plane {
          0%   { transform: translate(0,0) rotate(0deg); }
          50%  { transform: translate(12px,-6px) rotate(8deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes tk-trail {
          0%, 100% { opacity: 0; }
          50%      { opacity: 1; }
        }
      `}</style>
    </span>
  )
}

function Auditing({ size }: { size: number }) {
  // Magnifier orbits a Flex line, highlighting it
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        {/* the "document" lines */}
        <line x1="10" y1="14" x2="30" y2="14" stroke="rgba(0,0,0,.18)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="10" y1="20" x2="26" y2="20" stroke="rgba(0,0,0,.18)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="10" y1="26" x2="28" y2="26" stroke="rgba(0,0,0,.18)" strokeWidth="1.4" strokeLinecap="round" />
        {/* magnifier */}
        <g style={{ animation: 'tk-audit 2s ease-in-out infinite', transformOrigin: '20px 20px' }}>
          <circle cx="22" cy="14" r="4" fill="none" stroke="#FF5C28" strokeWidth="1.6" />
          <line x1="25" y1="17" x2="28" y2="20" stroke="#FF5C28" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </svg>
      <style jsx>{`
        @keyframes tk-audit {
          0%   { transform: translate(-6px, 0); }
          33%  { transform: translate(-6px, 6px); }
          66%  { transform: translate(4px, 6px); }
          100% { transform: translate(-6px, 0); }
        }
      `}</style>
    </span>
  )
}

function Building({ size }: { size: number }) {
  // Blocks stacking up
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <rect x="8"  y="26" width="24" height="4" rx="1" fill="#FF5C28"
              style={{ animation: 'tk-build 1.4s ease-out infinite' }} />
        <rect x="10" y="20" width="20" height="4" rx="1" fill="#FF7A4A"
              style={{ animation: 'tk-build 1.4s ease-out .2s infinite' }} />
        <rect x="12" y="14" width="16" height="4" rx="1" fill="#6D4BD8"
              style={{ animation: 'tk-build 1.4s ease-out .4s infinite' }} />
      </svg>
      <style jsx>{`
        @keyframes tk-build {
          0%   { opacity: 0; transform: translateY(8px); }
          30%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(0); }
        }
      `}</style>
    </span>
  )
}
