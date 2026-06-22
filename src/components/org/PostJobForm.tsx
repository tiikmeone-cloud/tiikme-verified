'use client'

/**
 * PostJobForm — the org's real job-posting form, a 4-step ATS wizard whose fields
 * match what the Jobs board actually renders (the Opening shape): function,
 * experience level, certs, editorial blocks, plus screening with EXPECTED answers
 * so the auto-selection engine can evaluate knockouts.
 *
 *   1 Details   — role, function, type, level, skills, certs, editorial blocks
 *   2 Screening — questions + expected answer; must-have answers are knockouts
 *   3 Scoring   — weights (must total 100; "Balance" one-click fixes it)
 *   4 Pipeline  — stages + automation rules
 *
 * Writes org_jobs (incl. screening / scoring_weights / pipeline_config / content
 * jsonb + job_function / experience_level / certs_required) via the RLS insert
 * path (no SECURITY DEFINER bypass — org-admin enforcement lands with auth).
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrgIdBySlug } from '@/lib/applications'
import { enqueueOrgJobText } from '@/lib/embeddings'
import SmartSelect from '@/components/ui/SmartSelect'

interface EditJob {
  id: string; title: string; job_type: string | null; work_mode: string | null
  location: string | null; salary: string | null
  screening: { q: string; kind: Kind; expected?: string | null; options?: string[]; must_have?: boolean }[]
  apply_mode: string | null; external_url: string | null
}

interface Props {
  orgSlug: string
  orgName: string
  onClose: () => void
  onPosted?: () => void
  editJob?: EditJob
}

type Kind = 'yesno' | 'choice' | 'number' | 'short_text'
interface Screen { id: string; q: string; kind: Kind; mustHave: boolean; expected: string; optionsStr: string }
interface Weights { skill: number; cert: number; squad: number; vector: number; experience: number }

const KINDS: [Kind, string][] = [
  ['yesno', 'Yes / no'], ['choice', 'Choice'], ['number', 'Number'], ['short_text', 'Short text'],
]
const DEFAULT_STAGES = ['applied', 'screening', 'shortlisted', 'hired']
const STEPS = ['Details', 'Screening', 'Pipeline']

const newScreen = (): Screen => ({ id: crypto.randomUUID(), q: '', kind: 'yesno', mustHave: true, expected: 'Yes', optionsStr: '' })
const mk = (p: Partial<Screen>): Screen => ({ ...newScreen(), ...p, id: crypto.randomUUID() })

// LinkedIn-style quick-add screening templates (org clicks to add a pre-filled question)
const TEMPLATES: { label: string; make: () => Screen }[] = [
  { label: 'Years of experience', make: () => mk({ q: 'How many years of relevant experience do you have?', kind: 'number', expected: '3', mustHave: true }) },
  { label: 'Location', make: () => mk({ q: 'Are you in, or willing to relocate to, the job location?', kind: 'yesno', expected: 'Yes', mustHave: true }) },
  { label: 'Work authorization', make: () => mk({ q: 'Are you legally authorized to work in this country?', kind: 'yesno', expected: 'Yes', mustHave: true }) },
  { label: 'Current field', make: () => mk({ q: 'What is your current role / field?', kind: 'short_text', expected: '', mustHave: false }) },
  { label: 'Notice period', make: () => mk({ q: 'What is your notice period?', kind: 'choice', optionsStr: 'Immediate, 15 days, 30 days, 60+ days', expected: 'Immediate', mustHave: false }) },
  { label: 'Expected salary', make: () => mk({ q: 'What is your expected annual salary?', kind: 'short_text', expected: '', mustHave: false }) },
  { label: 'Education', make: () => mk({ q: 'What is your highest qualification?', kind: 'choice', optionsStr: 'Diploma, Bachelor’s, Master’s, PhD', expected: 'Bachelor’s', mustHave: false }) },
  { label: 'Custom', make: () => newScreen() },
]
const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
const csv = (s: string) => s.split(/[,·]+/).map(x => x.trim()).filter(Boolean)

export default function PostJobForm({ orgSlug, orgName, onClose, onPosted, editJob }: Props) {
  const isEdit = !!editJob
  const [step, setStep] = useState(1)
  const [f, setF] = useState({
    title: editJob?.title ?? '',
    jobFunction: '',
    jobType: editJob?.job_type ?? 'Full-time',
    experienceLevel: '',
    workMode: editJob?.work_mode ?? '',
    location: editJob?.location ?? '',
    salary: editJob?.salary ?? '',
    description: '',
    mustHave: '', niceToHave: '',
    certs: '',
    involves: '',
    whoYouAre: '',
    benefits: '',
    expiresAt: '',
  })
  const [screening, setScreening] = useState<Screen[]>(
    editJob?.screening?.length
      ? editJob.screening.map(s => mk({ q: s.q, kind: s.kind as Kind, mustHave: s.must_have ?? false, expected: s.expected ?? '', optionsStr: s.options?.join(', ') ?? '' }))
      : [newScreen()]
  )
  const [autoReject, setAutoReject] = useState(true)
  const [autoShortlist, setAutoShortlist] = useState(false)
  const [minScore, setMinScore] = useState(80)
  const [applyMode, setApplyMode] = useState<'in_platform' | 'external'>(
    editJob?.apply_mode === 'external' ? 'external' : 'in_platform'
  )
  const [externalUrl, setExternalUrl] = useState(editJob?.external_url ?? 'https://careers.example.com/senior-product-designer')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)

  // Ranking weights use smart defaults (tunable later as an optional setting once the
  // ranking engine is live) — so there's no scoring step in the basic post flow.
  const weights: Weights = { skill: 40, cert: 15, squad: 20, vector: 15, experience: 10 }

  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))

  const basicsOk = f.title.trim().length >= 3 && !!f.jobType
  const canPost = basicsOk

  const next = () => {
    if (step === 1 && !basicsOk) return
    setStep(s => Math.min(3, s + 1))
  }
  const back = () => setStep(s => Math.max(1, s - 1))

  const submit = async () => {
    setPostError(null)
    if (!basicsOk) { setStep(1); setPostError('Add a role title and job type to continue.'); return }
    setPosting(true)
    const supabase = createClient()
    const orgId = await getOrgIdBySlug(orgSlug)
    if (!orgId) { setPosting(false); setPostError('Could not resolve this organization.'); return }

    const screeningClean = screening.filter(s => s.q.trim()).map(s => ({
      q: s.q.trim(), kind: s.kind, must_have: s.mustHave,
      expected: s.expected.trim() || null,
      ...(s.kind === 'choice' ? { options: csv(s.optionsStr) } : {}),
    }))

    const jobPayload = {
      org_id: orgId,
      title: f.title.trim(),
      job_function: f.jobFunction || null,
      job_type: f.jobType || null,
      experience_level: f.experienceLevel || null,
      work_mode: f.workMode || null,
      location: f.location.trim() || null,
      salary: f.salary.trim() || null,
      description: f.description.trim() || null,
      must_have_skills: csv(f.mustHave),
      nice_to_have: csv(f.niceToHave),
      certs_required: csv(f.certs),
      apply_mode: applyMode,
      external_url: applyMode === 'external' ? externalUrl.trim() || null : null,
      is_open: true,
      expires_at: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
      screening: screeningClean,
      scoring_weights: weights,
      pipeline_config: {
        stages: DEFAULT_STAGES,
        auto_rules: {
          auto_reject_on_knockout: autoReject,
          auto_shortlist_enabled: autoShortlist,
          auto_shortlist_min_score: minScore,
        },
      },
      content: {
        what_involves: lines(f.involves),
        who_you_are: lines(f.whoYouAre),
        benefits: lines(f.benefits),
      },
    }

    let jobId: string
    if (isEdit && editJob) {
      const { error: updErr } = await supabase.from('org_jobs').update(jobPayload).eq('id', editJob.id)
      if (updErr) { setPosting(false); setPostError(`Update failed: ${updErr.message}`); return }
      jobId = editJob.id
    } else {
      const { data: job, error: jobErr } = await supabase.from('org_jobs').insert(jobPayload).select('id').single()
      if (jobErr || !job) {
        setPosting(false)
        setPostError(
          jobErr?.code === '42501'
            ? 'Posting needs you signed in as an org admin. Sign-in is coming next — your draft is kept here.'
            : `Post failed: ${jobErr?.message ?? 'unknown error'}`,
        )
        return
      }
      jobId = job.id
      await supabase.from('org_posts').insert({
        org_id: orgId, kind: 'job',
        body: `Hiring: ${f.title.trim()}${f.location ? ` · ${f.location}` : ''}`,
        job_id: jobId, posted_at: new Date().toISOString(),
      })
    }

    // Enqueue an embedding for this role so the matcher can score it.
    enqueueOrgJobText(jobId, f.title.trim(), f.description)

    setPosting(false)
    setPosted(true)
    onPosted?.()
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="bg-card border border-line rounded-[20px] shadow-[0_24px_64px_-20px_rgba(0,0,0,.4)] w-full max-w-[580px]">

          <div className="px-5 pt-5 pb-3 border-b border-line">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">{isEdit ? 'Edit role' : 'Post a role · insider only'}</p>
            <h2 className="text-[17px] font-bold text-ink mt-1">{isEdit ? `Editing: ${editJob?.title}` : `New role at ${orgName}`}</h2>
            {!posted && <Stepper step={step} />}
          </div>

          {posted ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-orange/15 text-orange mx-auto flex items-center justify-center text-[22px]">✓</div>
              <p className="text-[15px] font-bold text-ink mt-3">“{f.title}” is live</p>
              <p className="text-[12.5px] text-ink-2 mt-1">Connected candidates will see it in their feed and Jobs.</p>
              <button onClick={onClose} className="mt-5 text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6">Done</button>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 space-y-3.5 min-h-[300px] max-h-[58vh] overflow-y-auto">
                {step === 1 && (
                  <>
                    <Field label="Role title" required>
                      <SmartSelect field="role_title" value={f.title} onChange={set('title')} placeholder="Pick or type — 100+ titles…" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Function"><SmartSelect field="job_function" value={f.jobFunction} onChange={set('jobFunction')} placeholder="Engineering…" /></Field>
                      <Field label="Experience level"><SmartSelect field="experience_level" value={f.experienceLevel} onChange={set('experienceLevel')} placeholder="Mid level…" /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Job type" required><SmartSelect field="job_type" value={f.jobType} onChange={set('jobType')} placeholder="Full-time…" /></Field>
                      <Field label="Work mode"><SmartSelect field="work_mode" value={f.workMode} onChange={set('workMode')} placeholder="Remote…" /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Location"><Input value={f.location} onChange={set('location')} placeholder="Bengaluru, IN" /></Field>
                      <Field label="Salary band"><Input value={f.salary} onChange={set('salary')} placeholder="₹35–55L" /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Application closes on">
                        <input type="date" value={f.expiresAt} onChange={e => set('expiresAt')(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40 transition-all" />
                      </Field>
                      <div className="flex items-end pb-0.5">
                        <p className="text-[11px] text-ink-3 leading-relaxed">Leave blank to post indefinitely. Candidates see how many days are left.</p>
                      </div>
                    </div>
                    <Field label="Must-have skills"><SmartSelect field="skill" value={f.mustHave} onChange={set('mustHave')} multi placeholder="Pick a skill…" /></Field>
                    <Field label="Nice-to-have"><SmartSelect field="skill" value={f.niceToHave} onChange={set('niceToHave')} multi placeholder="Pick a skill…" /></Field>
                    <Field label="Certifications required"><SmartSelect field="certification" value={f.certs} onChange={set('certs')} multi placeholder="Pick a certification…" /></Field>
                    <Field label="Description"><Area value={f.description} onChange={set('description')} placeholder="Short summary of the role…" rows={2} /></Field>
                    <Field label="What the job involves"><Area value={f.involves} onChange={set('involves')} placeholder="One responsibility per line…" rows={3} /></Field>
                    <Field label="Who you are"><Area value={f.whoYouAre} onChange={set('whoYouAre')} placeholder="One trait per line…" rows={3} /></Field>
                    <Field label="Benefits"><Area value={f.benefits} onChange={set('benefits')} placeholder="One benefit per line…" rows={2} /></Field>

                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-ink-2">How candidates apply</span>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button onClick={() => setApplyMode('in_platform')}
                          className={`text-left p-3 rounded-[12px] border transition-all ${applyMode === 'in_platform' ? 'border-orange bg-orange/5' : 'border-line bg-page hover:border-orange/40'}`}>
                          <p className="text-[12.5px] font-semibold text-ink">On tiikme</p>
                          <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">Apply with Flex — screening + pipeline auto-tracked.</p>
                        </button>
                        <button onClick={() => setApplyMode('external')}
                          className={`text-left p-3 rounded-[12px] border transition-all ${applyMode === 'external' ? 'border-orange bg-orange/5' : 'border-line bg-page hover:border-orange/40'}`}>
                          <p className="text-[12.5px] font-semibold text-ink">Our career page ↗</p>
                          <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">Redirect applicants to your own site / ATS.</p>
                        </button>
                      </div>
                      {applyMode === 'external' && (
                        <div className="mt-2"><Input value={externalUrl} onChange={setExternalUrl} placeholder="https://careers.yourcompany.com/role" /></div>
                      )}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <p className="text-[13px] font-semibold text-ink">Screening questions</p>
                      <span className="text-[11px] text-ink-3">expected answer = auto-evaluated</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATES.map(t => (
                        <button key={t.label} onClick={() => setScreening(p => [...p, t.make()])}
                          className="text-[11px] font-medium text-ink-2 bg-page border border-line rounded-full px-2.5 py-1 hover:border-orange/40 hover:text-orange transition-colors">
                          + {t.label}
                        </button>
                      ))}
                    </div>
                    {screening.map((s, i) => (
                      <div key={s.id} className="bg-page border border-line rounded-[12px] p-3 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-ink-3 w-6 shrink-0">{i + 1}{s.mustHave && <span className="text-orange font-bold ml-0.5" title="required (knockout)">*</span>}</span>
                          <input value={s.q} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, q: e.target.value } : x))}
                            placeholder="e.g. Do you have 5+ years in product design?"
                            className="flex-1 bg-card border border-line rounded-[8px] px-2.5 py-2 text-[12.5px] text-ink placeholder-ink-3 outline-none focus:border-orange/40" />
                          <button onClick={() => setScreening(p => p.length > 1 ? p.filter(x => x.id !== s.id) : p)} className="text-ink-3 hover:text-orange px-1" aria-label="remove">✕</button>
                        </div>
                        <div className="flex items-center gap-2 pl-6 flex-wrap">
                          <select value={s.kind} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, kind: e.target.value as Kind, expected: e.target.value === 'yesno' ? 'Yes' : '' } : x))}
                            className="bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-orange/40">
                            {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>

                          {s.kind === 'yesno' && (
                            <select value={s.expected} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, expected: e.target.value } : x))}
                              className="bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-orange/40" title="expected answer">
                              <option>Yes</option><option>No</option>
                            </select>
                          )}
                          {s.kind === 'number' && (
                            <span className="flex items-center gap-1 text-[11.5px] text-ink-2">≥
                              <input value={s.expected} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, expected: e.target.value } : x))}
                                placeholder="3" className="w-14 bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-orange/40" />
                            </span>
                          )}
                          {s.kind === 'choice' && (
                            <>
                              <input value={s.optionsStr} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, optionsStr: e.target.value } : x))}
                                placeholder="options, comma-separated" className="flex-1 min-w-[120px] bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-orange/40" />
                              <input value={s.expected} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, expected: e.target.value } : x))}
                                placeholder="expected" className="w-24 bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-orange/40" />
                            </>
                          )}
                          {s.kind === 'short_text' && (
                            <input value={s.expected} onChange={e => setScreening(p => p.map(x => x.id === s.id ? { ...x, expected: e.target.value } : x))}
                              placeholder="expected keyword (optional)" className="flex-1 min-w-[120px] bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-orange/40" />
                          )}

                          <label title="Required — applicants who miss this are auto-declined" className="flex items-center gap-1 cursor-pointer select-none ml-auto">
                            <input type="checkbox" checked={s.mustHave} onChange={() => setScreening(p => p.map(x => x.id === s.id ? { ...x, mustHave: !x.mustHave } : x))} className="accent-orange w-3.5 h-3.5" />
                            <span className="text-orange font-bold text-[14px] leading-none">*</span>
                          </label>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setScreening(p => [...p, newScreen()])} className="text-[12px] font-semibold text-purple hover:opacity-80">+ add question</button>
                    <p className="text-[11px] text-ink-3 leading-relaxed">Questions marked <span className="text-orange font-bold">*</span> are required knockouts — the expected answer is how tiikme auto-evaluates each applicant. Miss a required answer → auto-declined before review.</p>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="text-[13px] font-semibold text-ink">Pipeline stages</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DEFAULT_STAGES.map((s, i) => (
                        <span key={s} className="flex items-center gap-1.5">
                          <span className="text-[11.5px] text-ink-2 bg-page border border-line rounded-[8px] px-2.5 py-1 capitalize">{s}</span>
                          {i < DEFAULT_STAGES.length - 1 && <span className="text-ink-3 text-[10px]">›</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-[13px] font-semibold text-ink pt-2">Automation</p>
                    <ToggleRow label="Auto-decline on failed knockout" sub="Skip review when a required (*) answer fails" on={autoReject} onClick={() => setAutoReject(v => !v)} />
                    <ToggleRow label="Auto-shortlist high scorers" sub="Move strong matches straight to shortlist" on={autoShortlist} onClick={() => setAutoShortlist(v => !v)} />
                    {autoShortlist && (
                      <div className="flex items-center gap-3 pl-1">
                        <span className="text-[12.5px] text-ink-2 w-[110px]">Min score</span>
                        <input type="range" min={50} max={95} step={5} value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="flex-1 accent-orange" />
                        <span className="text-[12.5px] font-semibold text-ink w-[38px] text-right">{minScore}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {postError && (
                <div className="mx-5 mb-1 bg-orange/10 border border-orange/30 rounded-[10px] px-3 py-2">
                  <p className="text-[12px] text-orange font-medium">{postError}</p>
                </div>
              )}

              <div className="px-5 py-3.5 border-t border-line flex items-center gap-2">
                <button onClick={step === 1 ? onClose : back} className="text-[13px] font-semibold text-ink-2 bg-page border border-line rounded-[12px] py-2.5 px-4 hover:opacity-90">
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <div className="flex-1" />
                <span className="text-[11px] text-ink-3">{step}/3</span>
                {step < 3 ? (
                  <button onClick={next} disabled={step === 1 && !basicsOk}
                    className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">
                    Next
                  </button>
                ) : (
                  <button onClick={submit} disabled={!canPost || posting}
                    className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">
                    {posting ? 'Posting…' : 'Post role'}
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

function ToggleRow({ label, sub, on, onClick }: { label: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 text-left">
      <span className={`w-[40px] h-[22px] rounded-full p-0.5 transition-colors flex-shrink-0 ${on ? 'bg-orange' : 'bg-line'}`}>
        <span className={`block w-[18px] h-[18px] rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
      </span>
      <span className="flex-1">
        <span className="block text-[12.5px] font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-3">{sub}</span>
      </span>
    </button>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all" />
  )
}
function Area({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; rows: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all resize-y leading-relaxed" />
  )
}
