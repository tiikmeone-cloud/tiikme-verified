'use client'

import { useState } from 'react'
import type { Applicant, Stage } from '@/stubs/getJobs'
import { toast } from '@/components/profile/ui/Toast'

interface Props {
  applicant: Applicant
  onClose: () => void
  onStage: (id: string, stage: Stage) => void
}

const STAGE_TIMELINE: { key: Stage; label: string }[] = [
  { key:'applied', label:'Applied' },
  { key:'shortlisted', label:'Shortlisted' },
  { key:'invited', label:'Invited to interview' },
  { key:'interviewed', label:'Interviewed' },
  { key:'hired', label:'Hired' },
]

export default function CandidateDrawer({ applicant: a, onClose, onStage }: Props) {
  const [tab, setTab] = useState<'work'|'contact'|'testimonials'>('work')
  // Contact reveal: only when there's mutual interest (shortlisted+). No DMs — gated handoff.
  const contactUnlocked = ['shortlisted','invited','interviewed','hired'].includes(a.stage)
  const [revealed, setRevealed] = useState(false)
  const stageIdx = STAGE_TIMELINE.findIndex(s => s.key === a.stage)

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-[460px] bg-card z-50 flex flex-col" style={{ boxShadow:'-6px 0 32px rgba(0,0,0,.14)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line shrink-0">
          <div><h2 className="text-[15px] font-bold text-ink">Talent Details</h2><p className="text-[10px] text-ink-3">ID #{a.id.toUpperCase()}</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* identity */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.avatar} alt={a.name} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-ink">{a.name}</h3>
                {a.badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.badge==='TOP TALENT'?'text-green bg-green/12':'text-purple bg-purple/12'}`}>✓ {a.badge}</span>}
              </div>
              <p className="text-[12px] text-ink-3">{a.gender} · {a.age} yrs · {a.experience} exp</p>
              {a.referredBy && <p className="text-[11px] text-teal mt-0.5">Referred by {a.referredBy}</p>}
            </div>
          </div>

          {/* quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Stat v={a.expectedSalary} l="Expected" />
            <Stat v={<span className="flex items-center gap-0.5 justify-center">{a.rating}<span className="text-amber">★</span></span>} l="Rating" />
            <Stat v={`${a.matchPct}%`} l="AI match" accent />
            <Stat v={a.verifiedSkills} l="Verified" />
          </div>

          {/* View Flex */}
          <a href={`/profile/me`} className="flex items-center justify-between mt-3 bg-page rounded-[12px] px-4 py-3 hover:bg-line transition-colors">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-ink"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>View Flex / CV</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>

          {/* stages timeline */}
          <div className="mt-4">
            <p className="text-[12px] font-bold text-ink mb-2">Stages</p>
            <div className="space-y-2.5">
              {STAGE_TIMELINE.map((s, i) => {
                const done = i <= stageIdx
                return (
                  <div key={s.key} className="flex items-center gap-2.5">
                    <span className={['w-4 h-4 rounded-full flex items-center justify-center shrink-0', done?'bg-orange':'bg-line'].join(' ')}>{done && <span className="w-1.5 h-1.5 rounded-full bg-white"/>}</span>
                    <span className={['text-[12px]', done?'text-ink font-medium':'text-ink-3'].join(' ')}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* tabs */}
          <div className="flex bg-page rounded-[12px] p-1 mt-4">
            {([['work','Skills & Certs'],['testimonials','Testimonials'],['contact','Contact']] as [typeof tab,string][]).map(([id,l])=>(
              <button key={id} onClick={()=>setTab(id)} className={['flex-1 text-[11px] font-semibold py-2 rounded-[9px] transition-colors', tab===id?'bg-card text-ink shadow-card':'text-ink-3'].join(' ')}>{l}</button>
            ))}
          </div>

          <div className="mt-3">
            {tab==='work' && (
              <div className="space-y-3">
                {/* screening answers — gate the pipeline */}
                <div>
                  <p className="text-[11px] font-bold text-ink-2 uppercase tracking-wide mb-1.5">Screening answers</p>
                  <div className="space-y-1.5">
                    {[
                      { q:'Authorized to work?', a:'Yes', pass:true },
                      { q:'Years of experience', a:a.experience, pass: a.matchPct>=60 },
                      { q:'Preferred work mode', a: a.matchPct>70?'Remote':'Hybrid', pass:true },
                    ].map((x,i)=>(
                      <div key={i} className="flex items-center gap-2 bg-page rounded-[9px] px-3 py-2">
                        <span className={`text-[11px] ${x.pass?'text-green':'text-red'}`}>{x.pass?'✓':'✗'}</span>
                        <span className="text-[11px] text-ink-2 flex-1">{x.q}</span>
                        <span className="text-[11px] font-semibold text-ink">{x.a}</span>
                      </div>
                    ))}
                  </div>
                  {a.matchPct>=80 && <p className="text-[10px] text-green font-semibold mt-1.5">✓ Met all must-haves → auto-shortlisted</p>}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ink-2 uppercase tracking-wide mb-1.5">Skills <span className="text-green">({a.verifiedSkills} squad-verified)</span></p>
                  <div className="flex flex-wrap gap-1.5">{a.skills.map(s => <span key={s} className="text-[11px] font-medium text-teal bg-teal/8 border border-teal/15 px-2.5 py-1 rounded-full">{s}</span>)}</div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ink-2 uppercase tracking-wide mb-1.5">Certificates</p>
                  {a.certs.length ? a.certs.map(c => (
                    <div key={c.name} className="flex items-center gap-2 mt-1.5">
                      <div className="w-7 h-7 rounded-[8px] bg-amber/15 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                      <div className="flex-1"><p className="text-[12px] font-semibold text-ink">{c.name}</p><p className="text-[10px] text-ink-3">{c.issuer}</p></div>
                      <a href="#" onClick={e=>{e.preventDefault();toast('Opening issuer verification ↗')}} className="text-[11px] font-semibold text-orange">Verify ↗</a>
                    </div>
                  )) : <p className="text-[12px] text-ink-3 italic">No certificates listed.</p>}
                </div>
              </div>
            )}
            {tab==='testimonials' && (
              a.testimonial ? (
                <div className="bg-page rounded-[12px] p-3">
                  <p className="text-[12px] text-ink leading-snug">“{a.testimonial.quote}”</p>
                  <p className="text-[11px] text-ink-3 mt-2">— {a.testimonial.by}, {a.testimonial.role}</p>
                </div>
              ) : <p className="text-[12px] text-ink-3 italic">No testimonials yet.</p>
            )}
            {tab==='contact' && (
              contactUnlocked ? (
                revealed ? (
                  <div className="space-y-2">
                    <Field l="Email" v={a.email} /><Field l="Phone" v={a.phone} />
                    <p className="text-[10px] text-ink-3 mt-1">Shared by mutual interest. Take it to email/call — tiikme has no DMs by design.</p>
                  </div>
                ) : (
                  <button onClick={()=>{setRevealed(true);toast('Contact revealed — they were notified')}} className="w-full bg-ink text-card text-[13px] font-semibold py-2.5 rounded-[12px] hover:opacity-90 transition-opacity">
                    Reveal contact details
                  </button>
                )
              ) : (
                <div className="bg-page rounded-[12px] p-4 text-center">
                  <p className="text-[12px] text-ink-2">🔒 Contact unlocks once you shortlist this candidate.</p>
                  <p className="text-[11px] text-ink-3 mt-1">Privacy by default — no cold outreach.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* action footer */}
        <div className="px-5 py-3.5 border-t border-line shrink-0 flex items-center gap-2">
          {a.stage !== 'hired' && a.stage !== 'rejected' && (
            <>
              <button onClick={()=>{onStage(a.id,'rejected');toast('Moved to closed')}} className="px-4 py-2.5 text-[12px] font-medium text-ink-2 bg-page hover:bg-line rounded-[12px] transition-colors">Pass</button>
              {a.stage==='applied' && <button onClick={()=>{onStage(a.id,'shortlisted');toast('Shortlisted ✓ — candidate notified')}} className="flex-1 bg-teal text-white text-[13px] font-semibold py-2.5 rounded-[12px] hover:opacity-90 transition-opacity">Shortlist</button>}
              {(a.stage==='shortlisted'||a.stage==='invited'||a.stage==='interviewed') && (
                <button onClick={()=>{onStage(a.id,'invited');toast('Interview invite sent (pick slots)')}} className="flex-1 bg-orange text-white text-[13px] font-semibold py-2.5 rounded-[12px] hover:bg-orange-2 transition-colors" style={{boxShadow:'0 2px 8px -2px rgba(255,92,40,.4)'}}>Schedule Interview</button>
              )}
              {a.stage==='interviewed' && <button onClick={()=>{onStage(a.id,'hired');toast('Hired! 🎉')}} className="px-4 py-2.5 text-[13px] font-semibold text-white bg-green rounded-[12px] hover:opacity-90 transition-opacity">Hire</button>}
            </>
          )}
          {a.stage === 'hired' && <span className="flex-1 text-center text-[13px] font-semibold text-green py-2.5">✓ Hired</span>}
          {a.stage === 'rejected' && <span className="flex-1 text-center text-[13px] font-medium text-ink-3 py-2.5">Closed · <button onClick={()=>{onStage(a.id,'applied')}} className="text-orange font-semibold">Reopen</button></span>}
        </div>
      </aside>
    </>
  )
}

function Stat({ v, l, accent }: { v: React.ReactNode; l: string; accent?: boolean }) {
  return <div className="bg-page rounded-[10px] py-2 text-center"><div className={`text-[13px] font-bold ${accent?'text-purple':'text-ink'}`}>{v}</div><div className="text-[9px] text-ink-3 mt-0.5">{l}</div></div>
}
function Field({ l, v }: { l: string; v: string }) {
  return <div className="flex items-center justify-between py-2 border-b border-line last:border-0"><span className="text-[12px] text-ink-3">{l}</span><span className="text-[12px] font-medium text-ink">{v}</span></div>
}
