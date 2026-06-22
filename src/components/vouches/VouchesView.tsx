'use client'

/**
 * VouchesView — drop-in for Profile's "Vouches" section.
 *
 * Shows:
 *   · Quality score header (trust delta + interview/hired rate)
 *   · Received pending — Accept / Decline
 *   · Received history
 *   · Given history with outcomes
 */

import { useEffect, useState } from 'react'
import {
  listVouchesGiven, listVouchesReceived, getVouchQuality,
  acceptVouch, declineVouch,
  type VouchGiven, type VouchReceived, type VouchQuality, type VouchStatus,
} from '@/lib/vouches'
import { Card } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

export default function VouchesView({ userId }: { userId?: string }) {
  const [given, setGiven] = useState<VouchGiven[]>([])
  const [received, setReceived] = useState<VouchReceived[]>([])
  const [quality, setQuality] = useState<VouchQuality | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const [g, r, q] = await Promise.all([listVouchesGiven(userId), listVouchesReceived(userId), getVouchQuality(userId)])
    setGiven(g); setReceived(r); setQuality(q)
    setLoading(false)
  }
  useEffect(() => { refresh() }, [userId])

  const accept = async (v: VouchReceived) => {
    const id = await acceptVouch(v.vouch_id)
    if (id) {
      toast(`✓ Vouch accepted — application created at ${v.org_name}`)
      await refresh()
    }
  }
  const decline = async (v: VouchReceived) => {
    if (await declineVouch(v.vouch_id)) {
      toast(`Vouch from ${v.voucher_name ?? v.voucher_username} declined`)
      await refresh()
    }
  }

  const pending = received.filter(v => v.status === 'pending')
  const otherReceived = received.filter(v => v.status !== 'pending')

  return (
    <div className="space-y-5">
      {/* Quality hero */}
      {quality && quality.total_vouches > 0 && (
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Vouch quality</p>
              <p className="text-[16px] font-bold text-ink mt-1">
                {quality.interview_or_hired} of {quality.accepted_vouches} vouches landed an interview
              </p>
              <p className="text-[12px] text-ink-2 mt-1 leading-relaxed">
                {quality.quality_pct >= 70
                  ? 'You vouch well — your judgment moves people forward.'
                  : quality.quality_pct >= 40
                    ? 'Solid track record. Keep recommending people you genuinely know.'
                    : 'Vouch carefully — your reputation rides on it.'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[26px] font-black text-ink leading-none">{quality.quality_pct.toFixed(0)}%</p>
              <p className="text-[10px] text-ink-3 mt-1">quality</p>
              <p className={`text-[11px] font-bold mt-2 ${quality.trust_delta >= 0 ? 'text-green' : 'text-red'}`}>
                {quality.trust_delta >= 0 ? `+${quality.trust_delta}` : quality.trust_delta} trust
              </p>
            </div>
          </div>
        </Card>
      )}

      {loading && <p className="text-[12px] text-ink-3 py-8 text-center">Loading vouches…</p>}

      {/* Pending incoming */}
      {!loading && pending.length > 0 && (
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange mb-3">Incoming · {pending.length}</p>
          <div className="space-y-3">
            {pending.map(v => (
              <ReceivedRow key={v.vouch_id} v={v} onAccept={() => accept(v)} onDecline={() => decline(v)} />
            ))}
          </div>
        </Card>
      )}

      {/* Given */}
      {!loading && (
        <Card className="p-5">
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-ink">Vouches I gave</h2>
            <span className="text-[11.5px] text-ink-3">{given.length}</span>
          </header>
          {given.length === 0 ? (
            <p className="text-[12px] text-ink-3 italic py-2">
              You haven&apos;t vouched for anyone yet. Open a job at an org where you work and click <b>Vouch for someone</b>.
            </p>
          ) : (
            <div className="space-y-2">
              {given.map(v => <GivenRow key={v.vouch_id} v={v} />)}
            </div>
          )}
        </Card>
      )}

      {/* Older received (accepted / declined) */}
      {!loading && otherReceived.length > 0 && (
        <Card className="p-5">
          <header className="mb-3"><h2 className="text-[15px] font-bold text-ink">Vouches I received</h2></header>
          <div className="space-y-2">
            {otherReceived.map(v => <ReceivedRow key={v.vouch_id} v={v} compact />)}
          </div>
        </Card>
      )}
    </div>
  )
}

