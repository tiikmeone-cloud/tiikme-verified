'use client'

/**
 * Twin Audit — the "review every word" experience.
 *
 * The pattern, exactly as Naadhan described:
 *   1. Twin reads each line of the Flex.
 *   2. For each suggestion: Twin shows a card with a "Yes" button.
 *   3. Click Yes → preview the proposed change.
 *   4. Click Apply → the Flex updates in place.
 *
 * For now, the audit items are persona-tuned and stubbed.
 * When real Twin lands, this same UI is fed by a single Edge function call
 * that returns a list of `AuditItem` rows.
 *
 * No LLM call until the user explicitly enters the audit.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TiikmeMascot from '@/components/agent/TiikmeMascot'
import {
  loadOnboarding, type OnboardingState, type Persona,
} from '@/lib/onboarding'

type AuditKind = 'rewrite' | 'add' | 'remove' | 'fill'

interface AuditItem {
  id: string
  section: 'Headline' | 'Education' | 'Experience' | 'Projects' | 'Skills' | 'Links' | 'Trust'
  kind: AuditKind
  current: string | null
  suggestion: string
  why: string
}

export default function AuditShell() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [items, setItems] = useState<AuditItem[]>([])
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<'list' | 'preview'>('list')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  useEffect(() => {
    const s = loadOnboarding()
    setState(s)
    setItems(generateAuditFor(s))
  }, [])

  const total = items.length
  const handled = applied.size + skipped.size
  const remaining = useMemo(() => items.filter(i => !applied.has(i.id) && !skipped.has(i.id)), [items, applied, skipped])
  const current = remaining[0] ?? null
  const allDone = handled === total && total > 0

  if (!state) return null

  const onYes  = () => setStage('preview')
  const onSkip = () => { if (current) { setSkipped(p => new Set(p).add(current.id)); setStage('list'); setIdx(i => i + 1) } }
  const onApply = () => { if (current) { setApplied(p => new Set(p).add(current.id)); setStage('list'); setIdx(i => i + 1) } }
  const onUndo  = () => setStage('list')

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-page)' }}>
      <header className="px-6 lg:px-10 pt-6 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-ink-3 hover:text-ink transition-colors flex items-center gap-1.5 text-[12px] font-semibold">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Twin
        </button>
        <span className="text-[10px] text-ink-3">·</span>
        <span className="text-[12px] font-semibold text-ink">Audit your Flex</span>

        <div className="flex-1" />
        <div className="text-[10px] text-ink-3 hidden sm:block">{handled} / {total}</div>
        <div className="w-32 h-1 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange to-orange-2 transition-all" style={{ width: `${total === 0 ? 0 : (handled / total) * 100}%` }} />
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 lg:px-10 py-8 mx-auto w-full" style={{ maxWidth: 640 }}>
        {/* Empty / done state */}
        {allDone || total === 0 ? (
          <DoneState
            appliedCount={applied.size}
            skippedCount={skipped.size}
            onLand={() => router.push('/')}
          />
        ) : stage === 'list' ? (
          <ListCard item={current!} idx={total - remaining.length + 1} total={total}
            onYes={onYes} onSkip={onSkip} />
        ) : (
          <PreviewCard item={current!} onApply={onApply} onUndo={onUndo} />
        )}
      </section>

      <footer className="px-6 lg:px-10 pb-6 text-center">
        <p className="text-[10px] text-ink-3">Tiik never edits without your tap. Every change has a preview and an undo.</p>
      </footer>
    </main>
  )
}

