'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TiikmeMark from '@/components/brand/TiikmeMark'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import SmartSelect from '@/components/ui/SmartSelect'
import BuildingFlex from '@/components/create/BuildingFlex'
import {
  loadOnboarding, saveOnboarding, PERSONA_LABEL,
  type OnboardingState, type Persona,
} from '@/lib/onboarding'
import { PERSONA_SCHEMA, stepComplete, type FlexDraft, type StepDef } from '@/lib/onboardingSchema'
import { extractFlexFromResume, extractedToDraft } from '@/lib/extractFlex'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { createClient } from '@/lib/supabase/client'

type Phase = 'basics' | 'path' | 'form' | 'building' | 'diagnosis'

async function persistOnboardingToDb(state: OnboardingState, draft: FlexDraft) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: existing } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
  const slug = (state.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
  const username = existing?.username || `${slug}${Math.random().toString(36).slice(2, 5)}`
  const headline = draft.targetRole || draft.role || draft.roles || null
  const skills = draft.skills ? (draft.skills as string).split(',').map(s => s.trim()).filter(Boolean) : undefined
  await supabase.from('profiles').update({
    full_name: state.name || undefined,
    username,
    location_city: state.location || undefined,
    headline,
    ...(skills && skills.length ? { skills } : {}),
    account_type: ['organization', 'brand'].includes(state.persona ?? '') ? 'org' : 'user',
  }).eq('id', user.id)
}

export default function CreateShell() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [phase, setPhase] = useState<Phase>('basics')
  const [formStep, setFormStep] = useState(0)
  const [draft, setDraft] = useState<FlexDraft>({})

  useEffect(() => {
    const s = loadOnboarding()
    if (!s.persona) { router.replace('/welcome'); return }
    setState(s)
    if (s.flexDraft) setDraft(s.flexDraft)
  }, [router])

  if (!state || !state.persona) return null
  const persona = state.persona
  const schema = PERSONA_SCHEMA[persona]

  const patch = (p: Partial<OnboardingState>) => {
    const merged = { ...state, ...p } as OnboardingState
    setState(merged); saveOnboarding(merged)
  }
  const setField = (id: string, v: string) => {
    setDraft(d => { const next = { ...d, [id]: v }; patch({ flexDraft: next }); return next })
  }

  // progress = basics → path/form steps → building → diagnosis
  const totalDots = 2 + schema.length
  const dotIndex =
    phase === 'basics' ? 0
    : phase === 'path' ? 1
    : phase === 'form' ? 1 + formStep + 1
    : phase === 'building' ? totalDots - 1
    : totalDots

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <InfiniteGridBackdrop />

      <header className="relative z-10 px-6 lg:px-10 pt-6 flex items-center gap-3">
        <TiikmeMark size="sm" showWordmark />
        <span className="text-[10px] text-ink-3">·</span>
        <span className="text-[11px] font-semibold text-ink-2 bg-card border border-line rounded-full px-2.5 py-0.5 inline-flex items-center gap-1.5">
          {PERSONA_LABEL[persona]}
          {state.alsoBrand && <span className="text-orange">+ Brand</span>}
          {state.alsoOrganization && <span className="text-orange">+ Org</span>}
        </span>
        <div className="flex-1" />
        <ProgressDots total={totalDots} index={dotIndex} />
      </header>

      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 lg:px-10 py-8 mx-auto w-full" style={{ maxWidth: 640 }}>
        {phase === 'basics' && (
          <BasicsStep state={state} persona={persona}
            onNext={(name, location, alsoBrand, alsoOrg) => { patch({ name, location, alsoBrand, alsoOrganization: alsoOrg }); setPhase('path') }} />
        )}

        {phase === 'path' && (
          <PathStep persona={persona} firstName={state.name.split(' ')[0]}
            onResume={async (file) => {
              patch({ proof: { mode: 'resume', resumeName: file.name } })
              setPhase('building')
              // Try real extraction; on any non-ok, keep the draft as-is (manual fallback later).
              const res = await extractFlexFromResume(file, persona)
              if (res.ok) {
                const merged = { ...draft, ...extractedToDraft(res.flex) }
                setDraft(merged); patch({ flexDraft: merged })
              } else if (res.reason === 'no_key') {
                // silent — extraction not configured yet; building animation still runs
              }
            }}
            onBuild={() => { patch({ proof: { mode: 'manual' } }); setFormStep(0); setPhase('form') }} />
        )}

        {phase === 'form' && (
          <FormStep
            step={schema[formStep]} draft={draft} setField={setField}
            stepNo={formStep + 1} stepTotal={schema.length}
            onBack={() => formStep === 0 ? setPhase('path') : setFormStep(s => s - 1)}
            onNext={() => {
              if (formStep < schema.length - 1) setFormStep(s => s + 1)
              else setPhase('building')
            }} />
        )}

        {phase === 'building' && (
          <BuildingFlex persona={persona} state={state} onDone={() => setPhase('diagnosis')} />
        )}

        {phase === 'diagnosis' && (
          <DiagnosisStep persona={persona} state={state} draft={draft}
            onLand={async () => { patch({ completedAt: new Date().toISOString() }); await persistOnboardingToDb(state, draft); router.push(landingFor(persona)) }}
            onAudit={async () => { patch({ completedAt: new Date().toISOString() }); await persistOnboardingToDb(state, draft); router.push('/audit') }}
            onTwin={async () => { patch({ completedAt: new Date().toISOString() }); await persistOnboardingToDb(state, draft); router.push('/') }} />
        )}
      </section>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  Basics                                                          */
