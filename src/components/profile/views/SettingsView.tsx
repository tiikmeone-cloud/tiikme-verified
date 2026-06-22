'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/profile/ui/Primitives'
import Toggle from '@/components/profile/ui/Toggle'
import { toast } from '@/components/profile/ui/Toast'
import { loadPreferences, setPreference, type UserPreferences, DEFAULT_PREFS } from '@/lib/userPreferences'
import { getDemoUserId } from '@/lib/applications'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/lib/auth'
import ThemeToggle from '@/components/ui/ThemeToggle'
import FirstVisitHint from '@/components/ui/FirstVisitHint'

type Tab = 'account' | 'privacy' | 'notifications'

export default function SettingsView() {
  const [tab, setTab] = useState<Tab>('account')
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS)
  useEffect(() => { loadPreferences().then(setPrefs) }, [])
  const update = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs(p => ({ ...p, [key]: value }))
    const ok = await setPreference(key, value)
    if (!ok) toast('Could not save — try again')
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-ink leading-tight">Settings</h1>
        <FirstVisitHint id="settings"><p className="text-[12px] text-ink-3 mt-1">Manage your account, privacy, and notifications. Job preferences live in the Jobs filter.</p></FirstVisitHint>
      </div>
      <div className="flex gap-2 flex-wrap">
        {([['account','Account'],['privacy','Privacy'],['notifications','Notifications']] as [Tab,string][]).map(([id,l]) => (
          <button key={id} onClick={()=>setTab(id)} className={['px-4 py-1.5 text-[12px] font-medium rounded-full transition-colors', tab===id?'bg-orange text-white':'bg-card text-ink-2 hover:bg-line border border-line'].join(' ')}>{l}</button>
        ))}
      </div>
      {tab==='account' && <AccountTab />}
      {tab==='privacy' && <PrivacyTab prefs={prefs} update={update} />}
      {tab==='notifications' && <NotifTab prefs={prefs} update={update} />}
    </div>
  )
}

