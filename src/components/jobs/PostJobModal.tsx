'use client'

import { useState } from 'react'
import { toast } from '@/components/profile/ui/Toast'

type Kind = 'yesno' | 'choice' | 'experience'
interface SQ { id: string; q: string; kind: Kind; mustHave: boolean }

const inp = 'w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange transition-colors'
const sel = inp + ' appearance-none cursor-pointer'

const TYPES = ['Full-time','Part-time','Freelance','Contract','Internship','Gig']
const MODES = ['Remote','Hybrid','On-site']

/* Org-only: create a role. Sectioned form (Otta-style) → preview confirmation. */
export default function PostJobModal({ orgName, onClose }: { orgName: string; onClose: () => void }) {
  const [step, setStep] = useState<'form'|'done'>('form')
  const [f, setF] = useState({ title:'', type:'Full-time', mode:'Remote', location:'', salary:'', experience:'', summary:'' })
  const set = <K extends keyof typeof f>(k:K,v:(typeof f)[K]) => setF(p=>({...p,[k]:v}))
  const [mustSkills, setMustSkills] = useState<string[]>([])
  const [skillIn, setSkillIn] = useState('')
  const [certs, setCerts] = useState<string[]>([])
  const [certIn, setCertIn] = useState('')
  const [screening, setScreening] = useState<SQ[]>([{ id:'1', q:'Are you authorized to work here?', kind:'yesno', mustHave:true }])
  const [applyMode, setApplyMode] = useState<'in-platform'|'external'>('in-platform')
  const [externalUrl, setExternalUrl] = useState('')

  const addSkill = () => { const s=skillIn.trim(); if(s&&!mustSkills.includes(s))setMustSkills(p=>[...p,s]); setSkillIn('') }
  const addCert  = () => { const s=certIn.trim(); if(s&&!certs.includes(s))setCerts(p=>[...p,s]); setCertIn('') }
  const addQ = () => setScreening(p=>[...p,{ id:Date.now().toString(), q:'', kind:'yesno', mustHave:false }])
  const setQ = (id:string, patch:Partial<SQ>) => setScreening(p=>p.map(x=>x.id===id?{...x,...patch}:x))
  const valid = f.title.trim() && f.location.trim() && (applyMode==='in-platform' || externalUrl.trim())

  if (step === 'done') {
    return (
      <Shell onClose={onClose} title="Role posted">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green/12 mx-auto flex items-center justify-center text-[26px]">🎉</div>
          <p className="text-[15px] font-bold text-ink mt-3">{f.title} is live</p>
          <p className="text-[12px] text-ink-2 mt-1.5 max-w-[320px] mx-auto leading-relaxed">
            Posted under {orgName}. {applyMode==='in-platform' ? `Candidates apply with their Flex + answer ${screening.length} screening question${screening.length>1?'s':''}; must-have matches auto-shortlist into your Talent pipeline.` : 'Applicants are sent to your external link and tracked as referrals.'}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <a href="/opportunities" className="bg-orange text-white text-[13px] font-semibold px-5 py-2.5 rounded-[12px] hover:bg-orange-2 transition-colors">View in Jobs</a>
            <button onClick={onClose} className="text-[13px] font-medium text-ink-2 bg-page px-5 py-2.5 rounded-[12px] hover:bg-line transition-colors">Done</button>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell onClose={onClose} title={`Post a role · ${orgName}`}>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Basics */}
        <Section n="1" t="The basics">
          <L l="Role title *"><input value={f.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Senior Product Designer" className={inp} /></L>
          <div className="grid grid-cols-2 gap-3">
            <L l="Type"><select value={f.type} onChange={e=>set('type',e.target.value)} className={sel}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></L>
            <L l="Work mode"><select value={f.mode} onChange={e=>set('mode',e.target.value)} className={sel}>{MODES.map(t=><option key={t}>{t}</option>)}</select></L>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <L l="Location *"><input value={f.location} onChange={e=>set('location',e.target.value)} placeholder="City or Remote" className={inp} /></L>
            <L l="Salary (shown to candidates)"><input value={f.salary} onChange={e=>set('salary',e.target.value)} placeholder="$120k–150k" className={inp} /></L>
          </div>
          <L l="Experience"><input value={f.experience} onChange={e=>set('experience',e.target.value)} placeholder="e.g. 3-5 yrs" className={inp} /></L>
        </Section>

        {/* Description */}
        <Section n="2" t="What they'll do">
          <textarea value={f.summary} onChange={e=>set('summary',e.target.value)} rows={3} placeholder="Describe the role, impact, and what a great hire looks like…" className={`${inp} resize-none`} />
        </Section>

        {/* Skills + certs */}
        <Section n="3" t="Skills & certificates">
          <L l="Must-have skills">
            {mustSkills.length>0 && <div className="flex flex-wrap gap-1.5 mb-2">{mustSkills.map(s=><span key={s} className="inline-flex items-center gap-1 text-[11px] font-medium text-teal bg-teal/8 px-2 py-0.5 rounded-full">{s}<button onClick={()=>setMustSkills(p=>p.filter(x=>x!==s))} className="text-ink-3 hover:text-red">×</button></span>)}</div>}
            <div className="flex gap-2"><input value={skillIn} onChange={e=>setSkillIn(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSkill()}}} placeholder="Add skill…" className={`${inp} flex-1`} /><Add onClick={addSkill} /></div>
          </L>
          <L l="Certificates required (optional)">
            {certs.length>0 && <div className="flex flex-wrap gap-1.5 mb-2">{certs.map(s=><span key={s} className="inline-flex items-center gap-1 text-[11px] font-medium text-amber bg-amber/10 px-2 py-0.5 rounded-full">{s}<button onClick={()=>setCerts(p=>p.filter(x=>x!==s))} className="text-ink-3 hover:text-red">×</button></span>)}</div>}
            <div className="flex gap-2"><input value={certIn} onChange={e=>setCertIn(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCert()}}} placeholder="e.g. Google UX Design…" className={`${inp} flex-1`} /><Add onClick={addCert} /></div>
          </L>
        </Section>

        {/* Screening */}
        <Section n="4" t="Screening questions" hint="Must-have answers auto-shortlist candidates.">
          <div className="space-y-2">
            {screening.map((s,i)=>(
              <div key={s.id} className="bg-page rounded-[12px] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-ink-3">Q{i+1}</span>
                  <input value={s.q} onChange={e=>setQ(s.id,{q:e.target.value})} placeholder="Question…" className="flex-1 bg-card border border-line rounded-[8px] px-2.5 py-1.5 text-[12px] text-ink placeholder-ink-3 outline-none focus:border-orange" />
                  {screening.length>1 && <button onClick={()=>setScreening(p=>p.filter(x=>x.id!==s.id))} className="text-ink-3 hover:text-red text-[16px] leading-none">×</button>}
                </div>
                <div className="flex items-center gap-2">
                  <select value={s.kind} onChange={e=>setQ(s.id,{kind:e.target.value as Kind})} className="bg-card border border-line rounded-[8px] px-2 py-1.5 text-[11px] text-ink-2 outline-none cursor-pointer">
                    <option value="yesno">Yes / No</option><option value="choice">Multiple choice</option><option value="experience">Experience</option>
                  </select>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                    <input type="checkbox" checked={s.mustHave} onChange={e=>setQ(s.id,{mustHave:e.target.checked})} className="accent-orange" />
                    <span className="text-[11px] text-ink-2">Must-have (auto-shortlist)</span>
                  </label>
                </div>
              </div>
            ))}
            <button onClick={addQ} className="w-full border-2 border-dashed border-line rounded-[10px] py-2 text-[12px] font-semibold text-ink-3 hover:text-orange hover:border-orange/40 transition-colors">+ Add question</button>
          </div>
        </Section>

        {/* Apply method */}
        <Section n="5" t="How to apply">
          <div className="grid grid-cols-2 gap-2">
            <ApplyOpt on={applyMode==='in-platform'} onClick={()=>setApplyMode('in-platform')} title="On tiikme" desc="Full pipeline, screening, contact reveal" />
            <ApplyOpt on={applyMode==='external'} onClick={()=>setApplyMode('external')} title="External link" desc="Send to your own ATS / site ↗" />
          </div>
          {applyMode==='external' && <input value={externalUrl} onChange={e=>setExternalUrl(e.target.value)} placeholder="https://yourcompany.com/careers/role" className={`${inp} mt-2`} />}
        </Section>
      </div>

      <div className="px-5 py-3.5 border-t border-line shrink-0">
        <button onClick={()=>{ if(valid){ setStep('done'); toast('Role posted ✓') } }} disabled={!valid}
          className="w-full bg-orange text-white text-[13px] font-semibold py-3 rounded-[13px] hover:bg-orange-2 transition-colors disabled:opacity-40" style={{boxShadow:'0 2px 8px -2px rgba(255,92,40,.4)'}}>
          {valid ? 'Post role' : 'Add title, location & apply method'}
        </button>
      </div>
    </Shell>
  )
}

