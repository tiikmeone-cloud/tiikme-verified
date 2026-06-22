'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  listOrgApplications, advanceStage, getOrgIdBySlug,
  relativeTime, STAGE_LABEL, STAGE_TINT,
  type OrgApplication, type Stage,
} from '@/lib/applications'
import { toast } from '@/components/profile/ui/Toast'
import LiveCandidateDrawer from '@/components/applications/LiveCandidateDrawer'
import CompareCandidatesModal from '@/components/applications/CompareCandidatesModal'

interface Props {
  orgSlug: string
  orgName: string
  defaultJobId?: string
}

type AtsTab = 'new' | 'reviewed' | 'shortlisted'

const TAB_STAGES: Record<AtsTab, Stage[]> = {
  new:         ['applied'],
  reviewed:    ['screening'],
  shortlisted: ['shortlisted', 'shortlisted_with_consent', 'interview', 'offer', 'hired'],
}

const TAB_META: { id: AtsTab; label: string; badgeColor: string }[] = [
  { id: 'new',         label: 'New',         badgeColor: 'bg-orange/10 text-orange border border-orange/20' },
  { id: 'reviewed',    label: 'Reviewed',    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100' },
  { id: 'shortlisted', label: 'Shortlisted', badgeColor: 'bg-purple/10 text-purple border border-purple/20' },
]

// 9-column grid: ✓ | DP | Name | Current Role | Location | Exp | Skills | Match | Applied
// NOTE: keep as literal string — Tailwind JIT cannot scan template-literal class names
const GRID_HEADER = 'hidden md:grid md:grid-cols-[24px_38px_minmax(0,155px)_1fr_96px_52px_72px_52px_72px] md:gap-x-3'
const GRID_ROW    = 'flex md:grid md:grid-cols-[24px_38px_minmax(0,155px)_1fr_96px_52px_72px_52px_72px] md:gap-x-3'

export default function OrgTalentLifecycle({ orgSlug, orgName, defaultJobId }: Props) {
  const [apps, setApps]                   = useState<OrgApplication[]>([])
  const [loading, setLoading]             = useState(true)
  const [orgId, setOrgId]                 = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(defaultJobId ?? null)
  // posted/expiry now come from RPC — derived from jobApps below
  const [atsTab, setAtsTab]               = useState<AtsTab>('new')
  const [q, setQ]                         = useState('')
  const [searchOpen, setSearchOpen]       = useState(false)
  const [filterOpen, setFilterOpen]       = useState(false)
  const [activeFilter, setActiveFilter]   = useState<string | null>(null)
  const [filterMinScore, setFilterMinScore] = useState(0)
  const [filterKnockout, setFilterKnockout] = useState(false)
  const [filterLoc, setFilterLoc]           = useState('')
  const [filterExp, setFilterExp]           = useState<'any'|'0-2'|'2-5'|'5-10'|'10+'>('any')
  const [sortBy, setSortBy]               = useState<'match'|'applied'|'name'|'exp'>('match')
  const [sortDir, setSortDir]             = useState<'desc'|'asc'>('desc')
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [compareOpen, setCompareOpen]     = useState(false)
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const [bulkWorking, setBulkWorking]     = useState(false)
  const [openApp, setOpenApp]             = useState<OrgApplication | null>(null)
  const router = useRouter()

  /* ── load all applications for this org ── */
  const refresh = async () => {
    setLoading(true)
    const id = orgId ?? await getOrgIdBySlug(orgSlug)
    if (!id) { setApps([]); setLoading(false); return }
    setOrgId(id)
    setApps(await listOrgApplications(id))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [orgSlug]) // eslint-disable-line react-hooks/exhaustive-deps


  /* ── unique jobs extracted from applications ── */
  const jobs = useMemo(() => {
    const seen = new Set<string>()
    return apps
      .filter(a => { if (seen.has(a.job_id)) return false; seen.add(a.job_id); return true })
      .map(a => ({ id: a.job_id, title: a.job_title }))
  }, [apps])

  /* ── auto-select first job if none selected ── */
  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) setSelectedJobId(jobs[0].id)
  }, [jobs, selectedJobId])

  /* ── current job + its applications ── */
  const currentJob   = jobs.find(j => j.id === selectedJobId) ?? jobs[0]
  const jobApps      = useMemo(() => apps.filter(a => a.job_id === (currentJob?.id ?? '')), [apps, currentJob])
  const shortlistedN  = jobApps.filter(a =>
    ['shortlisted', 'shortlisted_with_consent', 'interview', 'offer'].includes(a.stage)
  ).length
  const jobPostedAt   = jobApps[0]?.job_posted_at ?? null
  const jobExpiresAt  = jobApps[0]?.job_expires_at ?? null
  const jobIsOpen     = jobApps[0]?.job_is_open ?? true

  /* ── job must-have skills for the Skills dropdown ── */
  const jobMustHave = useMemo(() => jobApps[0]?.job_must_have_skills ?? [], [jobApps])

  /* ── unique cities for location filter ── */
  const uniqueLocs = useMemo(() =>
    [...new Set(jobApps.map(a => a.user_city).filter(Boolean) as string[])].sort()
  , [jobApps])

  /* ── column sort toggle ── */
  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  /* ── visible list after tab + search + filters + sort ── */
  const visible = useMemo(() => {
    const ql  = q.trim().toLowerCase()
    const dir = sortDir === 'desc' ? -1 : 1
    return jobApps
      .filter(a => TAB_STAGES[atsTab].includes(a.stage))
      .filter(a => {
        if (!ql) return true
        const hay = `${a.user_full_name ?? ''} ${a.user_username} ${a.user_headline ?? ''} ${a.user_city ?? ''}`.toLowerCase()
        return hay.includes(ql)
      })
      .filter(a => !activeFilter || (a.user_skills ?? []).map(s => s.toLowerCase()).includes(activeFilter.toLowerCase()))
      .filter(a => filterMinScore === 0 || (a.ai_score ?? 0) >= filterMinScore)
      .filter(a => !filterKnockout || a.knockout_passed === true)
      .filter(a => !filterLoc || (a.user_city ?? '').toLowerCase() === filterLoc.toLowerCase())
      .filter(a => {
        if (filterExp === 'any') return true
        const yrs = Number((a.screening_answers as Record<string,unknown> | null)?.years ?? -1)
        if (filterExp === '0-2')  return yrs >= 0 && yrs <= 2
        if (filterExp === '2-5')  return yrs > 2  && yrs <= 5
        if (filterExp === '5-10') return yrs > 5  && yrs <= 10
        if (filterExp === '10+')  return yrs > 10
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'match')   return dir * ((b.ai_score ?? 0) - (a.ai_score ?? 0))
        if (sortBy === 'applied') return dir * (new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
        if (sortBy === 'name')    return dir * (a.user_full_name ?? a.user_username).localeCompare(b.user_full_name ?? b.user_username)
        if (sortBy === 'exp') {
          const aY = Number((a.screening_answers as Record<string,unknown> | null)?.years ?? 0)
          const bY = Number((b.screening_answers as Record<string,unknown> | null)?.years ?? 0)
          return dir * (bY - aY)
        }
        return 0
      })
  }, [jobApps, atsTab, q, activeFilter, filterMinScore, filterKnockout, filterLoc, filterExp, sortBy, sortDir])

  /* ── selection ── */
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const clearSel = () => { setSelected(new Set()); setRejectConfirm(false) }
  const allVisibleSelected = visible.length > 0 && visible.every(a => selected.has(a.app_id))
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected(prev => { const next = new Set(prev); visible.forEach(a => next.delete(a.app_id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); visible.forEach(a => next.add(a.app_id)); return next })
    }
  }
  const selectBelowScore = (threshold: number) => {
    const ids = visible.filter(a => (a.ai_score ?? 0) < threshold).map(a => a.app_id)
    if (ids.length === 0) { toast(`No candidates below ${threshold}% match`); return }
    setSelected(new Set(ids))
    toast(`${ids.length} candidate${ids.length !== 1 ? 's' : ''} selected`)
  }
  const selectedApps = useMemo(() => apps.filter(a => selected.has(a.app_id)), [apps, selected])

  /* ── bulk reject ── */
  const bulkReject = async () => {
    setBulkWorking(true)
    await Promise.all(selectedApps.map(a => advanceStage(a.app_id, 'rejected')))
    toast(`${selectedApps.length} candidate${selectedApps.length !== 1 ? 's' : ''} passed`)
    clearSel()
    setBulkWorking(false)
    await refresh()
  }

  /* ── Twin: navigate to Twin home with hiring context pre-filled ── */
  const askTwin = (candidates: OrgApplication[]) => {
    const jobTitle = currentJob?.title ?? 'this role'
    const list = candidates.map(c => {
      const mustHave = c.job_must_have_skills ?? []
      const matched  = mustHave.filter(s => (c.user_skills ?? []).map(x => x.toLowerCase()).includes(s.toLowerCase())).length
      const score    = c.ai_score != null ? ` — ${Math.round(c.ai_score)}% match` : ''
      const skills   = mustHave.length > 0 ? ` (${matched}/${mustHave.length} skills)` : ''
      return `${c.user_full_name ?? c.user_username}${score}${skills}`
    }).join('; ')
    const q = `I'm reviewing candidates for "${jobTitle}". Help me pick the best from: ${list}`
    router.push('/?q=' + encodeURIComponent(q))
  }

  /* ── email shortlist to org owner ── */
  const emailShortlist = (candidates: OrgApplication[]) => {
    const jobTitle = currentJob?.title ?? 'this role'
    const subject = encodeURIComponent(`Candidate shortlist — ${jobTitle} (${candidates.length} selected)`)
    const lines = candidates.map((c, i) => {
      const mustHave = c.job_must_have_skills ?? []
      const matched = mustHave.filter(s => (c.user_skills ?? []).map(x => x.toLowerCase()).includes(s.toLowerCase()))
      return [
        `${i + 1}. ${c.user_full_name ?? c.user_username}`,
        `   Role: ${c.user_headline ?? '—'}`,
        `   Location: ${c.user_city ?? '—'}`,
        mustHave.length > 0 ? `   Skills: ${matched.length}/${mustHave.length} required matched` : `   Skills: ${(c.user_skills ?? []).slice(0, 5).join(', ') || '—'}`,
        `   Flex: https://tiikme.com/flex/${c.user_username}`,
      ].join('\n')
    })
    const body = encodeURIComponent(
      `Hi,\n\nHere's the shortlist for ${jobTitle}:\n\n${lines.join('\n\n')}\n\n— Sent from tiikme ATS`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  /* ── stage advance ── */
  const move = async (app: OrgApplication, next: Stage) => {
    if (await advanceStage(app.app_id, next)) {
      toast(`${app.user_full_name ?? app.user_username} → ${STAGE_LABEL[next]}`)
      await refresh()
    }
  }

  if (loading) return <p className="text-[12px] text-ink-3 py-12 text-center">Loading applicants…</p>

  if (apps.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[14px] font-semibold text-ink">No applicants yet</p>
        <p className="text-[12px] text-ink-3 mt-1">Once candidates apply to your roles, they'll appear here.</p>
      </div>
    )
  }

  const tabCount = (t: AtsTab) => jobApps.filter(a => TAB_STAGES[t].includes(a.stage)).length

  return (
    <div className="space-y-4">

      {/* ── Job selector (if multiple roles) ── */}
      {jobs.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {jobs.map(j => (
            <button key={j.id} onClick={() => { setSelectedJobId(j.id); clearSel(); setActiveFilter(null) }}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-[9px] border transition-colors whitespace-nowrap ${
                j.id === currentJob?.id
                  ? 'bg-ink text-white border-ink'
                  : 'bg-card border-line text-ink-3 hover:text-ink hover:border-orange/30'
              }`}>
              {j.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Role header ── */}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">{orgName}</p>
        <h2 className="text-[19px] font-bold text-ink mt-0.5 leading-tight">{currentJob?.title ?? '—'}</h2>
        <p className="text-[11px] text-ink-3 mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span><span className="font-semibold text-ink">{jobApps.length}</span> applied</span>
          <span className="text-ink-4">·</span>
          <span><span className="font-semibold text-purple">{shortlistedN}</span> shortlisted</span>
          {jobPostedAt && <><span className="text-ink-4">·</span><span>Posted {relativeTime(jobPostedAt)}</span></>}
          {jobExpiresAt && (() => {
            const daysLeft = Math.ceil((new Date(jobExpiresAt).getTime() - Date.now()) / 86_400_000)
            return daysLeft > 0
              ? <><span className="text-ink-4">·</span><span className="text-orange font-semibold">{daysLeft}d left</span></>
              : <><span className="text-ink-4">·</span><span className="text-ink-3">Closed {relativeTime(jobExpiresAt)}</span></>
          })()}
        </p>
      </div>

      {/* ── Compact tabs + controls row ── */}
      {(() => {
        const activeCount = [filterKnockout, !!activeFilter, filterMinScore > 0, filterExp !== 'any', !!filterLoc].filter(Boolean).length
        const clearAll = () => { setFilterKnockout(false); setActiveFilter(null); setFilterMinScore(0); setFilterExp('any'); setFilterLoc('') }
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Stage tabs — small pills, scrollable on mobile */}
              <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
                <div className="flex gap-1 bg-page rounded-[10px] p-0.5 border border-line w-fit min-w-full">
                  {TAB_META.map(t => {
                    const n = tabCount(t.id)
                    return (
                      <button key={t.id} onClick={() => setAtsTab(t.id)}
                        className={['flex-1 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap',
                          atsTab === t.id ? 'bg-card shadow-sm text-ink border border-line' : 'text-ink-3 hover:text-ink-2'
                        ].join(' ')}>
                        {t.label}
                        {n > 0 && (
                          <span className={`text-[9px] font-bold px-1 py-px rounded-full ${atsTab === t.id ? t.badgeColor : 'bg-line/60 text-ink-3'}`}>
                            {n}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Filter icon */}
                <button
                  onClick={() => setFilterOpen(v => !v)}
                  className={`relative w-7 h-7 rounded-[8px] border flex items-center justify-center transition-colors ${
                    filterOpen || activeCount > 0 ? 'bg-ink text-white border-ink' : 'bg-card text-ink-2 border-line hover:border-orange/30'
                  }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange text-white text-[8px] font-black flex items-center justify-center leading-none">{activeCount}</span>
                  )}
                </button>

                {/* Search icon / input */}
                {searchOpen ? (
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                      placeholder="Search…"
                      className="bg-card border border-line rounded-[8px] pl-7 pr-6 py-1 text-[12px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 w-[140px]" />
                    <button onClick={() => { setQ(''); setSearchOpen(false) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink text-[14px] leading-none">×</button>
                  </div>
                ) : (
                  <button onClick={() => setSearchOpen(true)}
                    className="w-7 h-7 rounded-[8px] bg-card border border-line text-ink-2 hover:text-ink hover:border-orange/30 flex items-center justify-center transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                )}

                {/* Ask Tiik */}
                <button
                  onClick={() => askTwin(selected.size > 0 ? selectedApps : (visible.length > 0 ? visible : jobApps))}
                  className="h-7 text-[11px] font-semibold text-purple bg-purple/8 border border-purple/20 rounded-[8px] px-2.5 hover:bg-purple/12 transition-colors inline-flex items-center gap-1 whitespace-nowrap">
                  ✦ Tiik
                </button>
              </div>
            </div>

            {activeCount > 0 && (
              <button onClick={clearAll} className="text-[11px] text-ink-3 hover:text-orange transition-colors">Clear filters</button>
            )}

            {/* Filter panel — collapsible */}
            {filterOpen && (
              <div className="bg-card border border-line rounded-[14px] p-4 grid grid-cols-2 gap-4">

                {/* Match score slider */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em]">Min match score</p>
                    <span className={`text-[12px] font-bold ${filterMinScore > 0 ? 'text-orange' : 'text-ink-3'}`}>
                      {filterMinScore > 0 ? `${filterMinScore}%+` : 'Any'}
                    </span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={filterMinScore}
                    onChange={e => setFilterMinScore(Number(e.target.value))}
                    className="w-full accent-orange h-1.5 rounded-full cursor-pointer" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-ink-3">0%</span>
                    <span className="text-[10px] text-ink-3">50%</span>
                    <span className="text-[10px] text-ink-3">100%</span>
                  </div>
                </div>

                {/* Must-haves toggle */}
                <button onClick={() => setFilterKnockout(v => !v)}
                  className={`col-span-2 text-left text-[12px] font-semibold px-3 py-2.5 rounded-[10px] border transition-colors flex items-center justify-between ${
                    filterKnockout ? 'bg-green/8 text-green border-green/25' : 'bg-page text-ink-2 border-line'}`}>
                  <span>Must-haves met only</span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-colors ${
                    filterKnockout ? 'bg-green border-green text-white' : 'border-line text-transparent'}`}>✓</span>
                </button>

                {/* Skills */}
                {jobMustHave.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-1.5">Required skill</p>
                    <select value={activeFilter ?? ''} onChange={e => setActiveFilter(e.target.value || null)}
                      className={`w-full text-[12px] font-medium bg-page border rounded-[9px] px-2.5 py-1.5 outline-none cursor-pointer ${activeFilter ? 'border-orange/40 text-ink' : 'border-line text-ink-2'}`}>
                      <option value="">All skills</option>
                      {jobMustHave.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-1.5">Experience</p>
                  <select value={filterExp} onChange={e => setFilterExp(e.target.value as typeof filterExp)}
                    className={`w-full text-[12px] font-medium bg-page border rounded-[9px] px-2.5 py-1.5 outline-none cursor-pointer ${filterExp !== 'any' ? 'border-orange/40 text-ink' : 'border-line text-ink-2'}`}>
                    <option value="any">Any</option>
                    <option value="0-2">0–2 yrs</option>
                    <option value="2-5">2–5 yrs</option>
                    <option value="5-10">5–10 yrs</option>
                    <option value="10+">10+ yrs</option>
                  </select>
                </div>

                {/* Location */}
                {uniqueLocs.length > 1 && (
                  <div>
                    <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-1.5">Location</p>
                    <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}
                      className={`w-full text-[12px] font-medium bg-page border rounded-[9px] px-2.5 py-1.5 outline-none cursor-pointer ${filterLoc ? 'border-orange/40 text-ink' : 'border-line text-ink-2'}`}>
                      <option value="">All cities</option>
                      {uniqueLocs.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

              </div>
            )}
          </div>
        )
      })()}


      {/* ── Candidate table ── */}
      {visible.length === 0 ? (
        <div className="text-center py-10 bg-card border border-line rounded-[14px]">
          <p className="text-[13px] font-semibold text-ink">
            {q || activeFilter ? 'No results — clear filters' : `No applicants in ${atsTab}`}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-[14px] overflow-hidden">
          {/* Header row */}
          <div className={`${GRID_HEADER} px-4 py-2.5 border-b border-line bg-page`}>
            <label className="flex items-center" title={allVisibleSelected ? 'Deselect all' : 'Select all'}>
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="accent-orange w-3.5 h-3.5 cursor-pointer" />
            </label>
            <span />
            {/* Sortable column headers */}
            {(['name','role','loc','exp','skills','match','applied'] as const).map(col => {
              const meta: Record<string, { label: string; sortKey?: typeof sortBy; align?: string }> = {
                name:    { label: 'Name',         sortKey: 'name' },
                role:    { label: 'Current Role' },
                loc:     { label: 'Location' },
                exp:     { label: 'Exp',          sortKey: 'exp' },
                skills:  { label: 'Skills' },
                match:   { label: 'Match',        sortKey: 'match', align: 'justify-end' },
                applied: { label: 'Applied',      sortKey: 'applied', align: 'justify-end' },
              }
              const { label, sortKey, align = '' } = meta[col]
              if (!sortKey) return (
                <span key={col} className={`text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3 flex items-center ${align}`}>{label}</span>
              )
              const active = sortBy === sortKey
              return (
                <button key={col} onClick={() => toggleSort(sortKey)}
                  className={`text-[9.5px] font-bold uppercase tracking-[0.1em] transition-colors flex items-center gap-1 ${align} ${active ? 'text-orange' : 'text-ink-3 hover:text-ink'}`}>
                  {label}
                  <span className={`text-[8px] leading-none flex flex-col gap-px ${active ? 'text-orange' : 'text-ink-3/50'}`}>
                    <span style={{ opacity: active && sortDir === 'asc' ? 1 : (active ? 0.35 : 0.6) }}>▲</span>
                    <span style={{ opacity: active && sortDir === 'desc' ? 1 : (active ? 0.35 : 0.6) }}>▼</span>
                  </span>
                </button>
              )
            })}
          </div>
          {/* Rows */}
          {visible.map((app, i) => (
            <CandidateRow
              key={app.app_id}
              app={app}
              selected={selected.has(app.app_id)}
              onToggleSelect={() => toggleSelect(app.app_id)}
              onOpen={() => setOpenApp(app)}
              isLast={i === visible.length - 1}
            />
          ))}
        </div>
      )}

      {/* ── Floating action bar: multi-select ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] bg-ink text-white rounded-[16px] shadow-[0_8px_40px_-6px_rgba(0,0,0,.6)] flex items-center gap-2 pl-4 pr-2 py-2 max-w-[calc(100vw-32px)]">
          {rejectConfirm ? (
            /* ── Confirm reject ── */
            <>
              <span className="text-[12px] font-semibold text-red-300">Pass {selected.size} candidate{selected.size !== 1 ? 's' : ''}?</span>
              <button onClick={() => setRejectConfirm(false)} className="text-[11px] text-white/60 hover:text-white px-2">Cancel</button>
              <button onClick={bulkReject} disabled={bulkWorking}
                className="text-[12px] font-semibold bg-red/80 text-white rounded-[10px] px-3.5 py-1.5 hover:bg-red disabled:opacity-50 transition-colors">
                {bulkWorking ? 'Passing…' : 'Yes, pass all'}
              </button>
            </>
          ) : (
            /* ── Normal bar ── */
            <>
              <span className="text-[12px] font-semibold text-white/70 shrink-0">{selected.size} selected</span>
              <button onClick={clearSel} className="text-[11px] text-white/50 hover:text-white/80 px-1 shrink-0">Clear</button>
              <button onClick={() => setRejectConfirm(true)}
                className="text-[12px] font-semibold text-red-300 bg-red/15 border border-red/30 rounded-[10px] px-3 py-1.5 hover:bg-red/25 transition-colors shrink-0">
                ✕ Pass ({selected.size})
              </button>
              <button onClick={() => askTwin(selectedApps)}
                className="text-[12px] font-semibold bg-purple/20 text-purple-200 border border-purple/30 rounded-[10px] px-3 py-1.5 hover:bg-purple/30 transition-colors shrink-0">
                ✦ Ask Tiik
              </button>
              {selected.size >= 2 && selected.size <= 4 && (
                <button onClick={() => setCompareOpen(true)}
                  className="text-[12px] font-semibold bg-orange text-white rounded-[10px] px-3 py-1.5 hover:bg-orange-2 transition-colors shrink-0">
                  Compare ({selected.size})
                </button>
              )}
              <button onClick={() => emailShortlist(selectedApps)}
                className="text-[12px] font-semibold bg-white/10 text-white/80 border border-white/20 rounded-[10px] px-3 py-1.5 hover:bg-white/15 transition-colors shrink-0">
                ✉ Share
              </button>
            </>
          )}
        </div>
      )}

      {compareOpen && selectedApps.length >= 2 && (
        <CompareCandidatesModal
          apps={selectedApps}
          onClose={() => setCompareOpen(false)}
          onOpenOne={a => { setCompareOpen(false); setOpenApp(a) }}
        />
      )}

      {openApp && (
        <LiveCandidateDrawer app={openApp} onClose={() => setOpenApp(null)} onMoved={refresh} />
      )}

    </div>
  )
}

/* ── Candidate row ── */
function CandidateRow({
  app, selected, onToggleSelect, onOpen, isLast,
}: {
  app: OrgApplication
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  isLast: boolean
}) {
  const [skillsOpen, setSkillsOpen] = useState(false)
  const name = app.user_full_name ?? app.user_username
  const expYears = (app.screening_answers as Record<string, unknown> | null)?.years
  const mustHave      = app.job_must_have_skills ?? []
  const skillsLower   = (app.user_skills ?? []).map(s => s.toLowerCase())
  const matchedCount  = mustHave.filter(s => skillsLower.includes(s.toLowerCase())).length
  const missingSkills = mustHave.filter(s => !skillsLower.includes(s.toLowerCase()))
  const allSkills     = app.user_skills ?? []

  return (
    <div
      onClick={onOpen}
      className={[
        'cursor-pointer transition-colors',
        !isLast ? 'border-b border-line' : '',
        selected ? 'bg-orange/3' : 'hover:bg-page/60',
        `${GRID_ROW} gap-3 px-4 py-3 items-center`,
      ].join(' ')}
    >
      {/* Checkbox */}
      <label onClick={e => e.stopPropagation()} className="flex items-center shrink-0">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} className="accent-orange w-3.5 h-3.5" />
      </label>

      {/* Avatar */}
      <div className="shrink-0">
        {app.user_avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={app.user_avatar} alt="" className="w-9 h-9 rounded-[10px] object-cover" />
          : <span className="w-9 h-9 rounded-[10px] bg-orange/10 text-orange flex items-center justify-center text-[13px] font-bold">
              {name.charAt(0).toUpperCase()}
            </span>}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1 md:flex-none">
        <p className="text-[13px] font-semibold text-ink truncate">{name}</p>
      </div>

      {/* Current Role */}
      <p className="hidden md:block text-[12.5px] text-ink-2 truncate">
        {app.user_headline ?? '—'}
      </p>

      {/* Location */}
      <p className="hidden md:block text-[12.5px] text-ink-2 truncate">
        {app.user_city ?? '—'}
      </p>

      {/* Experience */}
      <p className="hidden md:block text-[12px] text-ink-2 text-center">
        {expYears != null ? `${String(expYears)} yrs` : '—'}
      </p>

      {/* Skills match — click to expand */}
      <div className="hidden md:flex flex-col items-center gap-0.5 relative">
        {mustHave.length > 0 ? (
          <button
            onClick={e => { e.stopPropagation(); setSkillsOpen(v => !v) }}
            className={`text-[11.5px] font-bold leading-none hover:opacity-80 transition-opacity ${
              matchedCount === mustHave.length ? 'text-green'
              : matchedCount >= mustHave.length / 2 ? 'text-orange'
              : 'text-red/70'
            }`}>
            {matchedCount}/{mustHave.length}
          </button>
        ) : allSkills.length > 0 ? (
          <button
            onClick={e => { e.stopPropagation(); setSkillsOpen(v => !v) }}
            className="text-[11px] text-teal font-semibold hover:opacity-80">
            {allSkills.length}
          </button>
        ) : (
          <span className="text-[12px] text-ink-3">—</span>
        )}

        {/* Skills popover */}
        {skillsOpen && (
          <div
            onClick={e => e.stopPropagation()}
            className="fixed z-[200] bg-card border border-line rounded-[12px] shadow-[0_8px_30px_-6px_rgba(0,0,0,.18)] p-3 w-[200px]"
            style={{ top: 'var(--pop-y,auto)', left: 'var(--pop-x,auto)' }}
            ref={(el) => {
              if (!el) return
              const trigger = el.previousElementSibling as HTMLElement | null
              if (!trigger) return
              const r = trigger.getBoundingClientRect()
              el.style.setProperty('--pop-y', `${r.bottom + 6}px`)
              el.style.setProperty('--pop-x', `${r.left - 80}px`)
            }}>
            <p className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-2">All skills</p>
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
              {allSkills.map(s => {
                const isRequired = mustHave.map(m => m.toLowerCase()).includes(s.toLowerCase())
                const isMatched  = isRequired && skillsLower.includes(s.toLowerCase())
                return (
                  <span key={s} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isMatched  ? 'bg-green/8 text-green border border-green/20'
                    : isRequired ? 'bg-red/6 text-red/70 border border-red/15'
                    : 'bg-page text-ink-2 border border-line'
                  }`}>{s}</span>
                )
              })}
            </div>
            {mustHave.length > 0 && (
              <p className="text-[9.5px] text-ink-3 mt-2 pt-2 border-t border-line">{matchedCount}/{mustHave.length} required matched</p>
            )}
            <button onClick={() => setSkillsOpen(false)}
              className="absolute top-2 right-2 text-ink-3 hover:text-ink text-[13px] leading-none">×</button>
          </div>
        )}
      </div>

      {/* Match */}
      <div className="hidden md:flex justify-end shrink-0">
        {typeof app.ai_score === 'number' ? (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            app.ai_score >= 85 ? 'bg-green/10 text-green'
            : app.ai_score >= 70 ? 'bg-orange/10 text-orange'
            : 'bg-line/60 text-ink-3'}`}>
            {Math.round(app.ai_score)}%
          </span>
        ) : <span className="text-[11px] text-ink-3">—</span>}
      </div>

      {/* Applied date — last column */}
      <p className="hidden md:block text-[11px] text-ink-3 text-right whitespace-nowrap">
        {relativeTime(app.applied_at)}
      </p>
    </div>
  )
}

// Keep these exports so any stale imports elsewhere don't break
export { STAGE_LABEL, STAGE_TINT }
