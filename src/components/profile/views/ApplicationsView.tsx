'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/profile/ui/Primitives'
import { listMyApplications, relativeTime, STAGE_LABEL, STAGE_TINT, type UserApplication, type Stage } from '@/lib/applications'
import FirstVisitHint from '@/components/ui/FirstVisitHint'

const PIPELINE: Stage[] = ['applied', 'screening', 'shortlisted', 'interview', 'offer']

type FilterTab = 'all' | 'active' | 'interview' | 'offer' | 'closed'

const NEXT_STEP: Record<Stage, string> = {
  applied:                  'Received — recruiter avg response 2–5 days',
  screening:                'Screening in progress — recruiter reviewing',
  shortlisted:              'You made the shortlist 🎉 — prep your portfolio',
  shortlisted_with_consent: 'Awaiting your consent to share Flex with org',
  interview:                'Interview round — check your email for details',
  offer:                    'Offer received — review & respond',
  hired:                    'Hired 🎉 — congratulations!',
  rejected:                 'Not progressing — your profile got views since',
  withdrawn:                'Withdrawn by you',
}

function orgColor(name: string): string {
  const colors = ['#FF5C28','#6D4BD8','#2BB3A3','#2FB866','#F5A524','#3B82F6','#EC4899']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function ApplicationsView() {
  const [apps, setApps] = useState<UserApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    listMyApplications().then(data => {
      setApps(data)
      setLoading(false)
      if (data.length > 0) setOpen(data[0].app_id)
    })
  }, [])

  const shown = apps.filter(a => {
    if (filter === 'all')       return true
    if (filter === 'active')    return !['rejected','withdrawn','offer','hired'].includes(a.stage)
    if (filter === 'interview') return a.stage === 'interview'
    if (filter === 'offer')     return a.stage === 'offer' || a.stage === 'hired'
    if (filter === 'closed')    return a.stage === 'rejected' || a.stage === 'withdrawn'
    return true
  })

  const counts = {
    total:      apps.length,
    active:     apps.filter(a => !['rejected','withdrawn','offer','hired'].includes(a.stage)).length,
    interviews: apps.filter(a => a.stage === 'interview').length,
    offers:     apps.filter(a => a.stage === 'offer' || a.stage === 'hired').length,
  }
  const responseRate = apps.length > 0
    ? Math.round((apps.filter(a => a.stage !== 'applied').length / apps.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-ink leading-tight">My Applications</h1>
        <FirstVisitHint id="applications"><p className="text-[12px] text-ink-3 mt-1">Track every job you applied to and what happens next.</p></FirstVisitHint>
      </div>

      {/* Insight strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InsightCard value={loading ? '—' : counts.total}      label="Applied"       accent="ink" />
        <InsightCard value={loading ? '—' : counts.active}     label="In progress"   accent="orange" />
        <InsightCard value={loading ? '—' : counts.interviews} label="Interviews"    accent="purple" />
        <InsightCard value={loading ? '—' : `${responseRate}%`} label="Response rate" accent="green" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {([['all','All'],['active','Active'],['interview','Interviewing'],['offer','Offers'],['closed','Closed']] as [FilterTab,string][]).map(([id,l]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={['px-3.5 py-1.5 text-[12px] font-medium rounded-full whitespace-nowrap transition-colors shrink-0',
              filter===id ? 'bg-orange text-white' : 'bg-card text-ink-2 border border-line hover:bg-line'].join(' ')}>
            {l}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <Card key={i} className="p-4 h-20 animate-pulse bg-line/40">{null}</Card>)}
        </div>
      )}

      {/* Empty */}
      {!loading && apps.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-[20px] mb-2">📋</p>
          <p className="text-[14px] font-semibold text-ink mb-1">No applications yet</p>
          <p className="text-[12px] text-ink-3">Apply to a role from the Jobs tab — it shows up here instantly.</p>
        </Card>
      )}

      {/* List */}
      {!loading && (
        <div className="space-y-2">
          {shown.map(a => <AppCard key={a.app_id} a={a} open={open===a.app_id} onToggle={() => setOpen(open===a.app_id?null:a.app_id)} />)}
          {shown.length === 0 && apps.length > 0 && (
            <Card className="p-10 text-center"><p className="text-[13px] text-ink-3">No applications in this filter.</p></Card>
          )}
        </div>
      )}
    </div>
  )
}

