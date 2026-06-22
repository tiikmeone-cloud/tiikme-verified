'use client'

/**
 * CompareCandidatesModal — pin 2–4 candidates and view them side-by-side.
 * Matches the "Applicant Comparison" pattern from the Dribbble references:
 * rows = attributes (Match · Stage · Experience · Location · Source · Email
 * · Skills · Past hires via tiikme), columns = candidates.
 */

import { type OrgApplication, STAGE_LABEL, STAGE_TINT, relativeTime } from '@/lib/applications'

interface Props { apps: OrgApplication[]; onClose: () => void; onOpenOne: (a: OrgApplication) => void }

export default function CompareCandidatesModal({ apps, onClose, onOpenOne }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="bg-card border border-line rounded-[20px] shadow-[0_24px_64px_-20px_rgba(0,0,0,.4)] w-full max-w-[1080px]">
          <div className="px-5 pt-5 pb-3 border-b border-line flex items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Side-by-side</p>
              <h2 className="text-[17px] font-bold text-ink mt-1">Comparing {apps.length} candidates</h2>
            </div>
            <button onClick={onClose} className="ml-auto text-ink-3 hover:text-orange text-[18px] px-2">✕</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-page border-b border-line">
                <tr>
                  <th className="text-left text-[10.5px] uppercase tracking-wider font-semibold text-ink-3 px-3 py-2.5 w-[150px]">Attribute</th>
                  {apps.map(a => (
                    <th key={a.app_id} className="px-3 py-2.5 text-left min-w-[200px]">
                      <button onClick={() => onOpenOne(a)} className="flex items-center gap-2 text-left">
                        {a.user_avatar
                          ? <img src={a.user_avatar} alt="" className="w-9 h-9 rounded-[10px] object-cover shrink-0" /> /* eslint-disable-line @next/next/no-img-element */
                          : <span className="w-9 h-9 rounded-[10px] bg-orange-soft text-orange flex items-center justify-center text-[12px] font-bold shrink-0">
                              {(a.user_full_name ?? a.user_username).charAt(0).toUpperCase()}
                            </span>}
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate leading-tight">{a.user_full_name ?? a.user_username}</p>
                          <p className="text-[10.5px] text-ink-3 font-normal truncate">{a.user_headline ?? '—'}</p>
                        </div>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <Row label="Match score" cols={apps.map(a => typeof a.ai_score === 'number'
                  ? <span key={a.app_id} className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${
                      a.ai_score >= 85 ? 'bg-green/10 text-green'
                      : a.ai_score >= 70 ? 'bg-orange-soft text-orange'
                      : 'bg-page text-ink-3 border border-line'}`}>{Math.round(a.ai_score)}%</span>
                  : <span key={a.app_id} className="text-ink-3">—</span>)} />
                <Row label="Stage" cols={apps.map(a =>
                  <span key={a.app_id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_TINT[a.stage].bg} ${STAGE_TINT[a.stage].fg}`}>{STAGE_LABEL[a.stage]}</span>
                )} />
                <Row label="Past hires via tiikme" cols={apps.map(a => a.past_hires_count > 0
                  ? <span key={a.app_id} className="text-[10.5px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full">✓ {a.past_hires_count}</span>
                  : <span key={a.app_id} className="text-ink-3">—</span>)} />
                <Row label="Experience" cols={apps.map(a => {
                  const y = (a.screening_answers as Record<string, unknown> | null)?.years
                  return <span key={a.app_id} className="text-ink-2">{y ? `${String(y)} yrs` : '—'}</span>
                })} />
                <Row label="Location" cols={apps.map(a => <span key={a.app_id} className="text-ink-2">{a.user_city ?? '—'}</span>)} />
                <Row label="Source" cols={apps.map(a =>
                  <span key={a.app_id} className="text-ink-2">{a.source === 'in_platform' ? 'On tiikme' : a.source === 'external' ? 'External' : a.source === 'referral' ? 'Referral' : a.source}</span>
                )} />
                <Row label="Knockout" cols={apps.map(a =>
                  a.knockout_passed === true ? <span key={a.app_id} className="text-[10.5px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full">✓ Passed</span>
                  : a.knockout_passed === false ? <span key={a.app_id} className="text-[10.5px] font-bold text-red bg-red/10 px-2 py-0.5 rounded-full">✕ Failed</span>
                  : <span key={a.app_id} className="text-ink-3">—</span>
                )} />
                <Row label="Email" cols={apps.map(a => a.applicant_email
                  ? <a key={a.app_id} href={`mailto:${a.applicant_email}`} className="text-ink-2 hover:text-orange font-medium truncate block">{a.applicant_email}</a>
                  : <span key={a.app_id} className="text-ink-3">—</span>)} />
                <Row label="Applied" cols={apps.map(a => <span key={a.app_id} className="text-ink-3">{relativeTime(a.applied_at)}</span>)} />

                {/* Skills — union row, each candidate gets ✓ for skills they have */}
                <tr>
                  <td className="px-3 py-2.5 text-[10.5px] uppercase tracking-wider font-semibold text-ink-3 align-top">Verified skills</td>
                  {apps.map(a => (
                    <td key={a.app_id} className="px-3 py-2.5 align-top">
                      <div className="flex flex-wrap gap-1">
                        {a.user_skills?.length > 0
                          ? a.user_skills.map(s => <span key={s} className="text-[10.5px] font-medium text-teal bg-teal/8 border border-teal/15 px-2 py-0.5 rounded-full">{s}</span>)
                          : <span className="text-ink-3 text-[11px]">—</span>}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Flex link row */}
                <tr className="bg-page">
                  <td className="px-3 py-2.5 text-[10.5px] uppercase tracking-wider font-semibold text-ink-3">View Flex</td>
                  {apps.map(a => (
                    <td key={a.app_id} className="px-3 py-2.5">
                      <a href={`/profile/${a.user_username}`} target="_blank" rel="noopener"
                         className="text-[11.5px] font-semibold text-orange hover:opacity-80">Open Flex ↗</a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 border-t border-line flex items-center justify-end">
            <button onClick={onClose} className="text-[12.5px] font-semibold text-ink-2 bg-page border border-line rounded-[10px] py-2 px-4 hover:opacity-90">Close</button>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, cols }: { label: string; cols: React.ReactNode[] }) {
  return (
    <tr>
      <td className="px-3 py-2.5 text-[10.5px] uppercase tracking-wider font-semibold text-ink-3">{label}</td>
      {cols.map((c, i) => <td key={i} className="px-3 py-2.5">{c}</td>)}
    </tr>
  )
}
