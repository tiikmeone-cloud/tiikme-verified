'use client'

/**
 * MyApplicationsView — the candidate's pipeline.
 *
 * Backed by `get_user_applications` RPC.
 * Each row shows stage + next-step CTA (Allow consent / View / Withdraw).
 */

import { useEffect, useState } from 'react'
import {
  listMyApplications, advanceStage,
  relativeTime,
  type UserApplication,
} from '@/lib/applications'
import { Card } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

// Maps internal stage to what the candidate sees
function candidateLabel(stage: string): { text: string; cls: string } {
  switch (stage) {
    case 'applied':                   return { text: 'Applied',        cls: 'bg-orange/10 text-orange border border-orange/20' }
    case 'screening':                 return { text: 'Under Review',   cls: 'bg-amber/10 text-amber border border-amber/20' }
    case 'shortlisted':               return { text: 'Shortlisted',    cls: 'bg-purple/10 text-purple border border-purple/20' }
    case 'shortlisted_with_consent':  return { text: 'Shortlisted',    cls: 'bg-purple/10 text-purple border border-purple/20' }
    case 'interview':                 return { text: 'Interview',      cls: 'bg-teal/10 text-teal border border-teal/20' }
    case 'offer':                     return { text: 'Offer',          cls: 'bg-green/10 text-green border border-green/20' }
    case 'hired':                     return { text: 'Hired',          cls: 'bg-green/15 text-green border border-green/30' }
    case 'rejected':                  return { text: 'Not selected',   cls: 'bg-red/8 text-red border border-red/10' }
    case 'withdrawn':                 return { text: 'Withdrawn',      cls: 'bg-page text-ink-3 border border-line' }
    default:                          return { text: stage,            cls: 'bg-page text-ink-3 border border-line' }
  }
}

// Candidate-visible pipeline — only 3 steps. Interview/offer happen offline.
const PIPELINE_STEPS = ['Applied', 'Under Review', 'Shortlisted']
const STAGE_TO_STEP: Record<string, number> = {
  applied: 0,
  screening: 1,
  shortlisted: 2, shortlisted_with_consent: 2,
  interview: 2, offer: 2, hired: 2,
}

