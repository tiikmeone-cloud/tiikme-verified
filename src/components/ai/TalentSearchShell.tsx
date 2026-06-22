'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { ToastHost } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import { Avatar } from '@/components/profile/ui/Primitives'
import ReachOutFlow from '@/components/ai/ReachOutFlow'
import { searchTalent, type TalentResult } from '@/stubs/getAgent'

/* Recruiter "Search Talent" — natural-language + filters → ranked VERIFIED profiles (Skillsync-style, on our Flex). */
export default function TalentSearchShell() {
  const [q, setQ] = useState('Senior Product Designer, design systems, Figma')
  const [loc, setLoc] = useState('Bangalore')
  const [otw, setOtw] = useState(true)
  const [reach, setReach] = useState<TalentResult | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const results = searchTalent().filter(r => !otw || r.openToWork)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor:'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="jobs" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor:'var(--color-page)' }}>
          <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8 mx-auto" style={{ maxWidth:'860px' }}>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-ink leading-tight">Search Talent</h1>
              <span className="text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full uppercase">AI</span>
            </div>
            <p className="text-[12px] text-ink-3 mb-5">Find people by <b>proof, not resume claims</b> — ranked on their verified Flex.</p>

            {/* natural-language query */}
            <div className="bg-card rounded-[16px] shadow-card p-4 space-y-3">
              <div className="flex items-center gap-2 bg-page border border-line rounded-[12px] px-3.5 py-2.5">
                <span className="text-[14px]">🔎</span>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Describe who you need…" className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-page border border-line rounded-[10px] px-3 py-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <input value={loc} onChange={e=>setLoc(e.target.value)} placeholder="Location" className="bg-transparent text-[12px] text-ink outline-none w-[120px]" />
                </div>
                <button onClick={()=>setOtw(o=>!o)} className={['text-[12px] font-semibold px-3 py-2 rounded-[10px] border transition-colors', otw?'bg-green/10 text-green border-green/20':'bg-page text-ink-2 border-line'].join(' ')}>
                  {otw?'● ':''}Open to work
                </button>
                <button className="ml-auto text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors">Search</button>
              </div>
            </div>

            {/* results */}
            <p className="text-[11px] text-ink-3 mt-5 mb-2">{results.length} verified matches · ranked by AI fit</p>
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="bg-card rounded-[16px] shadow-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar name={r.name} src={r.avatar} size={48} />
                      {r.openToWork && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green rounded-full border-2 border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-ink truncate">{r.name}</p>
                        <span className="text-[10px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full">{r.matchPct}% fit</span>
                      </div>
                      <p className="text-[12px] text-ink-2">{r.role} · {r.location}</p>
                      <p className="text-[11px] text-ink-3 mt-0.5">🔒 Contact hidden — shared if they accept your reach-out</p>
                    </div>
                  </div>
                  {/* proof, not claims */}
                  <p className="text-[12px] text-ink-2 mt-2.5 leading-snug"><span className="text-teal font-semibold">Proof:</span> {r.topProof}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.verifiedSkills.map(s => <span key={s} className="inline-flex items-center gap-1 text-[10px] font-medium text-teal bg-teal/8 border border-teal/15 px-2 py-0.5 rounded-full">✓ {s}</span>)}
                    <span className="text-[10px] font-medium text-ink-2 bg-page px-2 py-0.5 rounded-full">{r.squadProof} peers verified</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                    <a href={`/profile/${r.handle}`} className="text-[12px] font-semibold text-ink-2 bg-page rounded-[10px] px-4 py-2 hover:bg-line transition-colors">View Flex</a>
                    <button onClick={()=>setReach(r)} className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors">Reach out</button>
                    <span className="ml-auto text-[11px] text-ink-3">no email exposed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <MobileTabBar active="jobs" onCreateClick={() => setCreateOpen(true)} />
      {reach && <ReachOutFlow person={reach} role="Senior Product Designer" onClose={()=>setReach(null)} />}
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      <ToastHost />
    </div>
  )
}