/* ─────────────────────────────────────────────────────────────── */
function BasicsStep({
  state, persona, onNext,
}: { state: OnboardingState; persona: Persona; onNext: (n: string, l: string, ab: boolean, ao: boolean) => void }) {
  const [name, setName] = useState(state.name)
  const [loc, setLoc] = useState(state.location)
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const isBuyer = persona === 'brand' || persona === 'organization'
  const [also, setAlso] = useState(persona === 'brand' ? !!state.alsoOrganization : persona === 'organization' ? !!state.alsoBrand : false)
  const canGo = name.trim().length >= 2

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      setUserId(data.user.id)
      const { data: p } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).maybeSingle()
      if (p?.avatar_url) setAvatarUrl(p.avatar_url)
    })()
  }, [])

  const handleAvatarUploaded = async (publicUrl: string) => {
    if (!userId) return
    setAvatarUrl(publicUrl)
    await createClient().from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
  }

  return (
    <div className="w-full">
      <h2 className="text-[26px] font-bold text-ink tracking-tight leading-tight">
        {isBuyer ? 'Let’s set you up' : 'First — what should I call you?'}
      </h2>
      <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">Two fields. Twin learns the rest from what you share next.</p>

      <form onSubmit={(e) => { e.preventDefault(); if (canGo) onNext(name.trim(), loc.trim(), persona === 'organization' ? also : false, persona === 'brand' ? also : false) }}
        className="mt-7 space-y-3.5">

        {userId && (
          <div className="bg-card border border-line rounded-[14px] p-4">
            <AvatarUpload
              bucket="profile-avatars"
              ownerId={userId}
              currentUrl={avatarUrl}
              fallback={name || 'Y'}
              size={64}
              onUploaded={handleAvatarUploaded}
            />
          </div>
        )}

        <Field label={isBuyer ? 'Your name' : 'Your name'} value={name} onChange={setName} placeholder="Naadhan S" autoFocus required />
        <Field label="City (optional)" value={loc} onChange={setLoc} placeholder="Bengaluru, IN" />

        {isBuyer && (
          <label className="flex items-start gap-3 bg-card border border-line rounded-[14px] p-3.5 cursor-pointer hover:border-orange/30 transition-colors">
            <input type="checkbox" checked={also} onChange={e => setAlso(e.target.checked)} className="mt-0.5 accent-[var(--color-orange)] w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink leading-tight">{persona === 'brand' ? 'We also hire full-time roles' : 'We also brief creators'}</p>
              <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">{persona === 'brand' ? 'Adds a hiring desk alongside campaigns.' : 'Adds a creator-brief desk alongside hiring.'}</p>
            </div>
          </label>
        )}

        <button type="submit" disabled={!canGo} className={btnPrimary}>Continue</button>
      </form>
      <p className="text-[10px] text-ink-3 mt-5">No email asked yet. We never broadcast it — even to recruiters.</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  Path — resume (fast) vs build with me (schema form)            */
/* ─────────────────────────────────────────────────────────────── */
function PathStep({
  persona, firstName, onResume, onBuild,
}: { persona: Persona; firstName: string; onResume: (f: File) => void; onBuild: () => void }) {
  const showResume = !['brand', 'organization'].includes(persona) // buyers don't have resumes
  return (
    <div className="w-full">
      <h2 className="text-[24px] font-bold text-ink tracking-tight leading-tight">
        How do you want to build it, {firstName}?
      </h2>
      <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">Both end in the same place — a verified Flex.</p>

      <div className="mt-6 space-y-3">
        {showResume && (
          <label className="block cursor-pointer rounded-[18px] border border-line bg-card hover:border-orange/40 transition-colors p-5 group">
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onResume(f) }} />
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-[13px] bg-orange-soft text-orange flex items-center justify-center shrink-0 group-hover:scale-[1.04] transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-semibold text-ink">Drop a resume (PDF)</p>
                  <span className="text-[9px] font-bold text-orange tracking-wider bg-orange-soft px-1.5 py-0.5 rounded-full">~3 sec</span>
                </div>
                <p className="text-[11.5px] text-ink-3 mt-0.5">Tiik reads it and pre-fills everything.</p>
              </div>
              <Chev />
            </div>
          </label>
        )}

        <button onClick={onBuild} className="w-full rounded-[18px] border border-line bg-card p-5 hover:border-orange/30 transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[13px] bg-page text-ink-2 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">{showResume ? 'Build it with me' : 'Set up your desk'}</p>
              <p className="text-[11.5px] text-ink-3 mt-0.5">A few smart questions · pick or type your own answers.</p>
            </div>
            <Chev />
          </div>
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  Form — renders a persona step from schema with SmartSelect     */
/* ─────────────────────────────────────────────────────────────── */
function FormStep({
  step, draft, setField, stepNo, stepTotal, onBack, onNext,
}: {
  step: StepDef; draft: FlexDraft; setField: (id: string, v: string) => void
  stepNo: number; stepTotal: number; onBack: () => void; onNext: () => void
}) {
  const ok = stepComplete(step, draft)
  return (
    <div className="w-full">
      <button onClick={onBack} className="text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors mb-4 inline-flex items-center gap-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> Back
      </button>

      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Step {stepNo} of {stepTotal}</p>
      <h2 className="text-[23px] font-bold text-ink tracking-tight leading-tight mt-1">{step.title}</h2>
      <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">{step.subtitle}</p>

      <form onSubmit={(e) => { e.preventDefault(); if (ok) onNext() }} className="mt-6 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {step.fields.map(f => {
            const wrap = f.half ? '' : 'sm:col-span-2'
            return (
              <div key={f.id} className={wrap}>
                {(f.type === 'select' || f.type === 'multi') && f.taxonomy ? (
                  <SmartSelect
                    field={f.taxonomy}
                    value={draft[f.id] ?? ''}
                    onChange={(v) => setField(f.id, v)}
                    label={f.label}
                    placeholder={f.placeholder}
                    multi={f.type === 'multi'}
                    required={f.required}
                  />
                ) : f.type === 'textarea' ? (
                  <TextArea label={f.label} value={draft[f.id] ?? ''} onChange={(v) => setField(f.id, v)} placeholder={f.placeholder} required={f.required} />
                ) : (
                  <Field label={f.label} value={draft[f.id] ?? ''} onChange={(v) => setField(f.id, v)} placeholder={f.placeholder} required={f.required} type={f.type === 'number' ? 'number' : 'text'} />
                )}
                {f.hint && <p className="text-[10px] text-ink-3 mt-1">{f.hint}</p>}
              </div>
            )
          })}
        </div>

        <button type="submit" disabled={!ok} className={btnPrimary}>
          {stepNo < stepTotal ? 'Continue' : 'Build my Flex'}
        </button>
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  Diagnosis                                                       */
/* ─────────────────────────────────────────────────────────────── */
function DiagnosisStep({
  persona, state, draft, onLand, onAudit, onTwin,
}: { persona: Persona; state: OnboardingState; draft: FlexDraft; onLand: () => void; onAudit: () => void; onTwin: () => void }) {
  const firstName = state.name.split(' ')[0] || 'there'
  const d = diagnosisFor(persona, firstName, draft)
  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[22px] p-6 lg:p-7 border border-orange/15"
        style={{ background: 'linear-gradient(135deg, rgba(255,92,40,.06) 0%, rgba(109,75,216,.04) 100%)' }}>
        <span aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,92,40,.18), transparent 65%)', filter: 'blur(20px)' }} />
        <div className="relative flex items-start gap-3">
          <TiikmeMark size="md" alive />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Tiik · first read</p>
            <h2 className="text-[20px] font-bold text-ink leading-snug tracking-tight mt-1">{d.topline}</h2>
            <p className="text-[13.5px] text-ink-2 mt-2 leading-relaxed">{d.line}</p>
          </div>
        </div>
        <div className="mt-5 space-y-1.5 relative">
          <p className="text-[11px] font-semibold text-ink mb-1">Next 7 days, in order:</p>
          {d.gaps.map((g, i) => (
            <div key={g} className="flex items-center gap-2.5 bg-card border border-line rounded-[12px] px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-orange-soft text-orange text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-[12.5px] text-ink-2 leading-snug">{g}</span>
            </div>
          ))}
        </div>
      </div>

      {(() => {
        const isBuyer = ['organization', 'brand'].includes(persona)
        const isCreator = persona === 'creator'
        const primaryLabel = isBuyer ? '⌘ Open my desk →' : isCreator ? '◉ Open my creator desk →' : '✦ Audit my Flex with Twin →'
        const secondaryLabel = (isBuyer || isCreator) ? 'Talk to Twin' : 'Land on Twin'
        // Buyers/creators: primary = open desk, secondary = Twin.
        // Candidates: primary = audit Flex, secondary = land on Twin.
        const onPrimary = (isBuyer || isCreator) ? onLand : onAudit
        const onSecondary = (isBuyer || isCreator) ? onTwin : onLand
        return (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onClick={onPrimary} className="col-span-1 sm:col-span-2 bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold py-3 rounded-[12px] hover:opacity-95 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
              {primaryLabel}
            </button>
            <button onClick={onSecondary} className="text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-3 hover:bg-page transition-colors">{secondaryLabel}</button>
          </div>
        )
      })()}
    </div>
  )
}

