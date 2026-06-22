'use client'

import { useState } from 'react'
import { Card } from '@/components/profile/ui/Primitives'
import type { getOrg } from '@/stubs/getExplore'

type Org = NonNullable<ReturnType<typeof getOrg>>

/* The External Brain — public, AI-queryable knowledge about the org.
   Internal docs stay private; this exposes only what the org chose to share
   (about, FAQ, culture, reviews). Candidates self-serve answers — no DMs. */
export default function OrgBrain({ org, onJobs, onPeople }: { org: Org; onJobs: () => void; onPeople: () => void }) {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<{ q: string; a: string } | null>(null)

  const ask = (question: string) => {
    // Stub "retrieval": exact FAQ first, then keyword overlap (minus stopwords), then about.
    const lc = question.toLowerCase().trim()
    const STOP = new Set(['what','whats','is','the','are','do','does','you','your','this','a','an','of','to','for','and','how','it','with','my','i'])
    const exact = org.faqs.find(f => f.q.toLowerCase().replace(/[?'’]/g,'') === lc.replace(/[?'’]/g,''))
    const words = lc.replace(/[?'’]/g,'').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w))
    const score = (f: { q: string; a: string }) => words.filter(w => (f.q + ' ' + f.a).toLowerCase().includes(w)).length
    const best = org.faqs.map(f => ({ f, s: score(f) })).sort((x, y) => y.s - x.s)[0]
    const hit = exact ?? (best && best.s > 0 ? best.f : undefined)
    setAnswer({ q: question, a: hit?.a ?? org.about })
    setQ('')
  }

  return (
    <div className="space-y-4">
      {/* Ask-anything brain */}
      <Card className="p-5" >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px]">🧠</span>
          <p className="text-[14px] font-bold text-ink">Ask {org.name} anything</p>
          <span className="text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full uppercase">AI</span>
        </div>
        <p className="text-[11px] text-ink-3 mb-3">Public company brain — instant answers from what {org.name} shares. No waiting on a recruiter.</p>

        <div className="flex items-center gap-2 bg-page border border-line rounded-[12px] px-3.5 py-2.5 focus-within:border-orange transition-colors">
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&q.trim())ask(q.trim())}}
            placeholder="e.g. Is this role remote? What's the interview process?" className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none" />
          <button onClick={()=>q.trim()&&ask(q.trim())} disabled={!q.trim()} className="text-[12px] font-semibold text-white bg-orange rounded-[9px] px-3 py-1.5 disabled:opacity-40">Ask</button>
        </div>

        {/* answer */}
        {answer && (
          <div className="mt-3 bg-purple/5 border border-purple/15 rounded-[12px] p-3">
            <p className="text-[11px] font-semibold text-purple mb-1">{answer.q}</p>
            <p className="text-[13px] text-ink leading-relaxed">{answer.a}</p>
            <p className="text-[10px] text-ink-3 mt-2">Sourced from {org.name}&apos;s public profile · always verify in interview.</p>
          </div>
        )}

        {/* suggested chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {org.faqs.slice(0,4).map(f => (
            <button key={f.q} onClick={()=>ask(f.q)} className="text-[11px] font-medium text-ink-2 bg-page border border-line px-2.5 py-1 rounded-full hover:border-orange/40 transition-colors">{f.q}</button>
          ))}
        </div>
      </Card>

      {/* key facts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Fact icon="🏢" l="Type" v={org.type} />
        <Fact icon="📍" l="HQ" v={org.location} />
        <Fact icon="👥" l="Size" v={org.size} />
        <Fact icon="💰" l="Funding" v={org.funding} />
      </div>

      {/* what they do */}
      <Card className="p-5">
        <p className="text-[13px] font-bold text-ink mb-1.5">What they do</p>
        <p className="text-[13px] text-ink-2 leading-relaxed">{org.about}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">{org.techStack.map(t=><span key={t} className="text-[11px] font-medium text-ink-2 bg-page px-2.5 py-1 rounded-full">{t}</span>)}</div>
      </Card>

      {/* quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onJobs} className="bg-card rounded-[16px] shadow-card p-4 text-left hover:shadow-[0_4px_14px_rgba(0,0,0,.1)] transition-shadow">
          <p className="text-[20px]">💼</p>
          <p className="text-[13px] font-bold text-ink mt-1">{org.openRoles} open roles</p>
          <p className="text-[11px] text-ink-3">See what they&apos;re hiring for →</p>
        </button>
        <button onClick={onPeople} className="bg-card rounded-[16px] shadow-card p-4 text-left hover:shadow-[0_4px_14px_rgba(0,0,0,.1)] transition-shadow">
          <p className="text-[20px]">🧑‍🤝‍🧑</p>
          <p className="text-[13px] font-bold text-ink mt-1">{org.memberCount} on tiikme</p>
          <p className="text-[11px] text-ink-3">Your squad &amp; network here →</p>
        </button>
      </div>
    </div>
  )
}

function Fact({ icon, l, v }: { icon: string; l: string; v: string }) {
  return <Card className="p-3.5"><p className="text-[15px]">{icon}</p><p className="text-[10px] text-ink-3 mt-1">{l}</p><p className="text-[12px] font-semibold text-ink leading-snug">{v}</p></Card>
}
