'use client'

/**
 * OrgSquadDensity — the new "Squads" tab on org pages.
 *
 * Shows:
 *   · Density score (0–100%) with cultural read
 *   · Member count + members in squad
 *   · Active squad edge count
 *
 * The killer feature — no Glassdoor can show internal trust density.
 */

import { useEffect, useState } from 'react'
import { getOrgSquadDensity, type OrgSquadDensity as Density } from '@/lib/squads'

export default function OrgSquadDensity({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [d, setD] = useState<Density | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getOrgSquadDensity(orgId).then(x => { setD(x); setLoading(false) }) }, [orgId])

  if (loading) return <p className="text-[12px] text-ink-3 py-8 text-center">Reading squad density…</p>
  if (!d) return <p className="text-[12px] text-ink-3 py-8 text-center">No squad data yet for this org.</p>

  const pct = Number(d.density_pct)
  const health = pct >= 60 ? 'healthy' : pct >= 30 ? 'building' : 'sparse'
  const healthTint = pct >= 60 ? 'text-green' : pct >= 30 ? 'text-amber' : 'text-ink-3'
  const segments = 20
  const filled = Math.round((pct / 100) * segments)

  return (
    <div className="space-y-4">
      {/* Hero density card */}
      <div className="relative overflow-hidden rounded-[20px] border border-purple/20 p-6"
           style={{ background: 'linear-gradient(135deg, rgba(109,75,216,.10) 0%, rgba(255,92,40,.05) 60%, rgba(255,255,255,1) 100%)' }}>
        <span aria-hidden className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(109,75,216,.24), transparent 65%)', filter: 'blur(22px)' }} />

        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Squad density · tiikme</p>

          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-[52px] font-black text-ink leading-none">{pct.toFixed(0)}%</span>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${healthTint}`}>· {health}</span>
          </div>

          <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed max-w-[460px]">
            {d.members_with_squad} of {d.total_members} employees at {orgName} on tiikme are in <b>≥1 active squad</b> with another teammate.
          </p>

          {/* Segmented density bar */}
          <div className="mt-4 flex gap-1 h-2">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className="flex-1 rounded-full transition-colors"
                style={{ background: i < filled ? 'var(--color-purple)' : 'var(--color-line)' }} />
            ))}
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="On tiikme"        value={d.total_members.toString()} />
            <Stat label="In ≥1 squad"      value={d.members_with_squad.toString()} />
            <Stat label="Active edges"     value={d.active_edges.toString()} />
          </div>
        </div>
      </div>

      {/* Cultural read */}
      <div className="rounded-[16px] bg-card border border-line p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-2">What this means</p>
        <p className="text-[13px] text-ink-2 leading-relaxed">
          {pct >= 60 ? (
            <>This is an org where people <b className="text-ink">actually back each other&apos;s work</b>. High squad density means real trust — not just LinkedIn endorsements. Hiring panels here are likely to value squad-verified Flexes.</>
          ) : pct >= 30 ? (
            <>{orgName} is <b className="text-ink">building its trust graph</b>. Some teams are tight, but the org as a whole hasn&apos;t fully wired up squads yet. Watch for cluster details below.</>
          ) : (
            <><b className="text-ink">{orgName} is new to tiikme</b>. Their squad graph is sparse. This isn&apos;t a red flag — it just means the cultural signal isn&apos;t yet visible here. Look at reviews + their org Brain for now.</>
          )}
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-line rounded-[12px] p-3">
      <p className="text-[10.5px] text-ink-3 leading-none">{label}</p>
      <p className="text-[20px] font-black text-ink leading-none mt-1.5">{value}</p>
    </div>
  )
}
