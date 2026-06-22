'use client'

/**
 * Tilt3D — premium mouse-tracked 3D tilt with a moving glare.
 *
 * Wrap any card. On hover the card tilts toward the cursor in real 3D
 * (perspective + rotateX/Y), lifts slightly, and a soft specular glare
 * follows the pointer. Returns to flat on leave. Pure CSS transforms —
 * no deps, GPU-friendly.
 *
 *   <Tilt3D><Card>…</Card></Tilt3D>
 */

import { useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  /** Max tilt in degrees (default 8). */
  max?: number
  /** Lift in px on hover (default 6). */
  lift?: number
  /** Show the moving glare highlight (default true). */
  glare?: boolean
}

export default function Tilt3D({ children, className = '', max = 8, lift = 6, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 0, active: false })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width   // 0..1
    const py = (e.clientY - r.top) / r.height   // 0..1
    setT({
      ry: (px - 0.5) * 2 * max,         // left/right → rotateY
      rx: -(py - 0.5) * 2 * max,        // up/down → rotateX
      gx: px * 100,
      gy: py * 100,
      active: true,
    })
  }
  const onLeave = () => setT({ rx: 0, ry: 0, gx: 50, gy: 0, active: false })

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className}`}
      style={{ perspective: 900 }}>
      <div
        className="relative h-full transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: t.active
            ? `rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateZ(0) translateY(-${lift}px)`
            : 'rotateX(0) rotateY(0) translateY(0)',
          transformStyle: 'preserve-3d',
        }}>
        {children}

        {/* moving glare */}
        {glare && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
            style={{
              opacity: t.active ? 1 : 0,
              background: `radial-gradient(420px circle at ${t.gx}% ${t.gy}%, rgba(255,255,255,.35), transparent 45%)`,
              mixBlendMode: 'soft-light',
            }}
          />
        )}
      </div>
    </div>
  )
}
