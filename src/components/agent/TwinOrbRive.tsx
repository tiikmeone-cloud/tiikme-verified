'use client'

/**
 * TwinOrbRive — Rive-driven Twin orb with graceful CSS fallback.
 *
 * If `/anim/twin-orb.riv` is present, we render the Rive animation and drive
 * its state machine from props. Otherwise we fall back to <TwinOrb /> — the
 * CSS-only orb — so the UI never breaks while the designer is still working.
 *
 * The designer ships ONE file: public/anim/twin-orb.riv
 *   · Artboard:        "TwinOrb"
 *   · State machine:   "Orb State"
 *   · Inputs (booleans):
 *       - isListening    (true when composer is focused)
 *       - isThinking     (true when Twin is computing a reply)
 *       - isSpeaking     (true when reply is streaming in)
 *       - isSuccess      (one-shot · true briefly on success)
 *   · Inputs (number):
 *       - personaTone    (0 = professional, 1 = student, 2 = org)
 *
 * Sizes are passed through unchanged so it lives next to <TwinOrb /> with
 * the same API.
 */

import { useEffect, useState } from 'react'
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas'
import TwinOrb from '@/components/agent/TwinOrb'

type Size = 'hero' | 'header' | 'inline' | 'pill'
const SIZES: Record<Size, number> = { hero: 140, header: 36, inline: 28, pill: 22 }

const ORB_SRC = '/anim/twin-orb.riv'
const ARTBOARD = 'TwinOrb'
const STATE_MACHINE = 'Orb State'

interface Props {
  size?: Size | number
  halo?: boolean
  breathing?: boolean
  /** Twin is "listening" — composer focused */
  active?: boolean
  /** Twin is computing a reply */
  thinking?: boolean
  /** Reply is streaming in */
  speaking?: boolean
  /** One-shot success burst (apply, connect, etc.) */
  success?: boolean
  /** Tone — 0 professional, 1 student, 2 org */
  personaTone?: 0 | 1 | 2
  className?: string
}

export default function TwinOrbRive({
  size = 'header',
  active = false,
  thinking = false,
  speaking = false,
  success = false,
  personaTone = 0,
  halo,
  breathing,
  className = '',
}: Props) {
  const px = typeof size === 'number' ? size : SIZES[size]

  // Probe whether the .riv exists. If not, render the CSS fallback only.
  const [hasRiv, setHasRiv] = useState<boolean | null>(null)
  useEffect(() => {
    let cancel = false
    fetch(ORB_SRC, { method: 'HEAD' })
      .then(r => { if (!cancel) setHasRiv(r.ok) })
      .catch(() => { if (!cancel) setHasRiv(false) })
    return () => { cancel = true }
  }, [])

  // Hooks must run unconditionally — we always wire Rive, but only mount the
  // canvas when the file is present.
  const { rive, RiveComponent } = useRive({
    src: ORB_SRC,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  const inListening = useStateMachineInput(rive, STATE_MACHINE, 'isListening')
  const inThinking  = useStateMachineInput(rive, STATE_MACHINE, 'isThinking')
  const inSpeaking  = useStateMachineInput(rive, STATE_MACHINE, 'isSpeaking')
  const inSuccess   = useStateMachineInput(rive, STATE_MACHINE, 'isSuccess')
  const inPersona   = useStateMachineInput(rive, STATE_MACHINE, 'personaTone')

  // Drive state machine inputs from props
  useEffect(() => { if (inListening) inListening.value = active     }, [active, inListening])
  useEffect(() => { if (inThinking)  inThinking.value  = thinking   }, [thinking, inThinking])
  useEffect(() => { if (inSpeaking)  inSpeaking.value  = speaking   }, [speaking, inSpeaking])
  useEffect(() => { if (inPersona)   inPersona.value   = personaTone }, [personaTone, inPersona])

  // Success is a one-shot — flip true briefly, then back to false
  useEffect(() => {
    if (!inSuccess || !success) return
    inSuccess.value = true
    const t = setTimeout(() => { inSuccess.value = false }, 900)
    return () => clearTimeout(t)
  }, [success, inSuccess])

  // Probe pending → render fallback for now (no flash)
  if (hasRiv === null) return <TwinOrb size={size} halo={halo} breathing={breathing} active={active} className={className} />

  // No file → permanent CSS fallback
  if (hasRiv === false) return <TwinOrb size={size} halo={halo} breathing={breathing} active={active} className={className} />

  // Have file → render Rive
  return (
    <span className={`inline-block ${className}`} style={{ width: px, height: px }} aria-hidden>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </span>
  )
}
