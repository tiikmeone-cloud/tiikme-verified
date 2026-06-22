'use client'

import { useEffect, useState } from 'react'
import type { AttachableSquad, SquadMember } from '@/lib/profileTypes'
import { Avatar } from '@/components/profile/ui/Primitives'
import { suggestSquadMates, requestSquad, type SquadSuggestion } from '@/lib/squads'

interface Props {
  contextLabel: string
  kind: 'experience' | 'education' | 'certificate' | 'achievement'
  current: AttachableSquad
  onClose: () => void
  onSave: (squad: AttachableSquad) => void
}

const KIND_COPY: Record<Props['kind'], { found: string; empty: string; addNoun: string; teamSuffix: string }> = {
  experience:  { found: 'people from {x} are on tiikme', empty: 'No colleagues from {x} on tiikme yet', addNoun: 'teammates', teamSuffix: 'team' },
  education:   { found: 'people from {x} are on tiikme', empty: 'No classmates from {x} on tiikme yet', addNoun: 'classmates', teamSuffix: 'batch' },
  certificate: { found: 'people earned {x} on tiikme',   empty: 'No cohort from {x} on tiikme yet',     addNoun: 'cohort', teamSuffix: 'cohort' },
  achievement: { found: 'people share this win on tiikme', empty: 'No co-winners on tiikme yet',         addNoun: 'co-winners', teamSuffix: 'crew' },
}

const AVATAR_COLORS = [
  'from-teal to-[#43C9BA]', 'from-purple to-[#8A6EF0]',
  'from-orange to-orange-2', 'from-green to-[#52D87E]', 'from-amber to-[#F8C155]',
]

function suggestionToMember(s: SquadSuggestion, idx: number): SquadMember & { _realId: string } {
  const initials = (s.full_name || s.username).slice(0, 2).toUpperCase()
  return {
    id: s.user_id,
    _realId: s.user_id,
    name: s.full_name || s.username,
    initials,
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    role: s.shared_role || s.headline || '',
    status: 'pending',
  }
}

export default function SquadAttachModal({ contextLabel, kind, current, onClose, onSave }: Props) {
  const copy = KIND_COPY[kind]
  const [suggestions, setSuggestions] = useState<(SquadMember & { _realId: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set(current.members.map(m => m.id)))
  const [inviteEmail, setInviteEmail] = useState('')
  const [invited, setInvited] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    suggestSquadMates().then(data => {
      setSuggestions(data.map((s, i) => suggestionToMember(s, i)))
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleSave = async () => {
    setSaving(true)
    const chosen = suggestions.filter(m => selected.has(m.id))
    await Promise.all(
      chosen.map(m => requestSquad({ toUserId: m._realId }))
    )
    const members: SquadMember[] = chosen.map(m => ({ ...m, status: 'pending' as const }))
    onSave({
      foundOnPlatform: suggestions.length,
      teamLabel: members.length > 0 ? `${members.length} ${copy.teamSuffix}` : undefined,
      members,
    })
    onClose()
  }

  const sendInvite = () => {
    const e = inviteEmail.trim()
    if (e) { setInvited(prev => [...prev, e]); setInviteEmail('') }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[3px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.18)] w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-ink">Add your squad</h2>
              <p className="text-[12px] text-ink-3 mt-0.5">
                Verify who you worked with at <span className="font-semibold text-ink-2">{contextLabel || 'this place'}</span>.
                They approve, then appear on your profile.
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-line text-ink-2 transition-colors shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <p className="text-[12px] text-ink-3 text-center py-8">Finding colleagues…</p>
            ) : suggestions.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full">{suggestions.length} found</span>
                  <p className="text-[11px] text-ink-3">{copy.found.replace('{x}', contextLabel || 'here')}</p>
                </div>
                <div className="space-y-2">
                  {suggestions.map(m => {
                    const on = selected.has(m.id)
                    return (
                      <button key={m.id} onClick={() => toggle(m.id)}
                        className={['w-full flex items-center gap-3 p-3 rounded-[12px] border transition-all text-left', on ? 'border-orange bg-orange-soft/40' : 'border-line hover:border-orange/30'].join(' ')}>
                        <Avatar name={m.name} size={40} color={m.avatarColor} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-ink truncate">{m.name}</p>
                          <p className="text-[11px] text-ink-3 truncate">{m.role}</p>
                        </div>
                        <div className={['w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', on ? 'bg-orange border-orange' : 'border-line'].join(' ')}>
                          {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-[16px] bg-page flex items-center justify-center mx-auto mb-3 text-ink-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                </div>
                <p className="text-[13px] font-semibold text-ink">{copy.empty.replace('{x}', contextLabel || 'here')}</p>
                <p className="text-[12px] text-ink-3 mt-1 max-w-[320px] mx-auto leading-relaxed">
                  Invite your {copy.addNoun} to tiikme. When they join and confirm, they&apos;ll be verified on your profile.
                </p>
              </div>
            )}

            {/* Invite by email */}
            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-[11px] font-semibold text-ink mb-2">Invite {copy.addNoun} not on tiikme</p>
              <div className="flex gap-2">
                <input
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendInvite() }}
                  placeholder="their@email.com"
                  className="flex-1 bg-page border border-line rounded-[10px] px-3 py-2 text-[12px] text-ink placeholder-ink-3 outline-none focus:border-orange transition-colors"
                />
                <button onClick={sendInvite} disabled={!inviteEmail.trim()} className="px-4 py-2 bg-ink text-white text-[12px] font-semibold rounded-[10px] hover:bg-ink/90 transition-colors disabled:opacity-40">
                  Invite
                </button>
              </div>
              {invited.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {invited.map(e => <span key={e} className="text-[10px] text-green bg-green/10 px-2 py-0.5 rounded-full">✓ Invited {e}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-line flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-orange hover:bg-orange-2 text-white text-[13px] font-semibold py-2.5 rounded-[12px] transition-colors disabled:opacity-50"
              style={{ boxShadow: '0 2px 8px -2px rgba(255,92,40,.4)' }}>
              {saving ? 'Sending requests…' : selected.size > 0 ? `Request ${selected.size} to confirm` : 'Done'}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-medium text-ink-2 hover:text-ink bg-page hover:bg-line rounded-[12px] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
