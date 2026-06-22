'use client'

/* AI Match panel — "85% fit · why", with matched vs missing breakdown.
   Reused on job detail + agent cards. Sample data via props. */
export interface MatchFactor { label: string; have: boolean }

export default function MatchPanel({ score, factors, compact }: {
  score: number; factors: MatchFactor[]; compact?: boolean
}) {
  const got = factors.filter(f => f.have).length
  const ring = score >= 85 ? 'var(--color-green)' : score >= 70 ? 'var(--color-orange)' : 'var(--color-amber)'

  return (
    <div className={`bg-card rounded-[16px] shadow-card ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-3">
        {/* score ring */}
        <div className="relative w-[56px] h-[56px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="23" fill="none" stroke="var(--color-line)" strokeWidth="5" />
            <circle cx="28" cy="28" r="23" fill="none" stroke={ring} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2*Math.PI*23} strokeDashoffset={(2*Math.PI*23)*(1-score/100)} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-[15px] font-black text-ink">{score}<span className="text-[9px]">%</span></span></div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-ink">AI Match</p>
            <span className="text-[8px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full uppercase">AI</span>
          </div>
          <p className="text-[11px] text-ink-3">You meet <b className="text-ink-2">{got} of {factors.length}</b> of what they want.</p>
        </div>
      </div>

      {/* breakdown */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {factors.map(f => (
          <div key={f.label} className="flex items-center gap-1.5">
            <span className={`text-[12px] ${f.have ? 'text-green' : 'text-ink-3'}`}>{f.have ? '✓' : '○'}</span>
            <span className={`text-[12px] ${f.have ? 'text-ink-2' : 'text-ink-3 line-through'}`}>{f.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-ink-3 mt-3 leading-snug">Match runs on your <b>verified</b> Flex — squad-confirmed skills count more.</p>
    </div>
  )
}
