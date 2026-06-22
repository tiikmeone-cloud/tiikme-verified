'use client'

import { useEffect, useState } from 'react'
import type { Opening } from '@/stubs/getJobs'
import { toast } from '@/components/profile/ui/Toast'
import { Verified } from '@/components/explore/ExploreCards'
import { NetworkProofLine } from '@/components/jobs/JobDetailContent'
import { toggleBookmark } from '@/lib/bookmarks'
import { findRealJob } from '@/lib/applications'
import { listMyOrgs } from '@/lib/vouches'
import VouchModal from '@/components/vouches/VouchModal'

interface Props { job: Opening; selected: boolean; onSelect: () => void; onRefer: () => void }

export default function JobRow({ job, selected, onSelect }: Props) {
  const [saved, setSaved] = useState(!!job.saved)
  const [vouchFor, setVouchFor] = useState<{ jobId: string; title: string } | null>(null)
  const [insiderOrgNames, setInsiderOrgNames] = useState<Set<string>>(new Set())

  // Insider check — is the current user employed at this job's org?
  useEffect(() => {
    listMyOrgs().then(orgs => setInsiderOrgNames(new Set(orgs.map(o => o.org_name.toLowerCase()))))
  }, [])
  const isInsider = insiderOrgNames.has(job.org.toLowerCase())

  return (
    <div
      role="button" tabIndex={0}
      onClick={onSelect}
      className={['w-full text-left bg-card rounded-[16px] p-4 transition-all border cursor-pointer', selected ? 'border-orange shadow-[0_2px_10px_rgba(255,92,40,.12)]' : 'border-transparent shadow-card hover:border-orange/30'].join(' ')}
    >
      <div className="flex items-start gap-3">
        <a href={`/org/${job.orgSlug}`} onClick={e => e.stopPropagation()}
           className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[16px] font-bold shrink-0 hover:opacity-90 transition-opacity"
           style={{ backgroundColor: job.orgColor }}>{job.org.charAt(0)}</a>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-ink leading-snug truncate">{job.title}</h3>
          <div className="flex items-center gap-1 text-[12px] text-ink-2">
            <a href={`/org/${job.orgSlug}`} onClick={e => e.stopPropagation()} className="truncate hover:text-orange transition-colors">{job.org}</a>
            {job.verified && <Verified />}
          </div>
          <p className="text-[11px] text-ink-3">{job.location} · {job.postedAt}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {job.urgent && <span className="text-[9px] font-bold text-red bg-red/10 px-2 py-0.5 rounded-full">URGENT</span>}
        </div>
      </div>

      {/* tags */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <Tag>{job.type}</Tag><Tag>{job.mode}</Tag><Tag accent>{job.salary}</Tag>
      </div>

      {/* social proof */}
      {job.networkAtCompany.length>0 && <div className="mt-2.5"><NetworkProofLine job={job} /></div>}

      {/* actions — Vouch (insider only) + Save */}
      <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-line text-ink-3">
        <span className="text-[11px] font-medium">{job.applicants} applicants</span>
        <div className="flex-1" />

        {/* Vouch — visible only if you work at this org */}
        {isInsider && (
          <button
            title="Vouch · you work here"
            onClick={async (e) => {
              e.stopPropagation()
              const real = await findRealJob(job.org, job.title)
              if (!real) { toast('Cannot vouch — job not in catalogue yet'); return }
              setVouchFor({ jobId: real.id, title: job.title })
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple bg-purple/10 border border-purple/20 hover:bg-purple/15 rounded-[9px] px-2.5 py-1 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            Vouch
          </button>
        )}

        {/* Save → Stash */}
        <button
          title={saved ? 'Saved · click to remove' : 'Save to Stash'}
          onClick={async (e) => {
            e.stopPropagation()
            const real = await findRealJob(job.org, job.title)
            if (!real) { toast('Cannot save this job (not in catalogue yet)'); return }
            const nowSaved = await toggleBookmark(real.id)
            if (nowSaved !== null) {
              setSaved(!!nowSaved)
              toast(nowSaved ? 'Saved to Stash ✓' : 'Removed from Stash')
            }
          }}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-[9px] px-2.5 py-1 transition-colors ${
            saved ? 'text-orange bg-orange-soft border border-orange/20' : 'text-ink-2 bg-card border border-line hover:border-orange/30'
          }`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={saved?'currentColor':'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {vouchFor && (
        <VouchModal jobId={vouchFor.jobId} jobTitle={vouchFor.title} orgName={job.org} onClose={() => setVouchFor(null)} />
      )}
    </div>
  )
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${accent?'text-orange bg-orange-soft':'text-ink-2 bg-page'}`}>{children}</span>
}
