'use client'

/**
 * Profile Rundown — the "state of my career today" view.
 *
 * Hierarchy (top → bottom):
 *   1. Identity strip            — who I am at a glance
 *   2. Trust Score hero          — THE metric on tiikme
 *   3. Today from Tiik           — 3 specific Twin-curated actions
 *   4. Your applications         — pipeline snapshot
 *   5. At a glance               — slim metric strip
 *   6. From your connections     — compact org feed
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import type { ViewId, UserRole } from '@/lib/profileTypes'
import { Card, Avatar } from '@/components/profile/ui/Primitives'
import { RoleLine } from '@/components/profile/ui/RoleBadges'
import Toggle from '@/components/profile/ui/Toggle'
import ConnectedFeed from '@/components/feed/ConnectedFeed'
import { toast } from '@/components/profile/ui/Toast'
import {
  listMyApplications, relativeTime,
  STAGE_LABEL, STAGE_TINT,
  type UserApplication,
} from '@/lib/applications'
import { getTrustScore, getProfileSignals, trustBand, type TrustScore, type ProfileSignals } from '@/lib/trust'

interface Props {
  profile: Profile
  roles: UserRole[]
  onNavigate: (v: ViewId) => void
  onOpenToWorkChange: (val: boolean) => void
}

export default function OverviewView({ profile, roles, onNavigate, onOpenToWorkChange }: Props) {
  const displayName = profile.full_name ?? profile.username
  const firstName = displayName.split(' ')[0]
  const [apps, setApps] = useState<UserApplication[]>([])
  const [trust, setTrust] = useState<TrustScore | null>(null)
  const [signals, setSignals] = useState<ProfileSignals | null>(null)
  useEffect(() => { listMyApplications().then(setApps) }, [])
  useEffect(() => { getTrustScore(profile.id).then(setTrust) }, [profile.id])
  useEffect(() => { getProfileSignals(profile.id).then(setSignals) }, [profile.id])

  return (
    <div className="space-y-5">
      {/* 1 — Identity strip */}
      <IdentityStrip profile={profile} displayName={displayName} roles={roles} onOpenToWorkChange={onOpenToWorkChange} />

      {/* 2 — Trust Score hero */}
      <TrustScoreHero trust={trust} onNavigate={onNavigate} />

      {/* 3 — Today from Tiik */}
      <TodayFromTwin firstName={firstName} trust={trust} apps={apps} onNavigate={onNavigate} />

      {/* 4 — Your applications (real, top 3) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-ink">Your applications</h2>
            <p className="text-[11px] text-ink-3 mt-0.5">
              {apps.length === 0 ? 'No applications yet — apply on Jobs' : `${apps.length} in flight · click to track`}
            </p>
          </div>
          <button onClick={() => onNavigate('my-applications')}
            className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors">
            Track all
          </button>
        </div>
        <div className="space-y-1">
          {apps.slice(0, 3).map(a => {
            const tint = STAGE_TINT[a.stage]
            return (
              <button key={a.app_id} onClick={() => onNavigate('my-applications')}
                className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-page transition-colors text-left group">
                <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white text-[15px] font-bold shrink-0"
                     style={{ backgroundColor: a.org_logo ?? '#FF5C28' }}>{a.org_name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{a.job_title}</p>
                  <p className="text-[11px] text-ink-3 truncate">{a.org_name} · {a.job_location ?? '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${tint.bg} ${tint.fg}`}>
                    {STAGE_LABEL[a.stage]}
                  </span>
                  <span className="text-[10px] text-ink-3">{relativeTime(a.last_change ?? a.applied_at)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 5 — At a glance metric strip · real signals only, no vanity */}
      <AtAGlance signals={signals} trust={trust} onNavigate={onNavigate} />

      {/* 6 — New from your connected orgs (only show if user has connections) */}
      <ConnectedOrgsSection />
    </div>
  )
}

/* Connected orgs — new roles only, no updates, no social actions */
function ConnectedOrgsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-ink">New roles at orgs you&apos;ve connected with</h2>
        <a href="/opportunities" className="text-[11.5px] font-semibold text-orange hover:text-orange-2 transition-colors">All jobs</a>
      </div>
      <ConnectedFeed showHeader={false} jobsOnly onOpenJob={(it) => toast(`Opening ${it.job?.title} at ${it.orgName}…`)} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  1 — Identity strip                                                  */
