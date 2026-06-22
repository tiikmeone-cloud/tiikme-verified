import { createClient } from '@/lib/supabase/server'
import { PROFILE_COLUMNS } from '@/lib/types'
import type { Profile } from '@/lib/types'
import AiChatShell from '@/components/agent/AiChatShell'

export const metadata = { title: 'Tiik — your career AI' }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null

  if (user) {
    const { data } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', user.id).maybeSingle()
    profile = (data as unknown as Profile) ?? null
  }
  if (!profile) {
    const { data } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('username', 'naadhn').eq('is_public', true).maybeSingle()
    profile = (data as unknown as Profile) ?? null
  }

  return <AiChatShell profile={profile} />
}
