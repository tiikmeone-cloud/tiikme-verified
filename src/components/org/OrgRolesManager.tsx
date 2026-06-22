'use client'

import { useEffect, useState } from 'react'
import { getOrgIdBySlug, listOrgJobs, deleteOrgJob, type OrgJob, relativeTime } from '@/lib/applications'
import { toast } from '@/components/profile/ui/Toast'

interface Props {
  orgSlug: string
  onViewPipeline: (jobId: string) => void
}

type StatusFilter = 'all' | 'live' | 'expired'

export default function OrgRolesManager({ orgSlug, onViewPipeline }: Props) {
  const [jobs, setJobs]         = useState<OrgJob[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<StatusFilter>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    const orgId = await getOrgIdBySlug(orgSlug)
    if (!orgId) { setLoading(false); return }
    setJobs(await listOrgJobs(orgId))
    setLoading(false)
  }
  useEffect(() => { load() }, [orgSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const isExpired = (job: OrgJob) => {
    if (!job.is_open) return true
    if (job.expires_at && new Date(job.expires_at) < new Date()) return true
    return false
  }

  const visible = jobs.filter(j => {
    if (filter === 'live')    return !isExpired(j)
    if (filter === 'expired') return isExpired(j)
    return true
  })

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const ok = await deleteOrgJob(deleteId)
    if (ok) {
      toast('Role deleted')
      setJobs(prev => prev.filter(j => j.id !== deleteId))
    } else {
      toast('Could not delete role')
    }
    setDeleteId(null)
    setDeleting(false)
  }

  const liveN    = jobs.filter(j => !isExpired(j)).length
  const expiredN = jobs.filter(j => isExpired(j)).length

  if (loading) return <p className="text-[12px] text-ink-3 py-12 text-center">Loading roles…</p>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-ink">Roles</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">
            <span className="font-semibold text-green">{liveN} live</span>
            {expiredN > 0 && <> · <span className="text-ink-3">{expiredN} expired</span></>}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-page border border-line rounded-[12px] p-0.5 w-fit">
        {(['all', 'live', 'expired'] as StatusFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11.5px] font-semibold px-3.5 py-1.5 rounded-[9px] capitalize transition-all ${
              filter === f ? 'bg-card shadow-sm text-ink border border-line' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Role list */}
      {visible.length === 0 ? (
        <div className="text-center py-12 bg-card border border-line rounded-[14px]">
          <p className="text-[13px] font-semibold text-ink">No {filter === 'all' ? '' : filter} roles</p>
          <p className="text-[12px] text-ink-3 mt-1">Roles you post will appear here.</p>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-[14px] divide-y divide-line">
          {visible.map(job => {
            const expired = isExpired(job)
            const daysLeft = job.expires_at
              ? Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86_400_000)
              : null
            return (
              <div key={job.id} className="px-5 py-4 flex items-center gap-4">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${expired ? 'bg-ink-4' : 'bg-green'}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13.5px] font-semibold text-ink truncate">{job.title}</p>
                    {expired ? (
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-line text-ink-3">CLOSED</span>
                    ) : (
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-green/10 text-green border border-green/20">LIVE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {job.job_type && <span className="text-[11px] text-ink-3">{job.job_type}</span>}
                    {job.work_mode && <><span className="text-ink-4">·</span><span className="text-[11px] text-ink-3">{job.work_mode}</span></>}
                    {job.location && <><span className="text-ink-4">·</span><span className="text-[11px] text-ink-3">{job.location}</span></>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {job.posted_at && (
                      <span className="text-[10.5px] text-ink-3">
                        Posted {relativeTime(job.posted_at)}
                      </span>
                    )}
                    {!expired && daysLeft !== null && daysLeft > 0 && (
                      <><span className="text-ink-4">·</span>
                      <span className="text-[10.5px] text-orange font-semibold">{daysLeft}d left</span></>
                    )}
                    {expired && job.expires_at && (
                      <><span className="text-ink-4">·</span>
                      <span className="text-[10.5px] text-ink-3">Closed {relativeTime(job.expires_at)}</span></>
                    )}
                  </div>
                </div>

                {/* Applicant count */}
                <div className="text-center shrink-0">
                  <p className="text-[18px] font-bold text-ink">{job.applicant_count}</p>
                  <p className="text-[10px] text-ink-3">applicant{job.applicant_count !== 1 ? 's' : ''}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {job.applicant_count > 0 && (
                    <button
                      onClick={() => onViewPipeline(job.id)}
                      className="text-[11.5px] font-semibold text-orange bg-orange/8 border border-orange/20 rounded-[9px] px-3 py-1.5 hover:bg-orange/14 transition-colors whitespace-nowrap"
                    >
                      View pipeline
                    </button>
                  )}
                  {deleteId === job.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-red/80 font-medium">Delete?</span>
                      <button onClick={() => setDeleteId(null)} className="text-[11px] text-ink-3 hover:text-ink px-1.5">No</button>
                      <button onClick={handleDelete} disabled={deleting}
                        className="text-[11px] font-semibold bg-red/10 text-red border border-red/20 rounded-[8px] px-2.5 py-1 hover:bg-red/15 disabled:opacity-50 transition-colors">
                        {deleting ? '…' : 'Yes'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(job.id)}
                      className="w-7 h-7 rounded-[8px] border border-line text-ink-3 hover:text-red hover:border-red/30 flex items-center justify-center transition-colors"
                      title="Delete role">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-line rounded-[16px] shadow-xl p-6 max-w-sm w-full">
            <p className="text-[15px] font-bold text-ink mb-1.5">Delete this role?</p>
            <p className="text-[12.5px] text-ink-3 mb-5">
              All applications for this role will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="text-[12.5px] font-semibold text-ink-3 bg-page border border-line rounded-[10px] px-4 py-2 hover:text-ink transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-[12.5px] font-semibold bg-red text-white rounded-[10px] px-4 py-2 hover:bg-red/90 disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting…' : 'Delete role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
