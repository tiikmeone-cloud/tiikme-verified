'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import TiikmeMark from '@/components/brand/TiikmeMark'

// ── Landing chrome — white mode ────────────────────────────────────────────
const BG     = '#FFFFFF'
const CARD   = '#F8FAFC'
const BORDER = 'rgba(0,0,0,0.08)'
const ORANGE = '#FF5C28'
const MINT   = '#4EFFA8'
const DIM    = 'rgba(0,0,0,0.55)'
const DIM2   = 'rgba(0,0,0,0.38)'
const INK    = '#0F172A'
const INK2   = 'rgba(15,23,42,0.60)'
const INK3   = 'rgba(15,23,42,0.40)'
const PAGE   = 'rgba(0,0,0,0.025)'
const LINE   = 'rgba(0,0,0,0.06)'
const GREEN  = '#16A34A'
const AMBER  = '#D97706'
const PURPLE = '#6366F1'
const TEAL   = '#0D9488'

// ── Light mockup constants — visuals render as white app screenshots ──
const MOCK = {
  CARD:   '#F8FAFC',
  BORDER: 'rgba(0,0,0,0.08)',
  INK:    '#0F172A',
  INK2:   'rgba(15,23,42,0.60)',
  INK3:   'rgba(15,23,42,0.40)',
  PAGE:   'rgba(0,0,0,0.025)',
  LINE:   'rgba(0,0,0,0.06)',
  GREEN:  '#16A34A',
  PURPLE: '#6366F1',
  TEAL:   '#0D9488',
  AMBER:  '#D97706',
}

const LOGOS = ['Swiggy','Razorpay','Zepto','CRED','Groww','PhonePe','Meesho','Flipkart','Ola','Dunzo','BrowserStack','Freshworks']

const STEPS = [
  {
    n:'01', label:'Build Your Flex',
    desc:'Your profile is a living timeline — experience, education, skills, certs. No PDF upload. Structured, searchable, and squad-verified from day one.',
    visual: <FlexPublicVisual />,
  },
  {
    n:'02', label:'Your Squad Verifies',
    desc:'Teammates confirm your work history. Each verified peer adds a Trust Score point. AI can generate a CV — it cannot fake your network.',
    visual: <SquadVerifyVisual />,
  },
  {
    n:'03', label:'Tiik Matches You',
    desc:'Ask Tiik anything. Which roles fit your Flex right now. What skill gaps are blocking you. Which org is most likely to shortlist you this week.',
    visual: <TiikChatVisual />,
  },
  {
    n:'04', label:'Org Reviews. You Approve.',
    desc:'Orgs discover your anonymised card. You get a request in your inbox. Approve it and they see your full Flex — name, contact, everything.',
    visual: <OrgApproveVisual />,
  },
]

const STATS = [
  { n:'12,400+', label:'Verified Profiles' },
  { n:'847',     label:'Orgs Hiring' },
  { n:'₹22 LPA', label:'Avg Match Salary' },
  { n:'94%',     label:'Squad Reply Rate' },
]

const WITHOUT = [
  'Keyword-matched CVs disappear into ATS black holes',
  'Cold applications with no context, no reply',
  'Generic rejections, zero feedback',
  'Ghosted by recruiters for weeks',
]
const WITH = [
  'Squad-verified Flex — every claim is backed by peers',
  'Tiik introduces you to orgs that already fit your score',
  'Skill gap coaching with courses that close the gap',
  'Org sees your match score and contacts you first',
]

