'use client'

/**
 * VouchModal — opened from a job row when you're an insider at that org.
 *
 * Lets you pick a person (search → existing profiles) and write a 10–240 char "why".
 * Calls `create_vouch` RPC which enforces the insider rule in SQL.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createVouch } from '@/lib/vouches'
import { toast } from '@/components/profile/ui/Toast'

interface Person {
  id: string
  username: string
  full_name: string | null
  headline: string | null
  avatar_url: string | null
}

interface Props {
  jobId: string
  jobTitle: string
  orgName: string
  onClose: () => void
}

export default function VouchModal({ jobId, jobTitle, orgName, onClose }: Props) {
  const [q, setQ] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [picked, setPicked] = useState<Person | null>(null)
  const [why, setWhy] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Simple people search — public profiles whose name/headline matches
  useEffect(() => {
    if (q.trim().length < 2) { setPeople([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const supabase = createClient()
      const term = `%${q}%`
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, headline, avatar_url')
        .or(`full_name.ilike.${term},username.ilike.${term},headline.ilike.${term}`)
        .eq('is_public', true)
        .limit(8)
      if (!cancel) setPeople((data as Person[]) ?? [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [q])

  const submit = async () => {
    if (!picked || why.trim().length < 10) return
    setSubmitting(true)
    const res = await createVouch({ refereeId: picked.id, jobId, whyBrief: why.trim() })
    setSubmitting(false)
    if (res.ok) {
      toast(`✓ Vouched for ${picked.full_name ?? picked.username} at ${orgName}`)
      onClose()
    } else {
      toast(`Vouch failed: ${res.error}`)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.35)] w-full max-w-[500px] flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-line shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Vouch · insider only</span>
            </div>
            <h2 className="text-[17px] font-bold text-ink leading-tight">Vouch for someone</h2>
            <p className="text-[12px] text-ink-2 mt-1">{jobTitle} · {orgName}</p>
            <p className="text-[10.5px] text-ink-3 mt-1.5 leading-relaxed">
              You can vouch because you currently work at <b className="text-ink">{orgName}</b>. Your reputation rides on this — only vouch for people you genuinely know.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Pick a person */}
            {!picked ? (
              <>
                <label className="block">
                  <span className="text-[11px] font-semibold text-ink-2">Who do you want to vouch for?</span>
                  <input
                    autoFocus value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search by name or headline…"
                    className="mt-1.5 w-full bg-page border border-line rounded-[12px] px-3.5 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-colors"
                  />
                </label>
                <div className="space-y-1">
                  {people.map(p => (
                    <button key={p.id} onClick={() => setPicked(p)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-page transition-colors text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
                        : <span className="w-9 h-9 rounded-[10px] bg-orange-soft text-orange flex items-center justify-center text-[12px] font-bold shrink-0">{(p.full_name ?? p.username).charAt(0).toUpperCase()}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink truncate">{p.full_name ?? p.username}</p>
                        <p className="text-[10.5px] text-ink-3 truncate">{p.headline ?? '@'+p.username}</p>
                      </div>
                    </button>
                  ))}
                  {q.length >= 2 && people.length === 0 && (
                    <p className="text-[11.5px] text-ink-3 italic py-2 text-center">No matches.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-page rounded-[12px] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {picked.avatar_url
                    ? <img src={picked.avatar_url} alt="" className="w-11 h-11 rounded-[12px] object-cover shrink-0" />
                    : <span className="w-11 h-11 rounded-[12px] bg-orange-soft text-orange flex items-center justify-center text-[14px] font-bold shrink-0">{(picked.full_name ?? picked.username).charAt(0).toUpperCase()}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{picked.full_name ?? picked.username}</p>
                    <p className="text-[11px] text-ink-3 truncate">{picked.headline ?? ''}</p>
                  </div>
                  <button onClick={() => setPicked(null)} className="text-[11px] text-ink-3 hover:text-ink">Change</button>
                </div>

                <label className="block">
                  <span className="text-[11px] font-semibold text-ink-2">
                    Why are they right for this role? <span className="text-ink-3 font-normal">(10–240 chars)</span>
                  </span>
                  <textarea
                    autoFocus value={why} onChange={e => setWhy(e.target.value.slice(0, 240))}
                    placeholder="e.g. Worked with Riya at Razorpay 2 yrs — banking flow expertise + ships fast."
                    rows={4}
                    className="mt-1.5 w-full bg-page border border-line rounded-[12px] px-3.5 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-ink-3 mt-1">{why.length}/240 · {Math.max(0, 10 - why.trim().length)} more for minimum</p>
                </label>

                <div className="bg-orange-soft border border-orange/20 rounded-[12px] p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-orange mb-1">What happens next</p>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">
                    {picked.full_name ?? picked.username} gets a notification. If they accept, an application is created at <b>{orgName}</b> auto-promoted to <b>Screening</b> (skips the cold pile). Your trust score moves with the outcome.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-line grid grid-cols-2 gap-2 shrink-0">
            <button onClick={onClose}
              className="text-[13px] font-semibold text-ink-2 bg-card border border-line rounded-[12px] py-2.5 hover:bg-page transition-colors">
              Cancel
            </button>
            <button onClick={submit}
              disabled={!picked || why.trim().length < 10 || submitting}
              className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
              {submitting ? 'Vouching…' : 'Send vouch'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
