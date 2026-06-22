'use client'

import { useState } from 'react'

/* Icon-only follow control.
   Not following → person-with-+ (contact add).
   Following     → person-with-check (filled accent). */
export default function FollowButton({ initial = false, dark = false, size = 36 }: {
  initial?: boolean; dark?: boolean; size?: number
}) {
  const [following, setFollowing] = useState(initial)
  const accent = dark ? 'var(--color-ink)' : 'var(--color-orange)'

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFollowing(f => !f) }}
      title={following ? 'Following' : 'Follow'}
      aria-label={following ? 'Following' : 'Follow'}
      className="rounded-full flex items-center justify-center transition-colors shrink-0 border"
      style={{
        width: size, height: size,
        backgroundColor: following ? 'transparent' : accent,
        borderColor: following ? 'var(--color-line)' : accent,
        color: following ? 'var(--color-green)' : '#fff',
      }}
    >
      {following ? (
        // person-check
        <svg width={size*0.46} height={size*0.46} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
        </svg>
      ) : (
        // person-plus
        <svg width={size*0.46} height={size*0.46} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      )}
    </button>
  )
}