/* ── Received row ── */
function ReceivedRow({
  v, onAccept, onDecline, compact,
}: {
  v: VouchReceived
  onAccept?: () => void
  onDecline?: () => void
  compact?: boolean
}) {
  return (
    <div className="bg-page rounded-[14px] border border-line p-3.5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {v.voucher_avatar
          ? <img src={v.voucher_avatar} alt="" className="w-10 h-10 rounded-[12px] object-cover shrink-0" />
          : <span className="w-10 h-10 rounded-[12px] bg-purple/15 text-purple flex items-center justify-center text-[13px] font-bold shrink-0">
              {(v.voucher_name ?? v.voucher_username).charAt(0).toUpperCase()}
            </span>}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-semibold text-ink truncate">{v.voucher_name ?? v.voucher_username}</p>
            <span className="text-[10px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full">
              insider at {v.org_name}
            </span>
            {v.voucher_trust_delta > 0 && (
              <span className="text-[10px] font-bold text-green bg-green/10 px-1.5 py-0.5 rounded-full">
                +{v.voucher_trust_delta} trust
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-ink-3">{v.voucher_headline ?? '—'}</p>
          <p className="text-[10.5px] text-ink-3 mt-0.5">vouched for <b className="text-ink-2">{v.job_title}</b> at {v.org_name}</p>

          <p className="mt-2 text-[12.5px] text-ink leading-relaxed italic bg-card border border-line rounded-[10px] p-2.5">
            “{v.why_brief}”
          </p>

          {!compact && (
            <div className="flex items-center gap-2 mt-3">
              <button onClick={onDecline}
                className="text-[11.5px] font-semibold text-ink-3 hover:text-red transition-colors px-2.5 py-1.5">
                Decline
              </button>
              <button onClick={onAccept}
                className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-3.5 py-1.5 hover:opacity-95 transition-opacity shadow-[0_3px_10px_-3px_rgba(255,92,40,.45)]">
                Accept &amp; apply →
              </button>
            </div>
          )}
          {compact && <StatusPill status={v.status} />}
        </div>
      </div>
    </div>
  )
}

/* ── Given row ── */
function GivenRow({ v }: { v: VouchGiven }) {
  const outcomeTint = v.outcome === 'hired'     ? 'text-green bg-green/10'
                    : v.outcome === 'interview' ? 'text-orange bg-orange-soft'
                    : v.outcome === 'spam'      ? 'text-red bg-red/10'
                    : 'text-ink-3 bg-page'
  return (
    <div className="bg-page rounded-[12px] border border-line p-3 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {v.referee_avatar
        ? <img src={v.referee_avatar} alt="" className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
        : <span className="w-9 h-9 rounded-[10px] bg-orange-soft text-orange flex items-center justify-center text-[12px] font-bold shrink-0">
            {(v.referee_name ?? v.referee_username).charAt(0).toUpperCase()}
          </span>}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-ink truncate">{v.referee_name ?? v.referee_username}</p>
        <p className="text-[10.5px] text-ink-3 truncate">{v.job_title} · {v.org_name}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusPill status={v.status} />
        {v.outcome && (
          <span className={`text-[9.5px] font-bold rounded-full px-1.5 py-0.5 ${outcomeTint}`}>{v.outcome}</span>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: VouchStatus }) {
  const tint =
    status === 'accepted' ? 'text-green bg-green/10' :
    status === 'declined' ? 'text-ink-3 bg-page' :
    status === 'expired'  ? 'text-ink-3 bg-page' :
                            'text-orange bg-orange-soft'
  return <span className={`text-[9.5px] font-bold rounded-full px-1.5 py-0.5 ${tint}`}>{status}</span>
}
