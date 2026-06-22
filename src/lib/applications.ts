/**
 * Application lifecycle — typed wrappers around the Supabase RPCs.
 *
 * Pre-auth: the demo passes the seeded user's UUID. After auth lands,
 * we'll drop the user_id arg and let RLS take over.
 */

import { createClient } from '@/lib/supabase/client'
import { logRpc } from '@/lib/rpcError'

export const DEMO_USER_USERNAME = 'naadhn'

export type Stage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'shortlisted_with_consent'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export const STAGE_LABEL: Record<Stage, string> = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  shortlisted_with_consent: 'Awaiting your consent',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Not progressing',
  withdrawn: 'Withdrawn',
}

export const STAGE_ORDER: Stage[] = [
  'applied', 'screening', 'shortlisted', 'shortlisted_with_consent',
  'interview', 'offer', 'hired',
]

export const STAGE_TINT: Record<Stage, { bg: string; fg: string; ring: string }> = {
  applied:                  { bg: 'bg-page',        fg: 'text-ink-2',  ring: 'ring-line' },
  screening:                { bg: 'bg-amber/10',    fg: 'text-amber',  ring: 'ring-amber/20' },
  shortlisted:              { bg: 'bg-orange-soft', fg: 'text-orange', ring: 'ring-orange/20' },
  shortlisted_with_consent: { bg: 'bg-orange-soft', fg: 'text-orange', ring: 'ring-orange/30' },
  interview:                { bg: 'bg-teal/10',     fg: 'text-teal',   ring: 'ring-teal/20' },
  offer:                    { bg: 'bg-green/10',    fg: 'text-green',  ring: 'ring-green/20' },
  hired:                    { bg: 'bg-green/15',    fg: 'text-green',  ring: 'ring-green/30' },
  rejected:                 { bg: 'bg-red/10',      fg: 'text-red',    ring: 'ring-red/20' },
  withdrawn:                { bg: 'bg-page',        fg: 'text-ink-3',  ring: 'ring-line' },
}

export interface UserApplication {
  app_id: string
  stage: Stage
  applied_at: string
  last_change: string | null
  cover_note: string | null
  job_id: string
  job_title: string
  job_type: string | null
  job_mode: string | null
  job_location: string | null
  job_salary: string | null
  org_id: string
  org_slug: string
  org_name: string
  org_logo: string | null
  org_verified: boolean
}

export interface OrgApplication {
  app_id: string
  stage: Stage
  applied_at: string
  last_change: string | null
  user_id: string
  user_username: string
  user_full_name: string | null
  user_headline: string | null
  user_avatar: string | null
  user_city: string | null
  user_skills: string[]
  job_id: string
  job_title: string
  job_must_have_skills: string[]
  job_nice_to_have: string[]
  job_posted_at: string | null
  job_expires_at: string | null
  job_screening: Array<{ q: string; kind: string; expected?: string; must_have?: boolean; options?: string[] }> | null
  job_is_open: boolean
  consent_given: boolean
  contact_given: boolean
  applicant_email: string | null
  applicant_phone: string | null
  ai_score: number | null
  knockout_passed: boolean | null
  source: 'in_platform' | 'external' | 'hybrid' | 'referral'
  screening_answers: Record<string, unknown> | null
  match_breakdown: Record<string, unknown>
  past_hires_count: number
}

/* ── Resolve the demo user_id once (pre-auth) ── */
let _demoUserId: string | null = null
/**
 * The current acting user id.
 * - Logged in  → the real auth.uid() (session user).
 * - Logged out → the demo seed user, so the anonymous demo still works (Phase 1).
 * This single chokepoint is how the whole app flips from demo → real with auth.
 */
export async function getDemoUserId(): Promise<string | null> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user.id
  } catch { /* transient auth fetch — fall back to seed user */ }
  if (_demoUserId) return _demoUserId
  const { data } = await supabase.from('profiles').select('id').eq('username', DEMO_USER_USERNAME).single()
  _demoUserId = (data?.id as string) ?? null
  return _demoUserId
}

