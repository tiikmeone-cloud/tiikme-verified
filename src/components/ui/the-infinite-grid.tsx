'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
  type MotionValue,
} from 'framer-motion'

/* ──────────────────────────────────────────────────────────────────── */
/*  Component — original demo, verbatim                                 */
/* ──────────────────────────────────────────────────────────────────── */
export const Component = () => {
  const [count, setCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - left)
    mouseY.set(e.clientY - top)
  }

  const gridOffsetX = useMotionValue(0)
  const gridOffsetY = useMotionValue(0)

  const speedX = 0.5
  const speedY = 0.5

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get()
    const currentY = gridOffsetY.get()
    gridOffsetX.set((currentX + speedX) % 40)
    gridOffsetY.set(((currentY - speedY) % 40 + 40) % 40)
  })

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn('relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-background')}>
      <div className="absolute inset-0 z-0 opacity-[0.05]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} idSuffix="demo-base" />
      </div>
      <motion.div className="absolute inset-0 z-0 opacity-40" style={{ maskImage, WebkitMaskImage: maskImage }}>
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} idSuffix="demo-reveal" />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/40 dark:bg-orange-600/20 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/40 dark:bg-blue-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto space-y-6 pointer-events-none">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
            The Infinite Grid
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Move your cursor to reveal the active grid layer.<br />
            The pattern scrolls infinitely in the background.
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={() => setCount(count + 1)}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-all shadow-md active:scale-95">
            Interact ({count})
          </button>
          <button className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/80 transition-all active:scale-95">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  InfiniteGridBackdrop — self-contained background for embedding      */
/*  Absolute, pointer-events-none, tracks the cursor via window so      */
/*  reveal effect works under interactive children (chat / composer).   */
/* ──────────────────────────────────────────────────────────────────── */
export const InfiniteGridBackdrop: React.FC<{ className?: string }> = ({ className }) => {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [mouseX, mouseY])

  const gridOffsetX = useMotionValue(0)
  const gridOffsetY = useMotionValue(0)
  const speedX = 0.5
  const speedY = 0.5

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + speedX) % 40)
    gridOffsetY.set(((gridOffsetY.get() - speedY) % 40 + 40) % 40)
  })

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('absolute inset-0 pointer-events-none overflow-hidden bg-background', className)}>
      {/* base grid — always visible, very subtle */}
      <div className="absolute inset-0 opacity-[0.08]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} idSuffix="bd-base" />
      </div>
      {/* cursor-reveal layer */}
      <motion.div className="absolute inset-0 opacity-50" style={{ maskImage, WebkitMaskImage: maskImage }}>
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} idSuffix="bd-reveal" />
      </motion.div>
      {/* atmospheric blobs */}
      <div className="absolute inset-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/40 dark:bg-orange-600/20 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/40 dark:bg-blue-600/20 blur-[120px]" />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  GridPattern — one SVG layer of the grid                             */
/*  idSuffix makes each instance unique so multiple grids coexist.      */
/* ──────────────────────────────────────────────────────────────────── */
const GridPattern = ({
  offsetX, offsetY, idSuffix = '',
}: {
  offsetX: MotionValue<number>
  offsetY: MotionValue<number>
  idSuffix?: string
}) => {
  const id = `tk-grid-${idSuffix}`
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id={id}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX as unknown as number}
          y={offsetY as unknown as number}>
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
