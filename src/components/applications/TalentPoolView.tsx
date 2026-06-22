'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logRpc } from '@/lib/rpcError'
import Link from 'next/link'
import { toast } from '@/components/profile/ui/Toast'
import { getOpenTalent } from '@/stubs/demoProfiles'

// ── Types ────────────────────────────────────────────────────────────────────

interface PoolCandidate {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  about: string | null
  location_city: string | null
  location_state: string | null
  skills: string[] | null
  total_years_exp: number | null
}

interface OrgInfo {
  org_id: string
  org_name: string
  org_slug: string
  org_logo_url: string | null
}

type RequestStatus = 'pending' | 'approved' | 'declined'
type PoolTab = 'discover' | 'pending' | 'approved'

interface FlexExp {
  id: string; company: string; role: string; location: string | null
  emp_type: string | null; start_year: number; start_month: number
  end_year: number | null; end_month: number | null
  currently_working: boolean; description: string | null; skills_used: string[] | null
  squad_verified: number   // count of verified squad members for this entry
}
interface FlexEdu {
  id: string; institution: string; degree: string | null
  field: string | null; start_year: number | null; end_year: number | null; grade: string | null
  squad_verified: number
}
interface FlexAchievement { id: string; title: string; description: string | null; display_order: number }

interface FlexDetail {
  email: string | null
  experience: FlexExp[]
  education: FlexEdu[]
  achievements: FlexAchievement[]
}

interface TrustData {
  score: number
  squad_count: number
  vouch_count: number
  verified_skills: string[]   // skills backed by squad-confirmed experience
}

// ── Constants ────────────────────────────────────────────────────────────────

const DOMAINS = [
  { label: 'All',         kw: [] as string[] },
  { label: 'Design',      kw: ['design','ui','ux','figma','adobe','visual','branding','graphic','illustr'] },
  { label: 'Engineering', kw: ['engineer','developer','software','frontend','backend','fullstack','devops','python','javascript','react','node','coding','java','flutter','ios','android'] },
  { label: 'Product',     kw: ['product','pm','product manager','roadmap','agile','scrum','sprint'] },
  { label: 'Marketing',   kw: ['marketing','growth','brand','content','seo','social media','digital','campaign'] },
  { label: 'HR',          kw: ['hr','human resource','talent','recruit','people','culture','org dev'] },
  { label: 'Finance',     kw: ['finance','accounting','cfo','financial','investment','banking','ca','cpa','audit'] },
  { label: 'Sales',       kw: ['sales','business dev','account','revenue','crm','b2b','b2c','partnership'] },
  { label: 'Operations',  kw: ['operations','coo','ops','supply chain','logistics','process','strategy'] },
]

const EXP_OPTS = ['Any', '0–2 yrs', '2–5 yrs', '5+ yrs'] as const
type ExpOpt = typeof EXP_OPTS[number]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(year: number, month?: number | null) {
  return month ? `${MONTHS[month - 1]} ${year}` : `${year}`
}

// ── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchCandidates(): Promise<PoolCandidate[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_open_candidates', { p_limit: 100, p_offset: 0, p_skills: null })
  const dbList = error ? [] : ((data as PoolCandidate[]) ?? [])
  // Merge stub demo profiles — stubs fill the pool when DB is empty or sparse
  const stubs = getOpenTalent().map(p => ({
    id: p.id,
    username: p.username,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
    headline: p.headline,
    about: p.about ?? null,
    location_city: p.location_city,
    location_state: p.location_state,
    skills: p.skills,
    total_years_exp: p.total_years_exp,
  } as PoolCandidate))
  // Deduplicate by username — DB records take precedence
  const dbUsernames = new Set(dbList.map(c => c.username))
  const merged = [...dbList, ...stubs.filter(s => !dbUsernames.has(s.username))]
  if (error && merged.length === 0) logRpc('searchOpenCandidates', error)
  return merged
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TalentPoolView({ orgContext = false }: { orgContext?: boolean }) {
  const [candidates, setCandidates] = useState<PoolCandidate[]>([])
  const [loading, setLoading]       = useState(true)
  const [poolTab, setPoolTab]       = useState<PoolTab>('discover')

  // search + filter
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ]                   = useState('')
  const [locFilter, setLocFilter]   = useState('')
  const [domain, setDomain]         = useState('All')
  const [expFilter, setExpFilter]   = useState<ExpOpt>('Any')
  const [sortBy, setSortBy]         = useState<'recent' | 'name'>('recent')
  const [filterOpen, setFilterOpen] = useState(false)
  const searchInputRef              = useRef<HTMLInputElement>(null)

  // org state
  const [orgInfo, setOrgInfo]           = useState<OrgInfo | null>(null)
  const [requestMap, setRequestMap]     = useState<Map<string, RequestStatus>>(new Map())
  const [selected, setSelected]         = useState<PoolCandidate | null>(null)
  const [flexDetail, setFlexDetail]     = useState<FlexDetail | null>(null)
  const [trustData, setTrustData]       = useState<TrustData | null>(null)
  const [loadingFlex, setLoadingFlex]   = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)

  // load org + existing requests
  useEffect(() => {
    if (!orgContext) return
    const supabase = createClient()
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      const { data: mem } = await supabase
        .from('org_memberships').select('org_id, role')
        .eq('user_id', user.id).eq('is_current', true).in('role', ['owner', 'admin'])
        .order('role', { ascending: false })   // 'owner' > 'admin' alphabetically
        .order('created_at', { ascending: true })
        .limit(1).maybeSingle()
      if (!mem?.org_id) return
      const { data: org } = await supabase
        .from('orgs').select('id, name, slug, logo_url').eq('id', mem.org_id).maybeSingle()
      if (!org) return
      const info: OrgInfo = { org_id: org.id, org_name: org.name, org_slug: org.slug, org_logo_url: (org as { logo_url?: string | null }).logo_url ?? null }
      setOrgInfo(info)
      const { data: reqs } = await supabase.from('flex_requests').select('candidate_id, status').eq('org_id', org.id)
      const map = new Map<string, RequestStatus>()
      ;(reqs ?? []).forEach((r: { candidate_id: string; status: RequestStatus }) => map.set(r.candidate_id, r.status))
      setRequestMap(map)
    })()
  }, [orgContext])

  // load candidates
  useEffect(() => {
    setLoading(true)
    fetchCandidates().then(setCandidates).finally(() => setLoading(false))
  }, [])

  // select candidate → fetch full flex + trust data if approved
  const handleSelect = async (c: PoolCandidate) => {
    setSelected(c)
    setFlexDetail(null)
    setTrustData(null)
    if ((requestMap.get(c.id) ?? null) === 'approved') {
      setLoadingFlex(true)
      const supabase = createClient()
      const [{ data: flexRaw, error: flexErr }, { data: expSquad }, { data: trustRaw }, { data: vouches }] = await Promise.all([
        supabase.rpc('get_approved_candidate_flex', { p_candidate_id: c.id }),
        supabase.from('flex_experience').select('id, skills_used, squad').eq('user_id', c.id),
        supabase.rpc('get_trust_score', { p_user: c.id }),
        supabase.from('vouches').select('id').eq('candidate_id', c.id).eq('status', 'accepted'),
      ])
      setLoadingFlex(false)
      if (flexErr) { logRpc('getApprovedCandidateFlex', flexErr); return }

      // Compute verified skills (appear in squad-confirmed experience entries)
      const verifiedSkillsSet = new Set<string>()
      let totalSquadVerified = 0
      const squadByExpId = new Map<string, number>()

      for (const exp of expSquad ?? []) {
        const sq = exp.squad as { members?: { status: string }[] } | null
        const verifiedCount = sq?.members?.filter((m: { status: string }) => m.status === 'verified').length ?? 0
        squadByExpId.set(exp.id, verifiedCount)
        if (verifiedCount > 0) {
          totalSquadVerified += verifiedCount
          for (const s of exp.skills_used ?? []) verifiedSkillsSet.add(s)
        }
      }

      const trust = trustRaw as { score: number } | null
      setTrustData({
        score: trust?.score ?? 0,
        squad_count: totalSquadVerified,
        vouch_count: vouches?.length ?? 0,
        verified_skills: Array.from(verifiedSkillsSet),
      })

      // Enrich flex experience with squad_verified count
      if (flexRaw) {
        const flex = flexRaw as FlexDetail
        const enriched: FlexDetail = {
          ...flex,
          experience: flex.experience.map(e => ({ ...e, squad_verified: squadByExpId.get(e.id) ?? 0 })),
          education: flex.education.map(e => ({ ...e, squad_verified: 0 })),
        }
        setFlexDetail(enriched)
      }
    }
  }

  const handleRequestFlex = async (candidateId: string) => {
    if (!orgInfo) { toast('Could not identify your organisation'); return }
    setRequestingId(candidateId)
    const supabase = createClient()
    const { error } = await supabase.from('flex_requests').insert({
      org_id: orgInfo.org_id, candidate_id: candidateId,
      org_name: orgInfo.org_name, org_slug: orgInfo.org_slug,
      org_logo_url: orgInfo.org_logo_url, status: 'pending',
    })
    setRequestingId(null)
    if (error && error.code !== '23505') { toast('Failed — ' + error.message); return }
    setRequestMap(prev => new Map([...prev, [candidateId, 'pending']]))
    toast('Flex request sent ✓')
  }

  // ── filtering ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = candidates
    const ql = q.trim().toLowerCase()
    if (ql) list = list.filter(c =>
      `${c.full_name ?? ''} ${c.username} ${c.headline ?? ''} ${c.about ?? ''} ${(c.skills ?? []).join(' ')}`.toLowerCase().includes(ql)
    )
    if (locFilter) list = list.filter(c =>
      `${c.location_city ?? ''} ${c.location_state ?? ''}`.toLowerCase().includes(locFilter.toLowerCase())
    )
    if (domain !== 'All') {
      const kws = DOMAINS.find(d => d.label === domain)?.kw ?? []
      list = list.filter(c => {
        const txt = `${c.headline ?? ''} ${(c.skills ?? []).join(' ')}`.toLowerCase()
        return kws.some(k => txt.includes(k))
      })
    }
    if (expFilter !== 'Any') list = list.filter(c => {
      const yrs = c.total_years_exp ?? 0
      if (expFilter === '0–2 yrs') return yrs < 2
      if (expFilter === '2–5 yrs') return yrs >= 2 && yrs <= 5
      if (expFilter === '5+ yrs')  return yrs > 5
      return true
    })
    if (sortBy === 'name') list = [...list].sort((a, b) =>
      (a.full_name ?? a.username).localeCompare(b.full_name ?? b.username)
    )
    return list
  }, [candidates, q, locFilter, domain, expFilter, sortBy])

  const discover  = filtered
  const pending   = filtered.filter(c => requestMap.get(c.id) === 'pending')
  const approved  = filtered.filter(c => requestMap.get(c.id) === 'approved')
  const currentList = poolTab === 'discover' ? discover : poolTab === 'pending' ? pending : approved

  const activeFilters = (locFilter ? 1 : 0) + (domain !== 'All' ? 1 : 0) + (expFilter !== 'Any' ? 1 : 0) + (sortBy !== 'recent' ? 1 : 0)

  // ── Non-org view ─────────────────────────────────────────────────────────

  if (!orgContext) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Talent Pool</p>
          <h2 className="text-[20px] font-bold text-ink mt-1">Open to work</h2>
          <p className="text-[12px] text-ink-3 mt-1">Candidates actively looking. Click any card to view their Flex.</p>
        </header>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            className="w-full bg-card border border-line rounded-[10px] pl-9 pr-3 py-2 text-[12.5px] text-ink placeholder-ink-3 outline-none focus:border-orange/40" />
        </div>
        {loading && <p className="text-[12px] text-ink-3 py-12 text-center">Loading…</p>}
        {!loading && filtered.length === 0 && <EmptyDiscover />}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => <CandidateCard key={c.id} candidate={c} />)}
          </div>
        )}
      </div>
    )
  }

  // ── Org 2-panel view ──────────────────────────────────────────────────────

  return (
    <div className="flex gap-4 h-full overflow-hidden">

      {/* ── Left panel ── */}
      <div className="w-full lg:w-[42%] lg:max-w-[440px] flex flex-col overflow-hidden">

        {/* Title row — single line: heading · tabs (centre) · icons (right) */}
        <div className="pb-3 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange mb-1">Candidates</p>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-ink shrink-0">Open to work</h2>

            {/* Tabs — centred */}
            <div className="flex-1 flex justify-center">
              <div className="flex gap-0.5 bg-page rounded-[11px] p-0.5 border border-line">
                {(['discover', 'pending', 'approved'] as PoolTab[]).map(tab => {
                  const count = tab === 'pending' ? pending.length : tab === 'approved' ? approved.length : null
                  return (
                    <button key={tab} onClick={() => setPoolTab(tab)}
                      className={['px-3 py-1.5 rounded-[9px] text-[11px] font-semibold capitalize transition-all flex items-center justify-center gap-1',
                        poolTab === tab ? 'bg-card shadow-sm text-ink border border-line' : 'text-ink-3 hover:text-ink-2'
                      ].join(' ')}>
                      {tab}
                      {count !== null && count > 0 && (
                        <span className={`text-[9px] font-bold px-1 rounded-full ${tab === 'approved' ? 'text-green bg-green/10' : 'text-orange bg-orange-soft'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: search + filter icons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { const next = !searchOpen; setSearchOpen(next); if (!next) setQ(''); else setTimeout(() => searchInputRef.current?.focus(), 50) }}
                className={['w-7 h-7 rounded-[8px] flex items-center justify-center border transition-colors',
                  searchOpen || q ? 'bg-orange-soft text-orange border-orange/30' : 'bg-card border-line text-ink-2 hover:text-ink'
                ].join(' ')}>
                {searchOpen
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
              </button>
              <button onClick={() => setFilterOpen(p => !p)}
                className={['relative w-7 h-7 rounded-[8px] flex items-center justify-center border transition-colors',
                  filterOpen || activeFilters > 0 ? 'bg-orange-soft text-orange border-orange/30' : 'bg-card border-line text-ink-2 hover:text-ink'
                ].join(' ')}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                {activeFilters > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 text-[7px] font-bold text-white bg-orange rounded-full flex items-center justify-center">{activeFilters}</span>}
              </button>
            </div>
          </div>

          {/* Inline search input */}
          {searchOpen && (
            <div className="flex items-center gap-2 bg-page border border-orange/30 rounded-[9px] px-3 py-1.5 mt-2">
              <svg className="shrink-0 text-ink-3" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input ref={searchInputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Name, headline, skill…"
                className="flex-1 bg-transparent text-[12px] text-ink placeholder-ink-3 outline-none min-w-0" />
            </div>
          )}
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div className="bg-card border border-line rounded-[14px] p-3 mb-3 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-ink">Filters</p>
              <button onClick={() => { setLocFilter(''); setDomain('All'); setExpFilter('Any'); setSortBy('recent') }}
                className="text-[10px] text-orange font-semibold">Reset all</button>
            </div>

            {/* Domain */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">Role / Domain</p>
              <div className="flex flex-wrap gap-1">
                {DOMAINS.map(d => (
                  <button key={d.label} onClick={() => setDomain(d.label)}
                    className={['text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                      domain === d.label
                        ? 'bg-orange text-white border-orange'
                        : 'bg-page border-line text-ink-2 hover:border-orange/40 hover:text-orange'
                    ].join(' ')}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">Experience</p>
              <div className="flex gap-1">
                {EXP_OPTS.map(e => (
                  <button key={e} onClick={() => setExpFilter(e)}
                    className={['flex-1 py-1 rounded-[8px] text-[9.5px] font-semibold border transition-colors',
                      expFilter === e ? 'bg-orange text-white border-orange' : 'bg-page border-line text-ink-2'
                    ].join(' ')}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-1.5">Location</p>
              <div className="flex items-center gap-2 bg-page border border-line rounded-[9px] px-3 py-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input value={locFilter} onChange={e => setLocFilter(e.target.value)} placeholder="City or state…"
                  className="flex-1 bg-transparent text-[12px] text-ink placeholder-ink-3 outline-none" />
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-1.5">Sort by</p>
              <div className="flex gap-2">
                {(['recent', 'name'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={['flex-1 py-1.5 rounded-[9px] text-[10.5px] font-semibold border transition-colors',
                      sortBy === s ? 'bg-orange text-white border-orange' : 'bg-page border-line text-ink-2'
                    ].join(' ')}>
                    {s === 'recent' ? 'Most recent' : 'Name A–Z'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Candidate list */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-20 lg:pb-2">
          {loading && <p className="text-[12px] text-ink-3 py-12 text-center">Loading…</p>}
          {!loading && currentList.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[13px] font-semibold text-ink">
                {poolTab === 'pending' ? 'No pending requests'
                  : poolTab === 'approved' ? 'No approved candidates yet'
                  : 'No candidates found'}
              </p>
              <p className="text-[11px] text-ink-3 mt-1">
                {poolTab === 'pending' ? 'Send flex requests from the Discover tab.'
                  : poolTab === 'approved' ? 'Candidates appear here after they approve your request.'
                  : 'Try adjusting filters.'}
              </p>
            </div>
          )}
          {!loading && currentList.length > 0 && (
            <>
              <p className="text-[11px] text-ink-3 pb-0.5">
                {currentList.length} candidate{currentList.length !== 1 ? 's' : ''}
              </p>
              {currentList.map(c => (
                <OrgCandidateCard
                  key={c.id}
                  candidate={c}
                  status={requestMap.get(c.id) ?? null}
                  busy={requestingId === c.id}
                  selected={selected?.id === c.id}
                  onRequest={handleRequestFlex}
                  onSelect={() => handleSelect(c)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="hidden lg:flex flex-1 bg-card rounded-[18px] shadow-card overflow-hidden">
        {selected
          ? <CandidateDetailPanel
              candidate={selected}
              status={requestMap.get(selected.id) ?? null}
              flexDetail={flexDetail}
              trustData={trustData}
              loadingFlex={loadingFlex}
            />
          : (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-orange-soft flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <p className="text-[14px] font-semibold text-ink">Select a candidate</p>
                <p className="text-[12px] text-ink-3 mt-1 max-w-[200px] mx-auto">Click any card to preview. Full flex unlocks after approval.</p>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyDiscover() {
  return (
    <div className="text-center py-16 bg-card rounded-[16px] border border-line">
      <p className="text-[14px] font-semibold text-ink">No candidates yet</p>
      <p className="text-[12px] text-ink-3 mt-1">Candidates who turn on "Open to work" will appear here.</p>
    </div>
  )
}

function CandidateCard({ candidate: c }: { candidate: PoolCandidate }) {
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const longAbout = (c.about?.length ?? 0) > 120
  return (
    <Link href={`/flex/${c.username}`} target="_blank"
      className="bg-card border border-line rounded-[16px] p-4 hover:border-orange/30 hover:shadow-card transition-all group block">
      <div className="flex items-start gap-3">
        {c.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-[11px] object-cover shrink-0" />
          : <span className="w-10 h-10 rounded-[11px] bg-orange-soft text-orange flex items-center justify-center text-[14px] font-bold shrink-0">
              {(c.full_name ?? c.username).charAt(0).toUpperCase()}
            </span>}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink truncate group-hover:text-orange transition-colors">{c.full_name ?? c.username}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <p className="text-[11px] text-ink-3 truncate">{c.headline ?? '—'}</p>
            {(c.total_years_exp ?? 0) > 0 && (
              <span className="text-[9px] font-semibold text-purple bg-purple/8 border border-purple/15 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {c.total_years_exp} yrs exp
              </span>
            )}
          </div>
          {(c.location_city || c.location_state) && (
            <p className="text-[10.5px] text-ink-3 mt-0.5">📍 {[c.location_city, c.location_state].filter(Boolean).join(', ')}</p>
          )}
        </div>
        <span className="text-[9px] font-bold text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">Open</span>
      </div>
      {c.about && (
        <div className="mt-2.5" onClick={e => e.preventDefault()}>
          <p className={`text-[11px] text-ink-2 leading-relaxed ${aboutExpanded ? '' : 'line-clamp-2'}`}>{c.about}</p>
          {longAbout && (
            <button onClick={e => { e.preventDefault(); setAboutExpanded(v => !v) }}
              className="text-[10.5px] font-semibold text-orange mt-0.5 hover:underline">
              {aboutExpanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}
      {c.skills && c.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {c.skills.slice(0, 4).map(s => (
            <span key={s} className="text-[9.5px] font-medium text-ink-2 bg-page border border-line px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
          {c.skills.length > 4 && <span className="text-[9.5px] text-ink-3">+{c.skills.length - 4}</span>}
        </div>
      )}
    </Link>
  )
}

function OrgCandidateCard({
  candidate: c, status, busy, selected, onRequest, onSelect,
}: {
  candidate: PoolCandidate; status: RequestStatus | null; busy: boolean
  selected: boolean; onRequest: (id: string) => void; onSelect: () => void
}) {
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const longAbout = (c.about?.length ?? 0) > 120
  const isApproved = status === 'approved'
  return (
    <div onClick={onSelect}
      className={['bg-card border rounded-[16px] p-4 transition-all cursor-pointer',
        selected
          ? isApproved
            ? 'border-green/40 shadow-[0_0_0_2px_rgba(34,197,94,0.1)]'
            : 'border-orange/50 shadow-[0_0_0_2px_rgba(255,92,40,0.1)]'
          : isApproved
            ? 'border-green/20 hover:border-green/40 hover:shadow-card'
            : 'border-line hover:border-orange/30 hover:shadow-card',
      ].join(' ')}>

      <div className="flex items-start gap-3">
        {c.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-[11px] object-cover shrink-0" />
          : <span className="w-10 h-10 rounded-[11px] bg-orange-soft text-orange flex items-center justify-center text-[14px] font-bold shrink-0">
              {(c.full_name ?? c.username).charAt(0).toUpperCase()}
            </span>}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink truncate">{c.full_name ?? c.username}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <p className="text-[11px] text-ink-3 truncate">{c.headline ?? '—'}</p>
            {(c.total_years_exp ?? 0) > 0 && (
              <span className="text-[9px] font-semibold text-purple bg-purple/8 border border-purple/15 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {c.total_years_exp} yrs exp
              </span>
            )}
          </div>
          {(c.location_city || c.location_state) && (
            <p className="text-[10.5px] text-ink-3 mt-0.5">📍 {[c.location_city, c.location_state].filter(Boolean).join(', ')}</p>
          )}
        </div>
        {isApproved
          ? <span className="text-[9px] font-bold text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">✓ Approved</span>
          : <span className="text-[9px] font-bold text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">Open</span>
        }
      </div>

      {c.about && (
        <div className="mt-2.5" onClick={e => e.stopPropagation()}>
          <p className={`text-[11px] text-ink-2 leading-relaxed ${aboutExpanded ? '' : 'line-clamp-2'}`}>{c.about}</p>
          {longAbout && (
            <button onClick={() => setAboutExpanded(v => !v)}
              className="text-[10.5px] font-semibold text-orange mt-0.5 hover:underline">
              {aboutExpanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}

      {/* Skills + action in one row */}
      <div className="flex items-end gap-2 mt-2.5" onClick={e => e.stopPropagation()}>
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {(c.skills ?? []).slice(0, 4).map(s => (
            <span key={s} className="text-[9.5px] font-medium text-ink-2 bg-page border border-line px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
          {(c.skills?.length ?? 0) > 4 && <span className="text-[9.5px] text-ink-3 self-center">+{(c.skills?.length ?? 0) - 4}</span>}
        </div>
        <div className="shrink-0">
          {!status && (
            <button disabled={busy} onClick={() => onRequest(c.id)}
              className="px-3 py-1.5 rounded-[9px] text-[10.5px] font-semibold bg-gradient-to-br from-orange to-orange-2 text-white hover:opacity-90 disabled:opacity-60 transition-all whitespace-nowrap">
              {busy ? 'Sending…' : 'Request Flex'}
            </button>
          )}
          {status === 'pending' && (
            <span className="text-[9px] font-semibold text-orange bg-orange/8 border border-orange/20 px-2 py-1 rounded-full whitespace-nowrap">Pending</span>
          )}
          {status === 'approved' && (
            <span className="text-[9px] font-semibold text-green bg-green/10 border border-green/20 px-2 py-1 rounded-full whitespace-nowrap">✓ Unlocked</span>
          )}
          {status === 'declined' && (
            <span className="text-[9px] font-medium text-ink-3 bg-line/40 border border-line px-2 py-1 rounded-full whitespace-nowrap">Declined</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Trust Ring — circular score visual ────────────────────────────────────────

function TrustRing({ score }: { score: number }) {
  const r = 22, circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F5A524' : '#94a3b8'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4"/>
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${filled} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-ink">{score}</span>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-3">Trust Score</p>
    </div>
  )
}

// ── Verified vs. Self-reported skill split ────────────────────────────────────

function SkillsSplit({ allSkills, verifiedSkills }: { allSkills: string[]; verifiedSkills: string[] }) {
  const verifiedSet = new Set(verifiedSkills.map(s => s.toLowerCase()))
  const verified = allSkills.filter(s => verifiedSet.has(s.toLowerCase()))
  const selfReported = allSkills.filter(s => !verifiedSet.has(s.toLowerCase()))

  return (
    <div className="space-y-3">
      {verified.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-green">Verified by Squad</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {verified.map(s => (
              <span key={s} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-green bg-green/8 border border-green/25 px-2.5 py-1 rounded-full">
                <span className="w-1 h-1 rounded-full bg-green shrink-0" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {selfReported.length > 0 && (
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3 mb-1.5">Self-reported</p>
          <div className="flex flex-wrap gap-1.5">
            {selfReported.map(s => (
              <span key={s} className="text-[10.5px] font-medium text-ink-3 bg-page border border-line px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}
      {verified.length === 0 && selfReported.length === 0 && (
        <p className="text-[11px] text-ink-3">No skills listed.</p>
      )}
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function CandidateDetailPanel({
  candidate: c, status, flexDetail, trustData, loadingFlex,
}: {
  candidate: PoolCandidate; status: RequestStatus | null
  flexDetail: FlexDetail | null; trustData: TrustData | null; loadingFlex: boolean
}) {
  const isApproved = status === 'approved'

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header — avatar + name + trust ring */}
      <div className="flex items-start gap-4 p-6 pb-5 border-b border-line">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {c.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={c.avatar_url} alt="" className="w-14 h-14 rounded-[14px] object-cover shrink-0" />
            : <span className="w-14 h-14 rounded-[14px] bg-orange-soft text-orange flex items-center justify-center text-[20px] font-bold shrink-0">
                {(c.full_name ?? c.username).charAt(0).toUpperCase()}
              </span>}
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-bold text-ink leading-tight">{c.full_name ?? c.username}</h3>
            <p className="text-[13px] text-ink-2 mt-0.5">{c.headline ?? '—'}</p>
            {(c.location_city || c.location_state) && (
              <p className="text-[12px] text-ink-3 mt-1">📍 {[c.location_city, c.location_state].filter(Boolean).join(', ')}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[9px] font-bold text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded-full">Open to work</span>
              {isApproved && <span className="text-[9px] font-bold text-orange bg-orange-soft border border-orange/20 px-1.5 py-0.5 rounded-full">Flex approved</span>}
            </div>
          </div>
        </div>
        {/* Trust Ring — shown when approved and data loaded */}
        {isApproved && trustData && !loadingFlex && (
          <TrustRing score={trustData.score} />
        )}
      </div>

      {/* Trust summary bar — approved only */}
      {isApproved && trustData && !loadingFlex && (
        <div className="px-6 py-4 border-b border-line">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">Proof of Work</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-page rounded-[10px] border border-line px-3 py-2.5 text-center">
              <p className="text-[18px] font-bold text-green leading-none">{trustData.verified_skills.length}</p>
              <p className="text-[9px] font-semibold text-ink-3 mt-1 leading-tight">Squad-verified<br/>skills</p>
            </div>
            <div className="bg-page rounded-[10px] border border-line px-3 py-2.5 text-center">
              <p className="text-[18px] font-bold text-teal leading-none">{trustData.squad_count}</p>
              <p className="text-[9px] font-semibold text-ink-3 mt-1 leading-tight">Squad<br/>confirmations</p>
            </div>
            <div className="bg-page rounded-[10px] border border-line px-3 py-2.5 text-center">
              <p className="text-[18px] font-bold text-purple leading-none">{trustData.vouch_count}</p>
              <p className="text-[9px] font-semibold text-ink-3 mt-1 leading-tight">Peer<br/>vouches</p>
            </div>
          </div>
        </div>
      )}

      {/* Email — approved only */}
      {isApproved && (
        <div className="px-6 py-4 border-b border-line">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-2">Contact</p>
          {loadingFlex
            ? <div className="h-7 bg-line rounded-[8px] animate-pulse w-52" />
            : flexDetail?.email
              ? (
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
                  <span className="text-[13px] text-ink font-medium">{flexDetail.email}</span>
                  <button onClick={() => { navigator.clipboard.writeText(flexDetail.email!); toast('Copied') }}
                    className="text-[10px] text-ink-3 hover:text-orange transition-colors px-1.5 py-0.5 rounded border border-line hover:border-orange/30 ml-1">
                    Copy
                  </button>
                </div>
              )
              : <p className="text-[12px] text-ink-3">Email unavailable</p>
          }
        </div>
      )}

      {/* About */}
      {c.about && (
        <div className="px-6 py-5 border-b border-line">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-2">About</p>
          <p className="text-[13px] text-ink-2 leading-relaxed whitespace-pre-wrap">{c.about}</p>
        </div>
      )}

      {/* Skills — split verified / self-reported */}
      {c.skills && c.skills.length > 0 && (
        <div className={`px-6 py-5 ${isApproved ? 'border-b border-line' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">Skills</p>
          {isApproved && trustData
            ? <SkillsSplit allSkills={c.skills} verifiedSkills={trustData.verified_skills} />
            : (
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map(s => (
                  <span key={s} className="text-[11px] font-medium text-ink-2 bg-page border border-line px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Locked notice — not approved */}
      {!isApproved && (
        <div className="px-6 pt-2 pb-6">
          <div className="bg-page border border-dashed border-line rounded-[12px] px-4 py-5 text-center">
            <div className="w-8 h-8 rounded-[9px] bg-line flex items-center justify-center mx-auto mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <p className="text-[12px] font-semibold text-ink">Experience & Education locked</p>
            <p className="text-[11px] text-ink-3 mt-1">
              {status === 'pending'
                ? 'Waiting for the candidate to approve your request.'
                : 'Request Flex access to unlock their full profile.'}
            </p>
          </div>
        </div>
      )}

      {/* Full flex — approved */}
      {isApproved && (
        <>
          {loadingFlex && (
            <div className="px-6 py-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className={`bg-line rounded-[12px] animate-pulse ${i === 1 ? 'h-20' : 'h-14'}`} />)}
            </div>
          )}
          {!loadingFlex && flexDetail && (
            <>
              {/* Experience */}
              {flexDetail.experience.length > 0 && (
                <div className="px-6 py-5 border-b border-line">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-4">Experience</p>
                  <div className="relative">
                    <div className="absolute left-3.5 top-0 bottom-0 w-px bg-line" />
                    <div className="space-y-5">
                      {flexDetail.experience.map(exp => (
                        <div key={exp.id} className="flex gap-4 relative">
                          <div className="w-7 h-7 rounded-[8px] bg-orange-soft text-orange flex items-center justify-center text-[11px] font-bold shrink-0 relative z-10">
                            {exp.company.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[13px] font-semibold text-ink">{exp.role}</p>
                                <p className="text-[11.5px] text-ink-2 mt-0.5">
                                  {exp.company}
                                  {exp.emp_type && <span className="text-ink-3"> · {exp.emp_type}</span>}
                                </p>
                                <p className="text-[10.5px] text-ink-3 mt-0.5">
                                  {fmtDate(exp.start_year, exp.start_month)} – {exp.currently_working ? 'Present' : exp.end_year ? fmtDate(exp.end_year, exp.end_month) : ''}
                                  {exp.location && ` · ${exp.location}`}
                                </p>
                              </div>
                              {/* Squad badge — verified count */}
                              {exp.squad_verified > 0 && (
                                <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-green bg-green/8 border border-green/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  {exp.squad_verified} Squad
                                </span>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-[11.5px] text-ink-2 mt-1.5 leading-relaxed">{exp.description}</p>
                            )}
                            {exp.skills_used && exp.skills_used.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {exp.skills_used.map(s => {
                                  const isVerified = exp.squad_verified > 0
                                  return (
                                    <span key={s} className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded-full ${
                                      isVerified
                                        ? 'text-green bg-green/8 border border-green/20'
                                        : 'text-ink-2 bg-page border border-line'
                                    }`}>
                                      {s}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {flexDetail.education.length > 0 && (
                <div className="px-6 py-5 border-b border-line">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">Education</p>
                  <div className="space-y-3">
                    {flexDetail.education.map(edu => (
                      <div key={edu.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-page border border-line flex items-center justify-center text-[14px] shrink-0">🎓</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p className="text-[13px] font-semibold text-ink">{edu.institution}</p>
                            {edu.squad_verified > 0 && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green bg-green/8 border border-green/20 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ml-2">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                {edu.squad_verified} Squad
                              </span>
                            )}
                          </div>
                          {(edu.degree || edu.field) && (
                            <p className="text-[11.5px] text-ink-2 mt-0.5">{[edu.degree, edu.field].filter(Boolean).join(' · ')}</p>
                          )}
                          <p className="text-[10.5px] text-ink-3 mt-0.5">
                            {edu.start_year && edu.end_year ? `${edu.start_year} – ${edu.end_year}` : edu.end_year ?? ''}
                            {edu.grade && ` · Grade: ${edu.grade}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {flexDetail.achievements.length > 0 && (
                <div className="px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">Achievements</p>
                  <div className="space-y-2">
                    {flexDetail.achievements.map(a => (
                      <div key={a.id} className="bg-page border border-line rounded-[12px] p-3">
                        <p className="text-[12px] font-semibold text-ink">⭐ {a.title}</p>
                        {a.description && <p className="text-[11px] text-ink-2 mt-1 leading-relaxed">{a.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {flexDetail.experience.length === 0 && flexDetail.education.length === 0 && flexDetail.achievements.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <p className="text-[12px] text-ink-3">Candidate hasn&apos;t added experience or education yet.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