/* ── Candidate-side ─────────────────────────────────────────────── */

export async function listMyApplications(): Promise<UserApplication[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('get_user_applications', { p_user: user })
  if (error) { logRpc('listMyApplications', error); return [] }
  return (data as UserApplication[]) ?? []
}

/** Apply to a LIVE org_jobs row: writes the application (with applicant email +
 *  screening answers keyed by question text), the scoring trigger computes
 *  ai_score / knockout / auto-rules, and we return the scored result. */
export async function applyToLiveJob(args: {
  jobId: string; email: string; answers: Record<string, string>
}): Promise<{ score: number | null; knockout: boolean | null; stage: Stage } | { error: string }> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return { error: 'Sign-in needed to apply (auth coming).' }
  const { data, error } = await supabase
    .from('applications')
    .insert({ user_id: user, job_id: args.jobId, stage: 'applied', applicant_email: args.email.trim(), source: 'in_platform', screening_answers: args.answers })
    .select('id').single()
  if (error) return { error: error.code === '23505' ? 'You’ve already applied to this role.' : error.code === '42501' ? 'Sign-in needed to apply (auth coming).' : error.message }
  const { data: scored } = await supabase
    .from('applications').select('ai_score, knockout_passed, stage').eq('id', (data as { id: string }).id).single()
  const s = scored as { ai_score: number | null; knockout_passed: boolean | null; stage: Stage } | null
  return { score: s?.ai_score ?? null, knockout: s?.knockout_passed ?? null, stage: s?.stage ?? 'applied' }
}

export async function applyToJob(args: {
  jobId: string
  coverNote?: string
  screeningAnswers?: Record<string, string>
  referrerId?: string
}): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('apply_to_job', {
    p_user: user,
    p_job: args.jobId,
    p_cover: args.coverNote ?? null,
    p_answers: args.screeningAnswers ?? null,
    p_referrer: args.referrerId ?? null,
  })
  if (error) { logRpc('applyToJob', error); return null }
  return data as string
}

export async function grantFlexConsent(args: {
  orgId: string; jobId: string; applicationId: string
}): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('grant_flex_consent', {
    p_user: user,
    p_org: args.orgId,
    p_job: args.jobId,
    p_application: args.applicationId,
  })
  if (error) { logRpc('grantFlexConsent', error); return null }
  return data as string
}

export async function grantContactConsent(args: {
  orgId: string; applicationId: string
}): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('grant_contact_consent', {
    p_user: user,
    p_org: args.orgId,
    p_application: args.applicationId,
  })
  if (error) { logRpc('grantContactConsent', error); return null }
  return data as string
}

/* ── Org-side ───────────────────────────────────────────────────── */

export async function listOrgApplications(orgId: string): Promise<OrgApplication[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_org_applications', { p_org: orgId })
  if (error) { logRpc('listOrgApplications', error); return [] }
  return (data as OrgApplication[]) ?? []
}

export async function advanceStage(applicationId: string, newStage: Stage): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.rpc('advance_application_stage', {
    p_application: applicationId,
    p_new_stage: newStage,
  })
  if (error) { logRpc('advanceStage', error); return false }
  return true
}

/* ── Org roles management ───────────────────────────────────────── */

export interface OrgJob {
  id: string
  title: string
  job_type: string | null
  work_mode: string | null
  location: string | null
  is_open: boolean
  posted_at: string | null
  expires_at: string | null
  applicant_count: number
}

export async function listOrgJobs(orgId: string): Promise<OrgJob[]> {
  const sb = createClient()
  const { data: jobs } = await sb
    .from('org_jobs')
    .select('id,title,job_type,work_mode,location,is_open,posted_at,expires_at')
    .eq('org_id', orgId)
    .order('posted_at', { ascending: false })
  if (!jobs) return []
  const { data: counts } = await sb
    .from('applications')
    .select('job_id')
    .in('job_id', jobs.map(j => j.id))
  const countMap = new Map<string, number>()
  for (const c of counts ?? []) countMap.set(c.job_id, (countMap.get(c.job_id) ?? 0) + 1)
  return jobs.map(j => ({ ...(j as OrgJob), applicant_count: countMap.get(j.id) ?? 0 }))
}