export default function MyApplicationsView() {
  const [apps, setApps]                     = useState<UserApplication[]>([])
  const [loading, setLoading]               = useState(true)
  const [withdrawTarget, setWithdrawTarget] = useState<UserApplication | null>(null)
  const [withdrawing, setWithdrawing]       = useState(false)

  const refresh = async () => {
    setLoading(true)
    setApps(await listMyApplications())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return
    setWithdrawing(true)
    if (await advanceStage(withdrawTarget.app_id, 'withdrawn')) {
      toast(`Withdrew from ${withdrawTarget.org_name}`)
      await refresh()
    }
    setWithdrawTarget(null)
    setWithdrawing(false)
  }

  const active = apps.filter(a => !['withdrawn', 'rejected'].includes(a.stage))
  const closed = apps.filter(a =>  ['withdrawn', 'rejected'].includes(a.stage))

  return (
    <div className="space-y-5">
      {/* Withdraw confirmation modal */}
      {withdrawTarget && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[300] flex items-center justify-center p-5">
          <div className="bg-card border border-line rounded-[18px] shadow-xl p-6 max-w-sm w-full">
            <p className="text-[15px] font-bold text-ink mb-1.5">Withdraw application?</p>
            <p className="text-[12.5px] text-ink-3 leading-relaxed mb-5">
              You&apos;re about to withdraw your application for <span className="font-semibold text-ink">{withdrawTarget.job_title}</span> at <span className="font-semibold text-ink">{withdrawTarget.org_name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setWithdrawTarget(null)}
                className="flex-1 text-[13px] font-semibold text-ink-3 bg-page border border-line rounded-[11px] py-2.5 hover:text-ink hover:border-orange/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmWithdraw}
                disabled={withdrawing}
                className="flex-1 text-[13px] font-semibold text-white bg-red rounded-[11px] py-2.5 hover:bg-red/90 disabled:opacity-50 transition-colors"
              >
                {withdrawing ? 'Withdrawing…' : 'Yes, withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="p-5">
        <header className="mb-4">
          <h2 className="text-[16px] font-bold text-ink">My applications</h2>
          <p className="text-[11.5px] text-ink-3 mt-0.5">
            {apps.length === 0
              ? 'You have no applications yet — find a role on Jobs and apply.'
              : `${active.length} active · ${closed.length} closed`}
          </p>
        </header>

        {loading && <p className="text-[12px] text-ink-3 py-8 text-center">Loading…</p>}

        {!loading && active.length > 0 && (
          <div className="space-y-2.5">
            {active.map(a => (
              <ApplicationRow key={a.app_id} app={a} onWithdraw={() => setWithdrawTarget(a)} />
            ))}
          </div>
        )}

        {!loading && closed.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mt-6 mb-2">Closed</p>
            <div className="space-y-2.5 opacity-60">
              {closed.map(a => <ApplicationRow key={a.app_id} app={a} compact />)}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

/* ── Row ── */
function ApplicationRow({
  app, compact, onWithdraw,
}: {
  app: UserApplication
  compact?: boolean
  onWithdraw?: () => void
}) {
  const label = candidateLabel(app.stage)
  const isClosed = ['rejected', 'withdrawn'].includes(app.stage)
  const isHired  = app.stage === 'hired'
  const stepIdx  = STAGE_TO_STEP[app.stage] ?? -1
  const isNew    = !isClosed && app.last_change &&
    (Date.now() - new Date(app.last_change).getTime()) < 48 * 3600 * 1000 &&
    app.last_change !== app.applied_at

  return (
    <div className={`bg-page rounded-[14px] border transition-colors p-3.5 ${
      isClosed ? 'border-line opacity-70' : 'border-line hover:border-orange/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white text-[13px] font-bold shrink-0"
             style={{ backgroundColor: app.org_logo ?? '#f95c28' }}>
          {app.org_name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-semibold text-ink truncate">{app.job_title}</p>
            {app.org_verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-purple)" className="shrink-0">
                <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/>
                <path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/>
              </svg>
            )}
          </div>
          <p className="text-[11px] text-ink-3 truncate mt-0.5">
            {app.org_name}{app.job_location ? ` · ${app.job_location}` : ''}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            {isNew && (
              <span className="text-[9px] font-bold bg-orange text-white px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>
            )}
            <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${label.cls}`}>
              {label.text}
            </span>
          </div>
          {!compact && (
            <span className="text-[10px] text-ink-3">{relativeTime(app.last_change ?? app.applied_at)}</span>
          )}
        </div>
      </div>

      {/* Still at Applied — no bar yet, show waiting state */}
      {!compact && !isClosed && !isHired && app.stage === 'applied' && (
        <div className="mt-2.5 pt-2.5 border-t border-line/60 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange/60 animate-pulse shrink-0" />
          <p className="text-[11px] text-ink-3">Awaiting review from {app.org_name}</p>
        </div>
      )}

      {/* Progress bar — only once org has taken an action (past Applied) */}
      {!compact && !isClosed && !isHired && app.stage !== 'applied' && stepIdx >= 0 && (
        <div className="mt-3 pt-3 border-t border-line/60">
          <div className="flex items-center gap-0">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center w-full">
                  {i > 0 && <div className={`flex-1 h-[1.5px] ${i <= stepIdx ? 'bg-orange' : 'bg-line'}`} />}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    i < stepIdx   ? 'bg-orange' :
                    i === stepIdx ? 'bg-orange ring-2 ring-orange/30' :
                    'bg-line'
                  }`} />
                  {i < PIPELINE_STEPS.length - 1 && <div className={`flex-1 h-[1.5px] ${i < stepIdx ? 'bg-orange' : 'bg-line'}`} />}
                </div>
                <p className={`text-[8.5px] font-medium text-center leading-tight ${i === stepIdx ? 'text-orange font-bold' : 'text-ink-4'}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hired celebration */}
      {!compact && isHired && (
        <div className="mt-2.5 pt-2.5 border-t border-green/20 flex items-center gap-2">
          <span className="text-[11.5px] text-green font-semibold">You got the job! 🎉</span>
        </div>
      )}

      {/* Withdraw CTA */}
      {!compact && !isClosed && stepIdx < 2 && (
        <div className="mt-2 flex justify-end">
          <button onClick={onWithdraw}
            className="text-[10.5px] text-ink-3 hover:text-red transition-colors">
            Withdraw
          </button>
        </div>
      )}
    </div>
  )
}
