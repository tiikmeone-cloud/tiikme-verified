'use client'

/**
 * SquadsLifecycleView — the squad surface.
 *
 * Sections, in order:
 *   1. SUGGESTED — auto-discovered from shared org/projects.
 *      "23 people from Zeta are on tiikme" → tap to send a squad request.
 *      Nothing is public until BOTH sides confirm.
 *   2. INCOMING — requests waiting on you to confirm.
 *   3. ACTIVE — confirmed, bilateral squads (these count toward trust + org density).
 *   4. SENT — your pending requests.
 *
 * Privacy: a suggestion is private (only you see it). A request is visible only
 * to the two people. Only an ACTIVE squad shows publicly on profiles / org density.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  listMySquads, confirmSquad, revokeSquad, requestSquad, suggestSquadMates,
  type MySquad, type SquadSuggestion,
} from '@/lib/squads'
import { Card } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'
import FirstVisitHint from '@/components/ui/FirstVisitHint'

export default function SquadsLifecycleView() {
  const router = useRouter()
  const [squads, setSquads] = useState<MySquad[]>([])
  const [suggestions, setSuggestions] = useState<SquadSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<Set<string>>(new Set())

  const refresh = async () => {
    setLoading(true)
    const [s, sug] = await Promise.all([listMySquads(), suggestSquadMates()])
    setSquads(s)
    setSuggestions(sug)
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const confirm = async (s: MySquad) => {
    if (await confirmSquad(s.squad_id)) { toast(`✓ Squad confirmed with ${s.other_name ?? s.other_username}`); await refresh() }
  }
  const revoke = async (s: MySquad) => {
    if (await revokeSquad(s.squad_id)) { toast(`Removed ${s.other_name ?? s.other_username}`); await refresh() }
  }
  const sendRequest = async (sug: SquadSuggestion) => {
    setRequesting(prev => new Set(prev).add(sug.user_id))
    const id = await requestSquad({
      toUserId: sug.user_id,
      contextOrgId: sug.shared_org_id ?? undefined,
      contextProj: sug.shared_org_id ? undefined : sug.shared_org_name,
    })
    if (id) {
      toast(`Squad request sent to ${sug.full_name ?? sug.username}`)
      // Optimistic: remove this person immediately, no loading flash
      setSuggestions(prev => prev.filter(s => s.user_id !== sug.user_id))
      // Silent background refresh (squads list only, no loading state)
      listMySquads().then(setSquads)
    }
    setRequesting(prev => { const n = new Set(prev); n.delete(sug.user_id); return n })
  }

  const incoming = squads.filter(s => s.is_incoming)
  const active = squads.filter(s => s.status === 'active')
  const sent = squads.filter(s => s.status === 'pending' && s.is_initiator)

  // Group suggestions by org for the "X people from Zeta" pattern
  // shared_org_id is null for flex_experience-matched suggestions — fall back to slug as key
  const byOrg = suggestions.reduce<Record<string, { name: string; slug: string; people: SquadSuggestion[] }>>((acc, s) => {
    const key = s.shared_org_id ?? `flex-${s.shared_org_slug}`
    if (!acc[key]) acc[key] = { name: s.shared_org_name, slug: s.shared_org_slug, people: [] }
    acc[key].people.push(s)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* What is a squad */}
      <Card className="p-5">
        <h2 className="text-[16px] font-bold text-ink">Squads</h2>
        <FirstVisitHint id="squads-about">
          <p className="text-[12px] text-ink-2 mt-1 leading-relaxed">
            People you&apos;ve actually worked with, who vouch for each other. A squad is
            <b className="text-ink"> live only when both of you confirm</b> — then it shows on your Flex
            and counts toward your Trust Score. Nothing is public before that.
          </p>
        </FirstVisitHint>
      </Card>

      {loading && <p className="text-[12px] text-ink-3 py-8 text-center">Finding your people…</p>}

      {/* Empty state — no experience or education added yet */}
      {!loading && squads.length === 0 && suggestions.length === 0 && (
        <Card className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-4">How it works</p>
          <div className="space-y-4">
            {[
              { step: '1', color: 'bg-orange-soft text-orange', title: 'Add your experience & education', body: 'Go to My Flex → Work Experience and add your jobs and schools. These are the orgs we search for teammates.' },
              { step: '2', color: 'bg-purple/10 text-purple', title: 'We find your people', body: 'tiikme auto-detects anyone from the same org who\'s already on the platform. No manual searching.' },
              { step: '3', color: 'bg-green/10 text-green', title: 'Send a squad request', body: 'They confirm, you confirm — only then does it appear on both your Flexes and count toward your Trust Score.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <span className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-[12px] font-bold shrink-0 ${s.color}`}>{s.step}</span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{s.title}</p>
                  <p className="text-[12px] text-ink-3 mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/profile?tab=flex')}
            className="mt-5 w-full py-2.5 bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold rounded-[12px] hover:opacity-95 transition-opacity shadow-[0_3px_12px_-3px_rgba(255,92,40,.4)]">
            Go to My Flex →
          </button>
        </Card>
      )}

      {/* 1 — Suggested (auto-discovered) */}
      {!loading && Object.keys(byOrg).length > 0 && (
        <div className="space-y-3">
          {Object.entries(byOrg).map(([orgId, grp]) => (
            <Card key={orgId} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Suggested · same org</p>
                  <p className="text-[14px] font-bold text-ink mt-0.5">
                    {grp.people.length} {grp.people.length === 1 ? 'person' : 'people'} from {grp.name} {grp.people.length === 1 ? 'is' : 'are'} on tiikme
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {grp.people.slice(0, 6).map(sug => (
                  <div key={sug.user_id} className="bg-page rounded-[12px] border border-line p-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {sug.avatar_url
                      ? <img src={sug.avatar_url} alt="" className="w-10 h-10 rounded-[11px] object-cover shrink-0" />
                      : <span className="w-10 h-10 rounded-[11px] bg-purple/15 text-purple flex items-center justify-center text-[13px] font-bold shrink-0">{(sug.full_name ?? sug.username).charAt(0).toUpperCase()}</span>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">{sug.full_name ?? sug.username}</p>
                      <p className="text-[11px] text-ink-3 truncate">
                        {sug.headline ?? sug.shared_role ?? '—'}
                        {sug.overlap_months >= 999 ? ' · works here now' : sug.overlap_months > 0 ? ` · ${sug.overlap_months}mo overlap` : ''}
                      </p>
                    </div>
                    <button onClick={() => sendRequest(sug)} disabled={requesting.has(sug.user_id)}
                      className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-3.5 py-1.5 hover:opacity-95 disabled:opacity-50 transition-opacity shrink-0">
                      {requesting.has(sug.user_id) ? 'Sent' : '+ Squad'}
                    </button>
                  </div>
                ))}
              </div>
              {grp.people.length > 6 && (
                <p className="text-[11px] text-ink-3 mt-2 text-center">+{grp.people.length - 6} more from {grp.name}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 2 — Incoming */}
      {!loading && incoming.length > 0 && (
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange mb-3">Waiting on you · {incoming.length}</p>
          <div className="space-y-2">
            {incoming.map(s => (
              <SquadRow key={s.squad_id} squad={s}
                primary={{ label: 'Confirm', onClick: () => confirm(s), tone: 'green' }}
                secondary={{ label: 'Decline', onClick: () => revoke(s) }} />
            ))}
          </div>
        </Card>
      )}

      {/* 3 — Active */}
      {!loading && (
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-3">Active · {active.length}</p>
          {active.length === 0
            ? <p className="text-[12px] text-ink-3 italic">No confirmed squads yet — start with a suggestion above.</p>
            : <div className="space-y-2">{active.map(s => <SquadRow key={s.squad_id} squad={s} secondary={{ label: 'Remove', onClick: () => revoke(s) }} />)}</div>}
        </Card>
      )}

      {/* 4 — Sent */}
      {!loading && sent.length > 0 && (
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-3">Awaiting reply · {sent.length}</p>
          <div className="space-y-2">
            {sent.map(s => <SquadRow key={s.squad_id} squad={s} secondary={{ label: 'Cancel', onClick: () => revoke(s) }} />)}
          </div>
        </Card>
      )}
    </div>
  )
}

/* ── Row ── */
function SquadRow({
  squad, primary, secondary,
}: {
  squad: MySquad
  primary?: { label: string; onClick: () => void; tone?: 'green' | 'orange' }
  secondary?: { label: string; onClick: () => void }
}) {
  const context = squad.context_org_name ? `worked at ${squad.context_org_name}` : squad.context_proj ? `on “${squad.context_proj}”` : ''
  return (
    <div className="bg-page rounded-[14px] border border-line p-3.5 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {squad.other_avatar
        ? <img src={squad.other_avatar} alt="" className="w-11 h-11 rounded-[12px] object-cover shrink-0" />
        : <span className="w-11 h-11 rounded-[12px] bg-purple/15 text-purple flex items-center justify-center text-[14px] font-bold shrink-0">{(squad.other_name ?? squad.other_username).charAt(0).toUpperCase()}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-tight truncate">{squad.other_name ?? squad.other_username}</p>
        <p className="text-[11.5px] text-ink-3 truncate">{squad.other_headline ?? '—'}</p>
        <p className="text-[10.5px] text-ink-3 mt-0.5">{squad.status === 'active' ? '✓ Active' : '◔ Pending'}{context && ` · ${context}`}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {secondary && <button onClick={secondary.onClick} className="text-[11.5px] font-semibold text-ink-3 hover:text-red transition-colors px-2.5 py-1.5">{secondary.label}</button>}
        {primary && (
          <button onClick={primary.onClick}
            className={['text-[12px] font-semibold rounded-[10px] px-3 py-1.5 transition-opacity', primary.tone === 'green' ? 'bg-green text-white hover:opacity-90' : 'bg-gradient-to-br from-orange to-orange-2 text-white hover:opacity-95'].join(' ')}>
            {primary.label}
          </button>
        )}
      </div>
    </div>
  )
}
