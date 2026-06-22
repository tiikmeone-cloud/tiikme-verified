import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PROFILE_COLUMNS } from '@/lib/types'
import type { Profile } from '@/lib/types'
import FlexPublicView from './FlexPublicView'
import { getDemoProfile } from '@/stubs/demoProfiles'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const stub = getDemoProfile(username)
  if (stub) return {
    title: `${stub.profile.full_name ?? username} — Flex on tiikme`,
    description: stub.profile.headline ?? 'Verified career profile on tiikme',
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, headline, username')
    .eq('username', username)
    .maybeSingle()
  if (!data) return { title: 'Flex — tiikme' }
  return {
    title: `${data.full_name ?? data.username} — Flex on tiikme`,
    description: data.headline ?? 'Verified career profile on tiikme',
  }
}

export default async function FlexPublicPage({ params }: Props) {
  const { username } = await params

  // Check stubs first — no DB round-trip needed for demo profiles
  const stub = getDemoProfile(username)
  if (stub) return (
    <FlexPublicView
      profile={stub.profile as unknown as Profile}
      experience={stub.experience}
      education={stub.education}
      certs={stub.certs}
      achievements={stub.achievements}
    />
  )

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('username', username)
    .maybeSingle()

  if (!data) notFound()
  return <FlexPublicView profile={data as unknown as Profile} />
}