function InsightCard({ value, label, accent }: { value: React.ReactNode; label: string; accent: string }) {
  return (
    <Card className="p-4">
      <div className={`text-[24px] font-black leading-none text-${accent}`}>{value}</div>
      <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
    </Card>
  )
}

function AppCard({ a, open, onToggle }: { a: UserApplication; open: boolean; onToggle: () => void }) {
  const stageIdx = PIPELINE.indexOf(a.stage)
  const color = orgColor(a.org_name)
  const tint = STAGE_TINT[a.stage]
  const isClosed = a.stage === 'rejected' || a.stage === 'withdrawn'

  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        {/* Org logo or initial */}
        {a.org_logo
          ? <img src={a.org_logo} alt={a.org_name} className="w-12 h-12 rounded-[12px] object-cover shrink-0" />
          : <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-white text-[18px] font-bold shrink-0" style={{ backgroundColor: color }}>
              {a.org_name.charAt(0)}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-ink truncate">{a.job_title}</p>
          <p className="text-[12px] text-ink-3 truncate">
            {a.org_name}{a.org_verified ? ' ✓' : ''}{a.job_location ? ` · ${a.job_location}` : ''}
          </p>
          <p className="text-[11px] text-ink-2 mt-1 flex items-center gap-1">
            <span className="text-orange">→</span> {NEXT_STEP[a.stage]}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${tint.bg} ${tint.fg} ${tint.ring}`}>
            {STAGE_LABEL[a.stage]}
          </span>
          <span className="text-[10px] text-ink-3">Applied {relativeTime(a.applied_at)}</span>
        </div>
      </button>

      {open && !isClosed && (
        <div className="px-4 pb-4 pt-1">
          {/* Stage pipeline */}
          <div className="flex items-center">
            {PIPELINE.map((step, i) => {
              const done = stageIdx >= 0 && i <= stageIdx
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={['w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold', done?'bg-orange text-white':'bg-line text-ink-3'].join(' ')}>{done?'✓':i+1}</div>
                    <span className={['text-[9px] capitalize', done?'text-ink font-medium':'text-ink-3'].join(' ')}>{STAGE_LABEL[step]}</span>
                  </div>
                  {i < PIPELINE.length-1 && <div className={['h-0.5 flex-1 mx-1 -mt-4', i < stageIdx ?'bg-orange':'bg-line'].join(' ')} />}
                </div>
              )
            })}
          </div>

          {/* Consent prompt */}
          {a.stage === 'shortlisted_with_consent' && (
            <div className="mt-3 rounded-[12px] bg-orange-soft border border-orange/20 p-3">
              <p className="text-[12px] font-semibold text-ink">Share your Flex with {a.org_name}?</p>
              <p className="text-[11px] text-ink-3 mt-0.5 mb-2">They've shortlisted you and need your full verified Flex to proceed.</p>
              <button className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-4 py-1.5 hover:opacity-95 transition-opacity">
                Share Flex →
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 text-[12px] font-semibold text-white bg-orange rounded-[10px] py-2 hover:bg-orange-2 transition-colors">View job</button>
            <button className="px-4 text-[12px] font-medium text-ink-2 bg-page rounded-[10px] py-2 border border-line hover:bg-line transition-colors">Message recruiter</button>
            <button className="px-3 text-[12px] font-medium text-ink-3 bg-page rounded-[10px] py-2 border border-line hover:bg-line transition-colors">Withdraw</button>
          </div>
        </div>
      )}

      {open && isClosed && (
        <div className="px-4 pb-4 pt-1">
          <div className="bg-page rounded-[10px] p-3 text-[11px] text-ink-3">
            {a.stage === 'rejected'
              ? <>Role closed. Keep going — <button className="text-orange font-semibold">Find similar roles →</button></>
              : 'You withdrew from this application.'}
          </div>
        </div>
      )}
    </Card>
  )
}
