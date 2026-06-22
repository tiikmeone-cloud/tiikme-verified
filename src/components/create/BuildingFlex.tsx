'use client'

import { useEffect, useState } from 'react'
import TiikmeMascot from '@/components/agent/TiikmeMascot'
import TwinThinking from '@/components/agent/TwinThinking'
import type { OnboardingState, Persona } from '@/lib/onboarding'

/**
 * The "live Flex build" moment — the wow.
 * Twin reads the resume/chips and the Flex *appears* in pieces over ~9 seconds.
 * Each step is a real, named operation so the user feels Twin is doing real work.
 */

interface Step {
  label: string
  card?: 'identity' | 'education' | 'projects' | 'skills' | 'trust'
}

function stepsFor(persona: Persona, mode: 'resume' | 'chips' | 'manual' | null): Step[] {
  const reading = mode === 'resume'
    ? 'Reading your resume…'
    : 'Reading what you told me…'
  const base: Step[] = [
    { label: reading },
    { label: 'Pulling out who you are…', card: 'identity' },
  ]
  if (persona === 'student' || persona === 'fresher') {
    base.push(
      { label: 'Finding your education…',         card: 'education' },
      { label: 'Logging the things you built…',   card: 'projects' },
      { label: 'Mapping your skills…',            card: 'skills' },
      { label: 'Setting your trust baseline…',    card: 'trust' },
    )
  } else if (persona === 'intern') {
    base.push(
      { label: 'Finding your education…',         card: 'education' },
      { label: 'Logging your internship work…',   card: 'projects' },
      { label: 'Mapping your skill stack…',       card: 'skills' },
      { label: 'Scoring trust from your manager…', card: 'trust' },
    )
  } else if (persona === 'employee') {
    base.push(
      { label: 'Lining up your experience…',      card: 'projects' },
      { label: 'Mapping your skill stack…',       card: 'skills' },
      { label: 'Scoring trust from squads & certs…', card: 'trust' },
    )
  } else if (persona === 'creator') {
    base.push(
      { label: 'Finding your platforms…',         card: 'projects' },
      { label: 'Mapping your craft…',             card: 'skills' },
      { label: 'Setting your audience signal…',   card: 'trust' },
    )
  } else { // brand / organization
    base.push(
      { label: 'Setting up your desk…',           card: 'projects' },
      { label: persona === 'organization' ? 'Prepping your candidate pipeline…' : 'Prepping your creator pipeline…', card: 'skills' },
      { label: 'Locking access rules…',           card: 'trust' },
    )
  }
  return base
}

