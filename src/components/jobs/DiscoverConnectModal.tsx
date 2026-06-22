'use client'

import { useState, useMemo } from 'react'
import { toast } from '@/components/profile/ui/Toast'

/**
 * Discover panel triggered from the Jobs page header search icon.
 * Search BOTH organisations and people to connect with.
 * Connect → org's updates + jobs land in the user's feed (Profile Rundown).
 */

type Tab = 'orgs' | 'people'

interface OrgRow {
  slug: string; name: string; tagline: string; logo: string; verified: boolean; openRoles: number; location: string
}
interface PersonRow {
  handle: string; name: string; headline: string; avatar: string; verified: boolean; location: string
}

const ORGS: OrgRow[] = [
  { slug:'zeta',    name:'Zeta',    tagline:'Banking, modern.',                  logo:'#6D4BD8', verified:true,  openRoles:14, location:'Bengaluru, IN' },
  { slug:'linear',  name:'Linear',  tagline:'The issue tracker you’ll enjoy.',   logo:'#5E6AD2', verified:true,  openRoles:6,  location:'Remote' },
  { slug:'replit',  name:'Replit',  tagline:'Code with friends in the cloud.',   logo:'#F26207', verified:true,  openRoles:9,  location:'San Francisco' },
  { slug:'razorpay',name:'Razorpay',tagline:'Money, simpler.',                   logo:'#0E7AFE', verified:true,  openRoles:21, location:'Bengaluru, IN' },
  { slug:'gitlab',  name:'GitLab',  tagline:'One DevSecOps platform.',           logo:'#FC6D26', verified:true,  openRoles:18, location:'Remote' },
]

const PEOPLE: PersonRow[] = [
  { handle:'aisha-r',  name:'Aisha Rao',   headline:'Senior Product Designer · Razorpay', avatar:'https://i.pravatar.cc/120?img=15', verified:true,  location:'Bengaluru' },
  { handle:'arjun-k',  name:'Arjun Kapoor', headline:'Frontend @ Linear',                  avatar:'https://i.pravatar.cc/120?img=22', verified:true,  location:'Remote' },
  { handle:'priya-s',  name:'Priya Shah',   headline:'Recruiter · Zeta',                   avatar:'https://i.pravatar.cc/120?img=32', verified:true,  location:'Bengaluru' },
  { handle:'devon-m',  name:'Devon Martin', headline:'CS Student · Indie hacker',          avatar:'https://i.pravatar.cc/120?img=44', verified:false, location:'Hyderabad' },
]

