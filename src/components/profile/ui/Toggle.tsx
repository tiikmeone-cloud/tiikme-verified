'use client'

/* Single, pixel-aligned toggle used everywhere.
   track 44×24, knob 20×20, 2px inset → travel = 44-20-4 = 20px. */
export default function Toggle({ on, onChange, disabled }: {
  on: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={[
        'relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
        on ? 'bg-green' : 'bg-line',
      ].join(' ')}
    >
      <span
        className="absolute left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}
