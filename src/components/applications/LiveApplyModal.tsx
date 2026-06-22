'use client'

/**
 * LiveApplyModal — in-platform apply to a LIVE org_jobs row. Attaches the
 * candidate's Flex (verified — read-only), captures email (LinkedIn-style:
 * shared with the org on apply) + screening answers keyed by question text,
 * then submits. The stage-5 trigger scores it server-side; we show the result.
 */

import { useState, useEffect } from 'react'
import { applyToLiveJob, getDemoUserId } from '@/lib/applications'
import { createClient } from '@/lib/supabase/client'

// Normalised internal format used by the modal
type ScreenQ = { q: string; kind: 'yesno' | 'choice' | 'multi_choice' | 'number' | 'short_text'; expected?: string | null; options?: string[]; must_have?: boolean }

// Accepts both old { q, kind } and new { question, type, knockout } formats from org_jobs.screening
function normalise(raw: Record<string, unknown>): ScreenQ {
  if (typeof raw.question === 'string') {
    const t = raw.type as string
    return {
      q: raw.question,
      kind: t === 'text' ? 'short_text' : t === 'multi_choice' ? 'multi_choice' : 'choice',
      options: raw.options as string[] | undefined,
      must_have: (raw.knockout ?? raw.required ?? false) as boolean,
    }
  }
  return raw as unknown as ScreenQ
}

export interface LiveJobForApply {
  id: string
  title: string
  org_name: string
  // Accepts either old {q,kind} or new {question,type,knockout} shapes from the DB
  screening: Record<string, unknown>[]
}

interface Props { job: LiveJobForApply; onClose: () => void; onApplied?: () => void }

