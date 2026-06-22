'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TiikmeMark from '@/components/brand/TiikmeMark'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import { updatePassword } from '@/lib/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm
  const weak = password.length > 0 && password.length < 8

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm || password.length < 8) return
    setBusy(true); setError(null)
    const res = await updatePassword(password)
    setBusy(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
    setTimeout(() => router.push('/'), 1800)
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-10 overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <InfiniteGridBackdrop />
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[24px] p-7 lg:p-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.7)]">
          <span aria-hidden className="absolute -top-16 left-1/2 -translate-x-1/2 w-[300px] h-[160px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(255,92,40,.28), transparent 65%)', filter: 'blur(40px)' }} />

          <div className="relative flex flex-col items-center">
            <TiikmeMark size="lg" alive />

            {done ? (
              <div className="mt-7 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green/10 border border-green/30 flex items-center justify-center mx-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-ink">Password updated</p>
                <p className="text-[12px] text-ink-2">Redirecting you in…</p>
              </div>
            ) : (
              <>
                <h1 className="text-[24px] font-bold text-ink mt-5 tracking-tight">Set new password</h1>
                <p className="text-[13px] text-ink-2 mt-1.5 text-center leading-relaxed">
                  Choose a strong password — at least 8 characters.
                </p>

                <form onSubmit={submit} className="w-full mt-7 space-y-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-ink-2">New password</span>
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" autoFocus
                      className="mt-1.5 w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all"
                    />
                    {weak && <p className="text-[11px] text-red mt-1">At least 8 characters</p>}
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-ink-2">Confirm password</span>
                    <input
                      type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1.5 w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all"
                    />
                    {mismatch && <p className="text-[11px] text-red mt-1">Passwords don&apos;t match</p>}
                  </label>

                  {error && <p className="text-[12px] text-red text-center">{error}</p>}

                  <button type="submit"
                    disabled={!password || !confirm || mismatch || weak || busy}
                    className="w-full bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold py-3 rounded-[12px] hover:opacity-95 disabled:opacity-40 transition-opacity shadow-[0_6px_18px_-6px_rgba(255,92,40,.55)] mt-1">
                    {busy ? 'Saving…' : 'Update password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
