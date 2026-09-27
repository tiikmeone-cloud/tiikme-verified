import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // No auth session — send to sign-in, never to another user's profile.
  // Was: redirect to the demo user ("naadhn"), which showed that account's
  // real identity to every logged-out visitor who hit /profile/me.
  if (!user) {
    redirect('/sign-in')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, account_type, primary_org_slug')
    .eq('id', user.id)
    .maybeSingle()

  // Org account → go to their org page, never to personal profile
  if (profile?.account_type === 'org' && profile?.primary_org_slug) {
    redirect(`/org/${profile.primary_org_slug}`)
  }

  // User account → personal profile. No username on a signed-in user's own
  // row is a broken/incomplete profile, not a reason to show them (or
  // anyone) the demo account's identity — send them home instead.
  redirect(profile?.username ? `/profile/${profile.username}` : '/home')
}