function AccountTab() {
  const [displayName, setDisplayName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameLoading, setNameLoading] = useState(false)

  const [editingPw, setEditingPw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  const supabase = createClient()

  // Load current display name + email
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setAuthEmail(user.email ?? '')
      getDemoUserId().then(async uid => {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', uid ?? user.id).maybeSingle()
        setDisplayName((data?.full_name as string) || user.email?.split('@')[0] || '')
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = async () => {
    if (!displayName.trim()) return
    setNameLoading(true)
    const uid = await getDemoUserId()
    if (uid) {
      const { error } = await supabase.from('profiles').update({ full_name: displayName.trim() }).eq('id', uid)
      if (error) { toast('Could not update name — try again'); setNameLoading(false); return }
    }
    setEditingName(false)
    setNameLoading(false)
    toast('Display name updated ✓')
  }

  const savePassword = async () => {
    if (!currentPw) { toast('Enter your current password first'); return }
    if (newPw.length < 8) { toast('New password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { toast('Passwords do not match'); return }
    setPwLoading(true)
    // Re-verify current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: currentPw })
    if (signInErr) { toast('Current password is incorrect'); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) { toast(error.message); return }
    toast('Password updated ✓')
    setEditingPw(false)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  const saveEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) { toast('Enter a valid email'); return }
    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailLoading(false)
    if (error) { toast(error.message); return }
    toast('Confirmation sent to ' + newEmail + ' — click the link to confirm')
    setEditingEmail(false)
    setNewEmail('')
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-[13px] font-bold text-ink mb-3">Appearance</p>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[13px] font-medium text-ink">Dark mode</p>
            <p className="text-[11px] text-ink-3 mt-0.5">Switch between light and dark theme</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-[13px] font-bold text-ink mb-3">Profile</p>
        {/* Display Name */}
        <div className="py-2.5 border-b border-line">
          {editingName ? (
            <div>
              <p className="text-[12px] font-semibold text-ink-2 mb-1.5">Display name</p>
              <div className="flex gap-2">
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  className="flex-1 bg-page border border-line rounded-[10px] px-3 py-2 text-[13px] text-ink outline-none focus:border-orange/40"
                  autoFocus
                />
                <button onClick={saveName} disabled={nameLoading}
                  className="px-3.5 py-2 text-[12px] font-semibold text-white bg-orange rounded-[10px] hover:bg-orange-2 transition-colors disabled:opacity-50">
                  {nameLoading ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)}
                  className="px-3.5 py-2 text-[12px] font-medium text-ink-2 bg-page border border-line rounded-[10px] hover:bg-line transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-ink">Display name</p>
                <p className="text-[11px] text-ink-3 mt-0.5">{displayName || 'Not set'}</p>
              </div>
              <button onClick={() => setEditingName(true)}
                className="text-[12px] font-semibold text-ink-2 hover:opacity-80 transition-opacity">Edit</button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-0">
        <p className="text-[13px] font-bold text-ink mb-3">Security</p>

        {/* Email */}
        <div className="py-2.5 border-b border-line">
          {editingEmail ? (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-ink-2">New email address</p>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" autoFocus
                className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40" />
              <p className="text-[10px] text-ink-3">A confirmation link will be sent to the new email.</p>
              <div className="flex gap-2">
                <button onClick={saveEmail} disabled={emailLoading}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-orange rounded-[10px] disabled:opacity-50">
                  {emailLoading ? 'Sending…' : 'Send confirmation'}
                </button>
                <button onClick={() => { setEditingEmail(false); setNewEmail('') }}
                  className="px-4 py-2 text-[12px] font-medium text-ink-2 bg-page border border-line rounded-[10px] hover:bg-line transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-ink">Email</p>
                <p className="text-[11px] text-ink-3 mt-0.5">{authEmail || '—'}</p>
              </div>
              <button onClick={() => setEditingEmail(true)} className="text-[12px] font-semibold text-orange hover:opacity-80 transition-opacity">Change</button>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="py-2.5">
          {editingPw ? (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-ink-2">Change password</p>
              <input type="password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoFocus
                className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40" />
              <input type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)}
                className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40" />
              <div className="relative">
                <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40" />
                {confirmPw && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold">{newPw === confirmPw ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</span>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={savePassword} disabled={pwLoading || !currentPw || newPw.length < 8 || newPw !== confirmPw}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-orange rounded-[10px] disabled:opacity-50">
                  {pwLoading ? 'Saving…' : 'Update password'}
                </button>
                <button onClick={() => { setEditingPw(false); setCurrentPw(''); setNewPw(''); setConfirmPw('') }}
                  className="px-4 py-2 text-[12px] font-medium text-ink-2 bg-page border border-line rounded-[10px] hover:bg-line transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-ink">Password</p>
                <p className="text-[11px] text-ink-3 mt-0.5">Change your account password</p>
              </div>
              <button onClick={() => setEditingPw(true)} className="text-[12px] font-semibold text-orange hover:opacity-80 transition-opacity">Change</button>
            </div>
          )}
        </div>
      </Card>

      <LogoutZone />
      <DeleteZone />

    </div>
  )
}

interface PrefProps {
  prefs: UserPreferences
  update: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>
}

function PrivacyTab({ prefs, update }: PrefProps) {
  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-1">
        <p className="text-[13px] font-bold text-ink mb-2">Profile visibility</p>
        <Tog label="Public Flex"      sub="Anyone can view your verified Flex"               on={prefs.public_flex}      onChange={v => update('public_flex', v)} />
        <Tog label="Recruiter search" sub="Hiring teams can find you in candidate search"    on={prefs.recruiter_search} onChange={v => update('recruiter_search', v)} />
        <Tog label="Show location"    sub="Display your city on your profile"                on={prefs.show_location}    onChange={v => update('show_location', v)} />
      </Card>
      <Card className="p-5 space-y-1">
        <p className="text-[13px] font-bold text-ink mb-2">Data sharing</p>
        <Tog label="Allow Flex download on shortlist"   sub="Orgs that shortlist you can request your Flex for the hiring panel" on={prefs.allow_flex_download}     onChange={v => update('allow_flex_download', v)} />
        <Tog label="Show squad attestations publicly"   sub="Display who you've squad-verified on your Flex"                     on={prefs.show_squad_attestations} onChange={v => update('show_squad_attestations', v)} />
        <Tog label="Show vouches publicly"              sub="Display vouches you've given and received"                          on={prefs.show_vouches}            onChange={v => update('show_vouches', v)} />
      </Card>
    </div>
  )
}

function NotifTab({ prefs, update }: PrefProps) {
  return (
    <Card className="p-5 space-y-1">
      <p className="text-[13px] font-bold text-ink mb-2">Notify me about</p>
      <Tog label="Application stage changes" sub="When an org moves you forward (or passes)"        on={prefs.notify_application_stage} onChange={v => update('notify_application_stage', v)} />
      <Tog label="Vouches received"          sub="When someone vouches for you for a role"          on={prefs.notify_vouches_received}  onChange={v => update('notify_vouches_received', v)} />
      <Tog label="Squad requests"            sub="When a teammate wants to confirm a squad"         on={prefs.notify_squad_requests}    onChange={v => update('notify_squad_requests', v)} />
      <Tog label="Job matches"               sub="When Tiik finds a high-fit role for you"          on={prefs.notify_job_matches}       onChange={v => update('notify_job_matches', v)} />
      <Tog label="Org posts"                 sub="Updates from orgs you've connected with"          on={prefs.notify_org_posts}         onChange={v => update('notify_org_posts', v)} />
      <Tog label="Weekly career report"      sub="Salary band, percentile, recruiter views by email" on={prefs.notify_weekly_report}    onChange={v => update('notify_weekly_report', v)} />
    </Card>
  )
}

function Row({ label, value, action, actionColor='ink-2', onClick }: { label:string; value:string; action:string; actionColor?:string; onClick:()=>void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <div><p className="text-[13px] font-medium text-ink">{label}</p><p className="text-[11px] text-ink-3 mt-0.5">{value}</p></div>
      <button onClick={onClick} className={`text-[12px] font-semibold text-${actionColor} hover:opacity-80 transition-opacity`}>{action}</button>
    </div>
  )
}

function Tog({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <div className="pr-4"><p className="text-[13px] font-medium text-ink">{label}</p><p className="text-[11px] text-ink-3 mt-0.5">{sub}</p></div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

function LogoutZone() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const handleLogout = async () => {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <Card className="p-5">
      <p className="text-[13px] font-bold text-ink mb-3">Session</p>
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-[13px] font-medium text-ink">Sign out</p>
          <p className="text-[11px] text-ink-3 mt-0.5">Log out of your account on this device</p>
        </div>
        <button onClick={handleLogout} disabled={busy}
          className="text-[12px] font-semibold text-orange hover:opacity-80 transition-opacity disabled:opacity-40">
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </Card>
  )
}

function DeleteZone() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setBusy(true)
    const res = await deleteAccount()
    if (res.error) { toast('Could not delete account: ' + res.error); setBusy(false); return }
    router.push('/sign-in')
  }

  return (
    <Card className="p-5 border border-red/20">
      <p className="text-[13px] font-bold text-red mb-3">Danger Zone</p>
      {!confirming ? (
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-[13px] font-medium text-ink">Delete account</p>
            <p className="text-[11px] text-ink-3 mt-0.5">Permanently remove your profile and data</p>
          </div>
          <button onClick={() => setConfirming(true)}
            className="text-[12px] font-semibold text-red hover:opacity-80 transition-opacity">Delete</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] text-ink-2 leading-relaxed">Type <strong className="text-red font-mono">DELETE</strong> to confirm. This removes your profile and signs you out. Your auth record is retained for 30 days then purged.</p>
          <input
            value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full bg-page border border-red/30 rounded-[10px] px-3 py-2 text-[13px] text-ink outline-none focus:border-red/60 font-mono"
          />
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={confirmText !== 'DELETE' || busy}
              className="px-4 py-2 text-[12px] font-semibold text-white bg-red rounded-[10px] disabled:opacity-40 hover:opacity-90 transition-opacity">
              {busy ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button onClick={() => { setConfirming(false); setConfirmText('') }}
              className="px-4 py-2 text-[12px] font-medium text-ink-2 bg-page border border-line rounded-[10px] hover:bg-line transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

