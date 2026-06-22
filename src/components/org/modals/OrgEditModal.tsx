'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from '@/components/ui/AvatarUpload'

interface Leader { id: string; user_id?: string; name: string; title: string; avatar_url?: string }
interface SocialLinks { linkedin?: string; twitter?: string; github?: string; instagram?: string }

export interface OrgEditData {
  tagline: string
  highlights: string[]
  mission: string
  about: string
  orgType: string
  location: string
  founded: string
  size: string
  funding: string
  website: string
  socialLinks: SocialLinks
  techStack: string[]
  perks: string[]
  leadership: Leader[]
}

interface Props {
  initial: OrgEditData
  orgId: string | null
  logoUrl: string | null
  onClose: () => void
  onSave: (data: OrgEditData) => Promise<void>
  onLogoUploaded: (url: string) => void
}

type Section = 'logo' | 'highlights' | 'story' | 'identity' | 'links' | 'culture' | 'leadership'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'logo',       label: 'Logo' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'story',      label: 'Story' },
  { id: 'identity',   label: 'Identity' },
  { id: 'links',      label: 'Links' },
  { id: 'culture',    label: 'Culture' },
  { id: 'leadership', label: 'Leadership' },
]

const toArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
const fromArr = (a: string[]) => a.join(', ')

interface ProfileResult { id: string; full_name: string | null; username: string; avatar_url: string | null }

