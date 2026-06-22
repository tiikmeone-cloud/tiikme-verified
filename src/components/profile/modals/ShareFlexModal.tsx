'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import { Avatar } from '@/components/profile/ui/Primitives'

interface Props {
  profile: Profile
  onClose: () => void
}

export default function ShareFlexModal({ profile, onClose }: Props) {
  const url = `tiikme.com/flex/${profile.username}`
  const full = `https://${url}`
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(full) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const displayName = profile.full_name ?? profile.username

  return (
    <>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[3px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.18)] w-full max-w-md overflow-hidden">

          <div className="px-6 py-5 border-b border-line flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-ink">Share My Flex</h2>
              <p className="text-[12px] text-ink-3 mt-0.5">Send your living resume as a link — always up to date.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-line text-ink-2 transition-colors shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Preview card — what recruiters see */}
            <div className="rounded-[14px] border border-line p-4 bg-page">
              <p className="text-[9px] font-bold uppercase tracking-wide text-ink-3 mb-2">Recruiters will see</p>
              <div className="flex items-center gap-3">
                <Avatar name={displayName} src={profile.avatar_url} size={44} />
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-ink truncate">{displayName}</p>
                  <p className="text-[11px] text-ink-2 truncate">{profile.headline ?? 'Add a headline'}</p>
                </div>
                {profile.open_to_work && (
                  <span className="ml-auto text-[9px] font-semibold text-green bg-green/10 border border-green/20 px-2 py-0.5 rounded-full shrink-0">Open</span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                {['Experience', 'Skills', 'Squad-verified', 'Certs'].map(t => (
                  <span key={t} className="text-[9px] font-medium text-ink-2 bg-card border border-line px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            {/* Copy link */}
            <div>
              <p className="text-[11px] font-semibold text-ink mb-1.5">Your Flex link</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-page border border-line rounded-[10px] px-3 py-2 text-[12px] text-ink-2 truncate">
                  {url}
                </div>
                <button onClick={copy} className="px-4 py-2 bg-orange text-white text-[12px] font-semibold rounded-[10px] hover:bg-orange-2 transition-colors shrink-0">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
