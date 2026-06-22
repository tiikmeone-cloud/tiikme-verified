import { getOrg } from '@/stubs/getExplore'
import TalentPageShell from '@/components/applications/TalentPageShell'

export const metadata = { title: 'Talent — tiikme' }

export default async function TalentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = getOrg(slug)
  return <TalentPageShell orgSlug={slug} orgName={org?.name ?? 'Organization'} />
}
