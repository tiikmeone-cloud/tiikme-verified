'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import TiikmeMark from '@/components/brand/TiikmeMark'

const BG     = '#FFFFFF'
const CARD   = '#F8FAFC'
const BORDER = 'rgba(0,0,0,0.08)'
const ORANGE = '#FF5C28'
const TEAL   = '#0D9488'
const INK    = '#0F172A'
const DIM    = 'rgba(15,23,42,0.55)'
const DIM2   = 'rgba(15,23,42,0.38)'

const PAIN_POINTS = [
  { icon: '📄', pain: '200 applications for one role',      fix: 'AI pre-screens against your JD. You see 5.' },
  { icon: '🤖', pain: 'AI-written CVs you can\'t verify',   fix: 'Squad-verified Flex — every claim is peer-confirmed.' },
  { icon: '👻', pain: 'Candidates ghost after interviews',  fix: 'Warm introductions only. Candidates opt in first.' },
  { icon: '⏳', pain: '6 weeks average time-to-hire',       fix: 'Shortlist with match score ready in minutes.' },
]

const HOW_IT_WORKS = [
  {
    n: '01', title: 'Post a role or describe your ideal hire',
    desc: 'Write a plain-English description of who you need. No rigid form. Tiik reads intent, not just keywords.',
    visual: <PostRoleVisual />,
  },
  {
    n: '02', title: 'Tiik scans 12,000+ verified profiles overnight',
    desc: 'Our semantic engine embeds your requirement and matches it against every open-to-work Flex — squad-verified skills weigh 2× more than self-reported.',
    visual: <ScanVisual />,
  },
  {
    n: '03', title: 'Review a shortlist with a reason for every candidate',
    desc: 'Each card shows match score, Trust Score, Squad confirmations, and a one-line Tiik summary. No CV spam — just evidence.',
    visual: <ShortlistVisual />,
  },
  {
    n: '04', title: 'Request Flex. Candidate approves. Interview.',
    desc: 'Candidate identity is anonymous until they approve your intro request. When they do, you get their full verified Flex — not a self-written PDF.',
    visual: <RequestFlexVisual />,
  },
]

const TRUST_PILLARS = [
  { stat: '2×',     label: 'weight for Squad-verified skills vs. self-reported' },
  { stat: '94%',    label: 'of open-to-work candidates reply to intro requests' },
  { stat: '< 3d',   label: 'average time from search to shortlist' },
  { stat: 'Zero',   label: 'cold applications — candidates opt in before you see their details' },
]

const WITHOUT = [
  'Parse 200 CVs, most AI-generated',
  'No way to verify a single claim',
  'Phone-screen to filter obvious mismatches',
  'Ghost after 3 interview rounds',
  'Start over in 6 weeks',
]
const WITH = [
  'See 5 AI-shortlisted, squad-verified candidates',
  'Every skill backed by peer confirmation + Trust Score',
  'Match score and reason before you spend a minute',
  'Candidate already opted in — no ghosting',
  'First intro to offer in under 3 days',
]