/* ──────────────────────────────────────────────────────────────────── */
function IdentityStrip({
  profile, displayName, roles, onOpenToWorkChange,
}: {
  profile: Profile; displayName: string; roles: UserRole[]
  onOpenToWorkChange: (val: boolean) => void
}) {
  const [on, setOn] = useState(profile.open_to_work)
  const [saving, setSaving] = useState(false)

  const toggle = async (next: boolean) => {
    setOn(next); onOpenToWorkChange(next); setSaving(true)
    const { error } = await createClient().from('profiles').update({ open_to_work: next }).eq('id', profile.id)
    if (error) { setOn(!next); onOpenToWorkChange(!next) }
    setSaving(false)
  }

  const location = [profile.location_city, profile.location_state, profile.country].filter(Boolean).join(', ')

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3.5">
        <Avatar name={displayName} src={profile.avatar_url} size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-ink leading-tight">{displayName}</h1>
          {/* Primary role line */}
          <div className="mt-0.5"><RoleLine roles={roles.filter(r => r.primary)} size="sm" /></div>
          {/* Personal tagline */}
          {profile.headline && (
            <p className="text-[11.5px] text-ink-3 mt-1 leading-snug line-clamp-2">{profile.headline}</p>
          )}
          {location && <p className="text-[11px] text-ink-3 mt-0.5">{location}</p>}
          {/* Open-to-Work toggle */}
          <div className={[
            'mt-2.5 inline-flex items-center gap-2 rounded-full pl-2.5 pr-1 py-0.5 border transition-colors',
            on ? 'border-green/30 bg-green/8' : 'border-line bg-card',
          ].join(' ')}>
            <span className={['text-[11px] font-semibold transition-colors', on ? 'text-green' : 'text-ink-3'].join(' ')}>
              Open to work
            </span>
            <Toggle on={on} onChange={toggle} disabled={saving} />
          </div>
          {/* Social / portfolio links */}
          <ProfileLinksBar profile={profile} />
        </div>
      </div>
    </Card>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  2 — Trust Score hero                                                */
/* ──────────────────────────────────────────────────────────────────── */
function TrustScoreHero({ trust, onNavigate }: { trust: TrustScore | null; onNavigate: (v: ViewId) => void }) {
  const loading = trust === null
  const score = trust?.score ?? 0
  const segments = 10
  const filled = Math.round((score / 100) * segments)
  const percentile = trustBand(score)
  const components = trust?.components ?? []

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-purple/20 p-6"
         style={{ background: 'linear-gradient(135deg, rgba(109,75,216,.08) 0%, rgba(255,92,40,.05) 60%, var(--color-card) 100%)' }}>
      <span aria-hidden className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(109,75,216,.22), transparent 65%)', filter: 'blur(22px)' }} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Trust score · tiikme</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-[48px] font-black text-ink leading-none">{loading ? '—' : score}</span>
            <span className="text-[14px] text-ink-3">/100</span>
            {!loading && (
              <span className="ml-2 text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">{percentile} in your band</span>
            )}
          </div>

          {/* Segmented bar */}
          <div className="mt-4 flex gap-1 h-2">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className="flex-1 rounded-full transition-colors"
                style={{ background: i < filled ? 'var(--color-purple)' : 'var(--color-line)' }} />
            ))}
          </div>

          {/* Components */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {components.map(c => (
              <span key={c.label}
                className={[
                  'inline-flex items-center gap-1 text-[10.5px] font-medium rounded-full px-2 py-0.5 border',
                  c.done
                    ? 'bg-purple/10 text-purple border-purple/20'
                    : 'bg-card text-ink-3 border-line',
                ].join(' ')}>
                {c.done ? '✓' : '+'} {c.label}
                <span className="text-ink-3 ml-1 font-normal">· {c.hint}</span>
              </span>
            ))}
          </div>

          <button onClick={() => onNavigate('squads')}
            className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-purple hover:bg-purple/90 rounded-[10px] px-3.5 py-2 transition-colors">
            Boost trust
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  3 — Today from Tiik                                                 */
/* ──────────────────────────────────────────────────────────────────── */
/* Maps each unfinished Trust Score component to a concrete next move. */
const COMPONENT_MOVE: Record<string, { kind: TwinMoveKind; title: string; cta: string; to: ViewId }> = {
  identity:     { kind: 'audit',   title: 'Complete your profile',        cta: 'Edit profile', to: 'my-flex' },
  experience:   { kind: 'audit',   title: 'Add your work & education',    cta: 'Open Flex',    to: 'my-flex' },
  certs:        { kind: 'audit',   title: 'Add a certification',          cta: 'Add cert',     to: 'my-flex' },
  squads:       { kind: 'connect', title: 'Squad-verify a teammate',      cta: 'Find people',  to: 'squads' },
  vouches:      { kind: 'connect', title: 'Get a vouch for a role',       cta: 'View vouches', to: 'vouches' },
  endorsements: { kind: 'connect', title: 'Get your skills endorsed',     cta: 'My squads',    to: 'squads' },
}

function TodayFromTwin({
  firstName, trust, apps, onNavigate,
}: { firstName: string; trust: TrustScore | null; apps: UserApplication[]; onNavigate: (v: ViewId) => void }) {
  // Build moves from the user's real trust gaps, biggest point-gain first.
  const moves: TwinMove[] = (trust?.components ?? [])
    .filter(c => !c.done && COMPONENT_MOVE[c.key])
    .sort((a, b) => (b.max - b.points) - (a.max - a.points))
    .map(c => {
      const m = COMPONENT_MOVE[c.key]
      const gain = c.max - c.points
      return { kind: m.kind, title: m.title, hint: `${c.hint} · +${gain} to Trust Score`, cta: m.cta, to: m.to }
    })

  // If there are active applications, surface tracking as a move.
  const active = apps.filter(a => !['rejected','withdrawn','hired'].includes(a.stage))
  if (active.length > 0) {
    moves.push({
      kind: 'apply',
      title: `Track ${active.length} active application${active.length === 1 ? '' : 's'}`,
      hint: `Latest: ${active[0].job_title} · ${active[0].org_name}`,
      cta: 'Track all',
      to: 'my-applications',
    })
  }

  const shown = moves.slice(0, 3)
  const loading = trust === null

  // Nothing to nudge — fully verified and no active apps.
  if (!loading && shown.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-orange/15 p-5"
         style={{ background: 'linear-gradient(135deg, rgba(255,92,40,.07), var(--color-card) 70%)' }}>
      <span aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,92,40,.20), transparent 65%)', filter: 'blur(22px)' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Today from Tiik</p>
            <p className="text-[15px] font-bold text-ink mt-1">
              {loading ? `Reviewing your Flex, ${firstName}…` : `${shown.length} move${shown.length === 1 ? '' : 's'} to make today, ${firstName}`}
            </p>
          </div>
          <button onClick={() => location.assign('/')}
            className="text-[11px] font-semibold text-ink-3 hover:text-orange transition-colors hidden sm:inline">
            Open Tiik
          </button>
        </div>

        <div className="space-y-2">
          {shown.map((m, i) => (
            <button key={i} onClick={() => onNavigate(m.to)}
              className="w-full flex items-start gap-3 p-3 rounded-[14px] bg-card border border-line hover:border-orange/40 transition-colors text-left group">
              <span className={[
                'w-7 h-7 rounded-[8px] flex items-center justify-center text-[10px] font-bold shrink-0',
                MOVE_TINT[m.kind].bg, MOVE_TINT[m.kind].fg,
              ].join(' ')}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink leading-snug">{m.title}</p>
                <p className="text-[11px] text-ink-2 mt-0.5 leading-snug">{m.hint}</p>
              </div>
              <span className="text-[11px] font-semibold text-orange opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 whitespace-nowrap">
                {m.cta}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

type TwinMoveKind = 'apply' | 'audit' | 'connect'
interface TwinMove { kind: TwinMoveKind; title: string; hint: string; cta: string; to: ViewId }
const MOVE_TINT: Record<TwinMoveKind, { bg: string; fg: string }> = {
  apply:   { bg: 'bg-orange-soft',  fg: 'text-orange' },
  audit:   { bg: 'bg-purple/10',    fg: 'text-purple' },
  connect: { bg: 'bg-teal/10',      fg: 'text-teal' },
}

/* ──────────────────────────────────────────────────────────────────── */
/*  5 — At a glance metric strip                                        */
/* ──────────────────────────────────────────────────────────────────── */
function AtAGlance({
  signals, trust, onNavigate,
}: { signals: ProfileSignals | null; trust: TrustScore | null; onNavigate: (v: ViewId) => void }) {
  const dash = '—'
  const s = signals
  return (
    <Card className="p-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
        {/* Real signals only — every value is a live count from the database. */}
        <Stat label="Trust percentile"   value={trust ? trustBand(trust.score) : dash} delta="boost trust"   deltaTint="text-purple" onClick={() => onNavigate('squads')} />
        <Stat label="Squad attestations" value={s ? String(s.squads_confirmed) : dash} delta="verified peers"   deltaTint="text-purple" onClick={() => onNavigate('squads')} />
        <Stat label="Vouches given"      value={s ? String(s.vouches_given) : dash}    delta="endorsements"     deltaTint="text-green"  onClick={() => onNavigate('vouches')} />
        <Stat label="Active applications" value={s ? String(s.applications_active) : dash} delta="in flight"    deltaTint="text-orange" onClick={() => onNavigate('my-applications')} />
      </div>
    </Card>
  )
}

function Stat({
  label, value, delta, deltaTint, onClick,
}: { label: string; value: string; delta: string; deltaTint: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-2 text-left first:pl-0 hover:bg-page transition-colors rounded-[8px]">
      <p className="text-[10px] text-ink-3 leading-none">{label}</p>
      <p className="text-[18px] font-black text-ink leading-none mt-1.5">{value}</p>
      <p className={`text-[10px] mt-1 font-semibold ${deltaTint}`}>{delta}</p>
    </button>
  )
}

/* ── Profile Links Bar ────────────────────────────────────────────────────── */
// Shown below the Open-to-Work toggle on the profile identity card.
// Platform-branded pills — no generic "link" icon.

const LINK_META: Record<string, { label: string; color: string; textColor?: string }> = {
  github:    { label: 'GitHub',    color: '#24292e', textColor: '#fff' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', textColor: '#fff' },
  twitter:   { label: 'X',        color: '#000',    textColor: '#fff' },
  dribbble:  { label: 'Dribbble', color: '#EA4C89', textColor: '#fff' },
  behance:   { label: 'Behance',  color: '#1769FF', textColor: '#fff' },
  youtube:   { label: 'YouTube',  color: '#FF0000', textColor: '#fff' },
  instagram: { label: 'Instagram',color: '#E1306C', textColor: '#fff' },
  portfolio: { label: 'Portfolio',color: '#6366F1', textColor: '#fff' },
}

function ProfileLinksBar({ profile }: { profile: Profile }) {
  const links = profile.social_links as Record<string, string> | null ?? {}
  const website = profile.website

  const allLinks: Array<{ key: string; url: string; label: string; color: string; textColor: string }> = []

  if (website) {
    allLinks.push({ key: 'website', url: website, label: 'Website', color: '#6366F1', textColor: '#fff' })
  }
  Object.entries(links).forEach(([k, v]) => {
    if (v && LINK_META[k]) {
      allLinks.push({ key: k, url: v, label: LINK_META[k].label, color: LINK_META[k].color, textColor: LINK_META[k].textColor ?? '#fff' })
    }
  })

  if (allLinks.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {allLinks.map(({ key, url, label, color, textColor }) => (
        <a
          key={key}
          href={url.startsWith('http') ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all hover:opacity-85 hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: color, color: textColor }}
        >
          <LinkDot platform={key} />
          {label}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
          </svg>
        </a>
      ))}
    </div>
  )
}

function LinkDot({ platform }: { platform: string }) {
  // Platform-specific micro-icon via SVG inline
  if (platform === 'github') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
  if (platform === 'linkedin') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
  if (platform === 'dribbble') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"/>
    </svg>
  )
  // Generic link icon for all others
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  )
}
