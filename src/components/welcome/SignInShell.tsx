'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TiikmeMark from '@/components/brand/TiikmeMark'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { createClient } from '@/lib/supabase/client'
import { signInPassword, resolveIdentifier, sendPasswordReset, sendOtpSignup, verifyOtpAndGetUser, ensureProfile, signInWithGoogle } from '@/lib/auth'
import { DEFAULTS } from '@/lib/taxonomy'

/* ─── Types ─────────────────────────────────────────────────────── */
type AuthMode = 'signin' | 'signup'
type SignupPath = 'user' | 'org'
type UserPersona = 'student' | 'fresher' | 'working' | 'freelancer' | 'between'
type SignupStep = 'path' | 'email' | 'otp' | 'credentials' | 'persona' | 'role-info' | 'org-info' | 'profile' | 'squad'

const USER_STEPS: SignupStep[] = ['path', 'email', 'otp', 'credentials', 'persona', 'role-info', 'profile', 'squad']
const ORG_STEPS: SignupStep[]  = ['path', 'email', 'otp', 'credentials', 'org-info', 'profile']

export default function SignInShell() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  /* Initialise from URL params — ?mode=signup&path=user skips the path picker */
  const urlMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  const urlPath = searchParams.get('path') === 'org' ? 'org' : 'user'
  const urlStep: SignupStep = urlMode === 'signup' ? (searchParams.get('path') ? 'email' : 'path') : 'path'

  const [mode, setMode] = useState<AuthMode>(urlMode)
  const [step, setStep] = useState<SignupStep>(urlStep)
  const [path, setPath] = useState<SignupPath>(urlPath)

  /* Auth */
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  /* Persona */
  const [persona, setPersona] = useState<UserPersona | null>(null)

  /* Role info — professionals & freelancers */
  const [roleTitle, setRoleTitle] = useState('')
  const [company, setCompany] = useState('')
  const [noOrg, setNoOrg] = useState(false)            // "I don't have a company yet"
  const [currentlyWorking, setCurrentlyWorking] = useState(true)
  const [expLevel, setExpLevel] = useState('')
  const [startYear, setStartYear] = useState(String(new Date().getFullYear()))
  const [freelanceNiche, setFreelanceNiche] = useState('')

  /* Student / fresher */
  const [school, setSchool] = useState('')
  const [degree, setDegree] = useState('')
  const [studyField, setStudyField] = useState('')
  const [studyYear, setStudyYear] = useState('')

  /* Org setup */
  const [orgName, setOrgName] = useState('')
  const [orgRole, setOrgRole] = useState('')
  const [orgIndustry, setOrgIndustry] = useState('')
  const [orgSize, setOrgSize] = useState('')

  /* Profile */
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  /* Squad nudge */
  const [colleagues, setColleagues] = useState<Colleague[]>([])
  const [squadSent, setSquadSent] = useState<Set<string>>(new Set())
  const [companyChecked, setCompanyChecked] = useState(false) // true once we've searched for colleagues

  /* UI state */
  const [usernameAvail, setUsernameAvail] = useState<'idle'|'checking'|'ok'|'taken'>('idle')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)
  const [identifier, setIdentifier] = useState('')

  const steps = path === 'org' ? ORG_STEPS : USER_STEPS
  const stepIdx = steps.indexOf(step)
  const progressSteps = steps.filter(s => s !== 'squad')

  const done = () => router.push('/home')

  /* ── OTP countdown ── */
  useEffect(() => {
    if (mode !== 'signup' || step !== 'otp') return
    setCountdown(60); setCanResend(false)
    const id = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(id); setCanResend(true); return 0 } return c - 1 })
    }, 1000)
    return () => clearInterval(id)
  }, [step, mode])

  /* ── Username availability ── */
  useEffect(() => {
    if (!username.trim() || username.length < 3) { setUsernameAvail('idle'); return }
    setUsernameAvail('checking')
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', username.trim()).maybeSingle()
      setUsernameAvail(data ? 'taken' : 'ok')
    }, 500)
    return () => clearTimeout(t)
  }, [username]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true); setError(null)
    const { error: err } = await sendOtpSignup(email)
    setBusy(false)
    if (err) { setError(err); return }
    setStep('otp')
  }

  /* ── Verify OTP ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) return
    setBusy(true); setError(null)
    const res = await verifyOtpAndGetUser(email, otp)
    setBusy(false)
    if (res.error) { setError(res.error); return }
    setUserId(res.userId!)
    if (!res.isNew) { await ensureProfile(); done(); return }
    setStep('credentials')
  }

  /* ── Credentials ── */
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.length < 3) { setError('Username must be at least 3 chars'); return }
    if (!/^[a-z0-9_-]+$/.test(username)) { setError('Letters, numbers, - and _ only'); return }
    if (usernameAvail === 'taken') { setError('Username taken'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPw) { setError('Passwords do not match'); return }
    setBusy(true); setError(null)
    const { error: pwErr } = await supabase.auth.updateUser({ password })
    if (pwErr) { setError(pwErr.message); setBusy(false); return }
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (uid) {
      await supabase.from('profiles').update({
        username: username.trim(),
        account_type: path === 'org' ? 'org' : 'user',
      }).eq('id', uid)
      setUserId(uid)
    }
    setBusy(false)
    setStep(path === 'org' ? 'org-info' : 'persona')
  }

  /* ── Org info ── */
  const handleOrgInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) { setError('Company name is required'); return }
    setBusy(true); setError(null)
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (uid) {
      const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
      const { data: org } = await supabase.from('orgs').insert({
        name: orgName.trim(), slug: `${slug}-${uid.slice(0,4)}`,
        industry: orgIndustry || null,
        size: orgSize || null,
      }).select('id').maybeSingle()
      if (org?.id) {
        await supabase.from('org_memberships').insert({ org_id: org.id, user_id: uid, role: orgRole || 'Admin' })
        await supabase.from('profiles').update({ primary_org_slug: `${slug}-${uid.slice(0,4)}`, headline: orgRole || null }).eq('id', uid)
      }
    }
    setBusy(false)
    setStep('profile')
  }

  /* ── Role info (save experience / education to DB) ── */
  const handleRoleInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!uid) { setStep('profile'); return }
    setBusy(true); setError(null)

    if (persona === 'working' || persona === 'between') {
      if (!roleTitle.trim()) { setError('Please enter your role title'); setBusy(false); return }
      const year = new Date().getFullYear()
      const effectiveCompany = noOrg ? null : (company.trim() || null)
      await supabase.from('flex_experience').insert({
        user_id: uid,
        role: roleTitle.trim(),
        company: effectiveCompany,
        currently_working: persona === 'working' ? currentlyWorking : false,
        start_year: startYear || String(year - 1),
        emp_type: 'Full-time',
        display_order: 0,
      })
      const headlineParts = [roleTitle.trim(), effectiveCompany].filter(Boolean)
      await supabase.from('profiles').update({ headline: headlineParts.join(' · ') }).eq('id', uid)
      if (effectiveCompany) {
        const { data } = await supabase.rpc('find_colleagues_by_company', { p_company: effectiveCompany, p_viewer: uid, p_limit: 5 })
        setColleagues((data as Colleague[]) ?? [])
        setCompanyChecked(true)
      }
    }

    if (persona === 'freelancer') {
      if (!roleTitle.trim()) { setError('Please enter what you do'); setBusy(false); return }
      await supabase.from('flex_experience').insert({
        user_id: uid,
        role: roleTitle.trim(),
        company: null,
        currently_working: true,
        start_year: startYear,
        emp_type: 'Freelance',
        display_order: 0,
        description: freelanceNiche ? `Specialisation: ${freelanceNiche}` : null,
      })
      await supabase.from('profiles').update({ headline: `${roleTitle.trim()} · Freelance` }).eq('id', uid)
    }

    if (persona === 'student' || persona === 'fresher') {
      if (school.trim() || studyField.trim()) {
        await supabase.from('flex_education').insert({
          user_id: uid,
          institution: school.trim() || null,
          degree: degree || null,
          field: studyField || null,
          end_year: studyYear || null,
          display_order: 0,
        })
      }
      if (roleTitle.trim()) {
        await supabase.from('profiles').update({ headline: roleTitle.trim() }).eq('id', uid)
      }
      // Lookup squad mates from same school
      if (school.trim()) {
        const { data } = await supabase.rpc('find_colleagues_by_company', { p_company: school.trim(), p_viewer: uid, p_limit: 5 })
        setColleagues((data as Colleague[]) ?? [])
      }
    }

    setBusy(false)
    setStep('profile')
  }

  /* ── Profile ── */
  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!uid) { done(); return }
    setBusy(true)
    await supabase.from('profiles').update({
      ...(name.trim() ? { full_name: name.trim() } : {}),
      ...(location.trim() ? { location_city: location.trim() } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    }).eq('id', uid)
    setBusy(false)
    if (colleagues.length > 0) { setStep('squad') } else { done() }
  }

  /* ── Squad ── */
  const sendSquad = async (toId: string) => {
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    await supabase.rpc('request_squad', { p_from: uid, p_to: toId, p_context_org: null, p_context_proj: null })
    setSquadSent(s => new Set([...s, toId]))
  }

  /* ── Sign in ── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password) return
    setBusy(true); setError(null)
    const resolvedEmail = await resolveIdentifier(identifier)
    if (!resolvedEmail) { setError('Account not found'); setBusy(false); return }
    const res = await signInPassword(resolvedEmail, password)
    setBusy(false)
    if (res.error) { setError(res.error === 'Invalid login credentials' ? 'Incorrect email or password' : res.error); return }
    done()
  }

  const handleForgot = async () => {
    if (!identifier.trim()) { setError('Enter your email first'); return }
    const resolvedEmail = await resolveIdentifier(identifier)
    if (!resolvedEmail) { setError('Account not found'); return }
    await sendPasswordReset(resolvedEmail)
    setForgotSent(true)
  }

  const switchMode = (m: AuthMode) => {
    setMode(m); setStep('path'); setError(null); setForgotSent(false)
    setOtp(''); setPassword(''); setConfirmPw(''); setUsername('')
  }

  const back = () => {
    const prev = steps[stepIdx - 1]
    if (prev) { setStep(prev); setError(null) }
  }

  /* squad context label */
  const squadContext = (persona === 'student' || persona === 'fresher') ? school : company

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 py-10 overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <InfiniteGridBackdrop />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[24px] p-7 lg:p-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.7)]">
          <span aria-hidden className="absolute -top-16 left-1/2 -translate-x-1/2 w-[300px] h-[160px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse,rgba(255,92,40,.28),transparent 65%)', filter: 'blur(40px)' }} />

          <div className="relative flex flex-col items-center">
            <TiikmeMark size="lg" alive />

            {/* Progress dots */}
            {mode === 'signup' && step !== 'path' && (
              <div className="flex items-center gap-1.5 mt-4">
                {progressSteps.filter(s => s !== 'path').map((s, i) => (
                  <span key={s} className="h-1 rounded-full transition-all"
                    style={{ width: i === (stepIdx - 1) ? 22 : 6, backgroundColor: i < stepIdx ? 'var(--color-orange)' : 'var(--color-line)' }} />
                ))}
              </div>
            )}

            {/* Back button */}
            {mode === 'signup' && stepIdx > 1 && step !== 'squad' && (
              <button onClick={back} className="absolute top-0 left-0 text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
            )}

            <h1 className="text-[23px] font-bold text-ink mt-5 tracking-tight text-center leading-tight">
              {mode === 'signin' ? 'Welcome back'
                : step === 'path' ? 'Join tiikme'
                : step === 'email' ? 'Create your account'
                : step === 'otp' ? 'Check your email'
                : step === 'credentials' ? 'Set your username'
                : step === 'persona' ? 'What describes you best?'
                : step === 'role-info' ? (
                    persona === 'student' ? 'Your studies'
                    : persona === 'fresher' ? 'Your education'
                    : persona === 'freelancer' ? 'What do you do?'
                    : 'Your current role'
                  )
                : step === 'org-info' ? 'Tell us about your company'
                : step === 'profile' ? 'Almost there!'
                : 'People from your ' + ((persona === 'student' || persona === 'fresher') ? 'institution' : 'company')}
            </h1>
            <p className="text-[12.5px] text-ink-2 mt-1.5 text-center leading-relaxed max-w-[300px]">
              {mode === 'signin' ? 'Your Twin remembers everything.'
                : step === 'path' ? 'The verified professional graph.'
                : step === 'email' ? "We'll send a 6-digit code to your email."
                : step === 'otp' ? `Code sent to ${email}`
                : step === 'credentials' ? 'Pick a @handle and set a password.'
                : step === 'persona' ? 'This shapes how Twin helps you.'
                : step === 'role-info' ? (
                    persona === 'student' || persona === 'fresher' ? 'Your education helps orgs find you.'
                    : persona === 'freelancer' ? 'This becomes your first Flex entry.'
                    : 'This becomes your first Flex entry.'
                  )
                : step === 'org-info' ? 'Your hiring desk is one step away.'
                : step === 'profile' ? 'Add a photo and your name.'
                : 'Squad up with people already on tiikme.'}
            </p>

            {/* ── SIGN IN ── */}
            {mode === 'signin' && !forgotSent && (
              <div className="w-full mt-6 space-y-3">
                <GoogleBtn />
                <Divider />
                <form onSubmit={handleSignIn} className="space-y-2.5">
                  <Field label="Email or username">
                    <Input value={identifier} onChange={setIdentifier} type="text" placeholder="you@work.com or @handle" autoFocus />
                  </Field>
                  <Field label="Password">
                    <Input value={password} onChange={setPassword} type="password" placeholder="••••••••" />
                  </Field>
                  <Btn busy={busy} disabled={!identifier.trim() || !password} label="Sign in" />
                  <button type="button" onClick={handleForgot}
                    className="w-full text-[11.5px] text-ink-3 hover:text-orange transition-colors py-0.5 text-center">
                    Forgot password?
                  </button>
                </form>
              </div>
            )}
            {mode === 'signin' && forgotSent && (
              <div className="w-full mt-7 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-[13px] font-semibold text-ink">Reset link sent</p>
                <p className="text-[12px] text-ink-2">Check <strong>{identifier}</strong> — expires in 1 hour.</p>
                <button onClick={() => setForgotSent(false)} className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors">Back to sign in</button>
              </div>
            )}

            {/* ── SIGNUP: Path ── */}
            {mode === 'signup' && step === 'path' && (
              <div className="w-full mt-6 space-y-3">
                <GoogleBtn label="Sign up with Google" />
                <Divider />
                <button onClick={() => { setPath('user'); setStep('email') }}
                  className="w-full text-left rounded-[16px] border-2 border-line bg-card hover:border-orange/50 transition-all p-4 group">
                  <div className="flex items-center gap-3.5">
                    <span className="w-10 h-10 rounded-[11px] bg-orange/10 text-[22px] flex items-center justify-center shrink-0">👤</span>
                    <div>
                      <p className="text-[14px] font-bold text-ink">I'm a professional or student</p>
                      <p className="text-[11.5px] text-ink-3 mt-0.5">Build your verified Flex · find opportunities</p>
                    </div>
                    <svg className="ml-auto text-ink-3 group-hover:text-orange transition-colors shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
                <button onClick={() => { setPath('org'); setStep('email') }}
                  className="w-full text-left rounded-[16px] border-2 border-line bg-card hover:border-orange/50 transition-all p-4 group">
                  <div className="flex items-center gap-3.5">
                    <span className="w-10 h-10 rounded-[11px] bg-orange/10 text-[22px] flex items-center justify-center shrink-0">🏢</span>
                    <div>
                      <p className="text-[14px] font-bold text-ink">I'm hiring / building a team</p>
                      <p className="text-[11.5px] text-ink-3 mt-0.5">Post roles · find verified candidates</p>
                    </div>
                    <svg className="ml-auto text-ink-3 group-hover:text-orange transition-colors shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              </div>
            )}

            {/* ── SIGNUP: Email ── */}
            {mode === 'signup' && step === 'email' && (
              <form onSubmit={handleSendOtp} className="w-full mt-6 space-y-2.5">
                <Field label="Email address">
                  <Input value={email} onChange={setEmail} type="email" placeholder="you@work.com" autoFocus />
                </Field>
                <Btn busy={busy} disabled={!email.trim()} label="Send verification code" />
              </form>
            )}

            {/* ── SIGNUP: OTP ── */}
            {mode === 'signup' && step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="w-full mt-6 space-y-4">
                <OtpBoxes value={otp} onChange={setOtp} />
                <div className="flex items-center justify-center text-[12px]">
                  {canResend
                    ? <button type="button" onClick={async () => { setOtp(''); await sendOtpSignup(email); setStep('otp') }} className="font-semibold text-orange hover:text-orange-2 transition-colors">Resend code</button>
                    : <span className="text-ink-3">Resend in <span className="font-semibold text-ink-2">{countdown}s</span></span>}
                </div>
                <Btn busy={busy} disabled={otp.length < 6} label="Verify & continue" />
                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(null) }}
                  className="w-full text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors py-0.5 text-center">Change email</button>
              </form>
            )}

            {/* ── SIGNUP: Credentials ── */}
            {mode === 'signup' && step === 'credentials' && (
              <form onSubmit={handleCredentials} className="w-full mt-6 space-y-2.5">
                <Field label="Username">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-3">@</span>
                    <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="your_handle" maxLength={20} autoFocus
                      className="w-full bg-card border border-line rounded-[12px] pl-7 pr-9 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all" />
                    {usernameAvail !== 'idle' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold">
                        {usernameAvail === 'checking' && <span className="text-ink-3">…</span>}
                        {usernameAvail === 'ok' && <span className="text-green-600">✓</span>}
                        {usernameAvail === 'taken' && <span className="text-red-500">✗</span>}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-3 mt-1">3–20 chars · letters, numbers, - and _</p>
                </Field>
                <Field label="Password">
                  <Input value={password} onChange={setPassword} type="password" placeholder="At least 8 characters" />
                </Field>
                <Field label="Confirm password">
                  <div className="relative">
                    <Input value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Same password again" />
                    {confirmPw && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold">{password === confirmPw ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</span>}
                  </div>
                </Field>
                <Btn busy={busy} disabled={username.length < 3 || usernameAvail === 'taken' || usernameAvail === 'checking' || password.length < 8 || password !== confirmPw} label="Continue" />
              </form>
            )}

            {/* ── SIGNUP: Persona ── */}
            {mode === 'signup' && step === 'persona' && (
              <div className="w-full mt-6 grid grid-cols-2 gap-2.5">
                {([
                  { id: 'student',    icon: '🎓', label: 'Student',      sub: 'Currently studying' },
                  { id: 'fresher',    icon: '🌱', label: 'New grad',     sub: 'Just graduated (0–1 yr)' },
                  { id: 'working',    icon: '💼', label: 'Professional', sub: 'Currently employed' },
                  { id: 'freelancer', icon: '🚀', label: 'Freelancer',   sub: 'Independent / self-employed' },
                  { id: 'between',    icon: '🔍', label: 'Open to work', sub: 'Looking for next role' },
                ] as { id: UserPersona; icon: string; label: string; sub: string }[]).map(p => (
                  <button key={p.id} onClick={() => { setPersona(p.id); setStep('role-info') }}
                    className={[
                      'text-left rounded-[16px] border-2 border-line bg-card hover:border-orange/60 hover:bg-orange/5 transition-all p-4 group',
                      p.id === 'between' ? 'col-span-2' : '',
                    ].join(' ')}>
                    <span className="text-[26px] block mb-2">{p.icon}</span>
                    <p className="text-[13px] font-bold text-ink leading-tight">{p.label}</p>
                    <p className="text-[10.5px] text-ink-3 mt-0.5">{p.sub}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ── SIGNUP: Role info ── */}
            {mode === 'signup' && step === 'role-info' && (
              <form onSubmit={handleRoleInfo} className="w-full mt-6 space-y-2.5">

                {/* PROFESSIONAL */}
                {(persona === 'working' || persona === 'between') && (<>
                  <Field label="Your job title *">
                    <SearchableSelect
                      options={DEFAULTS.role_title}
                      value={roleTitle}
                      onChange={setRoleTitle}
                      placeholder="e.g. Product Designer, Backend Engineer…"
                    />
                  </Field>

                  {!noOrg && (
                    <Field label={persona === 'working' ? 'Company / Organisation' : 'Last company'}>
                      <Input value={company} onChange={setCompany} placeholder="ByteCloud, Creative Labs…" />
                    </Field>
                  )}

                  {/* "No organisation" toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer py-0.5">
                    <input type="checkbox" checked={noOrg} onChange={e => { setNoOrg(e.target.checked); if (e.target.checked) setCompany('') }}
                      className="w-4 h-4 accent-[var(--color-orange)]" />
                    <span className="text-[12.5px] font-medium text-ink-2">
                      {persona === 'working' ? "I'm not at a company / I'm self-employed" : "No previous company to list"}
                    </span>
                  </label>

                  {persona === 'working' && !noOrg && (
                    <label className="flex items-center gap-2.5 cursor-pointer py-0.5">
                      <input type="checkbox" checked={currentlyWorking} onChange={e => setCurrentlyWorking(e.target.checked)}
                        className="w-4 h-4 accent-[var(--color-orange)]" />
                      <span className="text-[12.5px] font-medium text-ink">I currently work here</span>
                    </label>
                  )}

                  <Field label="Experience level">
                    <SimpleSelect options={DEFAULTS.experience_level} value={expLevel} onChange={setExpLevel} placeholder="Select level" />
                  </Field>
                  <Field label="Year started">
                    <SimpleSelect options={Array.from({length:36},(_,i)=>String(new Date().getFullYear()-i))} value={startYear} onChange={setStartYear} placeholder="Year" />
                  </Field>
                </>)}

                {/* FREELANCER */}
                {persona === 'freelancer' && (<>
                  <Field label="What do you do? *">
                    <SearchableSelect
                      options={DEFAULTS.role_title}
                      value={roleTitle}
                      onChange={setRoleTitle}
                      placeholder="e.g. UX Designer, Full-stack Engineer…"
                    />
                  </Field>
                  <Field label="Specialisation / niche (optional)">
                    <Input value={freelanceNiche} onChange={setFreelanceNiche} placeholder="e.g. SaaS products, D2C brands, fintech…" />
                  </Field>
                  <Field label="Freelancing since">
                    <SimpleSelect options={Array.from({length:15},(_,i)=>String(new Date().getFullYear()-i))} value={startYear} onChange={setStartYear} placeholder="Year" />
                  </Field>
                </>)}

                {/* STUDENT / FRESHER */}
                {(persona === 'student' || persona === 'fresher') && (<>
                  <Field label={persona === 'student' ? 'School / University' : 'College / Last institution'}>
                    <Input value={school} onChange={setSchool} placeholder="IIT Bombay, BITS Pilani, NID…" autoFocus />
                  </Field>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Degree">
                      <SimpleSelect options={['B.Tech / B.E.','B.Sc','B.Com','B.A.','BCA','BBA','MBA','M.Tech','M.Sc','PhD','Diploma','10th','12th','Other']} value={degree} onChange={setDegree} placeholder="Degree" />
                    </Field>
                    <Field label="Field of study">
                      <SimpleSelect options={DEFAULTS.study_field} value={studyField} onChange={setStudyField} placeholder="Field" />
                    </Field>
                  </div>
                  <Field label={persona === 'student' ? 'Current year' : 'Graduation year'}>
                    <SimpleSelect
                      options={persona === 'student'
                        ? ['1st Year','2nd Year','3rd Year','4th Year / Final','Postgrad 1st','Postgrad 2nd','PhD 1st','PhD 2nd+']
                        : Array.from({length:8},(_,i)=>String(new Date().getFullYear()-i))}
                      value={studyYear} onChange={setStudyYear} placeholder="Select" />
                  </Field>
                  <Field label="Target role (optional)">
                    <SearchableSelect options={DEFAULTS.role_title} value={roleTitle} onChange={setRoleTitle} placeholder="Product Designer, SWE, Data Scientist…" />
                  </Field>
                </>)}

                <Btn busy={busy}
                  disabled={
                    ((persona === 'working' || persona === 'between') && !roleTitle.trim()) ||
                    (persona === 'freelancer' && !roleTitle.trim())
                  }
                  label="Save & continue" />
                <button type="button" onClick={() => setStep('profile')}
                  className="w-full text-[11.5px] text-ink-3 hover:text-ink transition-colors py-0.5 text-center">Skip for now</button>
              </form>
            )}

            {/* ── SIGNUP: Org info ── */}
            {mode === 'signup' && step === 'org-info' && (
              <form onSubmit={handleOrgInfo} className="w-full mt-6 space-y-2.5">
                <Field label="Company name *">
                  <Input value={orgName} onChange={setOrgName} placeholder="Creative Labs, ByteCloud…" autoFocus />
                </Field>
                <Field label="Your role in the company">
                  <SimpleSelect options={['Founder / Co-founder','CEO / MD','CTO','VP Engineering','HR Manager','Recruiter','Talent Acquisition','Hiring Manager','People Ops','Operations Manager','Other']} value={orgRole} onChange={setOrgRole} placeholder="Select your role" />
                </Field>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Industry">
                    <SimpleSelect options={DEFAULTS.industry} value={orgIndustry} onChange={setOrgIndustry} placeholder="Industry" />
                  </Field>
                  <Field label="Company size">
                    <SimpleSelect options={DEFAULTS.company_size} value={orgSize} onChange={setOrgSize} placeholder="Size" />
                  </Field>
                </div>
                <Btn busy={busy} disabled={!orgName.trim()} label="Set up company" />
              </form>
            )}

            {/* ── SIGNUP: Profile ── */}
            {mode === 'signup' && step === 'profile' && (
              <form onSubmit={handleProfile} className="w-full mt-6 space-y-2.5">
                {userId && (
                  <div className="bg-card border border-line rounded-[14px] p-4 flex flex-col items-center gap-2">
                    <AvatarUpload bucket="profile-avatars" ownerId={userId} currentUrl={avatarUrl}
                      fallback={name || username || 'U'} size={72} onUploaded={url => setAvatarUrl(url)} />
                    <p className="text-[10.5px] text-ink-3">Tap to add a photo</p>
                  </div>
                )}
                <Field label={path === 'org' ? 'Your full name' : 'Full name'}>
                  <Input value={name} onChange={setName} placeholder="Naadhan S" autoFocus />
                </Field>
                <Field label="City (optional)">
                  <Input value={location} onChange={setLocation} placeholder="Bengaluru, IN" />
                </Field>
                <Btn busy={busy} disabled={false} label={colleagues.length > 0 ? 'Next' : 'Done — take me in'} />
                <button type="button" onClick={done}
                  className="w-full text-[11.5px] text-ink-3 hover:text-ink transition-colors py-0.5 text-center">Skip for now</button>
              </form>
            )}

            {/* ── SIGNUP: Squad nudge ── */}
            {mode === 'signup' && step === 'squad' && (
              <div className="w-full mt-6 space-y-3">
                {companyChecked && colleagues.length === 0 ? (
                  <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                    <p className="text-[12.5px] font-semibold text-amber-800">
                      Nobody from <strong>{squadContext}</strong> is on tiikme yet.
                    </p>
                    <p className="text-[11.5px] text-amber-700 mt-0.5">
                      Double-check the spelling — or invite them later from your profile.
                    </p>
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-2 text-center">
                    {colleagues.length} {colleagues.length === 1 ? 'person' : 'people'} from{' '}
                    <strong>{squadContext}</strong>{' '}
                    {colleagues.length === 1 ? 'is' : 'are'} already on tiikme
                  </p>
                )}
                <div className="space-y-2">
                  {colleagues.map(c => (
                    <div key={c.user_id} className="flex items-center gap-3 bg-card border border-line rounded-[14px] px-3.5 py-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white text-[13px] font-bold shrink-0 overflow-hidden">
                        {c.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={c.avatar_url} alt={c.full_name ?? ''} className="w-full h-full object-cover" />
                          : (c.full_name ?? c.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{c.full_name ?? c.username}</p>
                        {c.headline && <p className="text-[10.5px] text-ink-3 truncate">{c.headline}</p>}
                      </div>
                      {squadSent.has(c.user_id)
                        ? <span className="text-[11px] font-semibold text-green-600 shrink-0">Sent ✓</span>
                        : <button onClick={() => sendSquad(c.user_id)}
                            className="px-3 py-1.5 text-[11.5px] font-bold text-white bg-orange rounded-[9px] hover:opacity-90 transition-opacity shrink-0">
                            + Squad
                          </button>}
                    </div>
                  ))}
                </div>
                <button onClick={done} className="w-full bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold py-3 rounded-[12px] hover:opacity-95 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)] mt-1">
                  Go to my profile
                </button>
                <button onClick={done} className="w-full text-[11.5px] text-ink-3 hover:text-ink transition-colors py-0.5 text-center">Skip for now</button>
              </div>
            )}

            {error && <p className="text-[12px] text-red-500 font-medium mt-3 text-center">{error}</p>}

            {(mode === 'signin' || step === 'path') && !forgotSent && (
              <p className="text-[11.5px] text-ink-3 mt-5 text-center">
                {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
                <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-orange hover:text-orange-2 font-semibold transition-colors">
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─── Colleague type ─────────────────────────────────────────────── */
interface Colleague { user_id: string; username: string; full_name: string | null; headline: string | null; avatar_url: string | null }

/* ─── OTP 6-box ─────────────────────────────────────────────────── */
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const handle = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, 6)
    onChange(next)
    if (d && i < 5) refs.current[i + 1]?.focus()
  }
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1))
      else if (i > 0) refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(p); refs.current[Math.min(p.length, 5)]?.focus()
  }
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={el => { refs.current[i] = el }} type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''} autoFocus={i === 0}
          onChange={e => handle(i, e.target.value)} onKeyDown={e => onKey(i, e)} onPaste={onPaste}
          className="w-11 text-center text-[20px] font-bold text-ink bg-card border-2 border-line rounded-[12px] outline-none focus:border-orange transition-colors caret-transparent"
          style={{ height: 52 }} />
      ))}
    </div>
  )
}

/* ─── Searchable select ──────────────────────────────────────────── */
function SearchableSelect({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 30)

  useEffect(() => { setQuery(value) }, [value])

  return (
    <div className="relative">
      <input value={query} onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all" />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-[12px] shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map(o => (
            <button key={o} type="button" onMouseDown={() => { onChange(o); setQuery(o); setOpen(false) }}
              className="w-full text-left px-3.5 py-2.5 text-[12.5px] text-ink hover:bg-orange/8 first:rounded-t-[12px] last:rounded-b-[12px] transition-colors">
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Simple native select ───────────────────────────────────────── */
function SimpleSelect({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all appearance-none cursor-pointer"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%239ca3af' strokeWidth='1.5' strokeLinecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

/* ─── Shared primitives ─────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-semibold text-ink-2">{label}</span><div className="mt-1.5">{children}</div></label>
}
function Input({ value, onChange, type = 'text', placeholder, autoFocus }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoFocus?: boolean }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
    className="w-full bg-card border border-line rounded-[12px] px-3.5 py-3 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 focus:shadow-[0_0_0_3px_rgba(255,92,40,.07)] transition-all" />
}
function Btn({ busy, disabled, label }: { busy: boolean; disabled: boolean; label: string }) {
  return <button type="submit" disabled={disabled || busy}
    className="w-full bg-gradient-to-br from-orange to-orange-2 text-white text-[13px] font-semibold py-3 rounded-[12px] hover:opacity-95 disabled:opacity-40 transition-opacity shadow-[0_6px_18px_-6px_rgba(255,92,40,.55)] mt-1">
    {busy ? 'Please wait…' : label}
  </button>
}

function GoogleBtn({ label = 'Continue with Google' }: { label?: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <button type="button" disabled={busy} onClick={async () => { setBusy(true); await signInWithGoogle() }}
      className="w-full flex items-center justify-center gap-2.5 bg-white border border-line rounded-[12px] px-4 py-3 text-[13px] font-semibold text-ink hover:bg-gray-50 transition-colors disabled:opacity-40 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      {busy ? 'Redirecting…' : label}
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-line" />
      <span className="text-[11px] text-ink-3 font-medium">or</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  )
}
