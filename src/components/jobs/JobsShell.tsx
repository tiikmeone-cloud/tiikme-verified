'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { ToastHost, toast } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import JobRow from '@/components/jobs/JobRow'
import JobDetailContent from '@/components/jobs/JobDetailContent'
import JobDetailDrawer from '@/components/jobs/JobDetailDrawer'
import LearnView from '@/components/jobs/LearnView'
import OrgsBrowseView, { ORG_INDUSTRIES, type OrgIndustry } from '@/components/jobs/OrgsBrowseView'
import TalentPoolView from '@/components/applications/TalentPoolView'
import { getOpenings, type Opening, type JobType, type WorkMode } from '@/stubs/getJobs'
import { fetchOrgJobs } from '@/lib/orgJobs'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import { loadPreferences, setPreference, type UserPreferences, DEFAULT_PREFS } from '@/lib/userPreferences'
import { createClient } from '@/lib/supabase/client'

type Section = 'jobs' | 'orgs' | 'learn' | 'candidates'

const TYPES: (JobType | 'Any')[] = ['Any','Full-time','Part-time','Freelance','Contract','Internship','Gig']
const MODES: (WorkMode | 'Any')[] = ['Any','Remote','Hybrid','On-site']
const DATES = ['Any time','Past 24h','Past week','Past month']

const LEARN_DURATIONS = ['Any','<1 week','1–4 weeks','1–3 months','3+ months'] as const
const LEARN_COSTS    = ['Any','Free','Paid'] as const
const LEARN_MODES    = ['Any','Online','Offline','Hybrid'] as const
const LEARN_PROVIDERS= ['Any','University','Bootcamp','Self-paced','Cohort'] as const
const LEARN_SORTS    = ['Popular','Newest','Price low→high'] as const

export interface LearnFilters {
  duration: typeof LEARN_DURATIONS[number]
  cost: typeof LEARN_COSTS[number]
  emi: boolean
  mode: typeof LEARN_MODES[number]
  provider: typeof LEARN_PROVIDERS[number]
  sort: typeof LEARN_SORTS[number]
}

const DEFAULT_LEARN_FILTERS: LearnFilters = {
  duration: 'Any', cost: 'Any', emi: false, mode: 'Any', provider: 'Any', sort: 'Popular',
}

const NOTICE_LABEL: Record<NonNullable<UserPreferences['notice_period']>, string> = {
  immediate: 'Immediate', '15_days': '15 days', '30_days': '30 days', '60_days': '60 days', '90_days': '90 days',
}
const NOTICE_FROM_LABEL: Record<string, UserPreferences['notice_period']> = {
  'Any': null, 'Immediate': 'immediate', '15 days': '15_days', '30 days': '30_days', '60 days': '60_days', '90 days': '90_days',
}