/** Buyers + creators land on their desk; candidates land on Twin. */
function landingFor(persona: Persona): string {
  return ['organization', 'brand', 'creator'].includes(persona) ? '/desk' : '/'
}

function diagnosisFor(persona: Persona, firstName: string, draft: FlexDraft): { topline: string; line: string; gaps: string[] } {
  const role = draft.targetRole || draft.role || draft.roles
  switch (persona) {
    case 'organization': return { topline: `${firstName}, your hiring desk is ready.`, line: `Post ${draft.roles || 'a role'} and I’ll surface 5 verified candidates.`, gaps: ['Post your first role', 'Invite a teammate', 'Connect your careers page (optional)'] }
    case 'brand':        return { topline: `${firstName}, your brand desk is ready.`, line: `I’ll match verified ${draft.lookingFor || 'creators'} to your briefs.`, gaps: ['Add a brief', 'Set your budget band', 'Shortlist 3 creators'] }
    case 'creator':      return { topline: `${firstName}, you’re live as a creator.`, line: 'Connect a platform and your audience becomes verified proof brands can trust.', gaps: ['Connect your top platform', 'Add 1 paid collab', 'Pick a collab type'] }
    case 'employee':     return { topline: `${firstName}, your Flex is up.`, line: `Strong start as ${role || 'a pro'} — two moves will lift your trust score fastest.`, gaps: ['Squad-verify a current colleague', 'Add 1 shipped case study', 'Connect GitHub'] }
    case 'intern':       return { topline: `${firstName}, you’re ahead of most interns.`, line: 'Real work is going. Let’s turn it into proof that lands the full-time.', gaps: ['Get your manager to squad-verify you', 'Add 1 shipped artefact', 'Set your target role'] }
    case 'fresher':      return { topline: `${firstName}, here’s where you stand.`, line: `Top 18% of freshers for ${role || 'your stack'} — two gaps are hurting your match score.`, gaps: ['Add a shipped project', 'Connect GitHub', 'Get 1 classmate to co-sign'] }
    case 'student':
    default:             return { topline: `${firstName}, your Flex is started.`, line: 'Ahead of 64% of students because you’ve already shipped. Lock in classmate co-signs.', gaps: ['Invite 2 classmates to co-sign', 'Add 1 cert in progress', 'Set your internship target'] }
  }
}

/* ─────────────────────────────────────────────────────────────── */
/*  Bits                                                            */
/* ─────────────────────────────────────────────────────────────── */
const btnPrimary = 'mt-2 w-full bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold py-3 rounded-[12px] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]'

function Field({ label, value, onChange, placeholder, autoFocus, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; required?: boolean; type?: string
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        className="mt-1.5 w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all" />
    </label>
  )
}
function TextArea({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="mt-1.5 w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all resize-y leading-relaxed" />
    </label>
  )
}
function Chev() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-orange transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
}
function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="h-1 rounded-full transition-all" style={{ width: i === index ? 22 : 6, backgroundColor: i <= index ? 'var(--color-orange)' : 'var(--color-line)' }} />
      ))}
    </div>
  )
}