function Shell({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-[6vh]">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.35)] w-full max-w-lg max-h-[86vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <h2 className="text-[15px] font-bold text-ink">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
function Section({ n, t, hint, children }: { n:string; t:string; hint?:string; children:React.ReactNode }) {
  return <div><div className="flex items-center gap-2 mb-2.5"><span className="w-5 h-5 rounded-full bg-orange-soft text-orange text-[10px] font-bold flex items-center justify-center">{n}</span><p className="text-[13px] font-bold text-ink">{t}</p>{hint && <span className="text-[10px] text-ink-3">· {hint}</span>}</div><div className="space-y-3">{children}</div></div>
}
function L({ l, children }: { l:string; children:React.ReactNode }) { return <div><label className="block text-[10px] font-semibold text-ink-2 mb-1.5">{l}</label>{children}</div> }
function Add({ onClick }: { onClick:()=>void }) { return <button onClick={onClick} className="px-3.5 py-2 bg-orange text-white text-[12px] font-semibold rounded-[10px] hover:bg-orange-2 transition-colors">+</button> }
function ApplyOpt({ on, onClick, title, desc }: { on:boolean; onClick:()=>void; title:string; desc:string }) {
  return <button onClick={onClick} className={['p-3 rounded-[12px] border text-left transition-colors', on?'border-orange bg-orange-soft/40':'border-line hover:border-orange/30'].join(' ')}><p className="text-[12px] font-semibold text-ink">{title}</p><p className="text-[10px] text-ink-3 mt-0.5 leading-snug">{desc}</p></button>
}
