import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PROFILE_COLUMNS } from '@/lib/types'
import type { Profile } from '@/lib/types'
import ProfileShell from '@/components/profile/ProfileShell'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('full_name, headline, username, account_type, primary_org_slug')
    .eq('username', handle)
    .eq('is_public', true)
    .maybeSingle()

  if (!data) return { title: 'Profile not found — tiikme' }
  if (data.account_type === 'org' && data.primary_org_slug) {
    return { title: `${data.full_name ?? data.username} — tiikme` }
  }
  return {
    title: `${data.full_name ?? data.username} (@${data.username}) — tiikme`,
    description: data.headline ?? undefined,
  }
}

export default async function ProfileHandlePage({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`${PROFILE_COLUMNS}, account_type, primary_org_slug`)
    .eq('username', handle)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    console.error('[profile] select error:', error.message)
    notFound()
  }

  if (!data) notFound()

  // Org accounts don't have a user profile — redirect to their org page
  if ((data as any).account_type === 'org' && (data as any).primary_org_slug) {
    redirect(`/org/${(data as any).primary_org_slug}`)
  }

  return <ProfileShell profile={data as unknown as Profile} />
}