export async function deleteOrgJob(jobId: string): Promise<boolean> {
  const sb = createClient()
  const { error } = await sb.from('org_jobs').delete().eq('id', jobId)
  return !error
}

/* ── Lookups (org_id by slug · best-effort job match) ──────────── */

export async function getOrgIdBySlug(slug: string): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.from('orgs').select('id').eq('slug', slug).maybeSingle()
  return (data?.id as string) ?? null
}

/* ── Org ownership + creation (owner-only posting; demo uses the seed user) ── */

export async function isOwnerOfOrg(slug: string): Promise<boolean> {
  const supabase = createClient()
  const [uid, orgId] = await Promise.all([getDemoUserId(), getOrgIdBySlug(slug)])
  if (!uid || !orgId) return false
  const { data } = await supabase
    .from('org_memberships')
    .select('role')
    .eq('user_id', uid).eq('org_id', orgId).eq('is_current', true)
    .in('role', ['owner', 'admin'])
    .maybeSingle()
  return !!data
}

export interface NewOrg {
  name: string; slug: string; location: string | null
  logo_color: string; website: string | null; tagline: string | null
}

export async function createOrg(o: NewOrg): Promise<{ slug?: string; error?: string }> {
  const supabase = createClient()
  const uid = await getDemoUserId()
  const { data: org, error } = await supabase
    .from('orgs')
    .insert({ name: o.name, slug: o.slug, location: o.location, logo_color: o.logo_color, website: o.website, tagline: o.tagline, verified: false })
    .select('id, slug')
    .single()
  if (error || !org) {
    return {
      error: error?.code === '23505' ? 'That handle is taken — pick another.'
        : error?.code === '42501' ? 'Creating an organization needs sign-in (auth coming).'
        : (error?.message ?? 'Could not create organization.'),
    }
  }
  if (uid) {
    await supabase.from('org_memberships').insert({ user_id: uid, org_id: (org as { id: string }).id, role: 'owner', is_current: true })
  }
  return { slug: (org as { slug: string }).slug }
}

/**
 * Find a real org_jobs row by org-slug + best fuzzy title match.
 * Used when applying from the Jobs page which still uses stub `Opening` data.
 */
export async function findRealJob(orgName: string, jobTitle: string): Promise<{ id: string; org_id: string } | null> {
  const supabase = createClient()
  // First try by orgs.name ILIKE
  const { data: orgs } = await supabase.from('orgs').select('id, name').ilike('name', `%${orgName}%`)
  if (!orgs || orgs.length === 0) return null
  const orgId = orgs[0].id as string

  const { data: jobs } = await supabase
    .from('org_jobs')
    .select('id, title')
    .eq('org_id', orgId)
  if (!jobs || jobs.length === 0) return null

  // Best title overlap
  const target = jobTitle.toLowerCase()
  let best = jobs[0]
  let bestScore = 0
  for (const j of jobs) {
    const t = (j.title as string).toLowerCase()
    const score = overlap(t, target)
    if (score > bestScore) { bestScore = score; best = j }
  }
  return { id: best.id as string, org_id: orgId }
}

function overlap(a: string, b: string): number {
  const wa = new Set(a.split(/\s+/))
  const wb = new Set(b.split(/\s+/))
  let n = 0
  wa.forEach(w => { if (wb.has(w)) n++ })
  return n
}

/* ── Helpers ────────────────────────────────────────────────────── */

export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  const diff = (Date.now() - d) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  if (diff < 604800)return `${Math.floor(diff/86400)}d ago`
  return new Date(iso).toLocaleDateString()
}
