import { createClient } from '@/lib/supabase/server'
import { PROFILE_COLUMNS } from '@/lib/types'
import type { Profile } from '@/lib/types'
import AiChatShell from '@/components/agent/AiChatShell'

export const metadata = { title: 'Tiik — your career AI' }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null

  // Was: any visitor without their own profile row (anonymous, or a real
  // signed-in user whose profile insert hadn't landed yet) fell back to the
  // demo user's ("naadhn") real profile — showing them someone else's
  // identity. AiChatShell already renders correctly with profile=null
  // (see displayName/avatar fallbacks there), so just leave it null.
  if (user) {
    const { data } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', user.id).maybeSingle()
    profile = (data as unknown as Profile) ?? null
  }

  return <AiChatShell profile={profile} />
}