export default function LandingShell() {
  return (
    <main style={{ background:BG, color:INK,
        backgroundImage:`linear-gradient(rgba(0,0,0,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.045) 1px,transparent 1px)`,
        backgroundSize:'40px 40px',
        animation:'tiik-grid-pan 12s linear infinite' }}
      className="relative min-h-screen overflow-hidden font-sans">
      <style>{`@keyframes tiik-grid-pan{from{background-position:0 0}to{background-position:40px 40px}}`}</style>
      <div aria-hidden className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute',top:'-5%',left:'50%',transform:'translateX(-50%)',
          width:900,height:700,background:`radial-gradient(ellipse,rgba(255,92,40,.08) 0%,transparent 65%)`,filter:'blur(80px)' }} />
        <div style={{ position:'absolute',bottom:'10%',right:'-5%',
          width:500,height:400,background:`radial-gradient(ellipse,rgba(78,255,168,.04) 0%,transparent 65%)`,filter:'blur(80px)' }} />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-16 py-5">
        <Link href="/"><TiikmeMark size="md" showWordmark alive /></Link>
        <nav className="hidden md:flex items-center gap-1 px-1 py-1 rounded-[12px]"
          style={{ background:'rgba(0,0,0,0.04)', border:`1px solid ${BORDER}` }}>
          <span className="px-4 py-1.5 rounded-[9px] text-[12.5px] font-semibold" style={{ background:`rgba(255,92,40,0.12)`, color:ORANGE }}>
            For Talent
          </span>
          <Link href="/company" className="px-4 py-1.5 rounded-[9px] text-[12.5px] font-medium transition-all hover:text-gray-900" style={{ color:DIM }}>
            For Companies
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-[13px] font-medium transition-colors hover:text-gray-900" style={{ color:DIM }}>Sign in</Link>
          <Link href="/welcome" className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`, boxShadow:`0 4px 16px -4px rgba(255,92,40,0.5)` }}>
            Get started free
          </Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 pt-16 pb-10 text-center">
        <div className="max-w-[780px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold"
            style={{ background:'rgba(255,92,40,0.10)', border:`1px solid rgba(255,92,40,0.22)`, color:ORANGE }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:ORANGE,display:'inline-block' }} />
            India&apos;s Verified Career Graph
          </div>
          <h1 className="text-[48px] md:text-[68px] font-bold tracking-tight leading-[1.02]" style={{ letterSpacing:'-0.02em' }}>
            Your next role is<br /><span style={{ color:ORANGE }}>waiting in the data.</span>
          </h1>
          <p className="mt-5 text-[16px] md:text-[18px] leading-relaxed max-w-[560px] mx-auto" style={{ color:DIM }}>
            Build a squad-verified Flex profile, close skill gaps with Tiik, and let the AI matchmaker introduce you to orgs that already fit.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/welcome" className="inline-flex items-center justify-center px-8 py-3.5 rounded-[12px] font-semibold text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`, boxShadow:`0 8px 28px -6px rgba(255,92,40,0.5)` }}>
              Build My Flex — it&apos;s free
            </Link>
            <Link href="/company" className="inline-flex items-center justify-center px-8 py-3.5 rounded-[12px] font-semibold text-[15px] transition-all hover:text-gray-900"
              style={{ background:CARD, border:`1px solid ${BORDER}`, color:DIM }}>
              I&apos;m Hiring
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12px]" style={{ color:DIM2 }}>
            {['No CV required','Squad-verified','Invisible until you approve'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-16 py-20" style={{ borderTop:`1px solid ${BORDER}` }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:ORANGE }}>The Flow</p>
            <h2 className="text-[34px] lg:text-[46px] font-bold tracking-tight leading-[1.07]">From profile to introduction.</h2>
          </div>
          <div className="space-y-24">
            {STEPS.map(({ n, label, desc, visual }, i) => (
              <div key={n} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
                <div style={{ direction:'ltr' }}>
                  <p className="text-[12px] font-mono font-bold mb-3" style={{ color:ORANGE }}>{n}.</p>
                  <h3 className="text-[28px] lg:text-[34px] font-bold tracking-tight leading-[1.08] mb-4">{label}</h3>
                  <p className="text-[15px] leading-relaxed" style={{ color:DIM }}>{desc}</p>
                </div>
                <div style={{ direction:'ltr' }}><VisualFrame>{visual}</VisualFrame></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEVEL UP ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-20"
        style={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, background:'rgba(0,0,0,0.018)' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:MINT }}>Level Up</p>
              <h2 className="text-[32px] lg:text-[42px] font-bold tracking-tight leading-[1.07] mb-5">
                Close the gap.<br /><span style={{ color:MINT }}>Become the top match.</span>
              </h2>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color:DIM }}>
                Tiik reads your Flex against live JDs and finds exactly which skills are blocking you from the shortlist.
                One verified course and you jump from near-miss to top-3.
              </p>
              <div className="space-y-3">
                {[
                  { icon:'🔍', title:'Gap detected automatically', desc:'Tiik compares your Flex against every role you\'re close to and tells you the one thing that\'s missing.' },
                  { icon:'🎯', title:'Org-sponsored courses', desc:'Courses chosen by orgs actively hiring — not generic MOOCs. Many are free and org-sponsored.' },
                  { icon:'📈', title:'Trust Score updates in real time', desc:'Complete a verified course and your Trust Score goes up. Orgs see the change on your Flex card.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 px-4 py-3.5 rounded-[14px]"
                    style={{ background:CARD, border:`1px solid ${BORDER}` }}>
                    <span className="text-[20px] shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-[13px] font-semibold mb-0.5">{title}</p>
                      <p className="text-[12px] leading-snug" style={{ color:DIM2 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <VisualFrame><LevelUpVisual /></VisualFrame>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-14" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-[900px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(({ n, label }) => (
            <div key={label}>
              <p className="text-[38px] lg:text-[44px] font-bold tracking-tight" style={{ color:ORANGE }}>{n}</p>
              <p className="text-[12.5px] mt-1" style={{ color:DIM2 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WITHOUT vs WITH ──────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-20" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:DIM2 }}>Why Tiik</p>
            <h2 className="text-[32px] lg:text-[42px] font-bold tracking-tight leading-[1.07]">
              The difference is <span style={{ color:MINT }}>verification.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[18px] p-6" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color:'rgba(0,0,0,0.30)' }}>Without Tiik</p>
              <div className="space-y-3">
                {WITHOUT.map(t => (
                  <div key={t} className="flex items-start gap-3">
                    <div style={{ width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.10)',flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <div style={{ width:6,height:2,background:'rgba(0,0,0,0.20)',borderRadius:1 }} />
                    </div>
                    <p className="text-[13.5px] leading-snug" style={{ color:'rgba(0,0,0,0.35)' }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[18px] p-6" style={{ background:`rgba(78,255,168,0.04)`, border:`1px solid rgba(78,255,168,0.15)` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color:MINT }}>With Tiik</p>
              <div className="space-y-3">
                {WITH.map(t => (
                  <div key={t} className="flex items-start gap-3">
                    <div style={{ width:18,height:18,borderRadius:'50%',background:`rgba(78,255,168,0.12)`,border:`1px solid rgba(78,255,168,0.25)`,flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-[13.5px] leading-snug" style={{ color:'rgba(0,0,0,0.72)' }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-28">
        <div className="max-w-[640px] mx-auto text-center relative">
          <div aria-hidden style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
            width:700,height:500,background:`radial-gradient(ellipse,rgba(255,92,40,.13) 0%,transparent 65%)`,
            filter:'blur(80px)',pointerEvents:'none',zIndex:-1 }} />
          <h2 className="text-[38px] lg:text-[56px] font-bold tracking-tight leading-[1.04]">
            Your Flex is proof.<br /><span style={{ color:ORANGE }}>Let the data speak.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color:DIM }}>
            Build once. Tiik watches the market while you sleep.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/welcome" className="inline-flex items-center justify-center px-9 py-4 rounded-[14px] font-semibold text-[16px] text-white transition-all hover:opacity-90"
              style={{ background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`, boxShadow:`0 10px 32px -8px rgba(255,92,40,0.55)` }}>
              Build My Flex
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center px-9 py-4 rounded-[14px] font-semibold text-[15px] transition-all hover:text-gray-900"
              style={{ background:CARD, border:`1px solid ${BORDER}`, color:DIM }}>
              Sign in
            </Link>
          </div>
          <p className="mt-5 text-[12px]" style={{ color:DIM2 }}>No application. No queue. 10 minutes to your first match.</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 lg:px-16 py-8" style={{ borderTop:`1px solid ${BORDER}` }}>
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/"><TiikmeMark size="sm" showWordmark /></Link>
          <p className="text-[12px] italic" style={{ color:DIM2 }}>&ldquo;LinkedIn shows where you&apos;ve been. Tiik engineers where you&apos;re going.&rdquo;</p>
          <div className="flex items-center gap-5 text-[12px]" style={{ color:DIM2 }}>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <a href="mailto:hello@tiikme.com" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
        </div>
        <p className="text-center text-[11px] mt-4" style={{ color:'rgba(0,0,0,0.28)' }}>
          © {new Date().getFullYear()} tiikme · made in India
        </p>
      </footer>

      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes scrollLeft { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes verifyPop { 0%{opacity:0;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }
      `}</style>
    </main>
  )
}

/* ── Logo Scroll ──────────────────────────────────────────────────────────── */
function LogoScroll() {
  const doubled = [...LOGOS, ...LOGOS]
  return (
    <div className="relative z-10 overflow-hidden py-6" style={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}` }}>
      <p className="text-center text-[10.5px] font-bold uppercase tracking-widest mb-5" style={{ color:DIM2 }}>Talent from</p>
      <div className="flex overflow-hidden">
        <div className="flex gap-10 shrink-0 items-center pr-10" style={{ animation:'scrollLeft 22s linear infinite' }}>
          {doubled.map((name, i) => (
            <span key={i} className="text-[13px] font-semibold shrink-0 whitespace-nowrap" style={{ color:'rgba(255,255,255,0.25)' }}>{name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Dark frame wrapping each step visual (app screenshot on white landing) ── */
function VisualFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background:'#FFFFFF', borderRadius:22,
      boxShadow:'0 8px 40px -8px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)', overflow:'hidden' }}>
      {children}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   STEP 01 — Public Flex card (matches FlexPublicView.tsx exactly)
──────────────────────────────────────────────────────────────────────────── */
function FlexPublicVisual() {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { CARD, BORDER, INK, INK2, INK3, PAGE, LINE, GREEN, PURPLE } = MOCK
  const SKILLS = ['React','TypeScript','Node.js','System Design','GraphQL']
  return (
    <div style={{ boxShadow:'0 24px 56px -16px rgba(0,0,0,0.5)' }}>
      {/* Hero card — matches rounded-[20px] border border-line bg-card p-6 */}
      <div className="rounded-[20px] p-5 relative overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        <div aria-hidden style={{ position:'absolute',top:-24,right:-24,width:120,height:120,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(255,92,40,.18),transparent 65%)',filter:'blur(20px)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'flex-start',gap:16,position:'relative' }}>
          {/* w-[72px] h-[72px] rounded-[18px] bg-gradient-to-br from-orange to-orange-2 */}
          <div style={{ width:64,height:64,borderRadius:16,background:'linear-gradient(135deg,#FF5C28,#FF8A5C)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900,color:'white',flexShrink:0 }}>
            A
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
              <h1 style={{ fontSize:20,fontWeight:900,color:INK,lineHeight:1.15,margin:0 }}>Arjun Sharma</h1>
              {/* Open to work badge — text-[10px] font-bold text-green bg-green/10 border border-green/20 px-2 py-0.5 rounded-full */}
              <span style={{ fontSize:10,fontWeight:700,color:GREEN,background:`rgba(78,255,168,0.1)`,
                border:`1px solid rgba(78,255,168,0.2)`,padding:'2px 8px',borderRadius:999,whiteSpace:'nowrap' }}>
                Open to work
              </span>
            </div>
            <p style={{ fontSize:13,color:INK2,marginTop:4,lineHeight:1.4 }}>Frontend Engineer · 4 yrs exp</p>
            <p style={{ fontSize:11,color:INK3,marginTop:4 }}>📍 Bangalore, India</p>
          </div>
        </div>
      </div>

      {/* Skills section — matches Section: rounded-[16px] border border-line bg-card p-5 */}
      <div className="rounded-[16px] p-4 mt-3" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        <h2 style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:INK3,margin:0,marginBottom:10 }}>Skills</h2>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:8 }}>
          {SKILLS.map(s => (
            <span key={s} style={{ fontSize:11,fontWeight:500,color:INK2,background:PAGE,border:`1px solid ${LINE}`,
              padding:'3px 10px',borderRadius:999 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Experience section */}
      <div className="rounded-[16px] p-4 mt-3" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        <h2 style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:INK3,margin:0,marginBottom:10 }}>Experience</h2>
        <div>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:13,fontWeight:600,color:INK,margin:0 }}>Frontend Engineer</p>
              <p style={{ fontSize:12,color:INK2,marginTop:2 }}>Razorpay · Bangalore</p>
            </div>
            <span style={{ fontSize:11,color:INK3,flexShrink:0,marginTop:1 }}>2022 – Present</span>
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginTop:8 }}>
            {['React','TypeScript','GraphQL'].map(s => (
              <span key={s} style={{ fontSize:10,padding:'2px 8px',background:PAGE,border:`1px solid ${LINE}`,borderRadius:999,color:INK3 }}>{s}</span>
            ))}
          </div>
          {/* Squad-verified strip */}
          <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:10,padding:'6px 10px',borderRadius:10,
            background:`rgba(78,255,168,0.05)`,border:`1px solid rgba(78,255,168,0.12)` }}>
            <MiniAvatarStack colors={['#7C3AED','#0D9488',ORANGE]} initials={['A','M','R']} />
            <span style={{ fontSize:11,fontWeight:600,color:GREEN }}>3 verified teammates</span>
          </div>
        </div>
      </div>

      {/* Verified notice footer — purple strip from FlexPublicView */}
      <div className="rounded-[14px] p-4 mt-3 flex items-start gap-3" style={{ background:CARD, border:`1px solid rgba(129,140,248,0.2)` }}>
        <span style={{ width:32,height:32,borderRadius:10,background:`rgba(129,140,248,0.1)`,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>✦</span>
        <div>
          <p style={{ fontSize:12,fontWeight:600,color:INK,margin:0 }}>Flex is squad-verified on tiikme</p>
          <p style={{ fontSize:11,color:INK3,marginTop:3,lineHeight:1.5 }}>
            Every claim is co-signed by real teammates — not self-reported.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   STEP 02 — Squad Verify (experience entry + SquadLine as in MyFlexView)
──────────────────────────────────────────────────────────────────────────── */
function SquadVerifyVisual() {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { CARD, BORDER, INK, INK2, INK3, PAGE, LINE, GREEN, PURPLE } = MOCK
  const [count, setCount] = useState(0)
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setCount(1), 700)
    const t2 = setTimeout(() => setCount(2), 1500)
    const t3 = setTimeout(() => { setCount(3); setShowNotif(true) }, 2300)
    const t4 = setTimeout(() => setShowNotif(false), 4200)
    const t5 = setTimeout(() => setCount(0), 5200)
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout)
  }, [])

  const peers = [
    { init:'AK', bg:'#7C3AED', name:'Arun Kumar' },
    { init:'MP', bg:'#0D9488', name:'Meera Patel' },
    { init:'RS', bg:ORANGE,    name:'Rohan Shah'  },
  ]

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 24px 56px -16px rgba(0,0,0,0.5)' }}>
      {/* Header — matches MyFlexView section header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom:`1px solid ${LINE}`, background:PAGE }}>
        <p style={{ fontSize:15,fontWeight:700,color:INK,margin:0 }}>Work Experience</p>
        <button style={{ fontSize:12,fontWeight:600,color:ORANGE }}>+ Add</button>
      </div>

      {/* Experience entry — matches ExpRow in MyFlexView.tsx */}
      <div className="flex gap-4 px-5 pt-4 pb-4">
        {/* Left: company logo + timeline line */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:`rgba(255,92,40,0.12)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:15,color:ORANGE }}>R</div>
          <div style={{ width:1,flex:1,background:LINE,marginTop:8 }} />
        </div>
        {/* Right: content */}
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ fontSize:14,fontWeight:700,color:INK,margin:0 }}>Frontend Engineer</p>
          <p style={{ fontSize:12,color:INK2,marginTop:2 }}>Razorpay · Full-time</p>
          <p style={{ fontSize:11,color:INK3,marginTop:2 }}>Jun 2022 – Aug 2024 · Bangalore</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginTop:8 }}>
            {['React','TypeScript','Node.js'].map(s => (
              <span key={s} style={{ fontSize:10,fontWeight:500,color:INK2,background:LINE,padding:'2px 8px',borderRadius:999 }}>{s}</span>
            ))}
          </div>

          {/* SquadLine — matches SquadLine component in MyFlexView */}
          <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:10 }}>
            {count > 0 ? (
              <>
                <div style={{ display:'flex',alignItems:'center' }}>
                  {peers.slice(0, count).map((p, i) => (
                    <div key={p.init} style={{ width:22,height:22,borderRadius:'50%',background:p.bg,
                      border:'2px solid rgba(10,10,18,0.8)',display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:9,fontWeight:700,color:'white',
                      marginLeft: i === 0 ? 0 : -8, zIndex: peers.length - i,
                      animation:'verifyPop 0.3s ease-out' }}>
                      {p.init}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize:11,fontWeight:600,color:GREEN,transition:'color 0.3s' }}>
                  {count} verified teammate{count > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <button style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:600,color:PURPLE,background:'none',border:'none',cursor:'pointer',padding:0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Add your squad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Incoming verification notification */}
      <div style={{ margin:'0 16px 14px',borderRadius:12,padding:'10px 14px',
        background:`rgba(78,255,168,0.06)`,border:`1px solid rgba(78,255,168,0.18)`,
        display:'flex',alignItems:'center',gap:10,
        opacity: showNotif ? 1 : 0, transform: showNotif ? 'translateY(0)' : 'translateY(4px)',
        transition:'opacity 0.35s,transform 0.35s' }}>
        <span style={{ width:22,height:22,borderRadius:'50%',background:'#0D9488',display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:9,fontWeight:700,color:'white',flexShrink:0 }}>MP</span>
        <p style={{ fontSize:12,color:INK2,margin:0,lineHeight:1.4 }}>
          <strong style={{ color:INK }}>Meera Patel</strong> verified your Razorpay experience
          <span style={{ marginLeft:6,fontSize:10,color:GREEN,fontWeight:700 }}>✓</span>
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   STEP 03 — Tiik Chat (matches AiChatShell message bubble style)
──────────────────────────────────────────────────────────────────────────── */
const CHAT_TURNS = [
  { role:'user',      text:'Which roles match my Flex right now?' },
  { role:'assistant', text:'You\'re 84% match for Razorpay SDE-2 (₹28–38L) and 79% for CRED Frontend Lead (₹32–42L). One gap: System Design. Want me to close it?' },
  { role:'user',      text:'Yes — how long will it take?' },
  { role:'assistant', text:'ByteCloud System Design — 5h, free, org-sponsored by Razorpay. Your squad-mate Karthik finished it and landed Principal at Meesho. Trust Score jumps 72 → 91.' },
]

function TiikChatVisual() {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { CARD, BORDER, INK, INK2, INK3, PAGE, LINE, GREEN } = MOCK
  const [visible, setVisible] = useState(1)
  const [typing,  setTyping]  = useState(false)
  const [text,    setText]    = useState('')
  const [started, setStarted] = useState(false)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Start animation only when this section scrolls into view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let alive = true; let idx = 1

    async function step() {
      if (!alive || idx >= CHAT_TURNS.length) return
      const turn = CHAT_TURNS[idx]
      if (turn.role === 'user') {
        await wait(1400); if (!alive) return
        setVisible(v => v + 1); idx++
        await wait(600); if (!alive) return
        setTyping(true); await wait(900); if (!alive) return
        setTyping(false); step()
      } else {
        let i = 0; const full = turn.text
        setText(''); setVisible(v => v + 1); idx++
        function typeChar() {
          if (!alive) return
          if (i < full.length) { setText(full.slice(0, i+1)); i++; timerRef.current = setTimeout(typeChar, 14) }
          else { timerRef.current = setTimeout(() => { if (alive) step() }, 2400) }
        }
        typeChar()
      }
    }
    const t = setTimeout(step, 800)
    return () => { alive = false; clearTimeout(t); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [started])

  useEffect(() => {
    if (!started) return
    if (visible === CHAT_TURNS.length) {
      const t = setTimeout(() => { setVisible(1); setText(''); setTyping(false) }, 3500)
      return () => clearTimeout(t)
    }
  }, [visible, started])

  const turns = CHAT_TURNS.slice(0, visible)
  const lastIdx = visible - 1

  return (
    <div ref={containerRef} className="rounded-[18px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 24px 56px -16px rgba(0,0,0,0.5)' }}>
      {/* Header — matches AiChatShell */}
      <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom:`1px solid ${LINE}`, background:PAGE }}>
        <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,color:'white' }}>T</div>
        <div>
          <p style={{ fontSize:13,fontWeight:700,color:INK,lineHeight:1.2 }}>Tiik</p>
          <p style={{ fontSize:10,color:INK3 }}>Your Career AI</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span style={{ width:7,height:7,borderRadius:'50%',background:'rgba(78,255,168,0.6)',display:'block' }} />
          <span style={{ fontSize:10,color:GREEN }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-3 min-h-[180px]">
        {turns.map((t, i) => {
          const isAI  = t.role === 'assistant'
          const isLast = i === lastIdx
          const msg   = isLast && isAI ? text : t.text
          if (!msg && isAI) return null
          return (
            <div key={i} className={`flex gap-2.5 ${isAI ? '' : 'flex-row-reverse'}`}
              style={{ animation:'fadeSlideUp 0.3s ease-out' }}>
              {isAI && (
                <div style={{ width:26,height:26,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'white' }}>T</div>
              )}
              <div style={{
                maxWidth:'80%',padding:'8px 14px',fontSize:13,lineHeight:1.5,
                borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                background: isAI ? 'rgba(255,255,255,0.06)' : `rgba(255,92,40,0.16)`,
                color: isAI ? GREEN : INK2,
              }}>{msg}</div>
            </div>
          )
        })}
        {typing && (
          <div className="flex gap-2.5" style={{ animation:'fadeSlideUp 0.25s ease-out' }}>
            <div style={{ width:26,height:26,borderRadius:'50%',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800 }}>T</div>
            <div style={{ padding:'10px 14px',borderRadius:'4px 14px 14px 14px',background:'rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1 items-center" style={{ height:12 }}>
                {[0,1,2].map(j => (
                  <span key={j} style={{ width:5,height:5,borderRadius:'50%',background:'rgba(255,255,255,0.3)',display:'block',animation:`bounce 1.2s ease-in-out infinite`,animationDelay:`${j*0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderTop:`1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ flex:1,padding:'7px 14px',borderRadius:10,fontSize:12,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.2)',border:`1px solid rgba(255,255,255,0.07)` }}>
          Ask Tiik about your career…
        </div>
        <div style={{ width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   STEP 04 — Org Requests (matches RequestsView + RequestCard exactly)
──────────────────────────────────────────────────────────────────────────── */
function OrgApproveVisual() {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { CARD, BORDER, INK, INK2, INK3, PAGE, LINE, GREEN } = MOCK
  const [status, setStatus] = useState<'pending'|'approved'>('pending')
  useEffect(() => { const t = setTimeout(() => setStatus('approved'), 2400); return () => clearTimeout(t) }, [])

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 24px 56px -16px rgba(0,0,0,0.5)' }}>
      <div className="px-5 py-4" style={{ background:PAGE, borderBottom:`1px solid ${LINE}` }}>
        <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.14em',color:ORANGE }}>Flex Access</p>
        <p style={{ fontSize:18,fontWeight:700,color:INK,marginTop:4 }}>Requests</p>
        <p style={{ fontSize:12,color:INK3,marginTop:2 }}>Organisations requesting access to your Flex.</p>
      </div>

      <div className="px-5 py-4">
        <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:INK3,marginBottom:10 }}>
          {status === 'pending' ? 'PENDING · 1' : 'APPROVED'}
        </p>

        {/* RequestCard — matches bg-card border border-line rounded-[16px] p-4 */}
        <div className="flex items-center gap-4 p-4 rounded-[16px]"
          style={{ background: status === 'approved' ? `rgba(78,255,168,0.05)` : PAGE,
            border: `1px solid ${status === 'approved' ? 'rgba(78,255,168,0.2)' : LINE}`,
            transition:'all 0.4s' }}>
          {/* Org logo — bg-orange-soft text-orange w-10 h-10 rounded-[10px] */}
          <span style={{ width:40,height:40,borderRadius:10,background:`rgba(255,92,40,0.12)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:ORANGE,flexShrink:0 }}>R</span>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize:13,fontWeight:600,color:INK }}>Razorpay</p>
            <p style={{ fontSize:11,color:INK3,marginTop:2 }}>Requested 22 Jun 2026</p>
          </div>
          {status === 'pending' ? (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setStatus('approved')}
                style={{ fontSize:11.5,fontWeight:600,color:'white',background:`linear-gradient(135deg,${ORANGE},#FF8A5C)`,borderRadius:9,padding:'6px 12px' }}>
                Approve
              </button>
              <button style={{ fontSize:11.5,fontWeight:600,color:INK2,background:CARD,border:`1px solid ${LINE}`,borderRadius:9,padding:'6px 12px' }}>
                Decline
              </button>
            </div>
          ) : (
            <span style={{ fontSize:10,fontWeight:700,color:GREEN,background:`rgba(78,255,168,0.12)`,border:`1px solid rgba(78,255,168,0.25)`,padding:'3px 8px',borderRadius:999,flexShrink:0,
              animation:'verifyPop 0.4s ease-out' }}>
              Approved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Level Up — matches LearnView.tsx card list (courses, certs, hackathons)
──────────────────────────────────────────────────────────────────────────── */
function LevelUpVisual() {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { CARD, BORDER, INK, INK2, INK3, PAGE, LINE, GREEN, PURPLE, TEAL } = MOCK
  const [tab, setTab] = useState(0) // 0=All 1=Courses 2=Certificates 3=Hackathons

  const TABS = ['All','Courses','Certificates','Hackathons']

  const items = [
    {
      kind:0, letter:'B', color:'#7C3AED', title:'System Design for Engineers',
      provider:'ByteCloud', badge:'COURSE · INTERMEDIATE',
      duration:'5h', cost:'Free', skills:['System Design','Architecture'], landsFlex:true,
    },
    {
      kind:1, letter:'A', color:'#0D9488', title:'AWS Solutions Architect',
      provider:'AWS', badge:'CERTIFICATE · PRO',
      duration:'40h', cost:'₹12,000', skills:['AWS','Cloud'], landsFlex:true,
    },
    {
      kind:2, letter:'S', color:ORANGE, title:'Solana Summer Hackathon',
      provider:'Superteam', badge:'HACKATHON',
      duration:'Weekend', cost:'Free', skills:['Web3','Solidity'], landsFlex:false,
    },
  ]

  const shown = tab === 0 ? items : items.filter(it => it.kind === tab - 1)

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}`, boxShadow:'0 24px 56px -16px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div className="px-5 py-3.5" style={{ borderBottom:`1px solid ${LINE}`, background:PAGE }}>
        <p style={{ fontSize:15,fontWeight:700,color:INK,margin:0 }}>Level Up</p>
        <p style={{ fontSize:11,color:INK3,marginTop:2 }}>Courses · Certificates · Hackathons</p>
      </div>

      {/* Filter tabs — matches TABS in LearnView */}
      <div style={{ display:'flex',gap:6,padding:'12px 20px 0',overflowX:'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding:'5px 12px',fontSize:12,fontWeight:600,borderRadius:999,whiteSpace:'nowrap',
              background: tab === i ? ORANGE : 'rgba(255,255,255,0.05)',
              color: tab === i ? 'white' : INK2,
              border: tab === i ? 'none' : `1px solid ${LINE}`,
              cursor:'pointer', transition:'all 0.2s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Item count */}
      <p style={{ fontSize:11,color:INK3,padding:'8px 20px 0' }}>{shown.length} {shown.length === 1 ? 'item' : 'items'}</p>

      {/* LearnRow cards — matches LearnRow in LearnView.tsx */}
      <div style={{ padding:'8px 16px 16px',display:'flex',flexDirection:'column',gap:10 }}>
        {shown.map(it => (
          <div key={it.title} style={{ borderRadius:14,padding:'12px 14px',border:`1px solid ${LINE}`,
            background:PAGE, display:'flex',alignItems:'flex-start',gap:12 }}>
            {/* Provider logo — w-10 h-10 rounded-[11px] */}
            <div style={{ width:40,height:40,borderRadius:11,background:it.color,
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'white',flexShrink:0 }}>
              {it.letter}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              {/* Title + kind chip */}
              <div style={{ display:'flex',alignItems:'flex-start',gap:6 }}>
                <p style={{ fontSize:13,fontWeight:600,color:INK,flex:1,minWidth:0,lineHeight:1.3,margin:0 }}>{it.title}</p>
                <span style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',
                  color:INK3,background:PAGE,padding:'2px 6px',borderRadius:999,flexShrink:0,marginTop:1 }}>
                  {it.badge}
                </span>
              </div>
              {/* Provider */}
              <p style={{ fontSize:11,color:INK3,marginTop:3 }}>By {it.provider}</p>
              {/* Duration + cost rows */}
              <div style={{ marginTop:6,display:'flex',flexDirection:'column',gap:2 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,fontSize:11,color:INK2 }}>
                  <span style={{ width:14,textAlign:'center' }}>⏱</span>
                  <span style={{ color:INK3,width:54 }}>Duration</span>
                  <span style={{ fontWeight:500,color:INK }}>{it.duration}</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8,fontSize:11,color:INK2 }}>
                  <span style={{ width:14,textAlign:'center' }}>💳</span>
                  <span style={{ color:INK3,width:54 }}>Cost</span>
                  <span style={{ fontWeight:500,color:INK }}>{it.cost}</span>
                </div>
              </div>
              {/* Skill pills + Lands on Flex — matches LearnRow chips */}
              <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginTop:8 }}>
                {it.landsFlex && (
                  <span style={{ fontSize:9,fontWeight:700,color:PURPLE,background:`rgba(129,140,248,0.1)`,
                    padding:'2px 7px',borderRadius:999 }}>Lands on Flex</span>
                )}
                {it.skills.map(s => (
                  <span key={s} style={{ fontSize:9,fontWeight:500,color:TEAL,background:`rgba(67,201,186,0.08)`,
                    border:`1px solid rgba(67,201,186,0.15)`,padding:'2px 7px',borderRadius:999 }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Mini avatar stack (overlapping circles) ─────────────────────────────── */
function MiniAvatarStack({ colors, initials }: { colors: string[]; initials: string[] }) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { LINE } = MOCK
  const BG_MAP: Record<string, string> = {
    'from-purple-500 to-purple-700': '#7C3AED',
    'from-teal-500 to-teal-700': '#0D9488',
    'from-orange-400 to-orange-600': ORANGE,
  }
  return (
    <div className="flex items-center" style={{ marginLeft:-4 }}>
      {initials.map((init, i) => (
        <div key={i} style={{ width:22,height:22,borderRadius:'50%',
          background: BG_MAP[colors[i]] ?? colors[i],
          border:'2px solid rgba(10,10,18,0.8)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:9,fontWeight:700,color:'white',
          marginLeft: i === 0 ? 0 : -8, zIndex: initials.length - i }}>
          {init}
        </div>
      ))}
    </div>
  )
}

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)) }
