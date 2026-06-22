/**
 * Auth helpers (client-side). Email+password is verifiable now; email-OTP /
 * magic-link is wired for production (same supabase.auth — the email leg just
 * can't be tested in this environment). ensureProfile() links the logged-in
 * auth.uid() to a public.profiles row so the user has a Flex.
 *
 * Phase 1 (non-breaking): login is additive — getDemoUserId() falls back to the
 * seed user when logged out, so the anonymous demo keeps working. RLS hardening
 * (revoke anon, auth.uid() policies, drop p_user RPC args) is a deliberate Phase 2.
 */
import { createClient } from '@/lib/supabase/client'

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)

export async function getSessionUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Create the profiles row for the current auth user if missing. */
export async function ensureProfile(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (existing) return
  const base = slugify(user.email?.split('@')[0] || 'user') || 'user'
  await supabase.from('profiles').insert({
    id: user.id,
    username: `${base}_${user.id.slice(0, 4)}`,
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'New user',
  })
}

export async function signInPassword(email: string, password: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) return { error: error.message }
  await ensureProfile()
  return {}
}

export async function signUpPassword(email: string, password: string, fullName?: string): Promise<{ error?: string; needsConfirm?: boolean }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(), password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: error.message }
  if (data.session) { await ensureProfile(); return {} }
  return { needsConfirm: true } // email confirmation required by project settings
}

export async function sendOtp(email: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
  if (error) return { error: error.message }
  return {}
}

export async function verifyOtp(email: string, token: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' })
  if (error) return { error: error.message }
  await ensureProfile()
  return {}
}

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${location.origin}/reset-password`,
  })
  if (error) return { error: error.message }
  return {}
}

export async function updatePassword(newPassword: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return {}
}

export async function updateEmail(newEmail: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
  if (error) return { error: error.message }
  return {}
}

/** Resolves an email or username to an email for sign-in. */
export async function resolveIdentifier(identifier: string): Promise<string | null> {
  if (identifier.includes('@')) return identifier.trim()
  const supabase = createClient()
  const { data } = await supabase.rpc('get_email_by_username', { p_username: identifier.trim() })
  return (data as string | null) ?? null
}

export async function sendOtpSignup(email: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  })
  if (error) return { error: error.message }
  return {}
}

export async function verifyOtpAndGetUser(email: string, token: string): Promise<{ error?: string; userId?: string; isNew?: boolean }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' })
  if (error) return { error: error.message }
  const uid = data.user?.id
  if (!uid) return { error: 'No user returned' }
  // Check if profile row exists (returning user has one; brand-new OTP user doesn't)
  const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', uid).maybeSingle()
  if (!profile) {
    // Create the profile row now — session is live so RLS allows the insert
    const base = slugify(email.trim().split('@')[0] || 'user') || 'user'
    await supabase.from('profiles').insert({
      id: uid,
      username: `${base}_${uid.slice(0, 4)}`,
      full_name: email.split('@')[0] || 'New user',
    })
  }
  const isNew = !profile?.full_name || profile.full_name === profile?.username || (profile?.username ?? '').includes('_')
  return { userId: uid, isNew }
}

export async function claimProfile(userId: string, opts: {
  username: string; password: string; fullName?: string; headline?: string; location?: string; avatarUrl?: string
}): Promise<{ error?: string }> {
  const supabase = createClient()
  // Set password
  const { error: pwErr } = await supabase.auth.updateUser({ password: opts.password })
  if (pwErr) return { error: pwErr.message }
  // Save profile
  const { error: dbErr } = await supabase.from('profiles').update({
    username: opts.username.trim(),
    ...(opts.fullName ? { full_name: opts.fullName.trim() } : {}),
    ...(opts.headline ? { headline: opts.headline.trim() } : {}),
    ...(opts.location ? { location_city: opts.location.trim() } : {}),
    ...(opts.avatarUrl ? { avatar_url: opts.avatarUrl } : {}),
  }).eq('id', userId)
  if (dbErr) return { error: dbErr.message }
  return {}
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  // Soft-delete: mark profile as deleted + sign out. Hard delete requires service-role key.
  const { error } = await supabase.from('profiles').update({ is_public: false, full_name: '[deleted]', username: `deleted_${user.id.slice(0,8)}` }).eq('id', user.id)
  if (error) return { error: error.message }
  await supabase.auth.signOut()
  return {}
}