function LeaderSearch({ onSelect }: { onSelect: (p: ProfileResult) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (q.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('account_type', 'user')
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(6)
      setResults((data as ProfileResult[]) ?? [])
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search by name or username…" className={inputCls} />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-line rounded-[12px] shadow-card z-10 overflow-hidden">
          {results.map(p => (
            <button key={p.id} onMouseDown={() => { onSelect(p); setQ(''); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-page transition-colors text-left">
              {p.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                : <span className="w-7 h-7 rounded-full bg-orange-soft text-orange text-[11px] font-bold flex items-center justify-center shrink-0">{(p.full_name ?? p.username).charAt(0).toUpperCase()}</span>}
              <div>
                <p className="text-[13px] font-semibold text-ink leading-tight">{p.full_name ?? p.username}</p>
                <p className="text-[11px] text-ink-3">@{p.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {q.length >= 2 && results.length === 0 && open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-line rounded-[12px] shadow-card z-10 px-3 py-2.5">
          <p className="text-[12px] text-ink-3">No users found</p>
        </div>
      )}
    </div>
  )
}

export default function OrgEditModal({ initial, orgId, logoUrl, onClose, onSave, onLogoUploaded }: Props) {
  const [section, setSection] = useState<Section>('logo')
  const [saving, setSaving] = useState(false)

  const [tagline, setTagline] = useState(initial.tagline)
  const [h1, setH1] = useState(initial.highlights[0] ?? '')
  const [h2, setH2] = useState(initial.highlights[1] ?? '')
  const [mission, setMission] = useState(initial.mission)
  const [about, setAbout] = useState(initial.about)
  const [orgType, setOrgType] = useState(initial.orgType)
  const [location, setLocation] = useState(initial.location)
  const [founded, setFounded] = useState(initial.founded)
  const [size, setSize] = useState(initial.size)
  const [funding, setFunding] = useState(initial.funding)
  const [website, setWebsite] = useState(initial.website)
  const [linkedin, setLinkedin] = useState(initial.socialLinks.linkedin ?? '')
  const [twitter, setTwitter] = useState(initial.socialLinks.twitter ?? '')
  const [github, setGithub] = useState(initial.socialLinks.github ?? '')
  const [instagram, setInstagram] = useState(initial.socialLinks.instagram ?? '')
  const [techStackStr, setTechStackStr] = useState(fromArr(initial.techStack))
  const [perksStr, setPerksStr] = useState(fromArr(initial.perks))
  const [leaders, setLeaders] = useState<Leader[]>(initial.leadership.length > 0 ? initial.leadership : [])
  const [leaderRoles, setLeaderRoles] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const l of initial.leadership) map[l.id] = l.title
    return map
  })

  const addLeader = (p: ProfileResult) => {
    if (leaders.find(l => l.user_id === p.id)) return
    const newLeader: Leader = { id: p.id, user_id: p.id, name: p.full_name ?? p.username, avatar_url: p.avatar_url ?? undefined, title: '' }
    setLeaders(prev => [...prev, newLeader])
    setLeaderRoles(prev => ({ ...prev, [p.id]: '' }))
  }

  const removeLeader = (id: string) => {
    setLeaders(prev => prev.filter(l => l.id !== id))
    setLeaderRoles(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const submit = async () => {
    setSaving(true)
    try {
      await onSave({
        tagline: tagline.trim(),
        highlights: [h1.trim(), h2.trim()].filter(Boolean),
        mission: mission.trim(),
        about: about.trim(),
        orgType: orgType.trim(),
        location: location.trim(),
        founded: founded.trim(),
        size: size.trim(),
        funding: funding.trim(),
        website: website.trim(),
        socialLinks: {
          linkedin: linkedin.trim() || undefined,
          twitter: twitter.trim() || undefined,
          github: github.trim() || undefined,
          instagram: instagram.trim() || undefined,
        },
        techStack: toArr(techStackStr),
        perks: toArr(perksStr),
        leadership: leaders.map(l => ({ ...l, title: leaderRoles[l.id] ?? '' })),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-card border border-line rounded-t-[20px] sm:rounded-[20px] w-full sm:max-w-[600px] max-h-[90vh] flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,.2)] sm:shadow-[0_24px_64px_-20px_rgba(0,0,0,.4)]">

          {/* Header */}
          <div className="px-5 pt-5 pb-0 shrink-0">
            <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-line mb-4" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Organization</p>
                <h2 className="text-[17px] font-bold text-ink mt-0.5">Edit org profile</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-page transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-3 border-b border-line -mx-5 px-5">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${section === s.id ? 'bg-orange text-white' : 'text-ink-3 hover:text-ink hover:bg-page'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {section === 'logo' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-[12px] text-ink-3 text-center">Upload your organization logo. Shown on your org page and job cards.</p>
                {orgId ? (
                  <AvatarUpload
                    bucket="org-logos"
                    ownerId={orgId}
                    currentUrl={logoUrl}
                    fallback="ORG"
                    shape="rounded"
                    size={100}
                    onUploaded={url => { onLogoUploaded(url); }}
                  />
                ) : (
                  <p className="text-[12px] text-ink-3">Save your org first before uploading a logo.</p>
                )}
              </div>
            )}

            {section === 'highlights' && (
              <>
                <p className="text-[11.5px] text-ink-3 leading-relaxed">Short-form content shown on org cards and at the top of the org page.</p>
                <Field label="Tagline" hint="One line — what you do">
                  <input value={tagline} onChange={e => setTagline(e.target.value)} maxLength={140}
                    placeholder="e.g. Designing digital products people love." className={inputCls} autoFocus />
                </Field>
                <Field label="Highlight 1" hint="A standout fact">
                  <input value={h1} onChange={e => setH1(e.target.value)} maxLength={120}
                    placeholder="e.g. Series B · profitable · remote-first" className={inputCls} />
                </Field>
                <Field label="Highlight 2" hint="Optional">
                  <input value={h2} onChange={e => setH2(e.target.value)} maxLength={120}
                    placeholder="e.g. 90% of hires come from referrals" className={inputCls} />
                </Field>
              </>
            )}

            {section === 'story' && (
              <>
                <Field label="Mission" hint="Why you exist">
                  <textarea value={mission} onChange={e => setMission(e.target.value)} rows={2}
                    placeholder="e.g. Build infrastructure that empowers the next billion creators."
                    className={`${inputCls} resize-y leading-relaxed`} />
                </Field>
                <Field label="About" hint="What you do, for who, and how">
                  <textarea value={about} onChange={e => setAbout(e.target.value)} rows={5}
                    placeholder="Tell candidates what your organization does, who you serve, and what makes it different…"
                    className={`${inputCls} resize-y leading-relaxed`} />
                </Field>
              </>
            )}

            {section === 'identity' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Organization type">
                  <select value={orgType} onChange={e => setOrgType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="">Select…</option>
                    {['Startup','Scale-up','Enterprise','Agency','Studio','Non-profit','Government','Freelance / Solo'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="HQ location">
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. New York, NY" className={inputCls} />
                </Field>
                <Field label="Founded">
                  <input value={founded} onChange={e => setFounded(e.target.value)} placeholder="e.g. 2019" className={inputCls} />
                </Field>
                <Field label="Team size">
                  <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 11–50" className={inputCls} />
                </Field>
                <div className="col-span-2">
                  <Field label="Funding stage">
                    <select value={funding} onChange={e => setFunding(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      <option value="">Select…</option>
                      {['Bootstrapped','Pre-seed','Seed','Series A','Series B','Series C+','Profitable','Public','Government-funded'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {section === 'links' && (
              <>
                <p className="text-[11.5px] text-ink-3 leading-relaxed">These appear in your About tab and help candidates verify your org.</p>
                <Field label="Website">
                  <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputCls} type="url" />
                </Field>
                <Field label="LinkedIn">
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/…" className={inputCls} type="url" />
                </Field>
                <Field label="Twitter / X">
                  <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/…" className={inputCls} type="url" />
                </Field>
                <Field label="GitHub">
                  <input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/…" className={inputCls} type="url" />
                </Field>
                <Field label="Instagram">
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/…" className={inputCls} type="url" />
                </Field>
              </>
            )}

            {section === 'culture' && (
              <>
                <Field label="Perks & benefits" hint="Comma-separated">
                  <textarea value={perksStr} onChange={e => setPerksStr(e.target.value)} rows={3}
                    placeholder="Health cover, Learning budget, Equity, Remote-first, Flexible hours…"
                    className={`${inputCls} resize-y leading-relaxed`} />
                </Field>
                <Field label="Tech stack" hint="Comma-separated tools & languages">
                  <textarea value={techStackStr} onChange={e => setTechStackStr(e.target.value)} rows={2}
                    placeholder="React, TypeScript, Go, PostgreSQL, AWS…"
                    className={`${inputCls} resize-y leading-relaxed`} />
                </Field>
              </>
            )}

            {section === 'leadership' && (
              <>
                <p className="text-[11.5px] text-ink-3 leading-relaxed">Search for tiikme members and add them to your leadership team. Set their role in your org.</p>
                <LeaderSearch onSelect={addLeader} />
                {leaders.length === 0 && (
                  <p className="text-[12px] text-ink-3 text-center py-4">No leaders added yet. Search above to add someone.</p>
                )}
                <div className="space-y-2.5">
                  {leaders.map(l => (
                    <div key={l.id} className="bg-page border border-line rounded-[14px] p-3 flex items-center gap-3">
                      {l.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={l.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        : <span className="w-9 h-9 rounded-full bg-orange-soft text-orange text-[13px] font-bold flex items-center justify-center shrink-0">{l.name.charAt(0).toUpperCase()}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-ink leading-tight truncate">{l.name}</p>
                        <input
                          value={leaderRoles[l.id] ?? ''}
                          onChange={e => setLeaderRoles(prev => ({ ...prev, [l.id]: e.target.value }))}
                          placeholder="Role (e.g. Co-founder & CEO)"
                          className="mt-1 w-full bg-card border border-line rounded-[8px] px-2.5 py-1.5 text-[12px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all"
                        />
                      </div>
                      <button onClick={() => removeLeader(l.id)} className="text-[11px] text-ink-3 hover:text-orange transition-colors shrink-0 ml-1">Remove</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-line shrink-0 flex items-center gap-2">
            <button onClick={onClose} className="text-[13px] font-semibold text-ink-2 bg-page border border-line rounded-[12px] py-2.5 px-4 hover:opacity-90 transition-opacity">
              Cancel
            </button>
            <div className="flex-1" />
            {section !== 'logo' && (
              <button onClick={submit} disabled={saving}
                className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-50 transition-opacity">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const inputCls = 'w-full bg-card border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2">{label}</span>
      {hint && <span className="text-[10px] text-ink-3 ml-1.5 font-normal normal-case">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
