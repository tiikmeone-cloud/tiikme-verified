import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // No auth session — fall back to demo user (naadhn)
  if (!user) {
    redirect('/profile/naadhn')
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

  // User account → personal profile
  redirect(profile?.username ? `/profile/${profile.username}` : '/profile/naadhn')
}
