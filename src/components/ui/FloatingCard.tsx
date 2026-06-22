'use client'

/**
 * FloatingCard — gentle continuous bob (the reference's FloatingCard, done right).
 *
 * The original used setInterval + state (20fps, re-renders every 50ms). This is
 * a pure CSS keyframe (`tk-float-bob` in globals.css) — GPU-composited, zero
 * re-renders, and honours prefers-reduced-motion.
 *
 * Stagger cards with `delay` so they don't bob in unison.
 * Compose with <Tilt3D> inside for mouse-tracked tilt on top of the idle float.
 */

interface Props {
  children: React.ReactNode
  /** Animation delay in seconds — stagger neighbouring cards. */
  delay?: number
  /** Cycle duration in seconds (default 6). */
  duration?: number
  className?: string
}

export default function FloatingCard({ children, delay = 0, duration = 6, className = '' }: Props) {
  return (
    <div
      className={`tk-float ${className}`}
      style={{ animation: `tk-float-bob ${duration}s ease-in-out ${delay}s infinite` }}>
      {children}
    </div>
  )
}
