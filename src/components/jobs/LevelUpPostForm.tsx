'use client'

/**
 * LevelUpPostForm — a provider/org publishes a Course, Certificate or Hackathon
 * into Level Up. 2-step wizard: (1) Basics, (2) Brochure — the rich content the
 * detail view renders (who-for, outcomes, live projects, syllabus, EMI, prereqs,
 * instructors, FAQs). Pre-filled with dummy data so every field is self-explanatory.
 * Writes `learn_items` (incl. the `details` jsonb).
 */

import { useState } from 'react'
import SmartSelect from '@/components/ui/SmartSelect'
import { postLearnItem, updateLearnItem, type LearnKind, type LearnDetails, type LearnItem } from '@/lib/learn'

interface Props {
  onClose: () => void
  onPosted?: () => void
  editItem?: LearnItem        // when set, form is in edit mode
  orgId?: string              // org posting this item
  orgLogoUrl?: string | null  // when set, use org logo instead of colour picker
  orgColor?: string           // org brand colour; auto-applied when orgId present
}

const KINDS: [LearnKind, string][] = [['course', 'Course'], ['certificate', 'Certificate'], ['hackathon', 'Hackathon']]
const COLORS = ['#FF5C28', '#6D4BD8', '#1D9E75', '#378ADD', '#D4537E']
const STEPS = ['Basics', 'Brochure']

const csv = (s: string) => s.split(/[,·]+/).map(x => x.trim()).filter(Boolean)
const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
// Parse "title | description" per line into {title, summary}
const titleSummaryLines = (s: string) =>
  lines(s).map(line => {
    const [t, ...rest] = line.split('|')
    return { title: t.trim(), summary: rest.join('|').trim() }
  }).filter(x => x.title)
// Parse "Module title | topic1, topic2" per line into {title, topics[]}
const moduleLines = (s: string) =>
  lines(s).map(line => {
    const [t, ...rest] = line.split('|')
    return { title: t.trim(), topics: csv(rest.join('|')) }
  }).filter(x => x.title)
// Parse "Q? | A." per line into {q, a}
const faqLines = (s: string) =>
  lines(s).map(line => {
    const [q, ...rest] = line.split('|')
    return { q: q.trim(), a: rest.join('|').trim() }
  }).filter(x => x.q)

const joinLines = (arr: string[] | undefined) => (arr ?? []).join('\n')
const joinTitleSummary = (arr: { title: string; summary: string }[] | undefined) =>
  (arr ?? []).map(p => `${p.title} | ${p.summary}`).join('\n')
const joinModules = (arr: { title: string; topics: string[] }[] | undefined) =>
  (arr ?? []).map(m => `${m.title} | ${m.topics.join(', ')}`).join('\n')
const joinFaqs = (arr: { q: string; a: string }[] | undefined) =>
  (arr ?? []).map(f => `${f.q} | ${f.a}`).join('\n')
const joinInstructors = (arr: { name: string; title: string; bio?: string }[] | undefined) =>
  (arr ?? []).map(i => [i.name, i.title, i.bio].filter(Boolean).join(' | ')).join('\n')