export default function DiscoverConnectModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('orgs')
  const [q, setQ] = useState('')
  const [connected, setConnected] = useState<Set<string>>(new Set())

  const orgs   = useMemo(() => ORGS.filter(o => match(q, o.name, o.tagline, o.location)), [q])
  const people = useMemo(() => PEOPLE.filter(p => match(q, p.name, p.headline, p.location)), [q])

  const toggle = (key: string, label: string) => {
    setConnected(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key); toast(`Disconnected from ${label}`) }
      else                { next.add(key);    toast(`Connected to ${label} ✓  ·  Posts will land in your feed`) }
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-sm flex items-start justify-center p-4 lg:p-10 overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-page rounded-[20px] shadow-2xl w-full max-w-[640px] overflow-hidden border border-line">
        {/* header */}
        <div className="px-5 pt-4 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[11px] bg-orange-soft text-orange flex items-center justify-center">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-ink leading-tight">Discover &amp; connect</p>
              <p className="text-[11px] text-ink-3 mt-0.5">Find orgs &amp; people. Connect → their posts land in your feed.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] text-ink-3 hover:text-ink hover:bg-card transition-colors flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* search */}
          <div className="mt-3 flex items-center gap-2 bg-card border border-line rounded-[12px] px-3 py-2.5 focus-within:border-orange/40 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={tab === 'orgs' ? 'Search organisations…' : 'Search people…'}
              className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none"
            />
          </div>

          {/* tabs */}
          <div className="mt-3 flex bg-card rounded-[11px] p-1 w-fit shadow-card">
            {([['orgs','Organisations'],['people','People']] as [Tab,string][]).map(([id,l]) => (
              <button key={id} onClick={() => setTab(id)}
                className={['px-4 py-1.5 text-[12px] font-semibold rounded-[8px] transition-colors',
                  tab===id ? 'bg-page text-ink' : 'text-ink-3'].join(' ')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* list */}
        <div className="px-5 py-4 space-y-2 max-h-[480px] overflow-y-auto">
          {tab === 'orgs' && (orgs.length === 0
            ? <Empty label="No matching organisations." />
            : orgs.map(o => {
                const key = `org:${o.slug}`
                const isConnected = connected.has(key)
                return (
                  <div key={o.slug} className="bg-card border border-line rounded-[14px] p-3.5 flex items-center gap-3">
                    <a href={`/org/${o.slug}`} className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold shrink-0" style={{ backgroundColor: o.logo }}>{o.name.charAt(0)}</a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-ink truncate">{o.name}</p>
                        {o.verified && <Verified />}
                      </div>
                      <p className="text-[11px] text-ink-2 truncate">{o.tagline}</p>
                      <p className="text-[10px] text-ink-3 mt-0.5 truncate">{o.location} · {o.openRoles} open roles</p>
                    </div>
                    <button onClick={() => toggle(key, o.name)}
                      className={['text-[12px] font-semibold px-3.5 py-2 rounded-[10px] transition-all shrink-0',
                        isConnected
                          ? 'bg-page text-ink-2 border border-line'
                          : 'text-white bg-gradient-to-br from-orange to-orange-2 hover:opacity-95'].join(' ')}>
                      {isConnected ? '✓ Connected' : 'Connect'}
                    </button>
                  </div>
                )
              })
          )}

          {tab === 'people' && (people.length === 0
            ? <Empty label="No matching people." />
            : people.map(p => {
                const key = `usr:${p.handle}`
                const isConnected = connected.has(key)
                return (
                  <div key={p.handle} className="bg-card border border-line rounded-[14px] p-3.5 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <a href={`/profile/${p.handle}`} className="shrink-0"><img src={p.avatar} alt="" className="w-11 h-11 rounded-full object-cover" /></a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-ink truncate">{p.name}</p>
                        {p.verified && <Verified />}
                      </div>
                      <p className="text-[11px] text-ink-2 truncate">{p.headline}</p>
                      <p className="text-[10px] text-ink-3 mt-0.5 truncate">{p.location}</p>
                    </div>
                    <button onClick={() => toggle(key, p.name)}
                      className={['text-[12px] font-semibold px-3.5 py-2 rounded-[10px] transition-all shrink-0',
                        isConnected
                          ? 'bg-page text-ink-2 border border-line'
                          : 'text-white bg-gradient-to-br from-orange to-orange-2 hover:opacity-95'].join(' ')}>
                      {isConnected ? '✓ Connected' : 'Connect'}
                    </button>
                  </div>
                )
              })
          )}
        </div>

        <div className="px-5 py-3 border-t border-line flex items-center justify-between bg-card/60">
          <p className="text-[10px] text-ink-3">Connecting only follows public updates — no contact info is shared.</p>
          <button onClick={onClose} className="text-[12px] font-semibold text-ink-2 hover:text-ink transition-colors">Done</button>
        </div>
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="py-10 text-center text-[12px] text-ink-3">{label}</div>
}

function Verified() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-purple)" className="shrink-0">
      <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/>
      <path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/>
    </svg>
  )
}

function match(q: string, ...fields: string[]) {
  if (!q.trim()) return true
  const needle = q.toLowerCase()
  return fields.some(f => (f ?? '').toLowerCase().includes(needle))
}