/* ── List card — Twin's suggestion ──────────────────────────────── */
function ListCard({
  item, idx, total, onYes, onSkip,
}: {
  item: AuditItem; idx: number; total: number; onYes: () => void; onSkip: () => void
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Tiik · suggestion {idx} of {total}</span>
        <span className="text-[10px] text-ink-3">·</span>
        <SectionPill section={item.section} />
        <span className="text-[10px] text-ink-3">·</span>
        <KindPill kind={item.kind} />
      </div>

      <div className="rounded-[22px] bg-card border border-line shadow-card overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-start gap-3">
          <TiikmeMascot size={32} bg />
          <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-semibold text-ink leading-snug">{item.suggestion}</p>
            <p className="text-[12px] text-ink-3 mt-1.5 leading-relaxed">{item.why}</p>
          </div>
        </div>

        {item.current !== null && (
          <div className="bg-page border-t border-line px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-1">Right now</p>
            <p className="text-[12.5px] text-ink-2 leading-snug">{item.current}</p>
          </div>
        )}

        <div className="px-5 py-4 border-t border-line grid grid-cols-2 gap-2">
          <button onClick={onSkip}
            className="text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-2.5 hover:bg-line/40 transition-colors">
            Skip
          </button>
          <button onClick={onYes}
            className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 hover:opacity-95 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
            Yes, show me
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Preview card — before / after, then Apply ──────────────────── */
function PreviewCard({
  item, onApply, onUndo,
}: {
  item: AuditItem; onApply: () => void; onUndo: () => void
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Preview</span>
        <span className="text-[10px] text-ink-3">·</span>
        <SectionPill section={item.section} />
      </div>

      <div className="rounded-[22px] bg-card border border-line shadow-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* before */}
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-line bg-page">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-2">Before</p>
            {item.current
              ? <p className="text-[13px] text-ink-2 leading-relaxed">{item.current}</p>
              : <p className="text-[12px] text-ink-3 italic">— empty —</p>}
          </div>

          {/* after */}
          <div className="p-5 bg-card relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange mb-2">After</p>
            <p className="text-[13px] font-semibold text-ink leading-relaxed">{item.suggestion}</p>
            <div aria-hidden className="absolute -top-3 -right-3 w-16 h-16 rounded-full pointer-events-none"
                 style={{ background: 'radial-gradient(circle, rgba(255,92,40,.16), transparent 65%)', filter: 'blur(14px)' }} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-line grid grid-cols-2 gap-2">
          <button onClick={onUndo}
            className="text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-2.5 hover:bg-line/40 transition-colors">
            Back
          </button>
          <button onClick={onApply}
            className="text-[13px] font-semibold text-white bg-ink rounded-[12px] py-2.5 hover:opacity-90 transition-opacity">
            Apply ✓
          </button>
        </div>
      </div>

      <p className="text-[10px] text-ink-3 mt-3 text-center">{item.why}</p>
    </div>
  )
}

/* ── Done state ─────────────────────────────────────────────────── */
function DoneState({
  appliedCount, skippedCount, onLand,
}: { appliedCount: number; skippedCount: number; onLand: () => void }) {
  return (
    <div className="w-full text-center">
      <div className="relative inline-block">
        <div aria-hidden className="absolute -inset-8 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,92,40,.14), transparent 65%)', filter: 'blur(20px)' }} />
        <TiikmeMascot size={64} bg pulse />
      </div>
      <h2 className="text-[22px] font-semibold text-ink tracking-tight mt-5">Audit complete.</h2>
      <p className="text-[13px] text-ink-2 mt-2 leading-relaxed max-w-[420px] mx-auto">
        Applied <b className="text-orange">{appliedCount}</b> improvements, skipped {skippedCount}.
        Your Flex is sharper and your trust score went up.
      </p>

      <button onClick={onLand}
        className="mt-6 inline-flex items-center gap-2 bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold px-5 py-3 rounded-[12px] hover:opacity-95 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
        Land me on Twin →
      </button>

      <p className="text-[10px] text-ink-3 mt-6">You can re-audit any time — Twin keeps watching for stale lines.</p>
    </div>
  )
}

/* ── Small bits ─────────────────────────────────────────────────── */
function SectionPill({ section }: { section: AuditItem['section'] }) {
  return <span className="text-[10px] font-semibold text-ink-2 bg-card border border-line rounded-full px-2 py-0.5">{section}</span>
}
function KindPill({ kind }: { kind: AuditKind }) {
  const styles: Record<AuditKind, { label: string; color: string; bg: string }> = {
    rewrite: { label: 'Rewrite',  color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
    add:     { label: 'Add',      color: 'var(--color-green)',  bg: 'rgba(67,201,156,.10)' },
    remove:  { label: 'Remove',   color: 'var(--color-red)',    bg: 'rgba(232,72,72,.10)' },
    fill:    { label: 'Fill',     color: 'var(--color-purple)', bg: 'rgba(109,75,216,.10)' },
  }
  const s = styles[kind]
  return <span className="text-[9px] font-bold tracking-wider rounded-full px-1.5 py-0.5" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
}

/* ── Audit generator (stub) ─────────────────────────────────────── */
/**
 * Produces persona-tuned audit items. In production this maps to a
 * single Twin call that scans the user's Flex and returns suggestions.
 *
 * Cost model: ~1 cheap LLM call per audit *session*, not per item.
 * The user reviews many items but Twin only ran once.
 */
function generateAuditFor(s: OnboardingState): AuditItem[] {
  const persona = s.persona ?? 'fresher'
  const name = s.name || 'You'
  const headline = s.proof.manual?.headline ?? null
  const skills = s.proof.manual?.skills ?? null

  const base: AuditItem[] = []

  // Headline — universally audited
  base.push({
    id: 'a1', section: 'Headline', kind: 'rewrite',
    current: headline ?? (persona === 'employee' ? 'UX designer' : 'B.Tech student'),
    suggestion: persona === 'employee'
      ? 'Senior Product Designer · Banking flows at Razorpay · 5 yrs'
      : persona === 'creator'
      ? 'Design teardowns on YouTube · 42k subs · open to brand collabs'
      : persona === 'organization'
      ? 'Banking software for the next billion · hiring 14 roles'
      : 'B.Tech CS · VIT Vellore · shipped Flutter library app',
    why: 'Recruiters scan headlines in 1.4s on average. Yours should say role + craft + scale.',
  })

  // Skills — encourage specificity
  base.push({
    id: 'a2', section: 'Skills', kind: 'rewrite',
    current: skills ?? 'Figma, design, prototyping',
    suggestion: 'Figma · Design systems · Banking flows · Motion (Framer) · Prototyping',
    why: 'Verb-stack > vague tags. We rank by overlap with role must-haves — specificity wins.',
  })

  // Trust — pick the gap
  base.push({
    id: 'a3', section: 'Trust', kind: 'add',
    current: null,
    suggestion: persona === 'student' || persona === 'intern'
      ? 'Invite 2 classmates to co-sign your final-year project'
      : persona === 'employee'
      ? 'Squad-verify 1 current teammate at Razorpay'
      : persona === 'creator'
      ? 'Connect YouTube — locks in your audience as verified, not self-claimed'
      : 'Connect your careers page so jobs flow into the feed automatically',
    why: 'This single move raises your trust score the most for the least effort.',
  })

  // Experience / projects — persona-specific
  if (persona === 'employee' || persona === 'intern') {
    base.push({
      id: 'a4', section: 'Experience', kind: 'rewrite',
      current: 'Worked on UX for the banking app',
      suggestion: 'Led the account-opening redesign at Zeta — 38% faster funnel, used by 4M+',
      why: 'Numbers + scope > job-description copy. We pull this onto your card in search.',
    })
  } else if (persona === 'creator') {
    base.push({
      id: 'a4', section: 'Projects', kind: 'add',
      current: null,
      suggestion: 'Add 1 paid collab — even a small one. Verified collabs raise your brand-match score.',
      why: 'Brands filter by past-collab evidence. Self-claim is invisible to them.',
    })
  } else if (persona === 'fresher' || persona === 'student') {
    base.push({
      id: 'a4', section: 'Projects', kind: 'fill',
      current: null,
      suggestion: 'Drop a 1-line "impact" on your library app: who uses it, how many, what changed.',
      why: 'Recruiters score freshers on shipped projects. Outcome > description.',
    })
  }

  // GitHub link gap
  if (persona !== 'organization' && persona !== 'brand') {
    base.push({
      id: 'a5', section: 'Links', kind: 'fill',
      current: s.proof.manual?.links?.github ?? null,
      suggestion: 'github.com/' + (name.toLowerCase().replace(/\s+/g, '-')),
      why: 'GitHub OAuth doubles your trust score for engineers. One click to verify.',
    })
  }

  return base
}
