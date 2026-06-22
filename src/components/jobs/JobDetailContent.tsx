'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Opening } from '@/stubs/getJobs'
import { getOrg } from '@/stubs/getExplore'
import { toast } from '@/components/profile/ui/Toast'
import { Verified } from '@/components/explore/ExploreCards'
import ApplyModal from '@/components/jobs/ApplyModal'
import ShareSheet from '@/components/home/ShareSheet'
import VouchModal from '@/components/vouches/VouchModal'
import { listMyOrgs } from '@/lib/vouches'
import { toggleBookmark } from '@/lib/bookmarks'
import { findRealJob } from '@/lib/applications'

export function NetworkProofLine({ job, size = 'sm' }: { job: Opening; size?: 'sm'|'md' }) {
  // Only show squad-attested teammates — never "you follow"
  const squad = job.networkAtCompany.filter(p => p.relation === 'squad')
  if (squad.length === 0) return null
  const first = squad[0]
  const extra = squad.length - 1
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {squad.slice(0,3).map((p,i)=>(
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p.avatar} alt="" className="rounded-full object-cover border-2 border-card" style={{ width: size==='md'?22:18, height: size==='md'?22:18, marginLeft: i?-7:0 }} />
        ))}
      </div>
      <span className={`${size==='md'?'text-[12px]':'text-[11px]'} text-ink-3`}>
        <span className="font-semibold text-teal">{first.name}</span>
        {extra>0 ? ` & ${extra} more` : ''} from your squad {squad.length>1?'work':'works'} here
      </span>
    </div>
  )
}

