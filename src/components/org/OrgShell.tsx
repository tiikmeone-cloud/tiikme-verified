'use client'

import { useState, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { Card } from '@/components/profile/ui/Primitives'
import { ToastHost, toast } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import PostJobForm from '@/components/org/PostJobForm'
import PostUpdateModal from '@/components/org/PostUpdateModal'
import LiveApplyModal, { type LiveJobForApply } from '@/components/applications/LiveApplyModal'
import OrgSquadDensity from '@/components/squads/OrgSquadDensity'
import VouchModal from '@/components/vouches/VouchModal'
import { useEffect } from 'react'
import { getOrgIdBySlug, isOwnerOfOrg, deleteOrgJob } from '@/lib/applications'
import { listOrgLearnItems, deleteLearnItem, type LearnItem } from '@/lib/learn'
import LevelUpPostForm from '@/components/jobs/LevelUpPostForm'
import AvatarUpload from '@/components/ui/AvatarUpload'
import OrgEditModal, { type OrgEditData } from '@/components/org/modals/OrgEditModal'
import { createClient } from '@/lib/supabase/client'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import type { getOrg } from '@/stubs/getExplore'
import { getOpenings } from '@/stubs/getJobs'

type Org = NonNullable<ReturnType<typeof getOrg>>
type ScreenQ = { q: string; kind: string; expected?: string | null; options?: string[]; must_have?: boolean }
type LiveJob = {
  id: string; title: string; job_type: string | null; work_mode: string | null
  location: string | null; salary: string | null; screening: ScreenQ[]
  apply_mode: string | null; external_url: string | null
}
type Tab = 'jobs' | 'people' | 'about' | 'levelup'

export default function OrgShell({ org, initialIsOwner = false }: { org: Org; initialIsOwner?: boolean }) {
  const [connected, setConnected] = useState(!!org.following)
  const [followerCount, setFollowerCount] = useState(org.followers)
  const [followersOpen, setFollowersOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [jobOpen, setJobOpen] = useState(false)
  const [orgEditOpen, setOrgEditOpen] = useState(false)
  const [postMenuOpen, setPostMenuOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('about')
  const [orgIdState, setOrgIdState] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(org.logoUrl ?? null)

  // Editable org fields — overlaid on top of stub data once loaded from DB
  const [tagline, setTagline] = useState<string>(org.tagline ?? '')
  const [highlights, setHighlights] = useState<string[]>(org.highlights ?? [])
  const [orgMission, setOrgMission] = useState(org.mission ?? '')
  const [orgAbout, setOrgAbout] = useState(org.about ?? '')
  const [orgType, setOrgType] = useState(org.type ?? '')
  const [orgHQ, setOrgHQ] = useState(org.location ?? '')
  const [orgFounded, setOrgFounded] = useState(org.founded ?? '')
  const [orgSize, setOrgSize] = useState(org.size ?? '')
  const [orgFunding, setOrgFunding] = useState(org.funding ?? '')
  const [orgWebsite, setOrgWebsite] = useState(org.website ?? '')
  const [orgSocialLinks, setOrgSocialLinks] = useState<{ linkedin?: string; twitter?: string; github?: string; instagram?: string }>({})
  const [orgTechStack, setOrgTechStack] = useState<string[]>(org.techStack ?? [])
  const [orgPerks, setOrgPerks] = useState<string[]>(org.perks ?? [])
  const [orgLeadership, setOrgLeadership] = useState<{ id: string; name: string; title: string; background: string }[]>(
    (org.leadership ?? []).map((l, i) => ({ id: String(i), name: l.name, title: l.title, background: l.background ?? '' }))
  )

  const toggleConnect = () => {
    setConnected(c => {
      setFollowerCount(n => c ? n - 1 : n + 1)
      return !c
    })
    toast(connected
      ? `Disconnected from ${org.name}`
      : `Connected to ${org.name} ✓  ·  Their posts will land in your feed`)
  }

  const [vouchFor, setVouchFor] = useState<{ jobId: string; title: string } | null>(null)
  const [realJobs, setRealJobs] = useState<LiveJob[]>([])
  const [isOwner, setIsOwner] = useState(initialIsOwner)
  const [applyJob, setApplyJob] = useState<LiveJobForApply | null>(null)
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<LiveJob | null>(null)
  const [deletingJob, setDeletingJob] = useState(false)
  const [editJobOpen, setEditJobOpen] = useState<LiveJob | null>(null)

  // Level Up items posted by this org
  const [learnItems, setLearnItems] = useState<LearnItem[]>([])
  const [learnFormOpen, setLearnFormOpen] = useState(false)
  const [editLearnItem, setEditLearnItem] = useState<LearnItem | null>(null)
  const [deleteLearnConfirm, setDeleteLearnConfirm] = useState<LearnItem | null>(null)
  const [deletingLearn, setDeletingLearn] = useState(false)
  const [reviews, setReviews] = useState(org.reviews)

  // Load all live org fields from DB, overlaying stub data
  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('orgs')
        .select('id, logo_url, tagline, highlights, about, mission, type, location, founded, size, funding, website, social_links, tech_stack, perks, leadership_json')
        .eq('slug', org.slug)
        .maybeSingle()
      if (!data) return
      setOrgIdState(data.id)
      if (data.logo_url)   setLogoUrl(data.logo_url)
      if (data.tagline)    setTagline(data.tagline)
      if (Array.isArray(data.highlights) && data.highlights.length) setHighlights(data.highlights)
      if (data.about)      setOrgAbout(data.about)
      if (data.mission)    setOrgMission(data.mission)
      if (data.type)       setOrgType(data.type)
      if (data.location)   setOrgHQ(data.location)
      if (data.founded)    setOrgFounded(data.founded)
      if (data.size)       setOrgSize(data.size)
      if (data.funding)    setOrgFunding(data.funding)
      if (data.website)    setOrgWebsite(data.website)
      if (data.social_links && typeof data.social_links === 'object') setOrgSocialLinks(data.social_links as typeof orgSocialLinks)
      if (Array.isArray(data.tech_stack) && data.tech_stack.length) setOrgTechStack(data.tech_stack)
      if (Array.isArray(data.perks) && data.perks.length) setOrgPerks(data.perks)
      if (Array.isArray(data.leadership_json) && data.leadership_json.length) setOrgLeadership(data.leadership_json as typeof orgLeadership)
    })()
  }, [org.slug])

  const handleLogoUploaded = async (publicUrl: string) => {
    if (!orgIdState) return
    setLogoUrl(publicUrl)
    const supabase = createClient()
    await supabase.from('orgs').update({ logo_url: publicUrl }).eq('id', orgIdState)
    toast('Logo updated ✓')
  }

  const saveOrgEdit = async (data: OrgEditData) => {
    if (!orgIdState) return
    const supabase = createClient()
    const { error } = await supabase.from('orgs').update({
      tagline:         data.tagline || null,
      highlights:      data.highlights,
      mission:         data.mission || null,
      about:           data.about || null,
      type:            data.orgType || null,
      location:        data.location || null,
      founded:         data.founded || null,
      size:            data.size || null,
      funding:         data.funding || null,
      website:         data.website || null,
      social_links:    data.socialLinks,
      tech_stack:      data.techStack,
      perks:           data.perks,
      leadership_json: data.leadership,
    }).eq('id', orgIdState)
    if (error) { toast('Save failed — try again'); return }
    // Update local state
    setTagline(data.tagline)
    setHighlights(data.highlights)
    setOrgMission(data.mission)
    setOrgAbout(data.about)
    setOrgType(data.orgType)
    setOrgHQ(data.location)
    setOrgFounded(data.founded)
    setOrgSize(data.size)
    setOrgFunding(data.funding)
    setOrgWebsite(data.website)
    setOrgSocialLinks(data.socialLinks)
    setOrgTechStack(data.techStack)
    setOrgPerks(data.perks)
    setOrgLeadership(data.leadership.map((l: { id: string; name: string; title: string; background?: string }) => ({ ...l, background: l.background ?? '' })))
    setOrgEditOpen(false)
    toast('Org profile saved ✓')
  }

  const loadJobs = useCallback(async () => {
    const supabase = createClient()
    const oid = await getOrgIdBySlug(org.slug)
    const dbList: LiveJob[] = oid ? (() => {
      // fire-and-forget — we'll merge below; return [] synchronously
      return []
    })() : []

    const { data: jobs } = oid
      ? await supabase.from('org_jobs')
          .select('id, title, job_type, work_mode, location, salary, screening, apply_mode, external_url')
          .eq('org_id', oid).eq('is_open', true)
          .order('posted_at', { ascending: false })
      : { data: [] }

    const dbJobs = (jobs as LiveJob[]) ?? []
    const dbIds = new Set(dbJobs.map(j => j.id))

    const stubJobs: LiveJob[] = getOpenings()
      .filter(o => o.orgSlug === org.slug)
      .filter(o => !dbIds.has(o.id))
      .map(o => ({
        id: o.id,
        title: o.title,
        job_type: o.type,
        work_mode: o.mode,
        location: o.location,
        salary: o.salary,
        screening: [],
        apply_mode: o.applyMode,
        external_url: o.externalUrl ?? null,
      }))

    setRealJobs([...dbJobs, ...stubJobs])
    void dbList
  }, [org.slug])

  useEffect(() => { loadJobs() }, [loadJobs])

  const loadLearnItems = useCallback(async () => {
    if (!orgIdState) return
    const items = await listOrgLearnItems(orgIdState)
    setLearnItems(items)
  }, [orgIdState])

  useEffect(() => { loadLearnItems() }, [loadLearnItems])

  const confirmDeleteLearn = async () => {
    if (!deleteLearnConfirm) return
    setDeletingLearn(true)
    const { error } = await deleteLearnItem(deleteLearnConfirm.id)
    if (!error) { toast(`"${deleteLearnConfirm.title}" removed`); await loadLearnItems() }
    else toast('Delete failed — try again')
    setDeleteLearnConfirm(null)
    setDeletingLearn(false)
  }

  const confirmDeleteJob = async () => {
    if (!deleteConfirmJob) return
    setDeletingJob(true)
    const ok = await deleteOrgJob(deleteConfirmJob.id)
    if (ok) { toast(`"${deleteConfirmJob.title}" deleted`); await loadJobs() }
    else toast('Delete failed — try again')
    setDeleteConfirmJob(null)
    setDeletingJob(false)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id:'jobs',     label:`Jobs ${org.openRoles}` },
    { id:'people',   label:'People' },
    { id:'about',    label:'About' },
    { id:'levelup',  label:`Level Up${learnItems.length ? ` ${learnItems.length}` : ''}` },
  ]

  // Social links to show in About
  const socialEntries = Object.entries(orgSocialLinks).filter(([, v]) => !!v) as [string, string][]
  const socialIcons: Record<string, string> = {
    linkedin: '💼', twitter: '🐦', github: '🐙', instagram: '📸'
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor:'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active={isOwner ? 'profile' : 'jobs'} onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 relative overflow-hidden" style={{ backgroundColor:'var(--color-page)' }}>
          <InfiniteGridBackdrop />
          <div className="absolute inset-0 overflow-y-auto z-10">
          <div className="mx-auto pt-6 pb-24 lg:pb-8" style={{ maxWidth:'820px' }}>
            <div className="px-4 lg:px-6">
              {/* back nav */}
              <button onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = '/opportunities' }}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 hover:text-ink transition-colors mb-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                Back
              </button>

              {/* Header card */}
              <Card className="p-5 relative">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-20 h-20 rounded-[20px] flex items-center justify-center text-white text-[32px] font-bold shrink-0 overflow-hidden" style={{ backgroundColor: org.logoColor }}>
                    {logoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={logoUrl} alt={org.name} className="w-full h-full object-cover" />
                      : <span>{org.name.charAt(0)}</span>}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h1 className="text-[19px] font-bold text-ink">{org.name}</h1>
                          {org.verified && <svg width="16" height="16" viewBox="0 0 24 24" fill="#6D4BD8"><path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/><path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/></svg>}
                        </div>
                        <p className="text-[13px] text-ink-2 mt-0.5">{orgType || org.type} · {orgHQ || org.location}</p>
                        {tagline && <p className="text-[12px] text-ink-3 mt-1">{tagline}</p>}
                        {highlights.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {highlights.slice(0,2).map((h, i) => (
                              <li key={i} className="text-[11.5px] text-ink-2 flex items-start gap-1.5"><span className="text-orange mt-0.5">•</span><span>{h}</span></li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Owner: pencil edit button */}
                      {isOwner && (
                        <button onClick={() => setOrgEditOpen(true)} title="Edit org profile"
                          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-page transition-colors shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <StatBtn n={fmt(followerCount)} l="Connected" onClick={() => setFollowersOpen(true)} />
                  <StatBtn n={org.openRoles} l="Open roles" onClick={() => setTab('jobs')} />
                  <StatBtn n={<span className="flex items-center gap-0.5">{org.avgRating}<span className="text-amber text-[12px]">★</span></span>} l="Rating" onClick={() => setTab('people')} />
                  <div className="flex-1" />

                  {/* Connect — icon-only, hidden for owner */}
                  {!isOwner && (
                    <button
                      onClick={toggleConnect}
                      title={connected ? `Unfollow ${org.name}` : `Follow ${org.name}`}
                      className={[
                        'w-9 h-9 rounded-[11px] flex items-center justify-center transition-all',
                        connected
                          ? 'bg-orange/10 text-orange border border-orange/30 hover:bg-orange/15'
                          : 'bg-gradient-to-br from-orange to-orange-2 text-white shadow-[0_3px_10px_rgba(255,92,40,.35)] hover:opacity-95',
                      ].join(' ')}>
                      {connected
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
                    </button>
                  )}
                </div>
              </Card>

              {/* Tabs + single Post dropdown */}
              <div className="flex items-center gap-2 mt-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                  {TABS.map(t => (
                    <button key={t.id} onClick={()=>setTab(t.id)} className={['px-4 py-1.5 text-[12px] font-semibold rounded-full whitespace-nowrap transition-colors shrink-0', tab===t.id?'bg-orange text-white':'bg-card text-ink-2 border border-line hover:bg-line'].join(' ')}>{t.label}</button>
                  ))}
                </div>
                {isOwner && (
                  <div className="relative shrink-0">
                    <button onClick={() => setPostMenuOpen(o => !o)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-1.5 rounded-full bg-orange text-white hover:bg-orange-2 transition-colors whitespace-nowrap">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Post
                    </button>
                    {postMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setPostMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1.5 z-[91] bg-card border border-line rounded-[12px] shadow-[0_8px_24px_-8px_rgba(0,0,0,.18)] overflow-hidden min-w-[160px]">
                          <button onClick={() => { setPostMenuOpen(false); setJobOpen(true) }}
                            className="w-full text-left px-4 py-2.5 text-[12.5px] font-medium text-ink hover:bg-page transition-colors">
                            Post a role
                          </button>
                          <button onClick={() => { setPostMenuOpen(false); setEditLearnItem(null); setLearnFormOpen(true) }}
                            className="w-full text-left px-4 py-2.5 text-[12.5px] font-medium text-ink hover:bg-page transition-colors border-t border-line">
                            Post to Level Up
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-4">

                {tab==='jobs' && (
                  <>
                    {realJobs.length === 0 && isOwner && (
                      <div className="text-center py-12 bg-card border border-dashed border-line rounded-[16px]">
                        <p className="text-[14px] font-semibold text-ink">No open roles yet</p>
                        <p className="text-[12px] text-ink-3 mt-1 mb-4">Post your first role to start receiving applications.</p>
                        <button onClick={() => setJobOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-[12px] bg-orange text-white hover:bg-orange-2 transition-colors">
                          Post a role
                        </button>
                      </div>
                    )}
                    {realJobs.length === 0 && !isOwner && (
                      <div className="text-center py-12">
                        <p className="text-[13px] text-ink-3">No open roles at the moment.</p>
                      </div>
                    )}
                    {realJobs.map(j => {
                      const isExternal = j.apply_mode === 'external' && j.external_url
                      return (
                      <Card key={j.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold shrink-0 overflow-hidden" style={{ backgroundColor: org.logoColor }}>
                            {logoUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                              : org.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-ink truncate">{j.title}</p>
                            <p className="text-[11px] text-ink-3 truncate mt-0.5">{[j.job_type, j.work_mode, j.location, j.salary].filter(Boolean).join(' · ') || 'Open role'}</p>
                          </div>
                          {isOwner ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setEditJobOpen(j)}
                                title="Edit role"
                                className="w-8 h-8 flex items-center justify-center rounded-[9px] bg-page border border-line text-ink-3 hover:text-orange hover:border-orange/30 transition-colors">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button
                                onClick={() => setDeleteConfirmJob(j)}
                                title="Delete role"
                                className="w-8 h-8 flex items-center justify-center rounded-[9px] bg-page border border-line text-ink-3 hover:text-red hover:border-red/20 transition-colors">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              </button>
                              <a href={`/org/${org.slug}/talent?job=${j.id}`}
                                className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors">
                                Applicants
                              </a>
                            </div>
                          ) : isExternal ? (
                            <a href={j.external_url!} target="_blank" rel="noopener noreferrer"
                              className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors shrink-0 inline-flex items-center gap-1">
                              Apply ↗
                            </a>
                          ) : (
                            <button onClick={() => setApplyJob({ id: j.id, title: j.title, org_name: org.name, screening: (j.screening ?? []) as Record<string, unknown>[] })}
                              className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors shrink-0">
                              Apply with Flex
                            </button>
                          )}
                        </div>
                        {isExternal && !isOwner && (
                          <p className="text-[10.5px] text-ink-3 mt-1.5 ml-14">Redirects to careers page ↗ · tracked by tiikme</p>
                        )}
                      </Card>
                      )
                    })}
                  </>
                )}

                {tab==='levelup' && (
                  <>
                    {isOwner && (
                      <p className="text-[12px] text-ink-3 mb-2">Courses, certificates and hackathons your org has published to Level Up.</p>
                    )}
                    {learnItems.length === 0 && (
                      <div className="text-center py-12 bg-card border border-dashed border-line rounded-[16px]">
                        <p className="text-[14px] font-semibold text-ink">{isOwner ? 'No Level Up posts yet' : 'No listings yet'}</p>
                        <p className="text-[12px] text-ink-3 mt-1 mb-4">{isOwner ? 'Share a course, certificate programme or hackathon you run.' : 'Check back later.'}</p>
                        {isOwner && (
                          <button onClick={() => { setEditLearnItem(null); setLearnFormOpen(true) }}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-[12px] bg-orange text-white hover:bg-orange-2 transition-colors">
                            Post to Level Up
                          </button>
                        )}
                      </div>
                    )}
                    <div className="space-y-3">
                      {learnItems.map(item => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white text-[13px] font-bold shrink-0" style={{ backgroundColor: item.provider_color ?? '#FF5C28' }}>
                              {item.kind === 'hackathon' ? '⚡' : item.kind === 'certificate' ? '🏅' : '📖'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13.5px] font-semibold text-ink truncate">{item.title}</p>
                              <p className="text-[11px] text-ink-3 truncate mt-0.5">
                                {[item.kind.charAt(0).toUpperCase() + item.kind.slice(1), item.provider, item.duration ?? (item.deadline ? `Deadline ${item.deadline}` : null)].filter(Boolean).join(' · ')}
                              </p>
                              {item.expires_at && (
                                <p className="text-[10.5px] text-amber mt-0.5">Expires {new Date(item.expires_at).toLocaleDateString()}</p>
                              )}
                            </div>
                            {isOwner ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => { setEditLearnItem(item); setLearnFormOpen(true) }} title="Edit"
                                  className="w-8 h-8 flex items-center justify-center rounded-[9px] bg-page border border-line text-ink-3 hover:text-orange hover:border-orange/30 transition-colors">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button onClick={() => setDeleteLearnConfirm(item)} title="Delete"
                                  className="w-8 h-8 flex items-center justify-center rounded-[9px] bg-page border border-line text-ink-3 hover:text-red hover:border-red/20 transition-colors">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                              </div>
                            ) : item.url ? (
                              <a href={item.url} target="_blank" rel="noopener noreferrer"
                                className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors shrink-0 inline-flex items-center gap-1">
                                View ↗
                              </a>
                            ) : null}
                          </div>
                          {item.summary && <p className="text-[11.5px] text-ink-3 mt-2.5 ml-13 leading-relaxed line-clamp-2">{item.summary}</p>}
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {tab==='people' && (
                  <>
                    {/* Leadership */}
                    {orgLeadership.length > 0 && (
                      <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[14px] font-bold text-ink">Leadership</p>
                          {isOwner && (
                            <button onClick={() => setOrgEditOpen(true)}
                              className="text-[11px] font-semibold text-orange hover:opacity-80 transition-opacity">
                              Edit →
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {orgLeadership.map((l, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-[11px] bg-page">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white text-[16px] font-bold shrink-0">
                                {l.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-ink truncate">{l.name}</p>
                                <p className="text-[11px] font-medium text-orange truncate">{l.title}</p>
                                {l.background && <p className="text-[10.5px] text-ink-3 truncate">{l.background}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {isOwner && orgLeadership.length === 0 && (
                          <button onClick={() => setOrgEditOpen(true)} className="text-[12px] font-semibold text-orange">+ Add leadership team →</button>
                        )}
                      </Card>
                    )}
                    {isOwner && orgLeadership.length === 0 && (
                      <button onClick={() => setOrgEditOpen(true)}
                        className="w-full text-left text-[12px] font-semibold text-orange bg-orange/5 border border-orange/20 rounded-[14px] px-4 py-3 hover:bg-orange/8 transition-colors">
                        + Add leadership team — appears here for candidates
                      </button>
                    )}

                    {/* Squad density */}
                    <SquadsTabContent slug={org.slug} name={org.name} />

                    {/* Verified employees */}
                    <Card className="p-5">
                      <p className="text-[14px] font-bold text-ink mb-1">Verified employees</p>
                      <p className="text-[11px] text-ink-3 mb-3">Squad members surface first — these are the warmest intro paths.</p>
                      <div className="space-y-2">
                        {org.members.map((m,i)=>(
                          <a key={i} href="/profile/naadhn" className="flex items-center gap-3 p-2.5 rounded-[11px] hover:bg-page transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1"><p className="text-[13px] font-semibold text-ink">Team member</p><p className="text-[11px] text-ink-3">{i===0?'In your squad · ':''}Works at {org.name}</p></div>
                            <span className="text-[10px] font-semibold text-green bg-green/10 px-2 py-0.5 rounded-full">✓ Verified</span>
                          </a>
                        ))}
                      </div>
                    </Card>

                    <p className="text-[13px] font-bold text-ink pt-1">Reviews</p>
                    <Card className="p-5 flex items-center gap-4">
                      <div className="text-center"><div className="text-[28px] font-black text-ink leading-none">{org.avgRating}</div><div className="text-amber text-[12px]">★★★★★</div><div className="text-[10px] text-ink-3 mt-0.5">{org.reviews.length} reviews</div></div>
                      <p className="text-[12px] text-ink-2 leading-snug flex-1">Reviews come from verified current &amp; former team members on tiikme.</p>
                    </Card>
                    {reviews.map((r,i)=>(
                      <Card key={i} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1 text-amber text-[12px]">{'★'.repeat(r.rating)}<span className="text-line">{'★'.repeat(5-r.rating)}</span></div>
                          {isOwner && (
                            <button
                              onClick={() => setReviews(prev => prev.filter((_,j) => j !== i))}
                              title="Delete review"
                              className="text-ink-4 hover:text-red transition-colors p-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold text-ink mt-1">{r.title}</p>
                        <p className="text-[12px] text-ink-2 mt-0.5 leading-snug">{r.body}</p>
                        <p className="text-[11px] text-ink-3 mt-1.5">— {r.by}</p>
                      </Card>
                    ))}
                  </>
                )}

                {tab==='about' && (
                  <>
                    {/* Mission */}
                    <Card className="p-6 relative">
                      {isOwner && (
                        <button onClick={() => setOrgEditOpen(true)} title="Edit org profile"
                          className="absolute top-4 right-4 text-[11px] font-semibold text-orange hover:opacity-80 transition-opacity">
                          Edit →
                        </button>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-orange mb-2">Our mission</p>
                      {orgMission || org.mission
                        ? <p className="text-[17px] font-bold text-ink leading-snug">{orgMission || org.mission}</p>
                        : isOwner
                          ? <button onClick={() => setOrgEditOpen(true)} className="text-[13px] text-ink-3 italic">+ Add your mission statement</button>
                          : <p className="text-[13px] text-ink-3 italic">No mission statement yet.</p>
                      }
                    </Card>

                    {/* Key figures */}
                    <Card className="p-5">
                      <p className="text-[14px] font-bold text-ink mb-3">Key figures</p>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <Fact l="Founded"  v={orgFounded  || org.founded} />
                        <Fact l="Team size" v={orgSize    || org.size} />
                        <Fact l="Funding"  v={orgFunding  || org.funding} />
                        <Fact l="HQ"       v={orgHQ       || org.location} />
                        <Fact l="On tiikme" v={`${org.memberCount} people`} />
                        <Fact l="Rating"   v={`${org.avgRating} ★`} />
                      </div>
                    </Card>

                    {/* What they do */}
                    <Card className="p-5">
                      <p className="text-[14px] font-bold text-ink mb-2">What they do</p>
                      <p className="text-[13px] text-ink-2 leading-relaxed">{orgAbout || org.about}</p>
                      {orgTechStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">{orgTechStack.map(t=><span key={t} className="text-[11px] font-medium text-ink-2 bg-page px-2.5 py-1 rounded-full">{t}</span>)}</div>
                      )}
                    </Card>

                    {/* Why join */}
                    <Card className="p-5">
                      <p className="text-[14px] font-bold text-ink mb-3">Why join {org.name}</p>
                      {org.values.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {org.values.map(v=>(<div key={v.title} className="flex gap-2.5"><span className="text-orange mt-0.5">✦</span><div><p className="text-[13px] font-semibold text-ink">{v.title}</p><p className="text-[12px] text-ink-2 mt-0.5 leading-snug">{v.body}</p></div></div>))}
                        </div>
                      )}
                      {orgPerks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {orgPerks.map(p=><span key={p} className="text-[11px] font-medium text-teal bg-teal/8 border border-teal/15 px-2.5 py-1 rounded-full">{p}</span>)}
                        </div>
                      )}

                      {/* Website & social links */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        {orgWebsite && (
                          <a href={orgWebsite} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange hover:opacity-80 transition-opacity">
                            🌐 {orgWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                          </a>
                        )}
                        {socialEntries.map(([platform, url]) => (
                          <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-2 hover:text-orange transition-colors">
                            {socialIcons[platform] ?? '🔗'} {platform.charAt(0).toUpperCase() + platform.slice(1)} ↗
                          </a>
                        ))}
                        {isOwner && !orgWebsite && socialEntries.length === 0 && (
                          <button onClick={() => setOrgEditOpen(true)} className="text-[12px] font-semibold text-orange">+ Add website & social links →</button>
                        )}
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>

      <MobileTabBar active={isOwner ? 'profile' : 'jobs'} onCreateClick={() => setCreateOpen(true)} />
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      {postOpen && <PostUpdateModal orgSlug={org.slug} orgName={org.name} onClose={() => setPostOpen(false)} />}
      {jobOpen && <PostJobForm orgSlug={org.slug} orgName={org.name} onPosted={loadJobs} onClose={() => setJobOpen(false)} />}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {editJobOpen && <PostJobForm orgSlug={org.slug} orgName={org.name} onPosted={() => { loadJobs(); setEditJobOpen(null) }} onClose={() => setEditJobOpen(null)} editJob={editJobOpen as any} />}

      {/* Delete role confirm */}
      {deleteConfirmJob && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[300] flex items-center justify-center p-5">
          <div className="bg-card border border-line rounded-[18px] shadow-xl p-6 max-w-sm w-full">
            <p className="text-[15px] font-bold text-ink mb-1.5">Delete this role?</p>
            <p className="text-[12.5px] text-ink-3 leading-relaxed mb-5">
              <span className="font-semibold text-ink">{deleteConfirmJob.title}</span> will be removed from the jobs board and closed to new applicants. Existing applicants are kept in your talent pool.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteConfirmJob(null)} className="flex-1 text-[13px] font-semibold text-ink-3 bg-page border border-line rounded-[11px] py-2.5 hover:text-ink transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteJob} disabled={deletingJob} className="flex-1 text-[13px] font-semibold text-white bg-red rounded-[11px] py-2.5 hover:bg-red/90 disabled:opacity-50 transition-colors">
                {deletingJob ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {applyJob && <LiveApplyModal job={applyJob} onClose={() => setApplyJob(null)} onApplied={loadJobs} />}

      {/* Level Up: post or edit */}
      {learnFormOpen && (
        <LevelUpPostForm
          orgId={orgIdState ?? undefined}
          orgLogoUrl={logoUrl}
          orgColor={org.logoColor}
          editItem={editLearnItem ?? undefined}
          onClose={() => { setLearnFormOpen(false); setEditLearnItem(null) }}
          onPosted={() => { loadLearnItems(); setLearnFormOpen(false); setEditLearnItem(null) }}
        />
      )}

      {/* Level Up: delete confirm */}
      {deleteLearnConfirm && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[300] flex items-center justify-center p-5">
          <div className="bg-card border border-line rounded-[18px] shadow-xl p-6 max-w-sm w-full">
            <p className="text-[15px] font-bold text-ink mb-1.5">Remove this listing?</p>
            <p className="text-[12.5px] text-ink-3 leading-relaxed mb-5">
              <span className="font-semibold text-ink">{deleteLearnConfirm.title}</span> will no longer appear in Level Up.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteLearnConfirm(null)} className="flex-1 text-[13px] font-semibold text-ink-3 bg-page border border-line rounded-[11px] py-2.5 hover:text-ink transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteLearn} disabled={deletingLearn} className="flex-1 text-[13px] font-semibold text-white bg-red rounded-[11px] py-2.5 hover:bg-red/90 disabled:opacity-50 transition-colors">
                {deletingLearn ? 'Removing…' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
      {vouchFor && (
        <VouchModal
          jobId={vouchFor.jobId}
          jobTitle={vouchFor.title}
          orgName={org.name}
          onClose={() => setVouchFor(null)}
        />
      )}
      {orgEditOpen && (
        <OrgEditModal
          initial={{
            tagline, highlights,
            mission: orgMission, about: orgAbout,
            orgType, location: orgHQ,
            founded: orgFounded, size: orgSize, funding: orgFunding,
            website: orgWebsite, socialLinks: orgSocialLinks,
            techStack: orgTechStack, perks: orgPerks,
            leadership: orgLeadership,
          }}
          orgId={orgIdState}
          logoUrl={logoUrl}
          onClose={() => setOrgEditOpen(false)}
          onSave={saveOrgEdit}
          onLogoUploaded={url => { setLogoUrl(url); toast('Logo updated ✓') }}
        />
      )}
      {/* Followers sheet */}
      {followersOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ animation: 'tk-backdrop-in 0.2s ease both' }}>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-[6px]"
            onClick={() => setFollowersOpen(false)}
          />
          {/* sheet */}
          <div
            className="relative w-full max-w-[480px] z-[201]"
            style={{ animation: 'tk-sheet-up 0.36s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* glass panel */}
            <div className="bg-card/95 backdrop-blur-2xl rounded-t-[28px] overflow-hidden"
              style={{
                boxShadow: '0 -2px 0 0 rgba(255,255,255,0.06) inset, 0 -24px 60px -8px rgba(0,0,0,0.28)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
              {/* drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-[3.5px] rounded-full bg-line" />
              </div>
              {/* header */}
              <div className="px-5 pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-[17px] font-black text-ink leading-none">{fmt(followerCount)}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">following {org.name}</p>
                </div>
                <button
                  onClick={() => setFollowersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-page hover:bg-line transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-ink-3">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="h-px bg-line mx-5" />
              {/* body */}
              <div className="px-5 py-4" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
                {org.members.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-3">From your squad</p>
                    <div className="space-y-3 mb-4">
                      {org.members.slice(0, 3).map((av, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-[14px] bg-page hover:bg-line/40 transition-colors">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={av} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-line" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-ink truncate">Squad member</p>
                            <p className="text-[11px] text-ink-3 truncate">Connected to {org.name}</p>
                          </div>
                          <span className="text-[9.5px] font-bold text-orange bg-orange/10 border border-orange/20 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">Squad</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-line mb-4" />
                  </>
                )}
                <p className="text-[12px] text-ink-3 text-center leading-relaxed">
                  People from your squad who follow {org.name} will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastHost />
    </div>
  )
}

function StatBtn({ n, l, onClick }: { n: React.ReactNode; l: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left hover:opacity-70 transition-opacity">
      <div className="text-[16px] font-black text-ink leading-none">{n}</div>
      <div className="text-[10px] text-ink-3 mt-0.5">{l}</div>
    </button>
  )
}
function Fact({ l, v }: { l: string; v: string }) {
  return <div className="bg-page rounded-[10px] px-3 py-2"><p className="text-[10px] text-ink-3">{l}</p><p className="text-[13px] font-semibold text-ink mt-0.5">{v}</p></div>
}
function fmt(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : `${n}` }

function SquadsTabContent({ slug, name }: { slug: string; name: string }) {
  const [orgId, setOrgId] = useState<string | null>(null)
  useEffect(() => { getOrgIdBySlug(slug).then(setOrgId) }, [slug])
  if (!orgId) return <p className="text-[12px] text-ink-3 py-8 text-center">Loading squad data…</p>
  return <OrgSquadDensity orgId={orgId} orgName={name} />
}
