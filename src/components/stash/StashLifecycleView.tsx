'use client'

/**
 * StashLifecycleView — your saved jobs (bookmarks).
 *
 * Real Supabase-backed. Replaces the stub StashView.
 */

import { useEffect, useState } from 'react'
import { listBookmarks, toggleBookmark, type Bookmark } from '@/lib/bookmarks'
import { Card } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

export default function StashLifecycleView() {
  const [items, setItems] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => { setLoading(true); setItems(await listBookmarks()); setLoading(false) }
  useEffect(() => { refresh() }, [])

  const remove = async (b: Bookmark) => {
    await toggleBookmark(b.job_id)
    toast(`Removed “${b.job_title}”`)
    await refresh()
  }

  return (
    <Card className="p-5">
      <header className="mb-4">
        <h2 className="text-[16px] font-bold text-ink">Stash</h2>
        <p className="text-[11.5px] text-ink-3 mt-0.5">
          {items.length === 0 ? 'No saved jobs yet — tap the heart on any job to stash it' : `${items.length} saved · click to open`}
        </p>
      </header>

      {loading && <p className="text-[12px] text-ink-3 py-8 text-center">Loading…</p>}

      <div className="space-y-2">
        {items.map(b => (
          <div key={b.job_id} className="bg-page rounded-[14px] border border-line p-3.5 flex items-center gap-3 hover:border-orange/30 transition-colors">
            <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[14px] font-bold shrink-0"
                 style={{ backgroundColor: b.org_logo ?? '#FF5C28' }}>
              {b.org_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink truncate">{b.job_title}</p>
              <p className="text-[11.5px] text-ink-3 truncate">
                {b.org_name} · {b.job_location ?? '—'}{b.job_salary ? ` · ${b.job_salary}` : ''}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {b.job_type && <span className="text-[10px] font-medium text-ink-2 bg-card border border-line rounded-full px-2 py-0.5">{b.job_type}</span>}
                {b.job_mode && <span className="text-[10px] font-medium text-ink-2 bg-card border border-line rounded-full px-2 py-0.5">{b.job_mode}</span>}
              </div>
            </div>
            <button onClick={() => remove(b)}
              className="text-[11px] font-semibold text-ink-3 hover:text-red transition-colors px-2 py-1.5">
              Remove
            </button>
            <a href="/opportunities"
              className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-3 py-1.5 hover:opacity-95 transition-opacity shadow-[0_3px_10px_-3px_rgba(255,92,40,.45)]">
              View →
            </a>
          </div>
        ))}
      </div>
    </Card>
  )
}
