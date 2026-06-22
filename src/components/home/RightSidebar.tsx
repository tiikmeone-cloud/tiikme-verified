'use client'

import { TRENDING } from '@/stubs/getFeed'

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex w-[360px] shrink-0 flex-col overflow-y-auto border-l border-line p-4 gap-3" style={{ backgroundColor: 'var(--color-page)' }}>
      <div className="px-1 pt-1">
        <p className="text-[13px] font-bold text-ink">Trending topics</p>
      </div>
      <div className="bg-card rounded-[16px] shadow-card overflow-hidden">
        {TRENDING.map((t,i) => (
          <button key={t.tag} className={`w-full flex items-center justify-between px-4 py-3 hover:bg-page transition-colors text-left ${i?'border-t border-line':''}`}>
            <div>
              <p className="text-[13px] font-semibold text-ink">{t.tag}</p>
              <p className="text-[11px] text-ink-3 mt-0.5">{t.posts}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </aside>
  )
}
