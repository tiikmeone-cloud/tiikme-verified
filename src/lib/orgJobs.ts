import { createClient } from '@/lib/supabase/client'
import type { Opening, ScreeningQuestion } from '@/stubs/getJobs'

const FALLBACK_SCREENING: ScreeningQuestion[] = [
  { id: 's1', q: 'Are you authorized to work in this location?', kind: 'yesno', mustHave: 'Yes' },
  { id: 's2', q: 'Years of relevant experience?', kind: 'experience', mustHave: '3+' },
  { id: 's3', q: 'Preferred work mode?', kind: 'choice', options: ['Remote', 'Hybrid', 'On-site'] },
]

function relTime(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 3600) return `${Math.floor(d / 60)}m`
  if (d < 86400) return `${Math.floor(d / 3600)}h`
  return `${Math.floor(d / 86400)}d`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOpening(row: any): Opening {
  const org = row.orgs ?? {}
  const content = row.content ?? {}
  return {
    id: row.id,
    title: row.title ?? '',
    org: org.name ?? 'Unknown',
    orgSlug: org.slug ?? '',
    orgColor: org.logo_color ?? '#FF5C28',
    verified: org.verified ?? false,
    location: row.location ?? 'Remote',
    mode: row.work_mode ?? 'Remote',
    type: row.job_type ?? 'Full-time',
    salary: row.salary ?? 'Competitive',
    postedAt: row.posted_at ? relTime(row.posted_at) : '?',
    applicants: row.applicant_count ?? 0,
    likes: 0,
    refers: 0,
    urgent: false,
    mustHaveSkills: row.must_have_skills ?? [],
    niceToHave: row.nice_to_have ?? [],
    certsRequired: row.certs_required ?? [],
    experience: row.experience_level ?? '',
    networkAtCompany: [],
    summary: row.description ?? '',
    applyMode: row.apply_mode ?? 'in-platform',
    externalUrl: row.external_url ?? undefined,
    screening: (() => {
      const raw: ScreeningQuestion[] = row.screening ?? []
      const valid = raw.filter((s: ScreeningQuestion) => s.q?.trim())
      return valid.length > 0 ? valid : FALLBACK_SCREENING
    })(),
    fn: row.job_function ?? 'General',
    experienceLevel: row.experience_level ?? '',
    officeReq: row.work_mode === 'Remote' ? 'Fully remote' : row.work_mode === 'Hybrid' ? 'Hybrid · 2 days a week' : 'In office',
    whatJobInvolves: content.whatJobInvolves ?? (row.description ? [row.description] : []),
    whoYouAre: content.whoYouAre ?? (row.must_have_skills ?? []).map((s: string) => `Strong skill with ${s}`),
    ourTake: content.ourTake ?? `${org.name ?? ''} is hiring for this role.`,
    companyBenefits: content.companyBenefits ?? [],
    salaryBenchmark: content.salaryBenchmark ?? (row.salary ?? ''),
  }
}

export async function fetchOrgJobs(): Promise<Opening[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('org_jobs')
    .select('*, orgs(name, slug, logo_color, verified)')
    .eq('is_open', true)
    .order('posted_at', { ascending: false })
    .limit(50)
  if (error || !data || data.length === 0) return []
  return data.map(rowToOpening)
}
