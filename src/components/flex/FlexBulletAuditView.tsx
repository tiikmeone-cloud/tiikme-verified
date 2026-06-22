'use client'

/**
 * FlexBulletAuditView — Twin's inline polish surfaced as a list of suggestions.
 *
 * Each row: original line → Twin's rewrite → [Skip] [Apply].
 * Applying records `applied=true` and visually marks the row as done.
 *
 * The bullets table is populated by the Audit RPC; for the demo they're
 * pre-seeded so the user immediately sees Twin's polish suggestions.
 */

import { useEffect, useState } from 'react'
import { listMyBullets, applyBullet, type FlexBullet } from '@/lib/bullets'
import { Card } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

export default function FlexBulletAuditView() {
  const [bullets, setBullets] = useState<FlexBullet[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => { setLoading(true); setBullets(await listMyBullets()); setLoading(false) }
  useEffect(() => { refresh() }, [])

  const apply = async (b: FlexBullet) => {
    await applyBullet(b.id)
    toast('✓ Applied — line updated on your Flex')
    await refresh()
  }
  const skip = async (b: FlexBullet) => {
    // For demo, "skip" just visually hides — we keep the record around so user can revisit.
    toast(`Skipped — kept your original line`)
    setBullets(p => p.filter(x => x.id !== b.id))
  }

  const pending = bullets.filter(b => !b.applied)
  const applied = bullets.filter(b => b.applied)

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <header className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Tiik · Flex polish</p>
          <h2 className="text-[16px] font-bold text-ink mt-1">
            {pending.length > 0
              ? `${pending.length} line${pending.length > 1 ? 's' : ''} could be sharper`
              : 'Your Flex is sharp'}
          </h2>
          <p className="text-[12px] text-ink-2 mt-1 leading-relaxed">
            Twin reviewed every line. Pick the ones you want to apply — your reputation, your call.
          </p>
        </header>

        {loading && <p className="text-[12px] text-ink-3 py-8 text-center">Loading…</p>}

        {pending.length === 0 && applied.length === 0 && !loading && (
          <p className="text-[12px] text-ink-3 italic py-2">No suggestions right now — open <b>/audit</b> to refresh.</p>
        )}

        <div className="space-y-3">
          {pending.map(b => (
            <div key={b.id} className="bg-page rounded-[14px] border border-line p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-1.5">Right now</p>
              <p className="text-[12.5px] text-ink-2 italic leading-snug bg-card border border-line rounded-[10px] p-2.5">
                “{b.original}”
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange mt-3 mb-1.5">Tiik suggests</p>
              <p className="text-[13.5px] text-ink leading-relaxed font-medium bg-orange-soft border border-orange/20 rounded-[10px] p-3">
                {b.suggestion}
              </p>

              {b.why && (
                <p className="text-[11px] text-ink-3 mt-2 leading-relaxed">
                  <b className="text-ink-2">Why:</b> {b.why}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => skip(b)}
                  className="text-[12px] font-semibold text-ink-2 bg-card border border-line rounded-[10px] px-3 py-1.5 hover:bg-page transition-colors">
                  Skip
                </button>
                <button onClick={() => apply(b)}
                  className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-4 py-1.5 hover:opacity-95 transition-opacity shadow-[0_3px_10px_-3px_rgba(255,92,40,.45)]">
                  Apply ✓
                </button>
              </div>
            </div>
          ))}
        </div>

        {applied.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mt-6 mb-2">
              Applied · {applied.length}
            </p>
            <div className="space-y-1.5">
              {applied.map(b => (
                <div key={b.id} className="bg-green/5 border border-green/15 rounded-[12px] px-3 py-2">
                  <p className="text-[11.5px] text-green leading-snug">
                    <b>✓ Applied:</b> {b.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
