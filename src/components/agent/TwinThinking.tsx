'use client'

/**
 * TwinThinking — the "Twin is doing something" loader.
 *
 * Two variants:
 *   · overlay — full-screen take-over for weighty moments
 *               (Building Flex, Audit start, Application send)
 *   · inline  — compact card-sized for chat / inline reasoning
 *
 * Pattern:
 *   · Letters of the verb pulse in sequence ("T-h-i-n-k-i-n-g")
 *   · A circular ring around them rotates with multi-stop inset glow
 *     in tiikme's orange + purple (instead of the original blue)
 *
 * The verb is the affordance — Twin tells you what it's doing:
 *   "Twinning"  · starting up, connecting
 *   "Thinking"  · computing reply
 *   "Matching"  · searching candidates / jobs
 *   "Drafting"  · writing application / outreach
 *   "Auditing"  · reviewing your Flex
 *   "Building"  · creating your Flex
 *   "Sending"   · submitting application
 */

import * as React from 'react'

interface Props {
  /** What Twin is doing right now. Single verb, capitalised. */
  text?: string
  /** Optional second line under the verb. */
  subtext?: string
  /** Pixel size of the spinning ring. */
  size?: number
  /** overlay = full-screen take-over · inline = sits in flow */
  variant?: 'overlay' | 'inline'
  /** Show a close (×) button on overlay variant. */
  onCancel?: () => void
}

const TwinThinking: React.FC<Props> = ({
  text = 'Thinking',
  subtext,
  size = 180,
  variant = 'overlay',
  onCancel,
}) => {
  const letters = text.split('')
  const fontSize = Math.round(size * 0.16)

  const ring = (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}>
        {/* Letters — pulse in sequence */}
        <div className="flex items-center justify-center relative z-10">
          {letters.map((letter, i) => (
            <span
              key={i}
              className="inline-block text-white font-semibold opacity-40 tk-loader-letter"
              style={{
                fontSize,
                animationDelay: `${i * 0.1}s`,
                letterSpacing: '0.01em',
              }}>
              {letter}
            </span>
          ))}
        </div>

        {/* Rotating glow ring — tiikme orange + purple */}
        <div className="absolute inset-0 rounded-full tk-loader-ring" />
      </div>

      {subtext && (
        <p className="mt-7 text-[12.5px] text-white/55 text-center max-w-[280px] leading-relaxed">
          {subtext}
        </p>
      )}

      <style jsx>{`
        @keyframes tk-loader-ring {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 #FF8348 inset,
              0 12px 18px 0 #FF5C28 inset,
              0 36px 36px 0 #6D4BD8 inset,
              0 0 3px 1.2px rgba(255, 131, 72, 0.3),
              0 0 6px 1.8px rgba(255, 92, 40, 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 #FFB078 inset,
              0 12px 6px 0 #FF5C28 inset,
              0 24px 36px 0 #8053E0 inset,
              0 0 3px 1.2px rgba(255, 131, 72, 0.3),
              0 0 6px 1.8px rgba(109, 75, 216, 0.25);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 #FFA467 inset,
              0 12px 18px 0 #FF5C28 inset,
              0 36px 36px 0 #6D4BD8 inset,
              0 0 3px 1.2px rgba(255, 131, 72, 0.3),
              0 0 6px 1.8px rgba(255, 92, 40, 0.2);
          }
        }

        @keyframes tk-loader-letter {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          20%      { opacity: 1;   transform: scale(1.15); }
          40%      { opacity: 0.7; transform: translateY(0); }
        }

        .tk-loader-ring {
          animation: tk-loader-ring 5s linear infinite;
        }

        .tk-loader-letter {
          animation: tk-loader-letter 3s infinite;
        }
      `}</style>
    </div>
  )

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center py-6">
        {ring}
      </div>
    )
  }

  // Overlay — full-screen take-over with deep warm-purple gradient background.
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 50% 35%, rgba(255,92,40,.18), transparent 55%), linear-gradient(to bottom, #2A1410 0%, #120A18 55%, #060309 100%)',
      }}>
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 w-9 h-9 rounded-[11px] bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-colors flex items-center justify-center"
          title="Cancel">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}

      {ring}

      {/* "tiikme" wordmark in the corner — quiet brand presence */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
        tiikme · twin
      </div>
    </div>
  )
}

export default TwinThinking

/* ──────────────────────────────────────────────────────────────────── */
/*  Verb presets — single source of truth for what Twin says           */
/* ──────────────────────────────────────────────────────────────────── */
export const TwinVerb = {
  twinning: { text: 'Twinning', subtext: 'Connecting you to your Career Twin…' },
  thinking: { text: 'Thinking', subtext: 'Reading your Flex and the market.' },
  matching: { text: 'Matching', subtext: 'Finding verified people who fit.' },
  drafting: { text: 'Drafting', subtext: 'Writing this in your voice.' },
  auditing: { text: 'Auditing', subtext: 'Reviewing every line of your Flex.' },
  building: { text: 'Building', subtext: 'Assembling your Flex from your work.' },
  sending:  { text: 'Sending',  subtext: 'Submitting your application.' },
} as const

export type TwinVerbKind = keyof typeof TwinVerb
