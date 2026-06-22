'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Opening } from '@/stubs/getJobs'
import { applyToJob, findRealJob } from '@/lib/applications'
import { toast } from '@/components/profile/ui/Toast'

/* In-platform apply: attach Flex + answer screening questions.
   Answers are matched to must-haves → auto-shortlist or standard queue.
   No DMs — the org sees your answers + Flex in their Talent pipeline. */
export default function ApplyModal({ job, onClose, onApplied }: {
  job: Opening; onClose: () => void; onApplied: (shortlisted: boolean) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState<null | { shortlisted: boolean }>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const set = (id: string, v: string) => setAnswers(a => ({ ...a, [id]: v }))
  const allAnswered = job.screening.every(s => answers[s.id])

  const submit = async () => {
    const meets = job.screening.every(s => {
      if (!s.mustHave) return true
      const a = answers[s.id] ?? ''
      if (s.mustHave === '3+') return ['3+','5+','3-5','5-10','10+'].some(x => a.includes(x)) || parseInt(a) >= 3
      return a === s.mustHave
    })

    // Try writing to DB (best-effort match against seeded org_jobs)
    const real = await findRealJob(job.org, job.title)
    if (real) {
      const id = await applyToJob({
        jobId: real.id,
        screeningAnswers: answers,
      })
      if (id) toast(`✓ Applied to ${job.title} at ${job.org}`)
    }

    setDone({ shortlisted: meets })
    onApplied(meets)
  }

  const content = (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-[8vh]">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.35)] w-full max-w-lg max-h-[82vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <div><h2 className="text-[15px] font-bold text-ink">{done ? 'Application sent' : 'Apply'}</h2><p className="text-[11px] text-ink-3 mt-0.5">{job.title} · {job.org}</p></div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>

          {done ? (
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-[26px] bg-orange-soft">✓</div>
              <p className="text-[15px] font-bold text-ink mt-3">Thank you for applying</p>
              <p className="text-[12px] text-ink-2 mt-1.5 max-w-[320px] mx-auto leading-relaxed">
                Your application for <span className="font-semibold text-ink">{job.title}</span> at <span className="font-semibold text-ink">{job.org}</span> has been submitted with your verified Flex.
              </p>
              <button onClick={onClose} className="mt-4 bg-orange text-white text-[13px] font-semibold px-6 py-2.5 rounded-[12px] hover:bg-orange-2 transition-colors">Done</button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Flex attach */}
                <div className="flex items-center gap-2.5 bg-page rounded-[12px] p-3">
                  <span className="w-8 h-8 rounded-[9px] bg-orange-soft flex items-center justify-center text-orange"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
                  <div className="flex-1"><p className="text-[12px] font-semibold text-ink">Your Flex is attached</p><p className="text-[10px] text-ink-3">Skills, certs & squad-verified experience</p></div>
                  <span className="text-[10px] font-semibold text-green">✓</span>
                </div>

                {/* screening questions */}
                <div>
                  <p className="text-[12px] font-bold text-ink mb-2">A few questions from {job.org}</p>
                  <div className="space-y-3">
                    {job.screening.map((s, i) => (
                      <div key={s.id}>
                        <p className="text-[12px] font-medium text-ink mb-1.5">{i+1}. {s.q} {s.mustHave && <span className="text-[10px] text-orange font-semibold">· must-have</span>}</p>
                        {s.kind === 'yesno' && (
                          <div className="flex gap-2">{['Yes','No'].map(o => <Choice key={o} on={answers[s.id]===o} onClick={()=>set(s.id,o)}>{o}</Choice>)}</div>
                        )}
                        {s.kind === 'choice' && (
                          <div className="flex gap-2 flex-wrap">{(s.options??[]).map(o => <Choice key={o} on={answers[s.id]===o} onClick={()=>set(s.id,o)}>{o}</Choice>)}</div>
                        )}
                        {s.kind === 'experience' && (
                          <div className="flex gap-2 flex-wrap">{['0-1','1-3','3-5','5+'].map(o => <Choice key={o} on={answers[s.id]===o} onClick={()=>set(s.id,o)}>{o} yrs</Choice>)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-line shrink-0">
                <button onClick={submit} disabled={!allAnswered} className="w-full bg-orange text-white text-[13px] font-semibold py-3 rounded-[13px] hover:bg-orange-2 transition-colors disabled:opacity-40" style={{ boxShadow:'0 2px 8px -2px rgba(255,92,40,.4)' }}>
                  {allAnswered ? 'Submit application' : 'Answer all questions to apply'}
                </button>
                <p className="text-[10px] text-ink-3 text-center mt-2">Meet the must-haves → instantly shortlisted.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={['px-3.5 py-1.5 text-[12px] font-medium rounded-[10px] border transition-colors', on?'bg-orange text-white border-orange':'bg-card text-ink-2 border-line hover:border-orange/40'].join(' ')}>{children}</button>
  )
}
