'use client'

import { toast } from '@/components/profile/ui/Toast'

/* Kind, constructive "you don't fit yet → here's the path" feedback.
   Never says "rejected". Turns a near-miss into next steps (incl. no-experience path). */
export interface GapStep { kind: 'cert' | 'project' | 'squad' | 'skill'; label: string; cta: string }

export default function GapFeedback({ role, org, got, total, steps }: {
  role: string; org: string; got: number; total: number; steps: GapStep[]
}) {
  const ICON: Record<GapStep['kind'], string> = { cert:'🎖️', project:'🛠️', squad:'🧑‍🤝‍🧑', skill:'⚡' }
  const handle = (s: GapStep) => {
    if (s.kind === 'cert' || s.kind === 'skill') toast('Opening Level Up — finish it and it lands in your Flex')
    else if (s.kind === 'squad') toast('Pick teammates to verify — counts as proof')
    else toast('Add this to your Flex')
  }
  return (
    <div className="bg-card rounded-[18px] shadow-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[18px]">🌱</span>
        <p className="text-[14px] font-bold text-ink">You&apos;re close — here&apos;s how to land it</p>
      </div>
      <p className="text-[12px] text-ink-2">For <b>{role}</b> at <b>{org}</b> you matched <b className="text-orange">{got} of {total}</b>. Do these and you&apos;re there:</p>

      <div className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 bg-page rounded-[12px] p-3">
            <span className="text-[18px] shrink-0">{ICON[s.kind]}</span>
            <p className="flex-1 text-[12px] text-ink leading-snug">{s.label}</p>
            <button onClick={()=>handle(s)} className="text-[11px] font-semibold text-white bg-orange rounded-[9px] px-3 py-1.5 hover:bg-orange-2 transition-colors shrink-0">{s.cta}</button>
          </div>
        ))}
      </div>

      {/* no-experience reassurance */}
      <div className="mt-3 bg-teal/5 border border-teal/15 rounded-[12px] px-3 py-2.5">
        <p className="text-[11px] text-ink-2 leading-snug"><b className="text-teal">No work experience yet?</b> Tag classmates from a college project to verify it — on tiikme, <b>peer-verified proof counts</b>. You don&apos;t need a job to prove you can do the work.</p>
      </div>
    </div>
  )
}