export default function JobDetailContent({ job }: { job: Opening; onRefer: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState<'job'|'company'>('job')
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(!!job.saved)
  const [applyOpen, setApplyOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [vouchFor, setVouchFor] = useState<{ jobId: string; title: string } | null>(null)
  const [isInsider, setIsInsider] = useState(false)
  const isExternal = job.applyMode === 'external'
  const org = getOrg(job.orgSlug)

  const askTiik = () => {
    const skills = job.mustHaveSkills.join(', ')
    const certs = job.certsRequired.length > 0 ? ` Also requires: ${job.certsRequired.join(', ')}.` : ''
    const q = `I'm looking at "${job.title}" at ${job.org} (${job.salary}, ${job.mode}, ${job.experienceLevel}).${certs} Required skills: ${skills}. Based on my verified Flex, what's my actual chance of being shortlisted? What's the specific gap I need to close?`
    router.push('/?q=' + encodeURIComponent(q))
  }

  // Insider check — show Vouch only if user works at this org
  useEffect(() => {
    listMyOrgs().then(orgs => {
      setIsInsider(orgs.some(o => o.org_name.toLowerCase() === job.org.toLowerCase()))
    })
  }, [job.org])

  return (
    <div className="h-full flex flex-col">
      {/* header */}
      <div className="px-5 lg:px-6 pt-5 shrink-0">
        <div className="flex items-start gap-3">
          <a href={`/org/${job.orgSlug}`} className="w-14 h-14 rounded-[15px] flex items-center justify-center text-white text-[22px] font-bold shrink-0" style={{ backgroundColor: job.orgColor }}>{job.org.charAt(0)}</a>
          <div className="flex-1 min-w-0">
            <h2 className="text-[19px] font-bold text-ink leading-tight">{job.title}</h2>
            <a href={`/org/${job.orgSlug}`} className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-orange transition-colors mt-0.5">{job.org} {job.verified && <Verified />}</a>
            <p className="text-[12px] text-ink-3 mt-0.5">{job.location} · {job.postedAt} ago · {job.applicants} applicants</p>
          </div>
        </div>
        {job.networkAtCompany.length>0 && (
          <div className="mt-3 bg-teal/5 border border-teal/15 rounded-[12px] px-3 py-2.5"><NetworkProofLine job={job} size="md" /></div>
        )}
        {/* tabs */}
        <div className="flex gap-5 mt-4 border-b border-line">
          {([['job','Job'],['company','Company']] as ['job'|'company',string][]).map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} className={['pb-2.5 text-[13px] font-semibold border-b-2 transition-colors', tab===id?'border-orange text-ink':'border-transparent text-ink-3 hover:text-ink-2'].join(' ')}>{l}</button>
          ))}
        </div>
      </div>

      {/* scroll body */}
      <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-4">
        {tab === 'job' ? (
          <>
            {/* key-info stat tiles */}
            <div className="grid grid-cols-2 gap-2">
              <Tile l="Salary" v={job.salary} />
              <Tile l="Function" v={job.fn} />
              <Tile l="Level" v={job.experienceLevel} />
              <Tile l="Location" v={job.location} />
              <Tile l="Work arrangement" v={job.officeReq} wide />
            </div>

            <div className="bg-purple/5 border border-purple/15 rounded-[12px] p-3 flex items-center gap-3 mt-4">
              <span className="text-[20px]">🎯</span>
              <div><p className="text-[12px] font-semibold text-ink">You&apos;re an 82% match</p><p className="text-[11px] text-ink-3">Your Flex matches {job.mustHaveSkills.length} of {job.mustHaveSkills.length} must-have skills.</p></div>
            </div>

            <Section title="Who you are"><Bullets items={job.whoYouAre} /></Section>
            <Section title="What the job involves"><Bullets items={job.whatJobInvolves} /></Section>
            <Section title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {job.mustHaveSkills.map(s => <span key={s} className="text-[11px] font-medium text-teal bg-teal/8 border border-teal/15 px-2.5 py-1 rounded-full">{s}</span>)}
                {job.niceToHave.map(s => <span key={s} className="text-[11px] font-medium text-ink-2 bg-page px-2.5 py-1 rounded-full">{s} <span className="text-ink-3">· nice to have</span></span>)}
              </div>
            </Section>
            {job.certsRequired.length>0 && (
              <Section title="Certificates required">
                {job.certsRequired.map(c => (
                  <div key={c} className="flex items-center gap-2 mt-1.5">
                    <div className="w-7 h-7 rounded-[8px] bg-amber/15 flex items-center justify-center shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                    <span className="text-[12px] font-medium text-ink">{c}</span><span className="text-[10px] text-green ml-auto">✓ You have this</span>
                  </div>
                ))}
              </Section>
            )}
          </>
        ) : (
          <>
            {/* COMPANY TAB */}
            <Section title="Our take" first><p className="text-[13px] text-ink-2 leading-relaxed">{job.ourTake}</p>
              <a href={`/org/${job.orgSlug}`} className="inline-flex text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors mt-2">More about {job.org} →</a>
            </Section>

            <Section title="Company benefits">
              <div className="grid grid-cols-2 gap-2">{job.companyBenefits.map(b => <div key={b} className="flex items-center gap-1.5 text-[12px] text-ink-2"><span className="text-green">✓</span>{b}</div>)}</div>
            </Section>

            <Section title="Company HQ"><div className="bg-page rounded-[10px] px-3 py-2 inline-block"><p className="text-[13px] font-semibold text-ink">📍 {job.location}</p></div></Section>

            {org && (
              <>
                <Section title="Leadership">
                  <div className="space-y-2">
                    {org.leadership.map(l => (
                      <div key={l.name} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.avatar} alt={l.name} className="w-10 h-10 rounded-full object-cover" />
                        <div><p className="text-[13px] font-semibold text-ink">{l.name}</p><p className="text-[11px] text-ink-2">{l.title}</p><p className="text-[10px] text-ink-3">{l.background}</p></div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title={`Funding (last ${org.fundingRounds.length} of ${org.fundingRounds.length} rounds)`}>
                  <div className="grid grid-cols-2 gap-2">
                    {org.fundingRounds.map(r => (
                      <div key={r.date} className="bg-page rounded-[10px] p-3"><p className="text-[14px] font-black text-ink">{r.amount}</p><p className="text-[11px] text-ink-2">{r.series}</p><p className="text-[10px] text-ink-3">{r.date}</p></div>
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-3 mt-2">{org.totalFunding}</p>
                </Section>
              </>
            )}

            <Section title="Salary benchmarks">
              <p className="text-[13px] text-ink-2 leading-relaxed">{job.salaryBenchmark}</p>
              <button onClick={()=>toast('Submit your salary to unlock benchmarks')} className="text-[12px] font-semibold text-orange mt-1.5">Contribute salary data →</button>
            </Section>
          </>
        )}
      </div>

      {/* sticky footer · clear hierarchy: Apply primary, side actions small icon chips */}
      <div className="px-5 lg:px-6 py-3.5 border-t border-line shrink-0 bg-card">
        {/* Side-action chips — Save · Share · Vouch (insider only) */}
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <IconChip
            active={saved}
            onClick={async () => {
              const real = await findRealJob(job.org, job.title)
              if (!real) { toast('Cannot save — job not in catalogue yet'); return }
              const n = await toggleBookmark(real.id)
              if (n !== null) { setSaved(!!n); toast(n ? 'Saved to Stash ✓' : 'Removed from Stash') }
            }}
            label={saved ? 'Saved' : 'Save'}
            tint={saved ? 'orange' : 'neutral'}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </IconChip>

          <IconChip onClick={() => setShareOpen(true)} label="Share">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </IconChip>

          <button
            onClick={askTiik}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-[10px] border border-purple/25 bg-purple/8 hover:bg-purple/15 transition-colors text-purple"
          >
            <span className="text-[13px] leading-none">✦</span>
            <span className="text-[10px] font-semibold">Ask Tiik</span>
          </button>

          {isInsider && (
            <IconChip
              onClick={async () => {
                const real = await findRealJob(job.org, job.title)
                if (!real) { toast('Cannot vouch — job not in catalogue yet'); return }
                setVouchFor({ jobId: real.id, title: job.title })
              }}
              label="Vouch"
              tint="purple">
              <path d="M20 6L9 17l-5-5" />
            </IconChip>
          )}
        </div>

        {/* Primary CTA */}
        {isExternal ? (
          <>
            <button onClick={() => toast('Opening company site ↗ — tracked as External in The Grind')}
              className="w-full flex items-center justify-center gap-2 bg-ink text-card text-[14px] font-semibold py-3 rounded-[14px] hover:opacity-90 transition-opacity shadow-[0_4px_12px_-4px_rgba(0,0,0,.25)]">
              Apply on {job.org} site
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
            </button>
            <p className="text-[10.5px] text-ink-3 text-center mt-2">Applications go to the company&apos;s own site. We&apos;ll track it for you.</p>
          </>
        ) : (
          <>
            <button onClick={() => !applied && setApplyOpen(true)} disabled={applied}
              className="w-full bg-gradient-to-br from-orange to-orange-2 text-white text-[14px] font-semibold py-3 rounded-[14px] hover:opacity-95 transition-opacity disabled:opacity-60 shadow-[0_4px_14px_-4px_rgba(255,92,40,.5)]">
              {applied ? '✓ Applied — Flex attached' : 'Apply with my Flex'}
            </button>
            <p className="text-[10.5px] text-ink-3 text-center mt-2">{job.screening.length} quick questions · meet the must-haves to auto-shortlist.</p>
          </>
        )}
      </div>

      {applyOpen && <ApplyModal job={job} onClose={() => setApplyOpen(false)} onApplied={() => setApplied(true)} />}
      {shareOpen && <ShareSheet url={`tiikme.com/jobs/${job.id}`} onClose={() => setShareOpen(false)} />}
      {vouchFor && <VouchModal jobId={vouchFor.jobId} jobTitle={vouchFor.title} orgName={job.org} onClose={() => setVouchFor(null)} />}
    </div>
  )
}

/** Small action chip — Save / Share / Vouch */
function IconChip({
  onClick, label, children, active, tint = 'neutral',
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  active?: boolean
  tint?: 'neutral' | 'orange' | 'purple'
}) {
  const base = 'inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-[10px] px-3 py-2 transition-colors'
  const styles =
    active && tint === 'orange'
      ? `${base} text-orange bg-orange-soft border border-orange/20`
      : tint === 'purple'
        ? `${base} text-purple bg-purple/10 border border-purple/20 hover:bg-purple/15`
        : `${base} text-ink-2 bg-page border border-line hover:border-orange/30 hover:text-ink`
  return (
    <button onClick={onClick} className={styles}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={active && tint === 'orange' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {label}
    </button>
  )
}

function Tile({ l, v, wide }: { l: string; v: string; wide?: boolean }) {
  return <div className={`bg-page rounded-[10px] px-3 py-2.5 ${wide?'col-span-2':''}`}><p className="text-[10px] text-ink-3 leading-none">{l}</p><p className="text-[13px] font-semibold text-ink leading-snug mt-1">{v}</p></div>
}
function Section({ title, first, children }: { title: string; first?: boolean; children: React.ReactNode }) {
  return <div className={first?'':'mt-5'}><p className="text-[13px] font-bold text-ink mb-2">{title}</p>{children}</div>
}
function Bullets({ items }: { items: string[] }) {
  return <ul className="space-y-1.5">{items.map((it,i)=><li key={i} className="flex gap-2 text-[13px] text-ink-2 leading-snug"><span className="text-orange shrink-0 mt-0.5">•</span>{it}</li>)}</ul>
}
