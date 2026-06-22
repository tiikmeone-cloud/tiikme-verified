'use client'

import { useState } from 'react'

interface Props {
  initialHeadline?: string
  onSkip: () => void
  onSave: (data: { headline: string; highlights: [string, string] }) => Promise<void> | void
}

/* Fires after the first profile-photo upload — captures a one-line headline
   and two short highlights to bootstrap the user's profile presence. */
export default function TopHighlightsModal({ initialHeadline = '', onSkip, onSave }: Props) {
  const [headline, setHeadline] = useState(initialHeadline)
  const [h1, setH1] = useState('')
  const [h2, setH2] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = headline.trim().length > 0

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    try { await onSave({ headline: headline.trim(), highlights: [h1.trim(), h2.trim()] }) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <button aria-label="Skip" onClick={onSkip} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div className="relative bg-page rounded-t-[20px] md:rounded-[20px] w-full md:max-w-[440px] p-6 shadow-[0_-8px_30px_rgba(0,0,0,.15)] md:shadow-[0_12px_40px_rgba(0,0,0,.2)]">
        <div className="md:hidden mx-auto w-10 h-1 rounded-full bg-line mb-4" />
        <h2 className="text-[18px] font-bold text-ink">Your top highlights</h2>
        <p className="text-[12px] text-ink-3 mt-1">Tell people what you&apos;re about — shown on your profile and cards.</p>

        <div className="mt-5 space-y-3">
          <Field label="Headline" hint="One line — your tagline">
            <input value={headline} onChange={e => setHeadline(e.target.value)} maxLength={140}
              placeholder="e.g. Product Designer · Building in public" className={inputCls} autoFocus />
          </Field>
          <Field label="Highlight 1" hint="A standout — a role, win, or skill">
            <input value={h1} onChange={e => setH1(e.target.value)} maxLength={120}
              placeholder="e.g. Shipped 0→1 product at Acme" className={inputCls} />
          </Field>
          <Field label="Highlight 2" hint="Optional">
            <input value={h2} onChange={e => setH2(e.target.value)} maxLength={120}
              placeholder="e.g. 3× hackathon winner" className={inputCls} />
          </Field>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button onClick={onSkip} className="flex-1 text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-3">
            Skip for now
          </button>
          <button onClick={submit} disabled={!canSave || saving}
            className="flex-1 text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-3 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-card border border-line rounded-[12px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/50 focus:bg-white transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-wide">{label}</span>
      {hint && <span className="text-[10px] text-ink-3 ml-2 normal-case font-normal">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}