export default function JobsShell() {
  const [jobs, setJobs] = useState<Opening[]>(getOpenings())
  const [section, setSection] = useState<Section>('jobs')
  const [isOrgAccount, setIsOrgAccount] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (!user) return
      supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.account_type === 'org') setIsOrgAccount(true) })
    })
    // Load real jobs; fall back to stubs when DB has none
    fetchOrgJobs().then(dbJobs => { if (dbJobs.length > 0) setJobs(dbJobs) })
  }, [])
  const [q, setQ] = useState('')
  const [loc, setLoc] = useState('')
  const [type, setType] = useState<JobType | 'Any'>('Any')
  const [mode, setMode] = useState<WorkMode | 'Any'>('Any')
  const [date, setDate] = useState('Any time')
  const [selected, setSelected] = useState<Opening | null>(null)
  useEffect(() => { if (jobs.length > 0 && !selected) setSelected(jobs[0]) }, [jobs])
  const [mobileOpen, setMobileOpen] = useState<Opening | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false)
  // Search state per section (orgs + learn views were owning their own; lift to shell for the mobile compact bar).
  const [orgsQ,       setOrgsQ]       = useState('')
  const [orgsIndustry, setOrgsIndustry] = useState<OrgIndustry>('All')
  const [orgsLoc,      setOrgsLoc]      = useState('')
  const [orgsVerified, setOrgsVerified] = useState(false)
  const [learnQ, setLearnQ] = useState('')
  const [learnFilters, setLearnFilters] = useState<LearnFilters>(DEFAULT_LEARN_FILTERS)

  // Read URL params from Twin "Open in Jobs" deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qParam = params.get('q')
    if (qParam) { setQ(qParam); setSection('jobs') }
    const typeParam = params.get('type')
    if (typeParam && TYPES.includes(typeParam as JobType)) setType(typeParam as JobType)
    const modeParam = params.get('mode')
    if (modeParam && MODES.includes(modeParam as WorkMode)) setMode(modeParam as WorkMode)
  }, [])

  // Sort + user preferences (formerly Settings → Job Preferences).
  const [sort, setSort] = useState<'recent' | 'best_match'>('recent')
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS)
  useEffect(() => { loadPreferences().then(setPrefs) }, [])
  const updatePref = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs(p => ({ ...p, [key]: value }))
    await setPreference(key, value)
  }
  const activeLearnFilterCount =
    (learnFilters.duration !== 'Any' ? 1 : 0) +
    (learnFilters.cost !== 'Any' ? 1 : 0) +
    (learnFilters.emi ? 1 : 0) +
    (learnFilters.mode !== 'Any' ? 1 : 0) +
    (learnFilters.provider !== 'Any' ? 1 : 0)


  const activeFilterCount =
    (loc ? 1 : 0) +
    (type !== 'Any' ? 1 : 0) +
    (mode !== 'Any' ? 1 : 0) +
    (date !== 'Any time' ? 1 : 0)

  const orgsFilterCount =
    (orgsIndustry !== 'All' ? 1 : 0) +
    (orgsLoc ? 1 : 0) +
    (orgsVerified ? 1 : 0)

  const filteredJobs = jobs.filter(j => {
    if (type !== 'Any' && j.type !== type) return false
    if (mode !== 'Any' && j.mode !== mode) return false
    if (loc && !j.location.toLowerCase().includes(loc.toLowerCase())) return false
    if (q && !(`${j.title} ${j.org} ${j.mustHaveSkills.join(' ')}`.toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })

  // Sort. 'best_match' uses a lightweight heuristic until embeddings come online —
  // overlap of must-have skills with the user's saved skills, then preferred work modes.
  const shown = (() => {
    if (sort === 'recent') return filteredJobs
    const langs = (prefs.preferred_work_modes ?? []).map(s => s.toLowerCase())
    return [...filteredJobs].sort((a, b) => {
      const aMode = langs.includes(a.mode.toLowerCase()) ? 1 : 0
      const bMode = langs.includes(b.mode.toLowerCase()) ? 1 : 0
      return bMode - aMode
    })
  })()

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="jobs" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 overflow-hidden flex flex-col relative">
          <InfiniteGridBackdrop />
          {/* ── Header ── */}
          <div className="px-4 lg:px-6 pt-4 pb-3 shrink-0 border-b border-line bg-page/95 backdrop-blur-md relative z-10">
            {/* Mobile compact bar: section title + search icon + filter icon — applies to every section */}
            {(() => {
              const ctx = section === 'jobs'
                ? { title: 'Jobs', value: q, set: setQ, ph: 'Title, skill, company…', count: activeFilterCount, hasFilter: true }
                : section === 'orgs'
                ? { title: 'Organisations', value: orgsQ, set: setOrgsQ, ph: 'Name, tagline, city…', count: orgsFilterCount, hasFilter: true }
                : section === 'candidates'
                ? { title: 'Candidates', value: '', set: () => {}, ph: '', count: 0, hasFilter: false }
                : { title: 'Level Up', value: learnQ, set: setLearnQ, ph: 'Courses, certs, hackathons…', count: activeLearnFilterCount, hasFilter: true }
              return (
                <div className="md:hidden">
                  {mobileSearchOpen ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-card rounded-[10px] px-3 py-2 shadow-card flex-1 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input autoFocus value={ctx.value} onChange={e => ctx.set(e.target.value)} placeholder={ctx.ph}
                          className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none min-w-0" />
                      </div>
                      <button onClick={() => { ctx.set(''); setMobileSearchOpen(false) }}
                        aria-label="Close search"
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-card shadow-card text-ink-2 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Section tabs — scrollable carousel when 4 tabs (org account) */}
                      <div className="flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                        <div className="flex bg-card rounded-full p-0.5 border border-line w-fit" style={{ boxShadow: '0 4px 12px rgba(0,0,0,.12)' }}>
                          {([
                            ['jobs',  'Jobs'],
                            ['orgs',  'Orgs'],
                            ['learn', 'Level Up'],
                            ...(isOrgAccount ? [['candidates', 'Candidates']] : []),
                          ] as [Section, string][]).map(([id, l]) => (
                            <button key={id} onClick={() => setSection(id)}
                              className={['px-3.5 py-1.5 text-[12px] font-semibold rounded-full transition-colors whitespace-nowrap',
                                section === id ? 'bg-orange text-white' : 'text-ink-2'].join(' ')}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setMobileSearchOpen(true)}
                          aria-label="Search"
                          className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-card shadow-card text-ink-2">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </button>
                        {ctx.hasFilter && (
                          <button onClick={() => setFiltersOpen(true)}
                            aria-label="Filters"
                            className="relative w-9 h-9 rounded-[10px] flex items-center justify-center bg-card shadow-card text-ink-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                            {ctx.count > 0 && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-white bg-orange rounded-full px-1 leading-tight">{ctx.count}</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Desktop header: single row — tabs left, search/filter right */}
            {(() => {
              const deskQ   = section === 'jobs' ? q : section === 'orgs' ? orgsQ : learnQ
              const setDeskQ = section === 'jobs' ? setQ : section === 'orgs' ? setOrgsQ : setLearnQ
              const deskPh  = section === 'jobs' ? 'Title, skill, company…' : section === 'orgs' ? 'Name, tagline, city…' : 'Courses, certs…'
              const deskFilterCount = section === 'jobs' ? activeFilterCount : section === 'orgs' ? orgsFilterCount : section === 'learn' ? activeLearnFilterCount : 0
              return (
                <div className="hidden md:flex items-center gap-3">
                  {/* Section tabs */}
                  <div className="flex bg-card rounded-[12px] p-1 shadow-card shrink-0">
                    {([
                      ['jobs',  'Jobs'],
                      ['orgs',  'Organisations'],
                      ['learn', 'Level Up'],
                      ...(isOrgAccount ? [['candidates', 'Candidates']] : []),
                    ] as [Section, string][]).map(([id, l]) => (
                      <button key={id} onClick={() => { setSection(id as Section); setDesktopSearchOpen(false) }}
                        className={['px-3.5 py-1.5 text-[13px] font-semibold rounded-[9px] transition-colors whitespace-nowrap shrink-0',
                          section === id ? 'bg-page text-ink' : 'text-ink-3 hover:text-ink-2'].join(' ')}>
                        {l}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1" />

                  {/* Per-section right actions — hidden for Candidates (handled inside TalentPoolView) */}
                  {section !== 'candidates' && (
                    <div className="flex items-center gap-1.5">
                      {desktopSearchOpen ? (
                        <div className="flex items-center gap-2 bg-card rounded-[10px] px-3 py-2 shadow-card w-[220px]">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          <input autoFocus value={deskQ} onChange={e => setDeskQ(e.target.value)} placeholder={deskPh}
                            className="flex-1 bg-transparent text-[12.5px] text-ink placeholder-ink-3 outline-none min-w-0" />
                          <button onClick={() => { setDeskQ(''); setDesktopSearchOpen(false) }} className="text-ink-3 hover:text-ink transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDesktopSearchOpen(true)} aria-label="Search"
                          className={['w-9 h-9 rounded-[10px] flex items-center justify-center bg-card shadow-card transition-colors border',
                            deskQ ? 'text-orange border-orange/30' : 'text-ink-2 border-transparent hover:text-ink'].join(' ')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </button>
                      )}
                      {(section === 'jobs' || section === 'orgs' || section === 'learn') && (
                        <button onClick={() => setFiltersOpen(true)} aria-label="Filters"
                          className={['relative w-9 h-9 rounded-[10px] flex items-center justify-center bg-card shadow-card transition-colors border',
                            deskFilterCount > 0 ? 'text-orange border-orange/30' : 'text-ink-2 border-transparent hover:text-ink'].join(' ')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                          {deskFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[8px] font-bold text-white bg-orange rounded-full flex items-center justify-center">{deskFilterCount}</span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* ── Section content ── */}
          {section === 'jobs' && (
            <div className="flex-1 overflow-hidden flex gap-4 px-4 lg:px-6 py-4 relative z-10">
              {/* list */}
              <div className="w-full lg:w-[42%] lg:max-w-[440px] overflow-y-auto space-y-3 pb-20 lg:pb-2">
                <p className="text-[11px] text-ink-3 px-1">{shown.length} role{shown.length === 1 ? '' : 's'}</p>
                {shown.map(j => (
                  <JobRow key={j.id} job={j}
                    selected={selected?.id === j.id}
                    onSelect={() => { setSelected(j); setMobileOpen(j) }}
                    onRefer={() => {}} />
                ))}
                {shown.length === 0 && <div className="py-12 text-center text-[13px] text-ink-3">No jobs match these filters.</div>}
              </div>

              {/* sticky detail (desktop) */}
              <div className="hidden lg:block flex-1 bg-card rounded-[18px] shadow-card overflow-hidden">
                {selected
                  ? <JobDetailContent key={selected.id} job={selected} onRefer={() => {}} />
                  : <div className="h-full flex items-center justify-center text-[13px] text-ink-3">Select a role to see details</div>}
              </div>
            </div>
          )}

          {section === 'orgs' && (
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pb-20 lg:pb-4 relative z-10">
              <OrgsBrowseView controlledQ={orgsQ} onControlledQChange={setOrgsQ}
                filterIndustry={orgsIndustry} filterLoc={orgsLoc} filterVerified={orgsVerified} />
            </div>
          )}

          {section === 'learn' && (
            <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 relative z-10">
              <LearnView controlledQ={learnQ} onControlledQChange={setLearnQ} filters={learnFilters} />
            </div>
          )}

          {section === 'candidates' && (
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pb-20 lg:pb-4 relative z-10">
              <TalentPoolView orgContext />
            </div>
          )}
        </main>
      </div>

<MobileTabBar active="jobs" onCreateClick={() => setCreateOpen(true)} />
      {mobileOpen && <div className="lg:hidden"><JobDetailDrawer job={mobileOpen} onClose={() => setMobileOpen(null)} onRefer={() => {}} /></div>}
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}

      {/* Mobile filters bottom sheet — section-aware */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button aria-label="Close" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-page rounded-t-[20px] p-5 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,.15)] max-h-[85vh] overflow-y-auto">
            <div className="mx-auto w-10 h-1 rounded-full bg-line mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-ink">Filters</h2>
              <button onClick={() => {
                if (section === 'jobs') { setLoc(''); setType('Any'); setMode('Any'); setDate('Any time') }
                else if (section === 'orgs') { setOrgsIndustry('All'); setOrgsLoc(''); setOrgsVerified(false) }
                else if (section === 'learn') { setLearnFilters(DEFAULT_LEARN_FILTERS) }
              }} className="text-[12px] font-semibold text-ink-3 hover:text-ink">Reset</button>
            </div>

            {section === 'jobs' && (
              <div className="space-y-4">
                {/* Filters — affect which jobs you see right now */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-2">Filter</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-card rounded-[10px] px-3 py-2.5 shadow-card">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <input value={loc} onChange={e => setLoc(e.target.value)} placeholder="Location"
                        className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none min-w-0" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select label="Job type"  value={type} onChange={v => setType(v as JobType | 'Any')} options={TYPES} />
                      <Select label="Work mode" value={mode} onChange={v => setMode(v as WorkMode | 'Any')} options={MODES} />
                      <Select label="Date"      value={date} onChange={setDate} options={DATES} />
                      <Select label="Sort"      value={sort === 'recent' ? 'Most recent' : 'Best match'}
                        onChange={v => setSort(v === 'Best match' ? 'best_match' : 'recent')}
                        options={['Most recent','Best match']} />
                    </div>
                  </div>
                </div>

                {/* Preferences — saved to your profile; drive AI match scoring */}
                <div className="pt-3 border-t border-line">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-2">Your preferences <span className="font-normal normal-case text-ink-3">· used for match scoring</span></p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center gap-2 bg-card rounded-[10px] px-3 py-2.5 shadow-card">
                        <span className="text-[11px] text-ink-3 shrink-0">Min LPA</span>
                        <input type="number" inputMode="numeric" value={prefs.salary_min_lpa ?? ''} onChange={e => updatePref('salary_min_lpa', e.target.value ? Number(e.target.value) : null)}
                          placeholder="—" className="w-full bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none min-w-0" />
                      </label>
                      <label className="flex-1 flex items-center gap-2 bg-card rounded-[10px] px-3 py-2.5 shadow-card">
                        <span className="text-[11px] text-ink-3 shrink-0">Max LPA</span>
                        <input type="number" inputMode="numeric" value={prefs.salary_max_lpa ?? ''} onChange={e => updatePref('salary_max_lpa', e.target.value ? Number(e.target.value) : null)}
                          placeholder="—" className="w-full bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none min-w-0" />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select label="Notice period"
                        value={prefs.notice_period ? NOTICE_LABEL[prefs.notice_period] : 'Any'}
                        onChange={v => updatePref('notice_period', NOTICE_FROM_LABEL[v] ?? null)}
                        options={['Any','Immediate','15 days','30 days','60 days','90 days']} />
                      <Select label="Relocate"
                        value={prefs.willing_to_relocate ? 'Yes' : 'No'}
                        onChange={v => updatePref('willing_to_relocate', v === 'Yes')}
                        options={['Yes','No']} />
                    </div>
                    <input value={(prefs.preferred_languages ?? []).join(', ')}
                      onChange={e => updatePref('preferred_languages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="Preferred languages (English, Hindi, …)"
                      className="w-full bg-card rounded-[10px] px-3 py-2.5 shadow-card text-[13px] text-ink placeholder-ink-3 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {section === 'orgs' && (
              <div className="space-y-4">
                {/* Industry */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-2">Industry</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ORG_INDUSTRIES.map(ind => (
                      <button key={ind} onClick={() => setOrgsIndustry(ind)}
                        className={['text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                          orgsIndustry === ind
                            ? 'bg-orange text-white border-orange'
                            : 'bg-card border-line text-ink-2 hover:border-orange/40 hover:text-orange'
                        ].join(' ')}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Location */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-2">Location</p>
                  <div className="flex items-center gap-2 bg-card rounded-[10px] px-3 py-2.5 shadow-card">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <input value={orgsLoc} onChange={e => setOrgsLoc(e.target.value)} placeholder="City, country…"
                      className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none min-w-0" />
                  </div>
                </div>
                {/* Verified toggle */}
                <button onClick={() => setOrgsVerified(v => !v)}
                  className="flex items-center justify-between w-full bg-card rounded-[10px] px-3 py-2.5 shadow-card">
                  <span className="text-[13px] text-ink-2">Verified only</span>
                  <div className={['w-9 h-5 rounded-full transition-colors relative', orgsVerified ? 'bg-orange' : 'bg-line'].join(' ')}>
                    <span className={['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', orgsVerified ? 'left-4' : 'left-0.5'].join(' ')} />
                  </div>
                </button>
              </div>
            )}

            {section === 'learn' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Select label="Duration" value={learnFilters.duration} onChange={v => setLearnFilters(s => ({ ...s, duration: v as typeof LEARN_DURATIONS[number] }))} options={LEARN_DURATIONS} />
                  <Select label="Cost"     value={learnFilters.cost}     onChange={v => setLearnFilters(s => ({ ...s, cost: v as typeof LEARN_COSTS[number] }))}         options={LEARN_COSTS} />
                  <Select label="Mode"     value={learnFilters.mode}     onChange={v => setLearnFilters(s => ({ ...s, mode: v as typeof LEARN_MODES[number] }))}         options={LEARN_MODES} />
                  <Select label="Provider" value={learnFilters.provider} onChange={v => setLearnFilters(s => ({ ...s, provider: v as typeof LEARN_PROVIDERS[number] }))} options={LEARN_PROVIDERS} />
                  <Select label="Sort"     value={learnFilters.sort}     onChange={v => setLearnFilters(s => ({ ...s, sort: v as typeof LEARN_SORTS[number] }))}         options={LEARN_SORTS} />
                </div>
                <label className="flex items-center gap-2 bg-card rounded-[10px] px-3 py-2.5 shadow-card cursor-pointer">
                  <input type="checkbox" checked={learnFilters.emi} onChange={e => setLearnFilters(s => ({ ...s, emi: e.target.checked }))}
                    className="w-4 h-4 accent-orange" />
                  <span className="text-[13px] text-ink-2">EMI available</span>
                </label>
              </div>
            )}

            <button onClick={() => setFiltersOpen(false)}
              className="w-full mt-5 bg-gradient-to-br from-orange to-orange-2 text-white text-[14px] font-semibold rounded-[12px] py-3">
              Done
            </button>
          </div>
        </div>
      )}

      <ToastHost />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  const isDefault = value === options[0]
  const active = !isDefault
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={['appearance-none border shadow-card rounded-[10px] pl-3 pr-7 py-1.5 text-[12.5px] font-medium outline-none cursor-pointer transition-colors',
          active ? 'bg-orange-soft text-orange border-orange/30' : 'bg-card text-ink-2 border-transparent hover:bg-line'].join(' ')}>
        {options.map(o => <option key={o} value={o}>{o === options[0] ? label : o}</option>)}
      </select>
      <svg className={['absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none', active ? 'text-orange' : 'text-ink-3'].join(' ')}
        width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  )
}
