'use client'

import { useState } from 'react'
import { Card, Avatar, EmptyState } from '@/components/profile/ui/Primitives'
import { getStash } from '@/stubs/getActivity'
import FirstVisitHint from '@/components/ui/FirstVisitHint'

type Filter = 'all' | 'job' | 'post' | 'person'

export default function StashView() {
  const [filter, setFilter] = useState<Filter>('all')
  const items = getStash()
  const shown = filter === 'all' ? items : items.filter(i => i.kind === filter)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-ink leading-tight">Stash</h1>
        <FirstVisitHint id="stash"><p className="text-[12px] text-ink-3 mt-1">Everything you saved for later — jobs, posts, people.</p></FirstVisitHint>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all','job','post','person'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={['px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors capitalize',
              filter===f ? 'bg-orange text-white' : 'bg-card text-ink-2 hover:bg-line border border-line'].join(' ')}>
            {f === 'all' ? 'All' : `${f}s`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>}
            title="Nothing stashed yet" body="Tap the bookmark on any job, post, or person to save it here for later."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {shown.map(it => (
            <Card key={it.id} className="p-4 flex items-center gap-3">
              <Avatar name={it.title} size={44} square color={`from-[${it.color}] to-[${it.color}]`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-ink-3 bg-page px-1.5 py-0.5 rounded">{it.kind}</span>
                  <p className="text-[13px] font-semibold text-ink truncate">{it.title}</p>
                </div>
                <p className="text-[11px] text-ink-3 truncate mt-0.5">{it.sub}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] text-ink-3">{it.savedAt}</span>
                <button className="text-[11px] font-semibold text-orange hover:text-orange-2 transition-colors">Open</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
