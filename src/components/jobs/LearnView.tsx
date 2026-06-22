'use client'

import { useEffect, useRef, useState } from 'react'
import { listLearnItems, type LearnItem, type LearnKind } from '@/lib/learn'
import { toast } from '@/components/profile/ui/Toast'
import LevelUpPostForm from '@/components/jobs/LevelUpPostForm'
import { listMyOrgs } from '@/lib/vouches'
import type { LearnFilters } from '@/components/jobs/JobsShell'

const KIND_META: Record<LearnKind, { label: string; icon: string; cta: string }> = {
  course:      { label: 'Course',      icon: '📘', cta: 'Enrol' },
  certificate: { label: 'Certificate', icon: '🎖️', cta: 'Get certified' },
  hackathon:   { label: 'Hackathon',   icon: '⚡', cta: 'Join' },
}

const TABS: { id: LearnKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'course', label: 'Courses' },
  { id: 'certificate', label: 'Certificates' },
  { id: 'hackathon', label: 'Hackathons' },
]

interface ViewProps {
  controlledQ?: string
  onControlledQChange?: (v: string) => void
  filters?: LearnFilters
}

export default function LearnView({ controlledQ, onControlledQChange, filters }: ViewProps = {}) {
  const [tab, setTab] = useState<LearnKind | 'all'>('all')
  const [localQ, setLocalQ] = useState('')
  const q = controlledQ ?? localQ
  const setQ = onControlledQChange ?? setLocalQ
  const isControlled = controlledQ !== undefined
  const [items, setItems] = useState<LearnItem[]>([])
  const [sel, setSel] = useState<LearnItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [postOpen, setPostOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [canPost, setCanPost] = useState(false)
  const [enrollItem, setEnrollItem] = useState<LearnItem | null>(null)

  const load = () => listLearnItems().then(d => { setItems(d); setSel(prev => prev ?? d[0] ?? null); setLoading(false) })
  useEffect(() => { setLoading(true); load() }, [])
  // Only org members may post Level Up content.
  useEffect(() => { listMyOrgs().then(orgs => setCanPost(orgs.length > 0)).catch(() => setCanPost(false)) }, [])

  const ql = q.trim().toLowerCase()
  const matchesFilters = (i: LearnItem): boolean => {
    if (!filters) return true
    const d = i.details ?? {}
    if (filters.cost === 'Free' && !i.is_free) return false
    if (filters.cost === 'Paid' && i.is_free) return false
    if (filters.emi && !d.emi_available) return false
    if (filters.mode !== 'Any') {
      const m = (d.format || '').toLowerCase()
      const want = filters.mode.toLowerCase()
      if (!m.includes(want)) return false
    }
    if (filters.provider !== 'Any') {
      const p = (d.format || i.provider || '').toLowerCase()
      if (!p.includes(filters.provider.toLowerCase())) return false
    }
    return true
  }
  const shown = items
    .filter(i => tab === 'all' || i.kind === tab)
    .filter(i => !ql || i.title.toLowerCase().includes(ql) || i.provider.toLowerCase().includes(ql) || i.skills.some(s => s.toLowerCase().includes(ql)))
    .filter(matchesFilters)

  return (
    <div className="h-full flex flex-col">
      {/* search — hidden when shell controls it (both mobile and desktop) */}
      <div className={[isControlled ? 'hidden' : 'block', 'relative mb-3 shrink-0'].join(' ')}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-[14px]">⌕</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses, certs, hackathons, skills…"
          className="w-full bg-card border border-line rounded-[12px] pl-9 pr-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all" />
      </div>

      {/* filter pills + post (orgs only) */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={['px-3.5 py-1.5 text-[12px] font-semibold rounded-full whitespace-nowrap transition-colors shrink-0',
                tab === t.id ? 'bg-orange text-white' : 'bg-card text-ink-2 border border-line hover:bg-line'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
        {canPost && (
          <button onClick={() => setPostOpen(true)}
            title="Only organisations can post Level Up content"
            className="ml-auto shrink-0 text-[12px] font-semibold text-white bg-orange rounded-[10px] px-3 py-1.5 hover:bg-orange-2 transition-colors">
            + Post
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-[12px] text-ink-3 py-12 text-center">Loading…</p>
      ) : (
        <div className="flex-1 overflow-hidden flex gap-4">
          {/* list */}
          <div className="w-full lg:w-[42%] lg:max-w-[420px] overflow-y-auto space-y-3 pb-20 lg:pb-2">
            <p className="text-[11px] text-ink-3 px-1">{shown.length} {shown.length === 1 ? 'item' : 'items'}</p>
            {shown.map(it => <LearnRow key={it.id} it={it} selected={sel?.id === it.id} onSelect={() => { setSel(it); setMobileOpen(true) }} />)}
            {shown.length === 0 && <p className="text-[12px] text-ink-3 italic text-center py-8">Nothing here yet.</p>}
          </div>
          {/* detail */}
          <div className="hidden lg:block flex-1 bg-card rounded-[18px] shadow-card overflow-hidden">
            {sel ? <LearnDetail it={sel} onEnroll={setEnrollItem} /> : <div className="h-full flex items-center justify-center text-[13px] text-ink-3">Select to see details</div>}
          </div>
        </div>
      )}

      {postOpen && <LevelUpPostForm onClose={() => setPostOpen(false)} onPosted={load} />}

      {/* mobile detail — bottom sheet (desktop uses the side pane) */}
      {mobileOpen && sel && (
        <div className="lg:hidden fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-card rounded-t-[22px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-line shrink-0">
              <span className="text-[12px] font-semibold text-ink-2">Details</span>
              <button onClick={() => setMobileOpen(false)} className="text-ink-3 hover:text-orange text-[16px] px-1" aria-label="close">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto"><LearnDetail it={sel} onEnroll={setEnrollItem} /></div>
          </div>
        </div>
      )}

      {enrollItem && <EnrollModal item={enrollItem} onClose={() => setEnrollItem(null)} />}
    </div>
  )
}

function LearnRow({ it, selected, onSelect }: { it: LearnItem; selected: boolean; onSelect: () => void }) {
  const m = KIND_META[it.kind]
  const d = it.details ?? {}
  const emi = d.emi_available
  return (
    <button onClick={onSelect}
      className={['w-full text-left rounded-[14px] p-3.5 border transition-all',
        selected ? 'bg-orange/5 border-orange shadow-[0_2px_10px_rgba(255,92,40,.12)]' : 'bg-card border-transparent shadow-card hover:border-orange/30'].join(' ')}>
      {/* Header — logo + kicker + title */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white text-[15px] font-bold shrink-0 overflow-hidden" style={{ backgroundColor: it.provider_color }}>
          {it.org_logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={it.org_logo_url} alt={it.provider} className="w-full h-full object-cover" />
            : it.provider.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          {/* course name up top, kind·level chip beside it */}
          <div className="flex items-start gap-2">
            <p className="text-[13.5px] font-semibold text-ink leading-tight flex-1 min-w-0">{it.title}</p>
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-ink-3 bg-page px-1.5 py-0.5 rounded-full mt-0.5">
              {m.label}{it.level ? ` · ${it.level}` : ''}
            </span>
          </div>
          {/* organisation / provider below */}
          <p className="text-[11px] text-ink-3 truncate flex items-center gap-1 mt-1">
            By {it.provider}
            {d.verified_on_tiikme && <span className="text-[9px] font-bold text-green">✓</span>}
          </p>
        </div>
      </div>

      {/* Labeled rows */}
      <div className="mt-2.5 space-y-1 text-[11px]">
        {it.duration && <LRow icon="⏱" label="Duration" value={it.duration} />}
        {(it.is_free || it.cost) && <LRow icon="💳" label="Cost" value={it.is_free ? 'Free' : `${it.cost}${emi ? ' · EMI' : ''}`} />}
        {it.location && <LRow icon="📍" label="Where" value={it.location} />}
        {it.deadline && <LRow icon="⏳" label="Deadline" value={new Date(it.deadline).toLocaleDateString()} />}
        {it.prize && <LRow icon="🏆" label="Prize" value={it.prize} />}
      </div>

      {/* Pills */}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {it.is_free && <span className="text-[9px] font-bold text-green bg-green/10 px-1.5 py-0.5 rounded-full">Free</span>}
        {emi && <span className="text-[9px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">EMI</span>}
        {d.verified_on_tiikme && <span className="text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full">Lands on Flex</span>}
        {it.skills.slice(0, 2).map(s => <span key={s} className="text-[9.5px] font-medium text-teal bg-teal/8 border border-teal/15 px-1.5 py-0.5 rounded-full">{s}</span>)}
      </div>
    </button>
  )
}

function LRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-2">
      <span className="text-ink-3 shrink-0 w-[14px] text-center">{icon}</span>
      <span className="text-ink-3 shrink-0 w-[62px]">{label}</span>
      <span className="flex-1 min-w-0 truncate text-ink font-medium">{value}</span>
    </div>
  )
}

function LearnDetail({ it, onEnroll }: { it: LearnItem; onEnroll: (i: LearnItem) => void }) {
  const m = KIND_META[it.kind]
  const d = it.details ?? {}
  // Kicker = small uppercase line above the title (kind · level · duration) so the
  // category label is informative but doesn't crowd the hero like a tiny pill.
  const kicker = [m.label.toUpperCase(), it.level?.toUpperCase(), it.duration?.toUpperCase()].filter(Boolean).join(' · ')

  return (
    <div className="h-full flex flex-col">
      {/* HERO */}
      <div className="px-5 lg:px-6 pt-6 shrink-0">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-[16px] flex items-center justify-center text-white text-[24px] font-bold shrink-0 overflow-hidden" style={{ backgroundColor: it.provider_color }}>
            {it.org_logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={it.org_logo_url} alt={it.provider} className="w-full h-full object-cover" />
              : it.provider.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">{kicker}</p>
            <h2 className="text-[20px] lg:text-[22px] font-bold text-ink leading-tight mt-1.5">{it.title}</h2>
            <p className="text-[12.5px] text-ink-2 mt-1 flex items-center gap-1.5">
              By {it.provider}
              {d.verified_on_tiikme && <span className="text-[10px] font-semibold text-green bg-green/10 px-2 py-0.5 rounded-full">✓ Verified on tiikme</span>}
            </p>
          </div>
        </div>

        {/* META BAR — quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {it.duration && <Tile l="Duration" v={it.duration} />}
          {d.format && <Tile l="Format" v={d.format} />}
          {it.level && <Tile l="Level" v={it.level} />}
          {it.cost && <Tile l="Cost" v={it.cost + (d.emi_available ? ' · EMI' : '')} />}
          {d.weekly_hours && <Tile l="Effort" v={d.weekly_hours} />}
          {d.schedule && <Tile l="Schedule" v={d.schedule} />}
          {d.language && <Tile l="Language" v={d.language} />}
          {it.location && <Tile l="Where" v={it.location} />}
          {it.deadline && <Tile l="Deadline" v={new Date(it.deadline).toLocaleDateString()} />}
          {it.prize && <Tile l="Prize" v={it.prize} />}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-5 space-y-5">
        {(d.about || it.summary) && (
          <Section title={`About this ${m.label.toLowerCase()}`}>
            <p className="text-[13.5px] text-ink-2 leading-relaxed">{d.about || it.summary}</p>
          </Section>
        )}

        {d.who_for && d.who_for.length > 0 && (
          <Section title="Who this is for">
            <BulletList items={d.who_for} />
          </Section>
        )}

        {d.who_can_apply && (
          <Section title="Who can apply">
            <p className="text-[13px] text-ink-2 leading-relaxed">{d.who_can_apply}</p>
          </Section>
        )}

        {d.outcomes && d.outcomes.length > 0 && (
          <Section title="What you'll be able to do">
            <BulletList items={d.outcomes} check />
          </Section>
        )}

        {it.skills.length > 0 && (
          <Section title={it.kind === 'hackathon' ? 'Good if you know' : 'Skills you’ll gain'}>
            <div className="flex flex-wrap gap-1.5">
              {it.skills.map(s => <span key={s} className="text-[11.5px] font-medium text-teal bg-teal/8 border border-teal/15 px-2.5 py-1 rounded-full">{s}</span>)}
            </div>
          </Section>
        )}

        {d.live_projects && d.live_projects.length > 0 && (
          <Section title="Live projects you’ll build" sub="Projects land on your Flex as proof — recruiters can see them on apply.">
            <div className="space-y-2.5">
              {d.live_projects.map((p, i) => (
                <div key={i} className="bg-page border border-line rounded-[12px] p-3.5">
                  <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange/12 text-orange text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {p.title}
                  </p>
                  <p className="text-[12.5px] text-ink-2 leading-relaxed mt-1.5 pl-6.5" style={{ paddingLeft: 26 }}>{p.summary}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {d.syllabus && d.syllabus.length > 0 && (
          <Section title="Syllabus" sub="What you’ll cover, week by week.">
            <div className="space-y-2">
              {d.syllabus.map((mod, i) => (
                <div key={i} className="border border-line rounded-[12px] p-3.5">
                  <p className="text-[13px] font-semibold text-ink">{mod.title}</p>
                  {mod.topics?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {mod.topics.map((t, j) => (
                        <li key={j} className="text-[12.5px] text-ink-2 flex items-start gap-2"><span className="text-orange mt-0.5">›</span><span>{t}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {(d.format || d.weekly_hours || d.schedule || d.language) && (
          <Section title="Format & schedule">
            <Detail rows={[
              d.format ? ['Format', d.format] : undefined,
              d.weekly_hours ? ['Time commitment', d.weekly_hours] : undefined,
              d.schedule ? ['Schedule', d.schedule] : undefined,
              d.language ? ['Language', d.language] : undefined,
            ]} />
          </Section>
        )}

        {(it.cost || d.emi_available || d.scholarships || d.refund_policy) && (
          <Section title="Payment & options">
            <Detail rows={[
              it.cost ? ['Cost', it.is_free ? 'Free' : it.cost] : undefined,
              d.emi_available ? ['EMI', d.emi_band || 'Available'] : undefined,
              d.scholarships ? ['Scholarships', d.scholarships] : undefined,
              d.refund_policy ? ['Refund policy', d.refund_policy] : undefined,
            ]} />
          </Section>
        )}

        {d.prerequisites && d.prerequisites.length > 0 && (
          <Section title="Prerequisites">
            <BulletList items={d.prerequisites} />
          </Section>
        )}

        {d.instructors && d.instructors.length > 0 && (
          <Section title="Instructors">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {d.instructors.map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-page border border-line rounded-[12px] p-3">
                  <div className="w-9 h-9 rounded-full bg-orange/15 text-orange text-[12px] font-bold flex items-center justify-center shrink-0">{ins.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-ink">{ins.name}</p>
                    <p className="text-[11px] text-orange">{ins.title}</p>
                    {ins.bio && <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">{ins.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(d.certificate || d.placement_help) && (
          <Section title="Certificate & next steps">
            {d.certificate && (
              <div className="bg-orange/8 border border-orange/20 rounded-[12px] p-3.5 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange">✓ Lands on your Flex</p>
                <p className="text-[12.5px] text-ink mt-1 leading-relaxed">{d.certificate}</p>
              </div>
            )}
            {d.placement_help && (
              <p className="text-[12.5px] text-ink-2 leading-relaxed"><span className="font-semibold text-ink">Placement help · </span>{d.placement_help}</p>
            )}
          </Section>
        )}

        {d.faqs && d.faqs.length > 0 && (
          <Section title="FAQs">
            <div className="space-y-2">
              {d.faqs.map((f, i) => (
                <details key={i} className="bg-page border border-line rounded-[12px] px-3.5 py-2.5 group">
                  <summary className="text-[12.5px] font-semibold text-ink cursor-pointer flex items-center justify-between gap-2 list-none">
                    <span>{f.q}</span>
                    <span className="text-ink-3 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="text-[12.5px] text-ink-2 leading-relaxed mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* STICKY CTA */}
      <div className="px-5 lg:px-6 py-3.5 border-t border-line shrink-0 bg-card">
        <button onClick={() => onEnroll(it)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-orange to-orange-2 text-white text-[14px] font-semibold py-3 rounded-[14px] hover:opacity-95 transition-opacity shadow-[0_4px_14px_-4px_rgba(255,92,40,.5)]">
          {m.cta}
          {it.url && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>}
        </button>
        {it.url && (
          <p className="text-[10.5px] text-ink-3 text-center mt-2">You complete it on {it.provider} · verified credentials land back on tiikme.</p>
        )}
      </div>
    </div>
  )
}

function Tile({ l, v }: { l: string; v: string }) {
  return <div className="bg-page rounded-[10px] px-3 py-2.5"><p className="text-[10px] text-ink-3 leading-none">{l}</p><p className="text-[13px] font-semibold text-ink leading-snug mt-1">{v}</p></div>
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5">
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
        {sub && <p className="text-[11px] text-ink-3 mt-0.5">{sub}</p>}
      </div>
      {children}
    </section>
  )
}

function BulletList({ items, check }: { items: string[]; check?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="text-[12.5px] text-ink-2 flex items-start gap-2 leading-relaxed">
          <span className={check ? 'text-green mt-0.5 shrink-0' : 'text-orange mt-0.5 shrink-0'}>{check ? '✓' : '•'}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Detail({ rows }: { rows: ([string, string] | false | undefined | null | 0)[] }) {
  const valid = rows.filter(Boolean) as [string, string][]
  return (
    <div className="bg-page border border-line rounded-[12px] divide-y divide-line">
      {valid.map(([k, v]) => (
        <div key={k} className="px-3.5 py-2.5 flex items-baseline justify-between gap-3">
          <span className="text-[12px] text-ink-3 shrink-0">{k}</span>
          <span className="text-[12.5px] font-medium text-ink text-right">{v}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Enroll / Apply modal ─────────────────────────────────────────── */
function EnrollModal({ item, onClose }: { item: LearnItem; onClose: () => void }) {
  const m = KIND_META[item.kind]
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [attachFlex, setAttachFlex] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [working, setWorking]     = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const hasExternalUrl = !!item.url

  const handleSubmit = async () => {
    if (!email.trim()) return
    setWorking(true)
    await new Promise(r => setTimeout(r, 600))
    setWorking(false)
    setSubmitted(true)
    if (hasExternalUrl) {
      window.open(item.url!, '_blank', 'noopener')
    }
  }

  if (submitted) return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-[22px] shadow-[0_24px_80px_-12px_rgba(0,0,0,.4)] w-full max-w-[420px] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green/12 border border-green/25 flex items-center justify-center text-[26px] mx-auto mb-4">✓</div>
        <h3 className="text-[18px] font-bold text-ink">You&apos;re in!</h3>
        <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
          {hasExternalUrl
            ? `We've opened ${item.provider} in a new tab. Your Flex${attachFlex ? ' has been attached to your application' : ''}.`
            : `Your interest has been recorded. The organiser will reach out to ${email}.`}
        </p>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-[12px] bg-orange text-white text-[14px] font-semibold hover:opacity-90 transition-opacity">Done</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
      <div ref={overlayRef} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-[22px] shadow-[0_24px_80px_-12px_rgba(0,0,0,.4)] w-full max-w-[460px] overflow-hidden">
        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white text-[15px] font-bold shrink-0" style={{ backgroundColor: item.provider_color }}>
            {item.provider.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-ink leading-snug truncate">{item.title}</p>
            <p className="text-[11px] text-ink-3">By {item.provider}</p>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink text-[20px] leading-none shrink-0 px-1">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-1.5">Email <span className="text-orange">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-page border border-line rounded-[10px] px-3 py-2 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/50" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-1.5">Mobile <span className="text-ink-4">(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-page border border-line rounded-[10px] px-3 py-2 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/50" />
          </div>

          {/* Flex attach */}
          <button onClick={() => setAttachFlex(v => !v)}
            className={`w-full flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-colors text-left ${
              attachFlex ? 'bg-orange/6 border-orange/25' : 'bg-page border-line'
            }`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
              attachFlex ? 'bg-orange border-orange' : 'border-line'
            }`}>
              {attachFlex && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">Attach my Flex</p>
              <p className="text-[11px] text-ink-3">Share your verified profile with the organiser</p>
            </div>
          </button>

          {/* External URL note */}
          {hasExternalUrl && (
            <div className="bg-page border border-line rounded-[10px] px-3.5 py-2.5 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <p className="text-[11.5px] text-ink-2">You&apos;ll be redirected to <span className="font-semibold text-ink">{item.provider}</span> to complete {item.kind === 'hackathon' ? 'registration' : 'enrolment'}</p>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 pb-5">
          <button onClick={handleSubmit} disabled={!email.trim() || working}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-orange to-orange-2 text-white text-[14px] font-semibold py-3 rounded-[14px] hover:opacity-95 disabled:opacity-50 transition-all shadow-[0_4px_14px_-4px_rgba(255,92,40,.5)]">
            {working ? 'Submitting…' : hasExternalUrl ? `${m.cta} on ${item.provider} ↗` : 'Submit interest'}
          </button>
        </div>
      </div>
    </div>
  )
}
