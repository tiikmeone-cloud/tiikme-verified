'use client'

/**
 * PostUpdateModal — org insiders post an update.
 *
 * Visible only when the current user has a current org_membership at the org.
 * Writes to `org_posts (kind='update', body=...)` so it flows to every
 * user's feed who has org_connections to this org.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrgIdBySlug } from '@/lib/applications'
import { toast } from '@/components/profile/ui/Toast'

interface Props {
  orgSlug: string
  orgName: string
  onClose: () => void
}

export default function PostUpdateModal({ orgSlug, orgName, onClose }: Props) {
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    const text = body.trim()
    if (text.length < 10) return
    setPosting(true)
    const supabase = createClient()
    const orgId = await getOrgIdBySlug(orgSlug)
    if (!orgId) { toast('Cannot resolve org'); setPosting(false); return }
    const { error } = await supabase
      .from('org_posts')
      .insert({ org_id: orgId, kind: 'update', body: text, posted_at: new Date().toISOString() })
    setPosting(false)
    if (error) { toast(`Post failed: ${error.message}`); return }
    toast(`✓ Posted as ${orgName} — connected users will see it`)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.35)] w-full max-w-[520px] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-line">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Post · insider only</p>
            <h2 className="text-[17px] font-bold text-ink mt-1">Post an update as {orgName}</h2>
            <p className="text-[11.5px] text-ink-2 mt-1">Goes to everyone connected to {orgName}. No reactions, no comments — clean signal only.</p>
          </div>

          <div className="px-5 py-4">
            <textarea
              autoFocus value={body} onChange={e => setBody(e.target.value.slice(0, 800))}
              placeholder="e.g. Shipped a new account-opening flow — 38% faster than before."
              rows={6}
              className="w-full bg-page border border-line rounded-[12px] px-3.5 py-2.5 text-[13.5px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-colors resize-none leading-relaxed"
            />
            <p className="text-[10.5px] text-ink-3 mt-1">{body.length}/800 · {Math.max(0, 10 - body.trim().length)} more for minimum</p>
          </div>

          <div className="px-5 py-3.5 border-t border-line grid grid-cols-2 gap-2">
            <button onClick={onClose}
              className="text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-2.5 hover:bg-page transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={body.trim().length < 10 || posting}
              className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 hover:opacity-95 disabled:opacity-40 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
              {posting ? 'Posting…' : 'Post update'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
