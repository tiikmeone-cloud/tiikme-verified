'use client'

import type { ReactNode } from 'react'

/* Page header shown at the top of every view */
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-[20px] font-bold text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-ink-3 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* White card surface */
export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-card rounded-[18px] shadow-card ${className}`}>{children}</div>
}

/* Section card with optional title + add action */
export function SectionCard({ title, sub, onAdd, addLabel = '+ Add', className = '', children }: {
  title?: string; sub?: string; onAdd?: () => void; addLabel?: string; className?: string; children: ReactNode
}) {
  return (
    <Card className={`p-5 ${className}`}>
      {(title || onAdd) && (
        <div className="flex items-center justify-between mb-2">
          <div>
            {title && <p className="text-[14px] font-bold text-ink">{title}</p>}
            {sub && <p className="text-[11px] text-ink-3 mt-0.5">{sub}</p>}
          </div>
          {onAdd && (
            <button onClick={onAdd} className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors">
              {addLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </Card>
  )
}

/* Rich empty state with icon + CTA */
export function EmptyState({ icon, title, body, cta, onCta }: {
  icon: ReactNode; title: string; body: string; cta?: string; onCta?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-14 h-14 rounded-[16px] bg-page flex items-center justify-center mb-4 text-ink-3">
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      <p className="text-[12px] text-ink-3 mt-1.5 max-w-[280px] leading-relaxed">{body}</p>
      {cta && (
        <button
          onClick={onCta}
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-orange hover:bg-orange-2 rounded-[11px] px-4 py-2 transition-colors"
          style={{ boxShadow: '0 2px 8px -2px rgba(255,92,40,.4), inset 0 1px 0 rgba(255,255,255,.18)' }}
        >
          {cta}
        </button>
      )}
    </div>
  )
}

/* Stat number block */
export function Stat({ value, label, color = 'ink' }: { value: ReactNode; label: string; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-[20px] font-black leading-none text-${color}`}>{value}</div>
      <div className="text-[10px] text-ink-3 mt-1">{label}</div>
    </div>
  )
}

/* Application pipeline stage pill */
const STAGE_STYLE: Record<string, { label: string; cls: string }> = {
  applied:     { label: 'Applied',     cls: 'text-ink-2 bg-line' },
  viewed:      { label: 'Viewed',      cls: 'text-purple bg-purple/10' },
  shortlisted: { label: 'Shortlisted', cls: 'text-teal bg-teal/10' },
  interview:   { label: 'Interview',   cls: 'text-orange bg-orange-soft' },
  offer:       { label: 'Offer 🎉',    cls: 'text-green bg-green/12' },
  rejected:    { label: 'Closed',      cls: 'text-ink-3 bg-line' },
}

export function StagePill({ stage }: { stage: string }) {
  const s = STAGE_STYLE[stage] ?? STAGE_STYLE.applied
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

/* Avatar with initials */
export function Avatar({ name, src, size = 40, color = 'from-orange to-orange-2', square = false }: {
  name: string; src?: string | null; size?: number; color?: string; square?: boolean
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold overflow-hidden shrink-0 ${square ? 'rounded-[12px]' : 'rounded-full'}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  )
}

/* Stacked DP cluster for squad attestation */
export function AvatarStack({ members, max = 4 }: {
  members: { initials: string; avatarColor: string }[]; max?: number
}) {
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div
          key={i}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-card"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: max - i, background: m.avatarColor }}
        >
          {m.initials}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-line flex items-center justify-center text-ink-2 text-[10px] font-bold border-2 border-card" style={{ marginLeft: -8 }}>
          +{extra}
        </div>
      )}
    </div>
  )
}