export default function CompanyLandingShell() {
  return (
    <main style={{ background:'#FFFFFF', color:INK,
        backgroundImage:`linear-gradient(rgba(0,0,0,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.045) 1px,transparent 1px)`,
        backgroundSize:'40px 40px', backgroundAttachment:'fixed',
        '--color-page': '#FFFFFF',
        '--color-card': '#FFFFFF',
        '--color-ink': '#1B1B1D',
        '--color-ink-2': '#6E6E73',
        '--color-ink-3': '#A1A0A4',
        '--color-line': '#E4E2DE',
      } as React.CSSProperties}
      className="relative min-h-screen overflow-hidden font-sans">
      <div aria-hidden className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute', top:'-5%', left:'30%', width:800, height:600,
          background:`radial-gradient(ellipse,rgba(255,92,40,.08) 0%,transparent 65%)`, filter:'blur(80px)' }} />
        <div style={{ position:'absolute', bottom:'5%', right:'-5%', width:500, height:400,
          background:`radial-gradient(ellipse,rgba(13,148,136,.04) 0%,transparent 65%)`, filter:'blur(80px)' }} />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-16 py-5">
        <TiikmeMark size="md" showWordmark alive />

        <nav className="hidden md:flex items-center gap-1 px-1 py-1 rounded-[12px]"
          style={{ background:'rgba(0,0,0,0.04)', border:`1px solid ${BORDER}` }}>
          <Link href="/landing"
            className="px-4 py-1.5 rounded-[9px] text-[12.5px] font-medium transition-all hover:text-gray-900"
            style={{ color:DIM }}>
            For Talent
          </Link>
          <span className="px-4 py-1.5 rounded-[9px] text-[12.5px] font-semibold"
            style={{ background:`rgba(255,92,40,0.18)`, color:ORANGE }}>
            For Companies
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-in"
            className="text-[13px] font-medium transition-colors hover:text-gray-900"
            style={{ color:DIM }}>
            Sign in
          </Link>
          <Link href="/create"
            className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`, boxShadow:`0 4px 16px -4px rgba(255,92,40,0.5)` }}>
            Start hiring free
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 pt-16 pb-10 text-center">
        <div className="max-w-[820px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold"
            style={{ background:'rgba(255,92,40,0.10)', border:`1px solid rgba(255,92,40,0.22)`, color:ORANGE }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:ORANGE,display:'inline-block' }} />
            tiikme for Companies
          </div>

          <h1 className="text-[46px] md:text-[68px] font-bold tracking-tight leading-[1.02]" style={{ letterSpacing:'-0.02em' }}>
            Stop reading CVs.<br />
            <span style={{ color:ORANGE }}>Read proof instead.</span>
          </h1>

          <p className="mt-5 text-[16px] md:text-[18px] leading-relaxed max-w-[580px] mx-auto" style={{ color:DIM }}>
            tiikme surfaces squad-verified talent and delivers a shortlist with a match score
            and reason for every candidate — before you spend a single interview hour.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-[12px] font-semibold text-[15px] text-white transition-all hover:opacity-90"
              style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`, boxShadow:`0 8px 28px -6px rgba(255,92,40,0.5)` }}>
              Start hiring free
            </Link>
            <a href="mailto:hire@tiikme.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[12px] font-semibold text-[15px] transition-all hover:text-gray-900"
              style={{ background:CARD, border:`1px solid ${BORDER}`, color:DIM }}>
              Talk to our team
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12px]" style={{ color:DIM2 }}>
            {['Free to start','No sourcing fee','Verified talent only','Privacy-first — candidates opt in'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-14"
        style={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, background:'rgba(0,0,0,0.018)' }}>
        <div className="max-w-[1100px] mx-auto">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest mb-10" style={{ color:DIM2 }}>
            Sound familiar?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAIN_POINTS.map(({ icon, pain, fix }) => (
              <div key={pain} className="rounded-[18px] p-5" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
                <span className="text-[24px] mb-3 block">{icon}</span>
                <p className="text-[13px] font-semibold text-gray-400 mb-3 line-through leading-snug">{pain}</p>
                <div style={{ width:28, height:1, background:`rgba(0,0,0,0.15)`, marginBottom:10 }} />
                <p className="text-[13px] font-medium leading-snug" style={{ color:TEAL }}>{fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIIK FOR ORGS DEMO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-20" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:ORANGE }}>Meet Tiik for Hiring</p>
              <h2 className="text-[32px] lg:text-[42px] font-bold tracking-tight leading-[1.07] mb-5">
                Describe who you need.<br />
                <span style={{ color:ORANGE }}>Tiik finds the proof.</span>
              </h2>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color:DIM }}>
                Just like your team uses AI to ask questions — use Tiik to find talent.
                Plain English. No boolean search. No CV parsing. Tiik reads your intent
                and surfaces only squad-verified candidates who actually match.
              </p>
              <div className="space-y-3">
                {[
                  { icon:'💬', label:'Natural language search', desc:'Type what you need like you\'re briefing a recruiter.' },
                  { icon:'🔒', label:'All candidates are opt-in', desc:'You only see profiles of people who are open-to-work.' },
                  { icon:'📊', label:'Every result has evidence', desc:'Match score, Trust Score, Squad verifications — not just a CV.' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-3 rounded-[13px]"
                    style={{ background:CARD, border:`1px solid ${BORDER}` }}>
                    <span className="text-[18px] shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-[12.5px] font-semibold">{label}</p>
                      <p className="text-[11.5px]" style={{ color:DIM2 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <OrgTiikChatDemo />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-16 py-20" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:ORANGE }}>How It Works</p>
            <h2 className="text-[34px] lg:text-[46px] font-bold tracking-tight leading-[1.07]">
              From requirement to intro<br />in under 72 hours.
            </h2>
          </div>

          <div className="space-y-24">
            {HOW_IT_WORKS.map(({ n, title, desc, visual }, i) => (
              <div key={n} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
                <div style={{ direction:'ltr' }}>
                  <p className="text-[12px] font-mono font-bold mb-3" style={{ color:ORANGE }}>{n}.</p>
                  <h3 className="text-[26px] lg:text-[32px] font-bold tracking-tight leading-[1.08] mb-4">{title}</h3>
                  <p className="text-[15px] leading-relaxed" style={{ color:DIM }}>{desc}</p>
                </div>
                <div style={{ direction:'ltr' }}>{visual}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST PILLARS (stats) ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-14"
        style={{ borderBottom:`1px solid ${BORDER}`, background:'rgba(0,0,0,0.018)' }}>
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {TRUST_PILLARS.map(({ stat, label }) => (
            <div key={label}>
              <p className="text-[36px] lg:text-[44px] font-bold tracking-tight leading-none mb-2" style={{ color:ORANGE }}>{stat}</p>
              <p className="text-[12px] leading-snug" style={{ color:DIM2 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WITHOUT vs WITH ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-20" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:DIM2 }}>The Difference</p>
            <h2 className="text-[32px] lg:text-[42px] font-bold tracking-tight leading-[1.07]">
              Traditional hiring vs <span style={{ color:TEAL }}>tiikme.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[18px] p-6" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color:'rgba(0,0,0,0.3)' }}>Traditional</p>
              <div className="space-y-3">
                {WITHOUT.map(t => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ border:'1px solid rgba(0,0,0,0.12)', background:'rgba(0,0,0,0.04)' }}>
                      <div style={{ width:6,height:1.5,background:'rgba(0,0,0,0.25)',margin:'auto',borderRadius:1 }} />
                    </div>
                    <p className="text-[13.5px] leading-snug" style={{ color:'rgba(0,0,0,0.35)' }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] p-6" style={{ background:`rgba(13,148,136,0.04)`, border:`1px solid rgba(13,148,136,0.2)` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color:TEAL }}>With tiikme</p>
              <div className="space-y-3">
                {WITH.map(t => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background:`rgba(13,148,136,0.12)`, border:`1px solid rgba(13,148,136,0.28)` }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p className="text-[13.5px] leading-snug" style={{ color:INK }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-28 text-center">
        <div className="max-w-[640px] mx-auto relative">
          <div aria-hidden style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
            width:700,height:500,background:`radial-gradient(ellipse,rgba(255,92,40,.12) 0%,transparent 65%)`,
            filter:'blur(80px)',pointerEvents:'none',zIndex:-1 }} />
          <h2 className="text-[38px] lg:text-[54px] font-bold tracking-tight leading-[1.04]">
            Hire for proof,<br /><span style={{ color:ORANGE }}>not promises.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color:DIM }}>
            Your next hire is already on tiikme. Verified. Open to work. Waiting for the right match.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-[14px] font-semibold text-[16px] text-white transition-all hover:opacity-90"
              style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`, boxShadow:`0 10px 32px -8px rgba(255,92,40,0.55)` }}>
              Start hiring free
            </Link>
            <a href="mailto:hire@tiikme.com"
              className="inline-flex items-center justify-center px-9 py-4 rounded-[14px] font-semibold text-[15px] transition-all hover:text-gray-900"
              style={{ background:CARD, border:`1px solid ${BORDER}`, color:DIM }}>
              Talk to our team
            </a>
          </div>
          <p className="mt-5 text-[12px]" style={{ color:DIM2 }}>
            No credit card. 3 free searches to start. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 lg:px-16 py-8" style={{ borderTop:`1px solid ${BORDER}` }}>
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TiikmeMark size="sm" showWordmark />
          <p className="text-[12px] italic" style={{ color:DIM2 }}>
            &ldquo;LeBron has an agent. Your best hire deserves one too.&rdquo;
          </p>
          <div className="flex items-center gap-5 text-[12px]" style={{ color:DIM2 }}>
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="mailto:hire@tiikme.com" className="hover:text-gray-900 transition-colors">hire@tiikme.com</a>
          </div>
        </div>
        <p className="text-center text-[11px] mt-4" style={{ color:'rgba(0,0,0,0.3)' }}>
          © {new Date().getFullYear()} tiikme · made in India
        </p>
      </footer>

      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>
    </main>
  )
}

/* ── Step Visuals ──────────────────────────────────────────────────────────── */
function PostRoleVisual() {
  return (
    <div className="rounded-[20px] p-5" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 16px 40px -16px rgba(0,0,0,0.4)' }}>
      <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:DIM2 }}>New Search</p>
      <div className="rounded-[14px] p-4 mb-3" style={{ background:'rgba(0,0,0,0.025)', border:`1px solid rgba(0,0,0,0.06)` }}>
        <p className="text-[11px] font-medium mb-2" style={{ color:DIM2 }}>Describe who you&apos;re looking for</p>
        <p className="text-[13.5px] leading-relaxed" style={{ color:INK }}>
          &ldquo;Senior frontend engineer, React + TypeScript, has shipped consumer products at scale, comfortable leading a small team, Bangalore or remote.&rdquo;
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div style={{ height:1.5, flex:1, background:`linear-gradient(to right,${ORANGE},transparent)`, opacity:0.4 }} />
          <span className="text-[10.5px] font-semibold" style={{ color:ORANGE }}>Tiik is reading your intent…</span>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['React','TypeScript','Team lead','Scale','Bangalore'].map(tag => (
          <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
            style={{ background:`rgba(255,92,40,0.1)`, border:`1px solid rgba(255,92,40,0.2)`, color:ORANGE }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function ScanVisual() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setCount(c => { if (c >= 12400) { clearInterval(iv); return c } return c + 247 }), 40)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="rounded-[20px] p-5" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 16px 40px -16px rgba(0,0,0,0.4)' }}>
      <div className="text-center mb-5">
        <p className="text-[42px] font-bold tracking-tight" style={{ color:ORANGE }}>{count.toLocaleString('en-IN')}</p>
        <p className="text-[12px]" style={{ color:DIM2 }}>profiles scanned</p>
      </div>
      <div className="space-y-2">
        {[
          { label:'React · TypeScript verified', match:96 },
          { label:'Consumer scale experience',   match:91 },
          { label:'Team lead evidence in Flex',   match:84 },
          { label:'Bangalore / open to remote',   match:100 },
        ].map(({ label, match }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-[11.5px] flex-1" style={{ color:DIM }}>{label}</span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(0,0,0,0.08)' }}>
              <div style={{ height:'100%', width:`${match}%`, background:`linear-gradient(to right,${ORANGE},${TEAL})`, borderRadius:999 }} />
            </div>
            <span className="text-[11px] font-semibold w-8 text-right" style={{ color:TEAL }}>{match}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShortlistVisual() {
  const candidates = [
    { name:'Arjun S.', match:94, trust:88, squad:4, note:'React + TS verified by 4 Squad peers. Led Swiggy checkout team.' },
    { name:'Priya M.', match:89, trust:82, squad:3, note:'Ex-Razorpay frontend. 3 Squad confirmations. Active open-to-work.' },
    { name:'Ravi T.',  match:84, trust:77, squad:2, note:'TypeScript verified. Strong perf record at Flipkart.' },
  ]
  return (
    <div className="rounded-[20px] overflow-hidden" style={{ border:`1px solid ${BORDER}`, boxShadow:'0 16px 40px -16px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background:'rgba(0,0,0,0.025)', borderBottom:`1px solid ${BORDER}` }}>
        <span className="text-[12px] font-semibold">AI Shortlist · Senior Frontend</span>
        <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background:`rgba(255,92,40,0.12)`,color:ORANGE }}>
          3 of 847
        </span>
      </div>
      {candidates.map((c, i) => (
        <div key={i} className="flex gap-3 items-start px-4 py-3.5"
          style={{ borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
            background:`linear-gradient(135deg,hsl(${i*50+200},60%,55%),hsl(${i*50+240},55%,40%))`,
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
            {c.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[12.5px] font-semibold">{c.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`rgba(13,148,136,0.10)`,color:TEAL }}>{c.match}% Match</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:'rgba(0,0,0,0.05)',color:DIM2 }}>Trust {c.trust}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:'rgba(0,0,0,0.05)',color:DIM2 }}>{c.squad} Squad</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color:DIM2 }}>{c.note}</p>
          </div>
          <button className="shrink-0 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all hover:text-gray-900"
            style={{ background:'rgba(0,0,0,0.04)', border:`1px solid ${BORDER}`, color:DIM2 }}>
            View
          </button>
        </div>
      ))}
    </div>
  )
}

function RequestFlexVisual() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setStep(1), 2000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="rounded-[20px] p-5" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 16px 40px -16px rgba(0,0,0,0.4)' }}>
      {step === 0 ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:DIM2 }}>Anonymised Card</p>
          <div className="flex items-start gap-3 mb-4">
            <div style={{ width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,#6366f1,#8b5cf6)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0 }}>?</div>
            <div>
              <p className="text-[13.5px] font-semibold">Candidate #1 · Mumbai</p>
              <p className="text-[11px]" style={{ color:DIM2 }}>Identity hidden until they approve</p>
            </div>
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background:`rgba(13,148,136,0.10)`,color:TEAL }}>94% Match</span>
          </div>
          <div className="space-y-2 mb-4">
            {['React + TypeScript · verified by 4 Squad','Led Swiggy checkout team 2022–2024','Trust Score 88/100'].map(t => (
              <div key={t} className="flex items-center gap-2 text-[12px]" style={{ color:DIM }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)}
            className="w-full py-2.5 rounded-[11px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)` }}>
            Request Flex →
          </button>
        </>
      ) : (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:TEAL }}>Candidate Approved ✓</p>
          <div className="flex items-start gap-3 mb-4">
            <div style={{ width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'white',flexShrink:0 }}>A</div>
            <div>
              <p className="text-[13.5px] font-semibold">Arjun Sharma · Mumbai</p>
              <p className="text-[11px]" style={{ color:DIM2 }}>arjun.sharma@gmail.com · +91 98xxx xxxxx</p>
            </div>
          </div>
          <div className="rounded-[12px] p-3.5 mb-3" style={{ background:`rgba(13,148,136,0.06)`, border:`1px solid rgba(13,148,136,0.18)` }}>
            <p className="text-[12px] font-semibold mb-1" style={{ color:TEAL }}>Full verified Flex now visible</p>
            <p className="text-[11.5px]" style={{ color:DIM2 }}>5 years experience · 4 Squad peers · Trust Score 88 · 3 certs · AWS Solutions Architect</p>
          </div>
          <p className="text-[11px]" style={{ color:DIM2 }}>No CV. No PDF. Real verified evidence only.</p>
        </>
      )}
    </div>
  )
}

/* ── Org Tiik Chat Demo ────────────────────────────────────────────────────── */
const ORG_TURNS = [
  { role:'user',      text:'Find me a senior React engineer in Bangalore, startup background, open to hybrid' },
  { role:'assistant', text:'Found 847 verified matches. Here are your top 3 — all squad-verified, Trust Score above 80, currently open-to-work.' },
  { role:'assistant', text:'candidates', special:'shortlist' },
  { role:'user',      text:'Filter to Trust Score above 85 and who\'s worked at a funded startup' },
  { role:'assistant', text:'Narrowed to 2 candidates. Arjun S. (Trust 88, ex-Swiggy) and Priya M. (Trust 82, ex-Razorpay). Both have squad confirmation on React at scale. Want me to send them a Flex request?' },
]

const SHORTLIST_CANDIDATES = [
  { letter:'A', name:'Arjun S.', match:94, trust:88, note:'React verified by 4 Squad · ex-Swiggy · open to hybrid' },
  { letter:'P', name:'Priya M.', match:89, trust:82, note:'TypeScript + Node · ex-Razorpay · 3 Squad confirmations' },
  { letter:'R', name:'Ravi T.',  match:84, trust:79, note:'AWS + React · ex-Flipkart · open to relocation' },
]

function OrgTiikChatDemo() {
  const [visible, setVisible] = useState(0)
  const [typing,  setTyping]  = useState(false)
  const [text,    setText]    = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let alive = true; let idx = 0

    async function step() {
      if (!alive || idx >= ORG_TURNS.length) return
      const turn = ORG_TURNS[idx]
      if (turn.role === 'user') {
        await wait(800); if (!alive) return
        setVisible(v => v + 1); idx++
        await wait(600); if (!alive) return
        setTyping(true); await wait(1100); if (!alive) return
        setTyping(false); step()
      } else if (turn.special === 'shortlist') {
        await wait(400); if (!alive) return
        setVisible(v => v + 1); idx++
        await wait(300); if (!alive) return
        step()
      } else {
        let i = 0; const full = turn.text
        setText(''); setVisible(v => v + 1); idx++
        function typeChar() {
          if (!alive) return
          if (i < full.length) { setText(full.slice(0, i+1)); i++; timerRef.current = setTimeout(typeChar, 14) }
          else { timerRef.current = setTimeout(() => { if (alive) step() }, 2200) }
        }
        typeChar()
      }
    }
    const t = setTimeout(step, 900)
    return () => { alive = false; clearTimeout(t); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    if (visible === ORG_TURNS.length) {
      const t = setTimeout(() => { setVisible(0); setText(''); setTyping(false) }, 4000)
      return () => clearTimeout(t)
    }
  }, [visible])

  const turns = ORG_TURNS.slice(0, visible)
  const lastIdx = visible - 1

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 8px 40px -8px rgba(0,0,0,0.12)' }}>
      {/* Header — org-side Tiik */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom:`1px solid ${BORDER}`, background:'rgba(0,0,0,0.025)' }}>
        <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,
          display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,color:'white' }}>T</div>
        <div>
          <p className="text-[12px] font-semibold leading-tight" style={{ color:INK }}>Tiik</p>
          <p className="text-[10px]" style={{ color:DIM2 }}>Hiring AI · Creative Labs</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span style={{ width:7,height:7,borderRadius:'50%',background:`rgba(13,148,136,0.7)`,display:'block' }} />
          <span className="text-[10px]" style={{ color:TEAL }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[240px]">
        {turns.map((t, i) => {
          const isAI   = t.role === 'assistant'
          const isLast = i === lastIdx

          if (t.special === 'shortlist') {
            return (
              <div key={i} className="space-y-2" style={{ animation:'fadeSlideUp 0.35s ease-out' }}>
                {SHORTLIST_CANDIDATES.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px]"
                    style={{ background:'rgba(0,0,0,0.03)', border:`1px solid rgba(0,0,0,0.07)`,
                      animation:`fadeSlideUp 0.3s ease-out ${ci*0.12}s both` }}>
                    <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,hsl(${ci*50+200},60%,55%),hsl(${ci*50+240},55%,40%))`,
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0 }}>
                      {c.letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11.5px] font-semibold">{c.name}</span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:`rgba(13,148,136,0.10)`,color:TEAL }}>{c.match}%</span>
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded-full" style={{ background:'rgba(0,0,0,0.05)',color:DIM2 }}>Trust {c.trust}</span>
                      </div>
                      <p className="text-[10.5px] truncate" style={{ color:DIM2 }}>{c.note}</p>
                    </div>
                    <button className="text-[10px] font-semibold px-2.5 py-1 rounded-[7px] shrink-0"
                      style={{ background:`rgba(255,92,40,0.12)`, border:`1px solid rgba(255,92,40,0.2)`, color:ORANGE }}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            )
          }

          const msg  = isLast && isAI && t.special !== 'shortlist' ? text : t.text
          if (!msg && isAI) return null
          return (
            <div key={i} className={`flex gap-2.5 ${isAI ? '' : 'flex-row-reverse'}`}
              style={{ animation:'fadeSlideUp 0.3s ease-out' }}>
              {isAI && (
                <div style={{ width:26,height:26,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,
                  flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'white' }}>T</div>
              )}
              <div className="max-w-[82%] px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                style={{
                  borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  background: isAI ? 'rgba(0,0,0,0.04)' : `rgba(255,92,40,0.12)`,
                  color: 'rgba(0,0,0,0.75)',
                }}>
                {msg}
              </div>
            </div>
          )
        })}

        {typing && (
          <div className="flex gap-2.5">
            <div style={{ width:26,height:26,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,
              flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800 }}>T</div>
            <div className="px-3.5 py-3 rounded-[4px_14px_14px_14px]" style={{ background:'rgba(0,0,0,0.04)' }}>
              <div className="flex gap-1 items-center h-3">
                {[0,1,2].map(j => (
                  <span key={j} style={{ width:5,height:5,borderRadius:'50%',background:'rgba(0,0,0,0.25)',
                    display:'block',animation:`bounce 1.2s ease-in-out infinite`,animationDelay:`${j*0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop:`1px solid ${BORDER}` }}>
        <div className="flex-1 px-3.5 py-2 rounded-[10px] text-[12px]"
          style={{ background:'rgba(0,0,0,0.03)', color:'rgba(0,0,0,0.3)', border:`1px solid rgba(0,0,0,0.07)` }}>
          Describe the talent you need…
        </div>
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
          style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)` }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)) }
