'use client'

import { useState } from 'react'

interface Props {
  initial?: boolean
  size?: 'sm' | 'md'
  onClick?: (e: React.MouseEvent) => void
}

/* Compact Connect pill for org cards & job rows.
   Matches the OrgShell pattern: orange Connect → neutral ✓ Connected. */
export default function OrgConnectPill({ initial = false, size = 'sm', onClick }: Props) {
  const [connected, setConnected] = useState(initial)
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12px]'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setConnected(c => !c)
        onClick?.(e)
      }}
      title={connected ? 'Connected' : 'Connect'}
      className={[
        'inline-flex items-center gap-1 font-semibold rounded-[10px] transition-all shrink-0',
        pad,
        connected
          ? 'bg-card text-ink-2 border border-line hover:border-orange/40'
          : 'text-white bg-gradient-to-br from-orange to-orange-2 hover:opacity-95 border border-transparent',
      ].join(' ')}>
      {connected ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Connected
        </>
      ) : (
        'Connect'
      )}
    </button>
  )
}