export default function LiveApplyModal({ job, onClose, onApplied }: Props) {
  const questions: ScreenQ[] = (job.screening ?? []).map(normalise)
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) { setEmail(user.email); return }
      // Demo fallback: pull email from profiles table
      getDemoUserId().then(uid => {
        if (!uid) return
        supabase.from('profiles').select('email').eq('id', uid).single()
          .then(({ data }) => { if (data?.email) setEmail(data.email as string) })
      })
    })
  }, [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number | null; knockout: boolean | null; stage: string } | null>(null)

  const set = (q: string, v: string) => setAnswers(p => ({ ...p, [q]: v }))
  const toggle = (q: string, v: string) => setAnswers(p => {
    const cur = (p[q] as string[] | undefined) ?? []
    return { ...p, [q]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] }
  })
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const allAnswered = questions.every(s => {
    const a = answers[s.q]
    if (Array.isArray(a)) return a.length > 0
    return (a ?? '').toString().trim().length > 0
  })
  const canApply = emailOk && allAnswered

  const submit = async () => {
    if (!canApply) { setError(!emailOk ? 'Enter a valid email.' : 'Answer all screening questions.'); return }
    setSubmitting(true); setError(null)
    // Serialize arrays to comma-joined strings for the answers payload
    const flat: Record<string, string> = {}
    for (const [k, v] of Object.entries(answers)) flat[k] = Array.isArray(v) ? v.join(', ') : v
    const res = await applyToLiveJob({ jobId: job.id, email, answers: flat })
    setSubmitting(false)
    if ('error' in res) { setError(res.error); return }
    setResult(res); onApplied?.()
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-[6vh] overflow-y-auto">
        <div className="bg-card border border-line rounded-[20px] shadow-[0_24px_64px_-20px_rgba(0,0,0,.4)] w-full max-w-[520px]">
          <div className="px-5 pt-5 pb-3 border-b border-line">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Apply with your Flex</p>
            <h2 className="text-[17px] font-bold text-ink mt-1">{job.title} · {job.org_name}</h2>
          </div>

          {result ? (
            <div className="px-5 py-9 text-center">
              {result.stage === 'rejected' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red/10 text-red mx-auto flex items-center justify-center text-[22px]">✕</div>
                  <p className="text-[15px] font-bold text-ink mt-3">Not a match this time</p>
                  <p className="text-[12.5px] text-ink-2 mt-1">Your answer missed a required (must-have) question, so this role isn’t a fit. Keep your Flex strong — better matches are coming.</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-orange/15 text-orange mx-auto flex items-center justify-center text-[22px]">✓</div>
                  <p className="text-[15px] font-bold text-ink mt-3">Thank you for applying</p>
                  <p className="text-[12.5px] text-ink-2 mt-1">
                    Your application for <span className="font-semibold text-ink">{job.title}</span> at <span className="font-semibold text-ink">{job.org_name}</span> has been submitted with your verified Flex.
                  </p>
                  {typeof result.score === 'number' && (
                    <div className="inline-flex items-center gap-2 mt-3 bg-page border border-line rounded-full px-3 py-1.5">
                      <span className="text-[11px] text-ink-3">Your match score</span>
                      <span className={`text-[13px] font-bold ${result.score >= 85 ? 'text-green' : result.score >= 70 ? 'text-orange' : 'text-ink'}`}>{Math.round(result.score)}%</span>
                    </div>
                  )}
                </>
              )}
              <button onClick={onClose} className="block mx-auto mt-5 text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6">Done</button>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
                {/* Flex attach (read-only) */}
                <div className="bg-page border border-line rounded-[12px] p-3 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-[10px] bg-purple/12 text-purple flex items-center justify-center text-[15px] shrink-0">📄</span>
                  <div className="flex-1">
                    <p className="text-[12.5px] font-semibold text-ink">Your verified Flex is attached</p>
                    <p className="text-[11px] text-ink-3">Skills, certs and verified links travel with this application.</p>
                  </div>
                  <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">✓ Verified</span>
                </div>

                <Field label="Your email" required sub="Shared with the org when they advance you — so they can reach you.">
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com"
                    className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40" />
                </Field>

                {questions.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[12px] font-semibold text-ink">Screening questions</p>
                    {questions.map((s, i) => (
                      <div key={i}>
                        <p className="text-[12.5px] text-ink mb-1.5">{i + 1}. {s.q}{s.must_have && <span className="text-orange ml-1">*</span>}</p>
                        {s.kind === 'yesno' && (
                          <div className="flex gap-2">{['Yes', 'No'].map(o => <Choice key={o} on={answers[s.q] === o} onClick={() => set(s.q, o)}>{o}</Choice>)}</div>
                        )}
                        {(s.kind === 'choice' || s.kind === 'single_choice' as string) && (
                          <div className="flex gap-2 flex-wrap">{(s.options ?? []).map(o => <Choice key={o} on={answers[s.q] === o} onClick={() => set(s.q, o)}>{o}</Choice>)}</div>
                        )}
                        {s.kind === 'multi_choice' && (
                          <div className="flex gap-2 flex-wrap">
                            {(s.options ?? []).map(o => {
                              const sel = (answers[s.q] as string[] | undefined) ?? []
                              return <Choice key={o} on={sel.includes(o)} onClick={() => toggle(s.q, o)}>{o}</Choice>
                            })}
                            <p className="w-full text-[10.5px] text-ink-3 mt-0.5">Select all that apply</p>
                          </div>
                        )}
                        {s.kind === 'number' && (
                          <input value={(answers[s.q] as string) ?? ''} onChange={e => set(s.q, e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="e.g. 5"
                            className="w-28 bg-page border border-line rounded-[10px] px-3 py-2 text-[13px] text-ink outline-none focus:border-orange/40" />
                        )}
                        {s.kind === 'short_text' && (
                          <textarea value={(answers[s.q] as string) ?? ''} onChange={e => set(s.q, e.target.value)} placeholder="Type your answer…" rows={3}
                            className="w-full bg-page border border-line rounded-[10px] px-3 py-2 text-[13px] text-ink outline-none focus:border-orange/40 resize-none" />
                        )}
                      </div>
                    ))}
                    <p className="text-[10.5px] text-ink-3">Questions marked <span className="text-orange font-bold">*</span> are required — miss one and the role auto-declines.</p>
                  </div>
                )}
              </div>

              {error && <div className="mx-5 mb-1 bg-orange/10 border border-orange/30 rounded-[10px] px-3 py-2"><p className="text-[12px] text-orange font-medium">{error}</p></div>}

              <div className="px-5 py-3.5 border-t border-line flex items-center gap-2">
                <button onClick={onClose} className="text-[13px] font-semibold text-ink-2 bg-page border border-line rounded-[12px] py-2.5 px-4 hover:opacity-90">Cancel</button>
                <div className="flex-1" />
                <button onClick={submit} disabled={!canApply || submitting}
                  className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">
                  {submitting ? 'Submitting…' : 'Apply with Flex'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Field({ label, sub, required, children }: { label: string; sub?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span>
      {sub && <span className="block text-[10.5px] text-ink-3 mt-0.5">{sub}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-[10px] border transition-all ${on ? 'bg-orange text-white border-orange' : 'bg-page text-ink-2 border-line hover:border-orange/40'}`}>
      {children}
    </button>
  )
}
