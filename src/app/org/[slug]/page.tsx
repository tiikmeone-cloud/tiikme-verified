import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrg, type OrgFull } from '@/stubs/getExplore'
import OrgShell from '@/components/org/OrgShell'

interface Props { params: Promise<{ slug: string }> }

async function resolveOrg(slug: string): Promise<OrgFull | null> {
  const stub = getOrg(slug)
  if (stub) return stub

  // Not in stubs — fetch from Supabase
  const supabase = await createClient()
  const { data: o } = await supabase
    .from('orgs')
    .select('id,slug,name,tagline,about,logo_color,logo_url,type,location,website,verified,founded,size,funding,mission,tech_stack,perks,member_count,follower_count,rating,highlights,values_json,leadership_json')
    .eq('slug', slug)
    .maybeSingle()
  if (!o) return null

  const { data: jobs } = await supabase
    .from('org_jobs')
    .select('id,title,job_type,location,salary')
    .eq('org_id', o.id)
    .eq('is_open', true)
    .order('posted_at', { ascending: false })
    .limit(10)

  return {
    slug: o.slug,
    name: o.name,
    logoColor: o.logo_color ?? '#6366F1',
    logoUrl: o.logo_url ?? null,
    type: o.type ?? 'Company',
    location: o.location ?? '',
    openRoles: jobs?.length ?? 0,
    members: [],
    memberCount: o.member_count ?? 0,
    verified: o.verified ?? false,
    tagline: o.tagline ?? '',
    about: o.about ?? '',
    highlights: o.highlights ?? [],
    followers: o.follower_count ?? 0,
    founded: o.founded ?? '',
    size: o.size ?? '',
    website: o.website ?? '',
    funding: o.funding ?? '',
    mission: o.mission ?? '',
    techStack: (o.tech_stack as string[]) ?? [],
    perks: (o.perks as string[]) ?? [],
    values: (o.values_json as { title: string; body: string }[]) ?? [],
    faqs: [],
    reviews: [],
    avgRating: parseFloat(o.rating) || 0,
    leadership: (o.leadership_json as { name: string; title: string; background: string; avatar: string }[]) ?? [],
    fundingRounds: [],
    totalFunding: o.funding ?? '',
    roles: (jobs ?? []).map(j => ({
      id: j.id,
      title: j.title,
      type: j.job_type ?? 'Full-time',
      location: j.location ?? '',
      salary: j.salary ?? undefined,
    })),
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const org = await resolveOrg(slug)
  return { title: org ? `${org.name} — tiikme` : 'Organization — tiikme' }
}

export default async function OrgPage({ params }: Props) {
  const { slug } = await params
  const org = await resolveOrg(slug)
  if (!org) notFound()

  // Resolve ownership server-side so OrgShell never flashes the non-owner view
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialIsOwner = false
  if (user) {
    const { data: orgRow } = await supabase
      .from('orgs').select('id').eq('slug', slug).maybeSingle()
    if (orgRow?.id) {
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', orgRow.id)
        .eq('is_current', true)
        .in('role', ['owner', 'admin'])
        .maybeSingle()
      initialIsOwner = !!membership
    }
  }

  return <OrgShell org={org} initialIsOwner={initialIsOwner} />
}