export default function LevelUpPostForm({ onClose, onPosted, editItem, orgId, orgLogoUrl, orgColor }: Props) {
  const isEdit = !!editItem
  const ed = editItem?.details ?? {}
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState<LearnKind>(editItem?.kind ?? 'course')
  const [f, setF] = useState({
    title: editItem?.title ?? '',
    provider: editItem?.provider ?? '',
    color: editItem?.provider_color ?? orgColor ?? '#FF5C28',
    skills: (editItem?.skills ?? []).join(', '),
    level: editItem?.level ?? 'Beginner',
    isFree: editItem?.is_free ?? false,
    cost: editItem?.cost ?? '',
    duration: editItem?.duration ?? '',
    startsOn: editItem?.starts_on ?? '',
    deadline: editItem?.deadline ?? '',
    location: editItem?.location ?? '',
    prize: editItem?.prize ?? '',
    url: editItem?.url ?? '',
    summary: editItem?.summary ?? '',
    expiresAt: editItem?.expires_at ? editItem.expires_at.slice(0, 10) : '',
  })
  const [b, setB] = useState({
    about: ed.about ?? '',
    whoFor: joinLines(ed.who_for),
    whoCanApply: ed.who_can_apply ?? '',
    outcomes: joinLines(ed.outcomes),
    liveProjects: joinTitleSummary(ed.live_projects),
    syllabus: joinModules(ed.syllabus),
    format: ed.format ?? '',
    weeklyHours: ed.weekly_hours ?? '',
    schedule: ed.schedule ?? '',
    language: ed.language ?? '',
    emi: ed.emi_available ?? false,
    emiBand: ed.emi_band ?? '',
    scholarships: ed.scholarships ?? '',
    refund: ed.refund_policy ?? '',
    prereqs: joinLines(ed.prerequisites),
    instructors: joinInstructors(ed.instructors),
    certificate: ed.certificate ?? '',
    placement: ed.placement_help ?? '',
    faqs: joinFaqs(ed.faqs),
  })
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const setF1 = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))
  const setB1 = (k: keyof typeof b) => (v: string | boolean) => setB(p => ({ ...p, [k]: v as never }))

  const canPost = f.title.trim().length >= 3 && f.provider.trim().length > 0

  const submit = async () => {
    if (!canPost) { setError('Add a title and provider.'); setStep(1); return }
    setPosting(true); setError(null)
    const details: LearnDetails = {
      about: b.about.trim() || undefined,
      who_for: lines(b.whoFor),
      who_can_apply: b.whoCanApply.trim() || undefined,
      outcomes: lines(b.outcomes),
      live_projects: titleSummaryLines(b.liveProjects),
      syllabus: moduleLines(b.syllabus),
      format: b.format.trim() || undefined,
      weekly_hours: b.weeklyHours.trim() || undefined,
      schedule: b.schedule.trim() || undefined,
      language: b.language.trim() || undefined,
      emi_available: b.emi,
      emi_band: b.emi ? b.emiBand.trim() || undefined : undefined,
      scholarships: b.scholarships.trim() || undefined,
      refund_policy: b.refund.trim() || undefined,
      prerequisites: lines(b.prereqs),
      instructors: lines(b.instructors).map(l => {
        const [name, title, ...rest] = l.split('|').map(s => s.trim())
        return { name, title, bio: rest.join(' | ') || undefined }
      }).filter(x => x.name),
      certificate: b.certificate.trim() || undefined,
      placement_help: b.placement.trim() || undefined,
      faqs: faqLines(b.faqs),
    }
    const payload = {
      kind, title: f.title.trim(), provider: f.provider.trim(), provider_color: f.color,
      url: f.url.trim() || null, summary: f.summary.trim() || null, skills: csv(f.skills),
      level: kind === 'hackathon' ? null : f.level || null,
      is_free: f.isFree, cost: f.isFree ? null : f.cost.trim() || null,
      duration: kind === 'course' ? f.duration.trim() || null : null,
      starts_on: kind === 'hackathon' && f.startsOn ? f.startsOn : null,
      deadline: kind === 'hackathon' && f.deadline ? f.deadline : null,
      location: kind === 'hackathon' ? f.location.trim() || null : null,
      prize: kind === 'hackathon' ? f.prize.trim() || null : null,
      org_id: orgId ?? null,
      expires_at: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
      details,
    }
    const res = isEdit
      ? await updateLearnItem(editItem!.id, payload)
      : await postLearnItem(payload)
    setPosting(false)
    if (res.error) { setError(res.error); return }
    setPosted(true); onPosted?.()
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="bg-card border border-line rounded-[20px] shadow-[0_24px_64px_-20px_rgba(0,0,0,.4)] w-full max-w-[560px]">
          <div className="px-5 pt-5 pb-3 border-b border-line">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">{isEdit ? 'Edit Level Up listing' : 'Post to Level Up · provider'}</p>
            <h2 className="text-[17px] font-bold text-ink mt-1">{isEdit ? `Edit "${editItem!.title}"` : 'Publish learning'}</h2>
            {!posted && <Stepper step={step} />}
          </div>

          {posted ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-orange/15 text-orange mx-auto flex items-center justify-center text-[22px]">✓</div>
              <p className="text-[15px] font-bold text-ink mt-3">{isEdit ? 'Changes saved' : `"${f.title}" is live in Level Up`}</p>
              <p className="text-[12.5px] text-ink-2 mt-1">{isEdit ? 'Your Level Up listing has been updated.' : `Learners will see it under ${KINDS.find(k => k[0] === kind)![1]}s.`}</p>
              <button onClick={onClose} className="mt-5 text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6">Done</button>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {KINDS.map(([v, l]) => (
                        <button key={v} onClick={() => setKind(v)}
                          className={`text-[12.5px] font-semibold py-2 rounded-[10px] border transition-all ${kind === v ? 'bg-orange text-white border-orange' : 'bg-page text-ink-2 border-line hover:border-orange/40'}`}>{l}</button>
                      ))}
                    </div>

                    <Field label="Title" required><Input value={f.title} onChange={setF1('title')} placeholder="Product Design Foundations" /></Field>
                    <div className={orgId ? '' : 'grid grid-cols-2 gap-3'}>
                      <Field label={kind === 'certificate' ? 'Issuer' : kind === 'hackathon' ? 'Host' : 'Provider'} required>
                        <Input value={f.provider} onChange={setF1('provider')} placeholder={kind === 'hackathon' ? 'Devpost / MLH' : 'Coursera / Google'} />
                      </Field>
                      {!orgId && (
                        <Field label="Accent colour">
                          <div className="flex items-center gap-2 h-[42px]">
                            {COLORS.map(c => (
                              <button key={c} onClick={() => setF1('color')(c)} aria-label="colour"
                                className="w-6 h-6 rounded-full" style={{ backgroundColor: c, outline: f.color === c ? '2px solid var(--color-border-primary)' : 'none', outlineOffset: '2px' }} />
                            ))}
                          </div>
                        </Field>
                      )}
                    </div>

                    <Field label="Skills you'll gain"><SmartSelect field="skill" value={f.skills} onChange={setF1('skills')} multi placeholder="Pick a skill…" /></Field>

                    {kind !== 'hackathon' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Level">
                          <select value={f.level} onChange={e => setF1('level')(e.target.value)} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40">
                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All levels</option>
                          </select>
                        </Field>
                        {kind === 'course' && <Field label="Duration"><Input value={f.duration} onChange={setF1('duration')} placeholder="6 weeks" /></Field>}
                      </div>
                    )}

                    {kind === 'hackathon' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Starts on"><DateInput value={f.startsOn} onChange={setF1('startsOn')} /></Field>
                          <Field label="Deadline"><DateInput value={f.deadline} onChange={setF1('deadline')} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Location"><Input value={f.location} onChange={setF1('location')} placeholder="Online / Bengaluru" /></Field>
                          <Field label="Prize"><Input value={f.prize} onChange={setF1('prize')} placeholder="$10k pool" /></Field>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Toggle on={f.isFree} onClick={() => setF(p => ({ ...p, isFree: !p.isFree }))} label="Free" />
                        {!f.isFree && <div className="flex-1"><Input value={f.cost} onChange={setF1('cost')} placeholder="₹3,500" /></div>}
                      </div>
                    )}

                    <Field label="Link"><Input value={f.url} onChange={setF1('url')} placeholder="https://…" /></Field>
                    <Field label="Short summary"><Area value={f.summary} onChange={setF1('summary')} placeholder="One sentence pitch — shows in the list." rows={2} /></Field>
                    <Field label="Listing expires" sub="Leave blank to keep it live indefinitely."><DateInput value={f.expiresAt} onChange={setF1('expiresAt')} /></Field>
                  </>
                )}

                {step === 2 && (
                  <>
                    <p className="text-[11px] text-ink-3 leading-relaxed">The brochure is what learners see when they tap your item — A-to-Z detail beats a one-line description every time.</p>

                    <Field label={`About this ${kind}`}><Area value={b.about} onChange={setB1('about') as (v:string)=>void} rows={3} placeholder="Long-form description of what this is and why it matters." /></Field>
                    <Field label="Who this is for" sub="One persona per line."><Area value={b.whoFor} onChange={setB1('whoFor') as (v:string)=>void} rows={3} placeholder="Career switchers\nFreshers\n…" /></Field>
                    <Field label="Who can apply"><Area value={b.whoCanApply} onChange={setB1('whoCanApply') as (v:string)=>void} rows={2} placeholder="Eligibility, age, prerequisites." /></Field>
                    <Field label="What you'll be able to do" sub="One outcome per line, verb-led."><Area value={b.outcomes} onChange={setB1('outcomes') as (v:string)=>void} rows={3} placeholder="Run user research…\nBuild prototypes…" /></Field>

                    <Field label="Live projects you'll build" sub="One per line · format: title | description"><Area value={b.liveProjects} onChange={setB1('liveProjects') as (v:string)=>void} rows={3} placeholder="Mobile app | End-to-end research → high-fi prototype" /></Field>

                    <Field label="Syllabus" sub="One module per line · format: module title | topic 1, topic 2, …"><Area value={b.syllabus} onChange={setB1('syllabus') as (v:string)=>void} rows={4} placeholder="Module 1 · Foundations | What UX is, The design process" /></Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Format"><Input value={b.format} onChange={setB1('format') as (v:string)=>void} placeholder="Online · Self-paced" /></Field>
                      <Field label="Weekly hours"><Input value={b.weeklyHours} onChange={setB1('weeklyHours') as (v:string)=>void} placeholder="10 hrs / week" /></Field>
                      <Field label="Schedule"><Input value={b.schedule} onChange={setB1('schedule') as (v:string)=>void} placeholder="Cohort starts Aug 5" /></Field>
                      <Field label="Language"><Input value={b.language} onChange={setB1('language') as (v:string)=>void} placeholder="English" /></Field>
                    </div>

                    <div className="border border-line rounded-[12px] p-3 space-y-2.5">
                      <Toggle on={b.emi} onClick={() => setB1('emi')(!b.emi)} label="EMI available" />
                      {b.emi && <Input value={b.emiBand} onChange={setB1('emiBand') as (v:string)=>void} placeholder="₹4,000 / month for 3 months · No-cost EMI" />}
                      <Field label="Scholarships"><Input value={b.scholarships} onChange={setB1('scholarships') as (v:string)=>void} placeholder="Need-based scholarships up to 100%" /></Field>
                      <Field label="Refund policy"><Input value={b.refund} onChange={setB1('refund') as (v:string)=>void} placeholder="7-day money-back" /></Field>
                    </div>

                    <Field label="Prerequisites" sub="One per line."><Area value={b.prereqs} onChange={setB1('prereqs') as (v:string)=>void} rows={2} placeholder="Basic computer skills\nReading & writing English" /></Field>

                    <Field label="Instructors" sub="One per line · format: name | title | short bio"><Area value={b.instructors} onChange={setB1('instructors') as (v:string)=>void} rows={2} placeholder="Riya Mehta | Lead instructor | 10+ yrs at Google" /></Field>

                    <Field label="Certificate"><Input value={b.certificate} onChange={setB1('certificate') as (v:string)=>void} placeholder="Professional Certificate — verified on tiikme" /></Field>
                    <Field label="Placement help"><Input value={b.placement} onChange={setB1('placement') as (v:string)=>void} placeholder="Referrals into 150+ hiring partners" /></Field>

                    <Field label="FAQs" sub="One per line · format: question? | answer."><Area value={b.faqs} onChange={setB1('faqs') as (v:string)=>void} rows={4} placeholder="Do I need experience? | No, starts from zero." /></Field>
                  </>
                )}
              </div>

              {error && <div className="mx-5 mb-1 bg-orange/10 border border-orange/30 rounded-[10px] px-3 py-2"><p className="text-[12px] text-orange font-medium">{error}</p></div>}

              <div className="px-5 py-3.5 border-t border-line flex items-center gap-2">
                <button onClick={step === 1 ? onClose : () => setStep(1)} className="text-[13px] font-semibold text-ink-2 bg-page border border-line rounded-[12px] py-2.5 px-4 hover:opacity-90">{step === 1 ? 'Cancel' : 'Back'}</button>
                <div className="flex-1" />
                <span className="text-[11px] text-ink-3">{step}/2</span>
                {step < 2 ? (
                  <button onClick={() => canPost ? setStep(2) : setError('Add a title and provider.')} disabled={!canPost}
                    className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">Next</button>
                ) : (
                  <button onClick={submit} disabled={!canPost || posting}
                    className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">
                    {posting ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save changes' : 'Publish')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {STEPS.map((label, i) => {
        const n = i + 1, active = n === step, done = n < step
        return (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`flex items-center gap-1.5 text-[11.5px] ${active ? 'text-ink font-semibold' : done ? 'text-ink-2' : 'text-ink-3'}`}>
              <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-ink text-card' : done ? 'bg-orange/15 text-orange' : 'border border-line'}`}>{done ? '✓' : n}</span>
              {label}
            </span>
            {n < STEPS.length && <span className="w-3 h-px bg-line" />}
          </span>
        )
      })}
    </div>
  )
}

function Field({ label, sub, required, children }: { label: string; sub?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span>
      {sub && <span className="block text-[10.5px] text-ink-3 mt-0.5 leading-snug">{sub}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all" />
}
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="date" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40 transition-all" />
}
function Area({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; rows: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all resize-y leading-relaxed" />
}
function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <span className={`w-[40px] h-[22px] rounded-full p-0.5 transition-colors ${on ? 'bg-orange' : 'bg-line'}`}><span className={`block w-[18px] h-[18px] rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : ''}`} /></span>
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
    </button>
  )
}