export default function BuildingFlex({
  persona, state, onDone,
}: {
  persona: Persona
  state: OnboardingState
  onDone: () => void
}) {
  const steps = stepsFor(persona, state.proof.mode)
  const [active, setActive] = useState(0)
  const [reveals, setReveals] = useState<Set<string>>(new Set())

  // Tightened: ~400ms / step so total feels fast (~3s) not slow.
  // The "wow" comes from the live build, not the wait.
  useEffect(() => {
    if (active >= steps.length) { const t = setTimeout(onDone, 350); return () => clearTimeout(t) }
    const t = setTimeout(() => {
      const s = steps[active]
      if (s.card) setReveals(prev => { const n = new Set(prev); n.add(s.card!); return n })
      setActive(a => a + 1)
    }, active === 0 ? 450 : 420)
    return () => clearTimeout(t)
  }, [active, steps, onDone])

  // First 1.2 seconds: full-screen Twinning overlay sets the tone.
  // Then we shift into the side-by-side trace + Flex card reveal.
  const [showOverlay, setShowOverlay] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowOverlay(false), 1200)
    return () => clearTimeout(t)
  }, [])

  if (showOverlay) {
    return (
      <TwinThinking
        variant="overlay"
        text="Building"
        subtext={state.proof.mode === 'resume'
          ? 'Reading your resume and assembling your Flex.'
          : 'Assembling your Flex from what you told me.'}
      />
    )
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
      {/* LEFT — trace */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <TiikmeMascot size={30} bg pulse />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Tiik · building</p>
            <p className="text-[15px] font-semibold text-ink leading-tight">
              Hang tight, {state.name.split(' ')[0] || 'building yours'}…
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {steps.map((s, i) => {
            const done = i < active
            const live = i === active
            return (
              <div key={i} className="flex items-center gap-2.5 text-[13px]">
                {done
                  ? <span className="w-4 h-4 rounded-full bg-green text-white text-[9px] font-bold flex items-center justify-center shrink-0">✓</span>
                  : live
                    ? <Spinner />
                    : <span className="w-4 h-4 rounded-full border border-line shrink-0" />}
                <span className={done ? 'text-ink-2' : live ? 'text-ink' : 'text-ink-3'}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT — the Flex itself, appearing */}
      <aside className="rounded-[20px] bg-card border border-line p-5 shadow-card relative overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-3">Your Flex</p>

        {/* identity */}
        <Reveal show={reveals.has('identity')}>
          <div className="flex items-center gap-3 pb-3 border-b border-line">
            <div className="w-12 h-12 rounded-[13px] bg-gradient-to-br from-orange to-orange-2 text-white text-[16px] font-bold flex items-center justify-center shrink-0">
              {(state.name[0] || 'Y').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-ink leading-tight truncate">{state.name || 'You'}</p>
              <p className="text-[11px] text-ink-3 mt-0.5 truncate">{personaHeadline(persona, state)}</p>
            </div>
          </div>
        </Reveal>

        {/* education */}
        <Reveal show={reveals.has('education')}>
          <Block title="Education">
            <Line text={eduLine(state) || 'Add your education'} verified={false} />
          </Block>
        </Reveal>

        {/* projects */}
        <Reveal show={reveals.has('projects')}>
          <Block title={persona === 'organization' || persona === 'brand' ? 'Desk' : 'Projects'}>
            {(projectLines(state).length ? projectLines(state) : [projectFallback(persona)]).slice(0, 2).map((p, i) => (
              <Line key={i} text={p} verified={i === 0} />
            ))}
          </Block>
        </Reveal>

        {/* skills */}
        <Reveal show={reveals.has('skills')}>
          <Block title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {skillsFromDraft(persona, state).map(s => (
                <span key={s} className="text-[10.5px] font-medium text-ink-2 bg-page border border-line rounded-full px-2 py-0.5">{s}</span>
              ))}
            </div>
          </Block>
        </Reveal>

        {/* trust */}
        <Reveal show={reveals.has('trust')}>
          <Block title="Trust score">
            <div className="flex items-end gap-2">
              <span className="text-[28px] font-black text-ink leading-none">{trustFor(persona)}</span>
              <span className="text-[11px] text-ink-3 mb-1">/100 · baseline</span>
            </div>
            <div className="flex gap-1 h-1.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-full" style={{ backgroundColor: i < Math.ceil(trustFor(persona)/20) ? 'var(--color-purple)' : 'var(--color-line)' }} />
              ))}
            </div>
            <p className="text-[10px] text-ink-3 mt-1.5">Identity ✓ · Add squads + certs to grow.</p>
          </Block>
        </Reveal>
      </aside>
    </div>
  )
}

/* ── small bits ── */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-line last:border-0">
      <p className="text-[9.5px] font-bold uppercase tracking-widest text-ink-3 mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
function Line({ text, verified }: { text: string; verified: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
      <span className="flex-1 truncate">{text}</span>
      {verified && <span className="text-[9px] font-bold text-purple bg-purple/10 rounded-full px-1.5 py-0.5">✓ verified</span>}
    </div>
  )
}
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className="transition-all"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
        maxHeight: show ? 800 : 0,
        overflow: 'hidden',
        transitionDuration: '420ms',
        transitionTimingFunction: 'cubic-bezier(.2,.7,.2,1)',
      }}>
      {children}
    </div>
  )
}
function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-[1.6px] border-orange/30 border-t-orange shrink-0" style={{ animation: 'tk-spin .6s linear infinite' }}>
      <style>{`@keyframes tk-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}

/* ── content helpers — read the real flexDraft the user just filled ── */
function personaHeadline(p: Persona, s: OnboardingState): string {
  const d = s.flexDraft ?? {}
  const loc = s.location ? ` · ${s.location}` : ''
  switch (p) {
    case 'student':      return [d.degree, d.field].filter(Boolean).join(' · ') + (loc) || `Student${loc}`
    case 'intern':       return [d.role, d.company].filter(Boolean).join(' @ ') + loc || `Intern${loc}`
    case 'fresher':      return (d.targetRole ? `${d.targetRole} · seeking first role` : 'Fresher') + loc
    case 'employee':     return [d.role, d.company].filter(Boolean).join(' @ ') + loc || `Employee${loc}`
    case 'creator':      return [d.niche, d.platforms].filter(Boolean).join(' · ') + loc || `Creator${loc}`
    case 'brand':        return [d.company, d.category].filter(Boolean).join(' · ') || `Brand${loc}`
    case 'organization': return [d.company, d.orgType].filter(Boolean).join(' · ') || `Hiring${loc}`
  }
}
/* Education line from draft */
function eduLine(s: OnboardingState): string {
  const d = s.flexDraft ?? {}
  return [d.degree, d.field, d.institution, d.gradYear].filter(Boolean).join(' · ')
}
/* Project/impact lines from draft (textarea → array) */
function projectLines(s: OnboardingState): string[] {
  const d = s.flexDraft ?? {}
  const raw = d.projects || d.shipped || d.impact || d.bestWork || d.roles || ''
  return raw.split('\n').map(x => x.trim()).filter(Boolean)
}
/* Skills from draft (comma list) */
function skillsFromDraft(p: Persona, s: OnboardingState): string[] {
  const d = s.flexDraft ?? {}
  const raw = d.skills || d.lookingFor || d.platforms || ''
  const arr = raw.split(/[,·]+/).map(x => x.trim()).filter(Boolean).slice(0, 6)
  if (arr.length) return arr
  return skillsFor(p, s)
}
function projectFallback(p: Persona): string {
  switch (p) {
    case 'employee':     return 'Shipped Series-D banking flow · Razorpay'
    case 'intern':       return 'Redesigned KYC funnel — 12% lift'
    case 'creator':      return 'YouTube · 42k subs · Design teardowns'
    case 'brand':        return '5 creators briefed · Q3 launch'
    case 'organization': return '14 open roles · 3 hiring panels active'
    case 'fresher':      return 'Solo iOS app · 800 users'
    case 'student':      return 'Final-year campus library app · Flutter'
  }
}
function altProject(p: Persona): string {
  switch (p) {
    case 'employee':     return 'Design system led · 12 designers'
    case 'intern':       return 'Internship in progress · 4 months'
    case 'creator':      return 'Sponsored 4× this quarter'
    case 'brand':        return '1 active campaign'
    case 'organization': return 'Squad density: 64%'
    case 'fresher':      return 'Hackathon winner · IIT-B Summer'
    case 'student':      return 'Hackathon winner · IIT-B Summer'
  }
}
function skillsFor(p: Persona, s: OnboardingState): string[] {
  const chip = s.flexDraft?.skills ?? s.proof.chips?.[2]
  const fromChip = chip ? chip.split(/[,·]+/).map(x => x.trim()).filter(Boolean).slice(0, 4) : []
  if (fromChip.length) return fromChip
  switch (p) {
    case 'creator':      return ['Editing', 'Storytelling', 'Brand', 'Motion']
    case 'organization': return ['JD writing', 'Pipelines', 'Interviewing']
    case 'brand':        return ['Briefs', 'Creator ops', 'Campaign mgmt']
    default:             return ['Figma', 'React', 'TypeScript', 'Design systems']
  }
}
function trustFor(p: Persona): number {
  switch (p) {
    case 'employee':     return 64
    case 'creator':      return 52
    case 'intern':       return 46
    case 'brand':        return 40
    case 'organization': return 40
    case 'fresher':      return 38
    case 'student':      return 34
  }
}
