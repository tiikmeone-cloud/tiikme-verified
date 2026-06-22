'use client'

/**
 * SmartSelect — searchable dropdown with an "Other" escape hatch.
 *
 * · Type to filter.
 * · Pick a curated/crowd-promoted option.
 * · No match? "Other: <what you typed>" appears — pick it and the value is
 *   yours immediately, recorded so the taxonomy learns it.
 *
 * This is the pattern that beats LinkedIn's rigid lists: opinionated defaults
 * that never trap the user, and a crowd loop that fills the gaps over time.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULTS, popularCustomValues, recordCustomValue, type FieldKey } from '@/lib/taxonomy'

interface Props {
  field: FieldKey
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  /** allow multiple selections, comma-joined into `value` */
  multi?: boolean
  required?: boolean
}

export default function SmartSelect({
  field, value, onChange, label, placeholder = 'Search or type…', multi = false, required,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [crowd, setCrowd] = useState<string[]>([])
  const boxRef = useRef<HTMLDivElement>(null)

  // Load crowd-promoted values once
  useEffect(() => { popularCustomValues(field).then(setCrowd) }, [field])

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = useMemo(() => multi ? value.split(',').map(s => s.trim()).filter(Boolean) : [], [value, multi])

  const options = useMemo(() => {
    const merged = [...DEFAULTS[field], ...crowd.filter(c => !DEFAULTS[field].includes(c))]
    if (!query.trim()) return merged
    const q = query.toLowerCase()
    return merged.filter(o => o.toLowerCase().includes(q))
  }, [field, crowd, query])

  const exactMatch = options.some(o => o.toLowerCase() === query.trim().toLowerCase())
  const showOther = query.trim().length >= 2 && !exactMatch

  const pick = (v: string) => {
    if (multi) {
      const next = selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]
      onChange(next.join(', '))
      setQuery('')
    } else {
      onChange(v)
      setQuery('')
      setOpen(false)
    }
  }

  const pickOther = () => {
    const v = query.trim()
    recordCustomValue(field, v)        // learn it
    pick(v)
  }

  return (
    <div ref={boxRef} className="relative">
      {label && (
        <span className="text-[11px] font-semibold text-ink-2 block mb-1.5">
          {label}{required && <span className="text-orange ml-0.5">*</span>}
        </span>
      )}

      {/* control */}
      <div
        onClick={() => setOpen(true)}
        className={[
          'min-h-[42px] w-full bg-card border rounded-[12px] px-3 py-2 flex items-center gap-1.5 flex-wrap cursor-text transition-colors',
          open ? 'border-orange/40 shadow-[0_0_0_3px_rgba(255,92,40,.07)]' : 'border-line hover:border-line',
        ].join(' ')}>
        {/* multi chips */}
        {multi && selected.map(s => (
          <span key={s} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-orange bg-orange-soft border border-orange/20 rounded-full pl-2 pr-1 py-0.5">
            {s}
            <button onClick={(e) => { e.stopPropagation(); pick(s) }} className="hover:bg-orange/15 rounded-full w-4 h-4 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        ))}

        {/* single value (when closed & not searching) */}
        {!multi && value && !query && !open && (
          <span className="text-[13px] text-ink">{value}</span>
        )}

        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={(!multi && value && !open) ? '' : (multi && selected.length ? 'Add more…' : placeholder)}
          className="flex-1 min-w-[80px] bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none py-0.5"
        />

        <svg className={['shrink-0 text-ink-3 transition-transform', open ? 'rotate-180' : ''].join(' ')} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {/* dropdown */}
      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-card border border-line rounded-[14px] shadow-[0_18px_50px_-18px_rgba(0,0,0,.25)] overflow-hidden max-h-[280px] overflow-y-auto">
          {options.map(o => {
            const isSel = multi ? selected.includes(o) : value === o
            const isCrowd = !DEFAULTS[field].includes(o)
            return (
              <button key={o} onClick={() => pick(o)}
                className={['w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-page', isSel ? 'text-orange font-semibold bg-orange-soft/40' : 'text-ink'].join(' ')}>
                <span className="flex-1">{o}</span>
                {isCrowd && <span className="text-[9px] font-bold uppercase tracking-wider text-purple bg-purple/10 px-1.5 py-0.5 rounded-full">community</span>}
                {isSel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            )
          })}

          {/* Other escape hatch */}
          {showOther && (
            <button onClick={pickOther}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-t border-line hover:bg-orange-soft/40 transition-colors">
              <span className="w-5 h-5 rounded-[6px] bg-orange-soft text-orange flex items-center justify-center shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </span>
              <span className="text-[13px] text-ink">Other: <b className="text-orange">{query.trim()}</b></span>
            </button>
          )}

          {options.length === 0 && !showOther && (
            <p className="px-3 py-3 text-[12px] text-ink-3 italic">Type at least 2 characters to add your own.</p>
          )}
        </div>
      )}
    </div>
  )
}
