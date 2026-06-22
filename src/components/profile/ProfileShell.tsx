'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import { loadOnboarding } from '@/lib/onboarding'
import { hydrateFlexFromOnboarding } from '@/lib/flexFromDraft'
import type { ViewId, UserRole } from '@/lib/profileTypes'

import TopBar           from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import IdentityPanel, { MobileProfileNav } from '@/components/layout/IdentityPanel'
import EditProfilePanel from '@/components/profile/EditProfilePanel'
import CreateMenu       from '@/components/profile/CreateMenu'
import { ToastHost }    from '@/components/profile/ui/Toast'
import { RoleLine }     from '@/components/profile/ui/RoleBadges'

import MyFlexView       from '@/components/profile/views/MyFlexView'
import SquadsView       from '@/components/squads/SquadsLifecycleView'
import VouchesView      from '@/components/vouches/VouchesView'
import StashView        from '@/components/stash/StashLifecycleView'
import FlexSidePanel, { type FlexPanelMode } from '@/components/profile/FlexSidePanel'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import MyApplicationsView from '@/components/applications/MyApplicationsView'
import AlertsView       from '@/components/profile/views/AlertsView'
import SettingsView     from '@/components/profile/views/SettingsView'
import OverviewView     from '@/components/profile/views/OverviewView'
import RequestsView     from '@/components/profile/RequestsView'

import { getRoles } from '@/stubs/getIdentity'
import { listRoles } from '@/lib/roles'
import { createClient } from '@/lib/supabase/client'

interface Props { profile: Profile }

export default function ProfileShell({ profile: initialProfile }: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [view, setView]       = useState<ViewId>('my-flex')
  const [editOpen, setEditOpen]     = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [panel, setPanel] = useState<FlexPanelMode>(null)
  const router = useRouter()
  const [roles, setRoles] = useState<UserRole[]>([])

  // Roles from profile_roles; fall back to stubs only for the demo seed profile.
  useEffect(() => {
    listRoles(profile.id).then(r => {
      if (r.length) { setRoles(r); return }
      if (profile.username === 'naadhn') setRoles(getRoles())
    })
  }, [profile.id, profile.username])

  // Overlay onboarding identity so the profile reflects what you entered in /create.
  // Also writes the name back to the DB so Twin and applications stay in sync.
  useEffect(() => {
    const h = hydrateFlexFromOnboarding()
    const s = loadOnboarding()
    if (!s.completedAt) return
    setProfile(prev => ({
      ...prev,
      full_name: s.name || prev.full_name,
      headline: h?.headline ?? prev.headline,
      about: h?.about ?? prev.about,
      location_city: s.location || prev.location_city,
      skills: (h?.skills.length ? h.skills : prev.skills) ?? prev.skills,
    }))
    // Write name back to DB if onboarding has a name that differs from the DB value
    if (s.name && s.name !== initialProfile.full_name) {
      const supabase = createClient()
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) return
        supabase.from('profiles').update({ full_name: s.name }).eq('id', session.user.id).then(() => {})
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaved = (updates: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
    router.refresh()
  }
  const navigate = (v: ViewId) => {
    setView(v)
    document.getElementById('view-scroll')?.scrollTo({ top: 0, behavior: 'instant' })
  }
  const handleCreate = () => navigate('my-flex')

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <IconRail onCreateClick={() => setCreateOpen(true)} />
        <IdentityPanel
          profile={profile}
          roles={roles}
          activeView={view}
          onEditClick={() => setEditOpen(true)}
          onNavigate={navigate}
        />

        <main className="flex-1 relative overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
          {/* Grid is pinned to <main> (which never scrolls); the inner div scrolls over it. */}
          <InfiniteGridBackdrop />
          <div id="view-scroll" className="absolute inset-0 overflow-y-auto z-10">
          {/* Mobile sticky header — identity bar + chip nav pinned to top of scroll area */}
          <div className="lg:hidden sticky top-0 z-20">
            <div className="px-4 pt-3 pb-2.5 flex items-center gap-3 bg-card/95 backdrop-blur border-b border-line">
              <button
                onClick={() => setEditOpen(true)}
                title="Change photo"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white text-[15px] font-bold overflow-hidden shrink-0 relative group">
                {profile.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt={profile.full_name ?? profile.username} className="w-full h-full object-cover" />
                  : <span>{(profile.full_name ?? profile.username).charAt(0).toUpperCase()}</span>}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-semibold">Edit</span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-ink truncate leading-tight">{profile.full_name ?? profile.username}</p>
                <div className="mt-0.5"><RoleLine roles={roles} size="sm" /></div>
              </div>
              <button onClick={()=>setEditOpen(true)} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-ink-3 hover:bg-page transition-colors shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
            <MobileProfileNav activeView={view} onNavigate={navigate} />
          </div>

          <div className="px-4 lg:px-7 py-5 lg:py-6 pb-24 lg:pb-6 mx-auto lg:mx-0 relative z-10" style={{ maxWidth: '860px' }}>
            {view === 'rundown'         && (
              <OverviewView
                profile={profile} roles={roles}
                onNavigate={navigate}
                onOpenToWorkChange={open => setProfile(p => ({ ...p, open_to_work: open }))}
              />
            )}
            {view === 'my-flex'         && (
              <div className="space-y-3">
                {/* Desktop-only action bar — opens side panels. On mobile the Certificates section in MyFlex below already covers it; Audit with Twin is reachable from Twin tab. */}
                <div className="hidden lg:flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      const q = 'Audit my complete Flex right now. Go section by section — Headline, About, Experience, Skills, Trust Score breakdown, Squad confirmations, and Vouches. For each section tell me what\'s strong, what\'s missing, and the single most impactful thing to fix. End with a top-3 action list ordered by impact on my shortlist rate.'
                      router.push('/?q=' + encodeURIComponent(q))
                    }}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-purple bg-purple/10 border border-purple/20 hover:bg-purple/15 rounded-[10px] px-3 py-1.5 transition-colors">
                    ✦ Audit with Tiik
                  </button>
                </div>
                <MyFlexView profile={profile} roles={roles} onEditProfile={() => setEditOpen(true)} />
              </div>
            )}
            {view === 'squads'          && <SquadsView />}
            {view === 'vouches'         && <VouchesView userId={profile.id} />}
            {view === 'stash'           && <StashView />}
            {view === 'my-applications' && <MyApplicationsView />}
            {view === 'requests'        && <RequestsView />}
            {view === 'alerts'          && <AlertsView />}
            {view === 'settings'        && <SettingsView />}
          </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar onCreateClick={() => setCreateOpen(true)} />

      {editOpen   && <EditProfilePanel profile={profile} roles={roles} onRolesChange={setRoles} onClose={()=>setEditOpen(false)} onSaved={handleSaved} />}
      {createOpen && <CreateMenu onSelect={handleCreate} onClose={()=>setCreateOpen(false)} />}
      <FlexSidePanel mode={panel} onClose={() => setPanel(null)} />
      <ToastHost />
    </div>
  )
}
