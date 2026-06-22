'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import type { UserRole, RoleType } from '@/lib/profileTypes'
import SmartSelect from '@/components/ui/SmartSelect'
import Toggle from '@/components/profile/ui/Toggle'
import AvatarUpload from '@/components/ui/AvatarUpload'
import TopHighlightsModal from '@/components/profile/modals/TopHighlightsModal'
import { listRoles, replaceRoles } from '@/lib/roles'
import { enqueueProfileText, triggerUserEmbed } from '@/lib/embeddings'

interface Props {
  profile: Profile
  roles: UserRole[]
  onRolesChange: (roles: UserRole[]) => void
  onClose: () => void
  onSaved: (updated: Partial<Profile>) => void
}

export default function EditProfilePanel({ profile, roles, onRolesChange, onClose, onSaved }: Props) {
  const [localRoles, setLocalRoles] = useState<UserRole[]>(roles)
  // Hydrate localRoles from DB on open so the panel always reflects what's persisted.
  useEffect(() => { listRoles(profile.id).then(r => { if (r.length) setLocalRoles(r) }) }, [profile.id])

  // Current job from flex_experience (drives the primary role display)
  const [currentExp, setCurrentExp] = useState<{ role: string; company: string } | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.from('flex_experience')
      .select('role, company')
      .eq('user_id', profile.id)
      .eq('currently_working', true)
      .order('start_year', { ascending: false })
      .order('start_month', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCurrentExp(data))
  }, [profile.id])

  // Identity chips — non-work parallel identity types the user has enabled
  const IDENTITY_TYPES: { type: RoleType; emoji: string; label: string; sub: string }[] = [
    { type: 'founder',  emoji: '🚀', label: 'Building',    sub: 'founding or co-founding something' },
    { type: 'investor', emoji: '📈', label: 'Investing',   sub: 'angel investing or VC' },
    { type: 'creator',  emoji: '✨', label: 'Creating',    sub: 'content, newsletter, podcast' },
    { type: 'gig',      emoji: '⚡', label: 'Freelancing', sub: 'open to consulting & gigs' },
    { type: 'advisor',  emoji: '🧭', label: 'Advising',    sub: 'available as a startup advisor' },
    { type: 'student',  emoji: '🎓', label: 'Learning',    sub: 'enrolled or actively upskilling' },
  ]
  const [activeChips, setActiveChips] = useState<Set<RoleType>>(
    new Set(roles.filter(r => r.type !== 'work').map(r => r.type))
  )
  const toggleChip = (type: RoleType) => setActiveChips(prev => {
    const next = new Set(prev)
    if (next.has(type)) { next.delete(type) } else { next.add(type) }
    return next
  })
  const [form, setForm] = useState({
    full_name:     profile.full_name ?? '',
    headline:      profile.headline ?? '',
    about:         profile.about ?? '',
    location_city: profile.location_city ?? '',
    location_state:profile.location_state ?? '',
    open_to_work:  profile.open_to_work,
  })
  // Skills edited here too — comma string in state, text[] on save.
  const [skills, setSkills] = useState<string>((profile.skills ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [highlightsOpen, setHighlightsOpen] = useState(false)

  // Social links
  type SocialKey = 'github' | 'linkedin' | 'twitter' | 'dribbble' | 'behance' | 'youtube' | 'instagram' | 'portfolio'
  const [website, setWebsite] = useState(profile.website ?? '')
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialKey, string>>>(
    (profile.social_links as Partial<Record<SocialKey, string>>) ?? {}
  )
  const setSocial = (k: SocialKey, v: string) =>
    setSocialLinks(prev => ({ ...prev, [k]: v }))

  // AI assist state
  const [aiLoading, setAiLoading] = useState<'headline' | 'about' | 'skills' | null>(null)
  const [headlineAlts, setHeadlineAlts] = useState<string[]>([])

  async function aiAssist(type: 'headline' | 'about' | 'skills') {
    setAiLoading(type)
    setHeadlineAlts([])
    try {
      const body = {
        type,
        role: currentExp?.role,
        company: currentExp?.company,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        location: form.location_city,
        name: form.full_name,
      }
      const res = await fetch('/api/tiik/profile-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (type === 'headline' && data.headline) {
        set('headline', data.headline)
        setHeadlineAlts(data.alternatives ?? [])
      } else if (type === 'about' && data.about) {
        set('about', data.about)
      } else if (type === 'skills' && Array.isArray(data.skills)) {
        const existing = skills.split(',').map(s => s.trim()).filter(Boolean)
        const merged = Array.from(new Set([...existing, ...data.skills]))
        setSkills(merged.join(', '))
      }
    } catch { /* silent */ }
    setAiLoading(null)
  }

  const handleAvatarUploaded = async (publicUrl: string) => {
    setAvatarUrl(publicUrl)
    const supabase = createClient()
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    onSaved({ avatar_url: publicUrl })
    // First-upload prompt: if the user hasn't written a headline yet, open the top-highlights capture.
    if (!profile.headline) setHighlightsOpen(true)
  }

  const saveHighlights = async ({ headline, highlights }: { headline: string; highlights: [string, string] }) => {
    const supabase = createClient()
    const trimmed = highlights.filter(Boolean)
    const aboutAppend = trimmed.length ? `\n\nHighlights:\n• ${trimmed.join('\n• ')}` : ''
    const nextAbout = (form.about || profile.about || '') + aboutAppend
    set('headline', headline)
    set('about', nextAbout)
    await supabase.from('profiles').update({ headline, about: nextAbout || null }).eq('id', profile.id)
    onSaved({ headline, about: nextAbout || null })
    setHighlightsOpen(false)
  }

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean)
    // Filter empty social link values before saving
    const cleanLinks = Object.fromEntries(
      Object.entries(socialLinks).filter(([, v]) => v && v.trim())
    )
    const updates = {
      full_name:      form.full_name.trim()      || null,
      headline:       form.headline.trim()        || null,
      about:          form.about.trim()           || null,
      location_city:  form.location_city.trim()   || null,
      location_state: form.location_state.trim()  || null,
      open_to_work:   form.open_to_work,
      skills:         skillsArr.length ? skillsArr : null,
      website:        website.trim() || null,
      social_links:   Object.keys(cleanLinks).length ? cleanLinks : null,
    }
    const { error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    // Build roles: primary from flex_experience current job + identity chips
    const primaryRole: UserRole = {
      id: 'primary', type: 'work', primary: true, current: true,
      title: currentExp?.role ?? (localRoles.find(r => r.primary)?.title ?? ''),
      org:   currentExp?.company ?? (localRoles.find(r => r.primary)?.org ?? ''),
    }
    const chipRoles: UserRole[] = Array.from(activeChips).map(t => ({
      id: t, type: t, primary: false, current: true, title: '', org: '',
    }))
    const nextRoles = primaryRole.title ? [primaryRole, ...chipRoles] : chipRoles
    const ok = await replaceRoles(nextRoles)
    if (!ok) { setError('Roles did not save — try again'); return }
    enqueueProfileText(profile.id, updates.headline, updates.about)
    triggerUserEmbed(profile.id)
    onRolesChange(nextRoles)
    onSaved(updates as Partial<Profile>)
    onClose()
  }

  const completionPct = useMemo(() => {
    let score = 0
    if (avatarUrl)              score += 20
    if (form.full_name.trim())  score += 15
    if (form.headline.trim())   score += 20
    if (form.about.trim())      score += 15
    if (skills.trim())          score += 15
    if (form.location_city.trim()) score += 15
    return score
  }, [avatarUrl, form.full_name, form.headline, form.about, skills, form.location_city])

  const missingItems = [
    !avatarUrl && 'Add a photo',
    !form.headline.trim() && 'Add a headline',
    !form.about.trim() && 'Write an about',
    !skills.trim() && 'Add skills',
    !form.location_city.trim() && 'Add location',
  ].filter(Boolean) as string[]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/25 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel — glossy, matches FlexSidePanel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white/92 backdrop-blur-xl border-l border-white/60 shadow-[-12px_0_40px_-10px_rgba(0,0,0,.18)] z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-ink">Edit Profile</h2>
            <p className="text-[11px] text-ink-3 mt-0.5">Changes save to your tiikme profile</p>
            {/* Live completion bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-ink-3">Profile strength</span>
                <span className={`text-[10px] font-bold ${completionPct >= 80 ? 'text-green' : completionPct >= 50 ? 'text-orange' : 'text-amber'}`}>
                  {completionPct}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-line overflow-hidden w-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completionPct >= 80 ? 'bg-green' : completionPct >= 50 ? 'bg-gradient-to-r from-orange to-orange-2' : 'bg-amber'}`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              {missingItems.length > 0 && (
                <p className="text-[9.5px] text-ink-3 mt-1 truncate">
                  {missingItems.slice(0, 3).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-line text-ink-2 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Avatar upload */}
          <AvatarUpload
            bucket="profile-avatars"
            ownerId={profile.id}
            currentUrl={avatarUrl}
            fallback={form.full_name || profile.username}
            size={64}
            onUploaded={handleAvatarUploaded}
          />

          <Field label="Display Name" required>
            <input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="Your name"
              maxLength={100}
              className={inputCls}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-ink">
                Headline
                <span className="font-normal text-ink-3 ml-1.5">One line — shown in Squad, Explore, and My Flex</span>
              </label>
              <button
                type="button"
                onClick={() => aiAssist('headline')}
                disabled={aiLoading === 'headline'}
                className="flex items-center gap-1 text-[10px] font-semibold text-orange hover:text-orange-2 disabled:opacity-50 transition-colors"
              >
                {aiLoading === 'headline' ? (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
                AI suggest
              </button>
            </div>
            <input
              value={form.headline}
              onChange={e => set('headline', e.target.value)}
              placeholder="e.g. Product Designer · Building in public"
              maxLength={200}
              className={inputCls}
            />
            {headlineAlts.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-ink-3">Alternatives — tap to use:</p>
                {headlineAlts.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { set('headline', alt); setHeadlineAlts([]) }}
                    className="block w-full text-left text-[11px] text-ink-2 bg-card border border-line rounded-[8px] px-3 py-1.5 hover:border-orange/40 hover:text-ink transition-all"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Identity ── */}
          <div className="space-y-3">
            {/* Primary role — auto-derived from current experience */}
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">Current role</label>
              <div className="flex items-center gap-2.5 bg-card rounded-[10px] border border-line px-3 py-2.5">
                {currentExp ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{currentExp.role}</p>
                    <p className="text-[11px] text-ink-3 truncate">@ {currentExp.company}</p>
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-3 flex-1">No current experience — add one in My Flex</p>
                )}
                <span className="text-[10px] text-ink-3 shrink-0">auto</span>
              </div>
              <p className="text-[10px] text-ink-3 mt-1">Edit your job title in <span className="text-orange font-medium">My Flex → Work Experience</span></p>
            </div>

            {/* Identity chips — parallel activities beyond the main job */}
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-0.5">I also…</label>
              <p className="text-[10px] text-ink-3 mb-2">Select activities you do alongside your main role — shows as chips on your profile</p>
              <div className="grid grid-cols-2 gap-2">
                {IDENTITY_TYPES.map(({ type, emoji, label, sub }) => {
                  const on = activeChips.has(type)
                  return (
                    <button key={type} onClick={() => toggleChip(type)}
                      className={['rounded-[10px] border p-2.5 text-left transition-all', on ? 'border-orange bg-orange-soft' : 'border-line bg-card hover:border-orange/40'].join(' ')}>
                      <p className={['text-[12px] font-semibold', on ? 'text-orange' : 'text-ink'].join(' ')}>{emoji} {label}</p>
                      <p className="text-[10px] text-ink-3 mt-0.5 leading-tight">{sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Skills — SmartSelect multi, same control as onboarding ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-ink">
                Skills
                <span className="font-normal text-ink-3 ml-1.5">Pick from the list or type your own</span>
              </label>
              <button
                type="button"
                onClick={() => aiAssist('skills')}
                disabled={aiLoading === 'skills' || !currentExp?.role}
                title={!currentExp?.role ? 'Add a current role in My Flex first' : undefined}
                className="flex items-center gap-1 text-[10px] font-semibold text-orange hover:text-orange-2 disabled:opacity-40 transition-colors"
              >
                {aiLoading === 'skills' ? (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
                AI suggest
              </button>
            </div>
            <SmartSelect
              field="role_title"
              value={skills}
              onChange={setSkills}
              multi
              placeholder="Add a skill…"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-ink">About</label>
              <button
                type="button"
                onClick={() => aiAssist('about')}
                disabled={aiLoading === 'about'}
                className="flex items-center gap-1 text-[10px] font-semibold text-orange hover:text-orange-2 disabled:opacity-50 transition-colors"
              >
                {aiLoading === 'about' ? (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
                AI draft
              </button>
            </div>
            <textarea
              value={form.about}
              onChange={e => set('about', e.target.value)}
              placeholder="Who you are, what you build, what you're about…"
              rows={4}
              maxLength={2000}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={form.location_city}
                onChange={e => set('location_city', e.target.value)}
                placeholder="Mumbai"
                className={inputCls}
              />
            </Field>
            <Field label="State">
              <input
                value={form.location_state}
                onChange={e => set('location_state', e.target.value)}
                placeholder="Maharashtra"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Open to Work toggle */}
          <div className="flex items-center justify-between p-4 rounded-[12px] border border-line bg-page">
            <div>
              <p className="text-[13px] font-semibold text-ink">Open to Work</p>
              <p className="text-[11px] text-ink-3 mt-0.5">Visible to recruiters and hiring teams</p>
            </div>
            <Toggle on={form.open_to_work} onChange={(v) => set('open_to_work', v)} />
          </div>

          {/* ── Links & Portfolio ── */}
          <SocialLinksSection
            website={website}
            onWebsite={setWebsite}
            links={socialLinks}
            onLink={setSocial}
          />

          {error && (
            <div className="bg-red/8 border border-red/20 rounded-[10px] px-4 py-3 text-[12px] text-red">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-orange hover:bg-orange-2 disabled:opacity-60 text-white text-[13px] font-semibold py-2.5 rounded-[12px] transition-colors"
            style={{ boxShadow: '0 2px 8px -2px rgba(255,92,40,.4), inset 0 1px 0 rgba(255,255,255,.18)' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[13px] font-medium text-ink-2 hover:text-ink bg-page hover:bg-line rounded-[12px] transition-colors"
          >
            Cancel
          </button>
        </div>
      </aside>

      {highlightsOpen && (
        <TopHighlightsModal
          initialHeadline={form.headline}
          onSkip={() => setHighlightsOpen(false)}
          onSave={saveHighlights}
        />
      )}
    </>
  )
}

const inputCls = 'w-full bg-card border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all'

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-ink mb-1.5">
        {label}{required && <span className="text-orange ml-0.5">*</span>}
        {hint && <span className="font-normal text-ink-3 ml-1.5">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

// ── Social Links Section ──────────────────────────────────────────────────────
// Smart URL detection: paste any URL and it auto-identifies the platform.

type SocialKey = 'github' | 'linkedin' | 'twitter' | 'dribbble' | 'behance' | 'youtube' | 'instagram' | 'portfolio'

const PLATFORMS: { key: SocialKey; label: string; placeholder: string; color: string; icon: string }[] = [
  { key:'github',    label:'GitHub',    placeholder:'github.com/yourname',        color:'#24292e', icon:'⬡' },
  { key:'linkedin',  label:'LinkedIn',  placeholder:'linkedin.com/in/yourname',   color:'#0A66C2', icon:'in' },
  { key:'twitter',   label:'X / Twitter', placeholder:'x.com/yourname',           color:'#000',    icon:'X' },
  { key:'dribbble',  label:'Dribbble',  placeholder:'dribbble.com/yourname',      color:'#EA4C89', icon:'●' },
  { key:'behance',   label:'Behance',   placeholder:'behance.net/yourname',       color:'#1769FF', icon:'Be' },
  { key:'youtube',   label:'YouTube',   placeholder:'youtube.com/@yourchannel',   color:'#FF0000', icon:'▶' },
  { key:'instagram', label:'Instagram', placeholder:'instagram.com/yourname',     color:'#E1306C', icon:'◎' },
  { key:'portfolio', label:'Portfolio', placeholder:'yourportfolio.com',          color:'#6366F1', icon:'◈' },
]

function detectPlatform(url: string): SocialKey | null {
  const u = url.toLowerCase()
  if (u.includes('github.com')) return 'github'
  if (u.includes('linkedin.com')) return 'linkedin'
  if (u.includes('x.com') || u.includes('twitter.com')) return 'twitter'
  if (u.includes('dribbble.com')) return 'dribbble'
  if (u.includes('behance.net')) return 'behance'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('instagram.com')) return 'instagram'
  return null
}

function SocialLinksSection({
  website, onWebsite, links, onLink,
}: {
  website: string
  onWebsite: (v: string) => void
  links: Partial<Record<SocialKey, string>>
  onLink: (k: SocialKey, v: string) => void
}) {
  const [smartInput, setSmartInput] = useState('')
  const [detected, setDetected] = useState<SocialKey | null>(null)
  const [expanded, setExpanded] = useState(false)

  const handleSmartPaste = (v: string) => {
    setSmartInput(v)
    const key = detectPlatform(v)
    setDetected(key)
    if (key && v.trim()) onLink(key, v.trim())
  }

  const filledCount = Object.values(links).filter(Boolean).length + (website ? 1 : 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="block text-[11px] font-semibold text-ink">
            Links &amp; Portfolio
          </label>
          <p className="text-[10px] text-ink-3 mt-0.5">
            {filledCount > 0 ? `${filledCount} link${filledCount > 1 ? 's' : ''} added` : 'Shown on your public profile'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-[10.5px] font-semibold text-orange hover:text-orange-2 transition-colors"
        >
          {expanded ? 'Collapse ↑' : 'Add links ↓'}
        </button>
      </div>

      {/* Already added links (always visible) */}
      {filledCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {website && (
            <LinkChip label="Website" color="#6366F1" icon="◈" url={website} onRemove={() => onWebsite('')} />
          )}
          {PLATFORMS.filter(p => links[p.key]).map(p => (
            <LinkChip key={p.key} label={p.label} color={p.color} icon={p.icon}
              url={links[p.key]!} onRemove={() => onLink(p.key, '')} />
          ))}
        </div>
      )}

      {/* Smart paste input — detects platform from URL */}
      <div className="relative mb-2">
        <input
          value={smartInput}
          onChange={e => handleSmartPaste(e.target.value)}
          placeholder="Paste any link — GitHub, Dribbble, YouTube, portfolio…"
          className={inputCls}
        />
        {detected && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green">
            ✓ {PLATFORMS.find(p => p.key === detected)?.label} detected
          </span>
        )}
      </div>

      {/* Website field always shown */}
      <div className="mb-2">
        <input
          value={website}
          onChange={e => onWebsite(e.target.value)}
          placeholder="Personal website or portfolio URL"
          className={inputCls}
        />
      </div>

      {/* Individual platform fields (expandable) */}
      {expanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-line">
          {PLATFORMS.map(p => (
            <div key={p.key} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: p.color }}>
                {p.icon}
              </span>
              <input
                value={links[p.key] ?? ''}
                onChange={e => onLink(p.key, e.target.value)}
                placeholder={p.placeholder}
                className={`${inputCls} text-[12px]`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LinkChip({ label, color, icon, url, onRemove }: {
  label: string; color: string; icon: string; url: string; onRemove: () => void
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-card group">
      <span className="w-4 h-4 rounded-[4px] flex items-center justify-center text-[8px] font-bold text-white shrink-0"
        style={{ background: color }}>
        {icon}
      </span>
      <span className="text-[11px] font-medium text-ink truncate max-w-[80px]">
        {label}
      </span>
      <button type="button" onClick={onRemove}
        className="text-ink-3 hover:text-red transition-colors opacity-0 group-hover:opacity-100">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
