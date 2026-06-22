'use client'

/**
 * Two-step consent — used both for Flex download (step 1) and contact reveal
 * (step 2). Same component, different content via the `kind` prop.
 */

import { useState } from 'react'

export type ConsentKind = 'flex' | 'contact'

interface Props {
  kind: ConsentKind
  orgName: string
  roleTitle: string
  onAllow: () => Promise<void> | void
  onDecline: () => void
  onClose: () => void
}

const COPY = {
  flex: {
    title: 'Allow this org to download your Flex?',
    body: 'They want to share your verified work with their hiring panel for this role.',
    includes: [
      'Verified experiences + squad attestations',
      'Skills + endorsements',
      'Projects + portfolio links',
      'Trust score breakdown',
    ],
    excludes: [
      'Your email',
      'Your phone number',
      'Your exact address',
      'Other applications you have open',
    ],
    allowLabel: 'Allow download',
    footnote: 'They get a 30-day signed link. Every download is logged in your transparency page.',
  },
  contact: {
    title: 'Share your email and phone with this org?',
    body: 'They want to reach out for an interview. You\'ll receive their contact too — both ways.',
    includes: [
      'Your email address',
      'Your phone number',
      'A back-channel to schedule the interview',
    ],
    excludes: [
      'Your Flex stays exactly as it is (already shared)',
      'Other orgs cannot see your contact',
    ],
    allowLabel: 'Allow contact reveal',
    footnote: 'You can revoke this any time. Twin tracks every reveal.',
  },
} as const

export default function ConsentDialog({ kind, orgName, roleTitle, onAllow, onDecline, onClose }: Props) {
  const copy = COPY[kind]
  const [busy, setBusy] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleAllow = async () => {
    setBusy(true)
    try { await onAllow() } finally { setBusy(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.35)] w-full max-w-[480px] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">
                {kind === 'flex' ? 'Consent · Flex download' : 'Consent · Contact reveal'}
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-ink leading-tight">{copy.title}</h2>
            <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">{copy.body}</p>
            <p className="text-[11px] font-semibold text-ink-3 mt-2">
              <b className="text-ink">{orgName}</b> · {roleTitle}
            </p>
          </div>

          {/* Includes / Excludes */}
          <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-green/5 border border-green/15 rounded-[12px] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green mb-1.5">✓ Includes</p>
              <ul className="space-y-1">
                {copy.includes.map(x => (
                  <li key={x} className="text-[11.5px] text-ink-2 leading-snug">· {x}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red/5 border border-red/15 rounded-[12px] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red mb-1.5">✗ Excludes</p>
              <ul className="space-y-1">
                {copy.excludes.map(x => (
                  <li key={x} className="text-[11.5px] text-ink-2 leading-snug">· {x}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preview (Flex only) */}
          {kind === 'flex' && (
            <div className="px-6 pb-3">
              <button onClick={() => setShowPreview(s => !s)}
                className="text-[11.5px] font-semibold text-orange hover:text-orange-2 transition-colors">
                {showPreview ? 'Hide' : 'See exactly what they will see'} {showPreview ? '↑' : '↓'}
              </button>
              {showPreview && (
                <div className="mt-2 bg-page border border-line rounded-[12px] p-3 text-[11.5px] text-ink-2 space-y-1">
                  <p><b>Naadhan S</b> · Sr Designer · Bengaluru</p>
                  <p>· 3 verified experiences (Razorpay, Zeta…)</p>
                  <p>· 5 skills with 12 endorsements</p>
                  <p>· 2 verified certs</p>
                  <p>· Trust score: 64/100 (Top 22%)</p>
                  <p className="text-ink-3 italic mt-1.5">No email · No phone · No private chats.</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pt-3 pb-5 border-t border-line">
            <p className="text-[10.5px] text-ink-3 leading-relaxed mb-3">{copy.footnote}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { onDecline(); onClose() }}
                className="text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-2.5 hover:bg-page transition-colors">
                Decline
              </button>
              <button onClick={handleAllow} disabled={busy}
                className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 hover:opacity-95 disabled:opacity-50 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
                {busy ? 'Saving…' : copy.allowLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
