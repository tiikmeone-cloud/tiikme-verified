'use client'

import type { UserRole } from '@/lib/profileTypes'
import { ROLE_META } from '@/lib/profileTypes'

/* Renders multi-role identity:
   - primary roles as a bold line ("CEO @ Acme · Co-founder & CTO")
   - the rest as soft colored chips ("📈 Angel Investor", "✨ Creator") */
export function RoleLine({ roles, size = 'md' }: { roles: UserRole[]; size?: 'sm' | 'md' | 'lg' }) {
  const primary = roles.filter(r => r.primary)
  const secondary = roles.filter(r => !r.primary)
  const titleCls = size === 'lg' ? 'text-[13px]' : size === 'sm' ? 'text-[11px]' : 'text-[12px]'

  return (
    <div className="flex flex-col gap-1.5">
      {primary.length > 0 && (
        <p className={`${titleCls} text-ink-2 font-medium leading-snug`}>
          {primary.map((r, i) => (
            <span key={r.id}>
              {i > 0 && <span className="text-ink-3"> · </span>}
              <span className="text-ink font-semibold">{r.title}</span>
              {r.org && <span className="text-ink-2"> @ {r.org}</span>}
            </span>
          ))}
        </p>
      )}
      {secondary.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {secondary.map(r => (
            <span key={r.id} className="text-[10px] text-ink-3 font-medium">
              {r.title}{r.org ? ` · ${r.org}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* Profile-kind pills (the "lenses": Founder, Creator, Student…) derived from roles */
export function KindPills({ roles }: { roles: UserRole[] }) {
  const kinds = Array.from(new Set(roles.map(r => r.type)))
  return (
    <div className="flex flex-wrap gap-1.5">
      {kinds.map(k => {
        const m = ROLE_META[k]
        return (
          <span key={k} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border"
            style={{ color: m.color, backgroundColor: m.soft, borderColor: m.soft }}>
            {m.emoji} {m.label}
          </span>
        )
      })}
    </div>
  )
}
