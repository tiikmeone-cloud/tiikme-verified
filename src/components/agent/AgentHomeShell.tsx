'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import CreateMenu from '@/components/profile/CreateMenu'
import { ToastHost, toast } from '@/components/profile/ui/Toast'
import { Card, Avatar } from '@/components/profile/ui/Primitives'

import {
  professionalGreeting, professionalMoves,
  studentGreeting, studentMoves,
  orgGreeting, orgMoves,
  feedByHeadline, peopleByPersona,
  type Persona, type CareerMove,
} from '@/stubs/getCareerAgent'

interface Props { profile: Profile | null }

export default function AgentHomeShell({ profile }: Props) {
  const [persona, setPersona] = useState<Persona>('professional')
  const [createOpen, setCreateOpen] = useState(false)

  const displayName = profile?.full_name ?? 'You'
  const greeting =
    persona === 'professional' ? professionalGreeting(displayName) :
    persona === 'student' ? studentGreeting(displayName) :
    orgGreeting('Creative Labs')
  const moves =
    persona === 'professional' ? professionalMoves() :
    persona === 'student' ? studentMoves() :
    orgMoves()
  const matches = feedByHeadline(persona)
  const people = peopleByPersona(persona)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="home" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--color-page)' }}>
          <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8 mx-auto" style={{ maxWidth: '760px' }}>

            {/* ── Persona switch (preview tool) ── */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-card rounded-[12px] p-1 shadow-card">
                {([
                  ['professional','Professional'],
                  ['student','Student'],
                  ['org','Organization'],
                ] as [Persona,string][]).map(([id,l])=>(
                  <button key={id} onClick={()=>setPersona(id)} className={['px-3.5 py-1.5 text-[12px] font-semibold rounded-[9px] transition-colors', persona===id?'bg-page text-ink':'text-ink-3'].join(' ')}>{l}</button>
                ))}
              </div>
              <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full uppercase">tiikme AI</span>
            </div>

            {/* ── Agent greeting (headline-driven) ── */}
            <div className="rounded-[20px] p-5 mb-5 relative overflow-hidden" style={{ background:'linear-gradient(120deg, rgba(255,92,40,.10), rgba(109,75,216,.10) 60%, rgba(43,179,163,.08))' }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-[13px] bg-card flex items-center justify-center text-[22px] shrink-0 shadow-card">🤖</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[11px] font-semibold text-ink-2">Reading your headline</p>
                    <span className="text-[10px] font-bold text-orange bg-orange-soft px-2 py-0.5 rounded-full">{greeting.headline}</span>
                  </div>
                  <p className="text-[15px] font-bold text-ink mt-1 leading-snug">{greeting.oneLiner}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <a href={greeting.ctaHref} className="text-[13px] font-semibold text-white bg-orange rounded-[12px] px-4 py-2 hover:bg-orange-2 transition-colors" style={{ boxShadow:'0 2px 8px -2px rgba(255,92,40,.4)' }}>
                      {greeting.topMove} · {greeting.ctaLabel} →
                    </a>
                    <button onClick={()=>toast('Voice mode opening soon')} className="text-[11px] font-medium text-ink-2 bg-card border border-line rounded-[10px] px-3 py-2">🎙️ Ask anything</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Career moves (the agent's proactive cards) ── */}
            <SectionTitle title="Your next moves" sub="Personalised by AI, ranked by impact." />
            <div className="space-y-3 mb-6">
              {moves.map(m => <MoveCard key={m.id} m={m} />)}
            </div>

            {/* ── Personalised feed (jobs / candidates) ── */}
            <SectionTitle
              title={persona === 'org' ? 'Top candidates for your roles' : persona === 'student' ? 'Internships made for you' : 'Roles that level you up'}
              sub={persona === 'org' ? 'Verified, AI-ranked. Reach out — contact reveals on accept.' : 'AI-ranked by your verified Flex.'}
            />
            <div className="space-y-3 mb-6">
              {matches.map(m => (
                <a key={m.id} href={m.href} className="bg-card rounded-[16px] shadow-card p-4 flex items-start gap-3 hover:shadow-[0_4px_14px_rgba(0,0,0,.10)] transition-shadow">
                  <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[16px] font-bold shrink-0" style={{ backgroundColor: m.orgColor }}>{m.role.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-ink truncate">{m.role}</p>
                      <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full shrink-0">{m.matchPct}%</span>
                    </div>
                    <p className="text-[11px] text-ink-2 truncate">{m.org}</p>
                    <p className="text-[11px] text-orange mt-0.5">✦ {m.why}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-medium text-ink-2 bg-page px-2 py-0.5 rounded-full">{m.type}</span>
                      <span className="text-[10px] font-medium text-ink-2 bg-page px-2 py-0.5 rounded-full">{m.location}</span>
                      <span className="text-[10px] font-semibold text-green">{m.salary}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* ── People to know ── */}
            <SectionTitle
              title={persona === 'org' ? 'People worth a reach-out' : 'People you should know'}
              sub="Network is the shortcut. Warm intro paths surface here."
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {people.map(p => (
                <Card key={p.id} className="p-4">
                  <Avatar name={p.name} src={p.avatar} size={42} />
                  <p className="text-[13px] font-semibold text-ink mt-2 truncate">{p.name}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">{p.why}</p>
                  <a href="/opportunities" className="text-[11px] font-semibold text-orange mt-2 inline-block hover:text-orange-2 transition-colors">View →</a>
                </Card>
              ))}
            </div>

            {/* ── How tiikme AI works (transparency) ── */}
            <div className="bg-card rounded-[16px] shadow-card p-5 mb-3">
              <p className="text-[13px] font-bold text-ink mb-1.5">How tiikme AI works for you</p>
              <p className="text-[11px] text-ink-2 leading-relaxed">
                I read your <a href="/profile/me" className="text-orange font-semibold">Flex</a> (your verified work + headline) and connect it to live <a href="/opportunities" className="text-orange font-semibold">Jobs</a>, <a href="/opportunities" className="text-orange font-semibold">Level Up</a> skilling, and your <a href="/opportunities" className="text-orange font-semibold">network</a>. I never share your contact unless you accept. I work for you, not the recruiters.
              </p>
            </div>

          </div>
        </main>
      </div>

      <MobileTabBar active="home" onCreateClick={() => setCreateOpen(true)} />
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      <ToastHost />
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2.5">
      <p className="text-[14px] font-bold text-ink leading-tight">{title}</p>
      <p className="text-[11px] text-ink-3">{sub}</p>
    </div>
  )
}

function MoveCard({ m }: { m: CareerMove }) {
  return (
    <div className="bg-card rounded-[16px] shadow-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-page flex items-center justify-center text-[18px] shrink-0">{m.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-bold text-ink leading-snug">{m.hook}</p>
            {m.badge && (
              <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: m.badgeColor }}>{m.badge}</span>
            )}
          </div>
          <p className="text-[12px] text-ink-2 mt-1 leading-snug">{m.body}</p>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <a href={m.href} className="text-[11px] font-semibold text-white bg-orange rounded-[10px] px-3 py-1.5 hover:bg-orange-2 transition-colors">{m.cta}</a>
            {m.meta && <span className="text-[10px] text-ink-3">{m.meta}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
