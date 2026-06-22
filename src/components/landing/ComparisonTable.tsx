'use client'

/**
 * ComparisonTable — tiikme vs other platforms.
 *
 * No competitor names. The "Other platforms" column lists the
 * structural gaps that everyone in the legacy space shares.
 */

import { Check, X, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Row {
  feature: string
  tiikme: string
  others: string
}

const ROWS: Row[] = [
  {
    feature: 'Your work history',
    tiikme: 'Verified by the peers and orgs you worked with',
    others: 'Self-typed claims nobody checks',
  },
  {
    feature: 'How trust is measured',
    tiikme: 'A Trust Score and squad density you can’t fake',
    others: 'Follower counts and one-click endorsements',
  },
  {
    feature: 'AI that works for you',
    tiikme: 'Tiik reads your verified Flex and watches the market',
    others: 'A search box wrapped in ads',
  },
  {
    feature: 'Referrals',
    tiikme: 'Vouches — only people who work there can vouch',
    others: 'Open referral links anyone can spam',
  },
  {
    feature: 'Who controls your data',
    tiikme: 'Your Flex is shared only when you say yes',
    others: 'Recruiters bulk-export you without a word',
  },
  {
    feature: 'Reading a company',
    tiikme: 'Squad density — measurable internal trust',
    others: 'Anonymous reviews and gut feel',
  },
  {
    feature: 'Cold outreach',
    tiikme: 'None — contact is revealed on mutual consent',
    others: 'A flood of recruiter InMail',
  },
  {
    feature: 'Your identity',
    tiikme: 'One living profile that holds every role',
    others: 'A frozen resume and a stale profile',
  },
  {
    feature: 'Knowing where you stand',
    tiikme: 'A live pipeline — every stage update reaches you',
    others: 'Apply, then silence',
  },
  {
    feature: 'Built for India',
    tiikme: 'WhatsApp-native, vernacular-ready, tier-2/3 first',
    others: 'Metro-English platforms ported from abroad',
  },
]

export default function ComparisonTable() {
  return (
    <section className="relative z-10 px-6 lg:px-10 py-20">
      <div className="max-w-[1100px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <Badge className="bg-orange-soft text-orange border-orange/20 hover:bg-orange-soft">Built different</Badge>
          <h2 className="text-[34px] lg:text-[44px] font-bold text-ink tracking-tight mt-4 leading-[1.05]">
            What everyone else skipped
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-[560px] mx-auto leading-relaxed">
            The legacy platforms all share the same blind spots. tiikme is built around the three things they left out — <b className="text-ink">verified work, real peer trust, and your consent</b>.
          </p>
        </div>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 md:hidden gap-3">
          {ROWS.map(r => (
            <div key={r.feature} className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[16px] p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,.10),inset_0_1px_0_rgba(255,255,255,.7)]">
              <p className="text-[12.5px] font-bold text-ink mb-2.5">{r.feature}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-orange" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange">tiikme</p>
                  </div>
                  <p className="text-[11.5px] text-ink-2 leading-snug">{r.tiikme}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <X className="w-3 h-3 text-ink-3" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Everywhere else</p>
                  </div>
                  <p className="text-[11.5px] text-ink-3 leading-snug">{r.others}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table — glossy */}
        <div className="hidden md:block bg-white/85 backdrop-blur-xl border border-white/60 rounded-[22px] overflow-hidden shadow-[0_18px_50px_-18px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.7)]">
          {/* Header row */}
          <div className="grid grid-cols-[1.1fr_1.4fr_1.4fr] border-b border-white/60 bg-white/40">
            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">What matters</p>
            </div>
            <div className="px-5 py-4 border-l border-white/60 bg-gradient-to-br from-orange/8 to-transparent">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-soft border border-orange/20">
                <Sparkles className="w-3 h-3 text-orange" />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange">tiikme</p>
              </div>
            </div>
            <div className="px-5 py-4 border-l border-white/60">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-page border border-line">
                <X className="w-3 h-3 text-ink-3" />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Everywhere else</p>
              </div>
            </div>
          </div>

          {/* Body rows */}
          {ROWS.map((r, i) => (
            <div key={r.feature}
              className={[
                'grid grid-cols-[1.1fr_1.4fr_1.4fr] hover:bg-white/60 transition-colors',
                i !== ROWS.length - 1 ? 'border-b border-white/50' : '',
              ].join(' ')}>
              <div className="px-5 py-4">
                <p className="text-[13px] font-semibold text-ink leading-snug">{r.feature}</p>
              </div>
              <div className="px-5 py-4 border-l border-white/50 bg-gradient-to-br from-orange/[0.04] to-transparent">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-orange shrink-0 mt-0.5" strokeWidth={2.6} />
                  <p className="text-[13px] text-ink leading-snug">{r.tiikme}</p>
                </div>
              </div>
              <div className="px-5 py-4 border-l border-white/50">
                <div className="flex items-start gap-2">
                  <X className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" strokeWidth={2.4} />
                  <p className="text-[13px] text-ink-3 leading-snug">{r.others}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-[11px] text-ink-3 text-center mt-6 max-w-[600px] mx-auto leading-relaxed">
          We don&apos;t name names — the gaps speak for themselves. If your current platform treats your
          profile as a billboard and your contact as inventory, you&apos;ll feel the difference the moment you start.
        </p>
      </div>
    </section>
  )
}
