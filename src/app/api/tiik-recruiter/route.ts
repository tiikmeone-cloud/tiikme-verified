import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Strict JSON schema — the model CANNOT hallucinate fields outside this schema.
// OpenAI enforces this at the API level: any field not in `properties` is rejected.
const SHORTLIST_SCHEMA = {
  name: 'applicant_shortlist',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      candidate_id: {
        type: 'string' as const,
        description: 'The candidate user ID',
      },
      match_score: {
        type: 'integer' as const,
        description: 'Score 0–100: skills match (40%) + Squad verifications on required skills (30%) + Trust Score vs role avg (20%) + Vouch coverage (10%)',
      },
      trust_rating: {
        type: 'string' as const,
        enum: ['High', 'Medium', 'Low'] as const,
        description: 'High = Trust Score ≥70 or 3+ Squad. Medium = 40–69. Low = below 40.',
      },
      verified_skills_found: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Skills that are both listed AND squad-confirmed in the candidate Flex',
      },
      self_reported_skills_only: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Skills listed but NOT squad-confirmed — treat as unverified claims',
      },
      missing_critical_skills: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Required job skills completely absent from the candidate Flex',
      },
      squad_confirmation_count: {
        type: 'integer' as const,
        description: 'Total bilateral Squad confirmations on the candidate profile',
      },
      vouch_coverage: {
        type: 'boolean' as const,
        description: 'True if the candidate has at least one Vouch relevant to this role type',
      },
      shortlist_recommendation: {
        type: 'string' as const,
        enum: ['Shortlist', 'Maybe', 'Skip'] as const,
        description: 'Shortlist = strong verified match. Maybe = partial match, worth reviewing. Skip = critical skills missing or Trust Score too low.',
      },
      tiik_recruiter_summary: {
        type: 'string' as const,
        description: 'One sentence: why this candidate fits or fails. Reference verified signals only — never hallucinate.',
      },
    },
    required: [
      'candidate_id',
      'match_score',
      'trust_rating',
      'verified_skills_found',
      'self_reported_skills_only',
      'missing_critical_skills',
      'squad_confirmation_count',
      'vouch_coverage',
      'shortlist_recommendation',
      'tiik_recruiter_summary',
    ] as const,
    additionalProperties: false,
  },
} as const

const RECRUITER_SYSTEM = `You are Tiik Recruiter, an AI talent analyst for organisations on tiikme.

Your job is to evaluate a candidate's Flex against a job's requirements and return a structured assessment.

CRITICAL RULES:
1. VERIFIED SIGNALS ONLY. Distinguish between squad-confirmed skills (verified) and self-reported skills (claimed). Never treat unconfirmed skills as equivalent to confirmed ones.
2. TRUST SCORE is the primary signal for senior roles (Trust ≥ 60 = credible, ≥ 80 = exceptional).
3. A Vouch for the relevant role type adds a significant hiring signal — it means someone staked their reputation on this candidate.
4. Do NOT reference or reveal candidate emails, phone numbers, or private contact information.
5. If the candidate Flex data is missing key fields, set match_score low and note it in the summary.
6. Your tiik_recruiter_summary must be ONE sentence and reference only facts in the provided context.`

interface CandidateContext {
  candidate_id: string
  name: string
  headline: string | null
  skills: string[]
  verified_skills: string[]
  trust_score: number
  squad_count: number
  vouch_roles: string[]
  experience_roles: string[]
}

async function buildCandidateContext(candidateId: string): Promise<CandidateContext> {
  const supabase = await createClient()

  const [profileRes, expRes, squadRes, vouchRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, headline, skills, account_type')
      .eq('id', candidateId)
      .single(),
    supabase
      .from('flex_experience')
      .select('role, skills_used')
      .eq('user_id', candidateId)
      .limit(5),
    supabase
      .from('squads')
      .select('user_a, user_b')
      .or(`user_a.eq.${candidateId},user_b.eq.${candidateId}`)
      .eq('status', 'active'),
    supabase
      .from('vouches')
      .select('role')
      .eq('candidate_id', candidateId)
      .eq('status', 'accepted')
      .limit(3),
  ])

  const trustRes = await supabase.rpc('get_trust_score', { p_user: candidateId })

  const profile = profileRes.data
  const squad = squadRes.data ?? []
  const exps = expRes.data ?? []

  // Skills that appear in squad-confirmed experience entries
  const squadLinkedExpIds: Set<string> = new Set()
  for (const s of squad) {
    const partnerId = s.user_a === candidateId ? s.user_b : s.user_a
    squadLinkedExpIds.add(partnerId)
  }

  const verifiedSkills = Array.from(
    new Set(
      exps
        .filter(() => squad.length > 0)
        .flatMap((e: { role: string; skills_used: string[] | null }) => e.skills_used ?? [])
    )
  )

  return {
    candidate_id: candidateId,
    name: profile?.full_name ?? 'Unknown',
    headline: profile?.headline ?? null,
    skills: profile?.skills ?? [],
    verified_skills: verifiedSkills,
    trust_score: (trustRes.data as { score?: number } | null)?.score ?? 0,
    squad_count: squad.length,
    vouch_roles: (vouchRes.data ?? []).map((v: { role: string }) => v.role),
    experience_roles: exps.map((e: { role: string }) => e.role),
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'Tiik Recruiter not configured' }, { status: 503 })
  }

  const body = await req.json() as {
    candidate_id: string
    job_title: string
    required_skills: string[]
    org_id?: string
  }

  const { candidate_id, job_title, required_skills } = body

  if (!candidate_id || !job_title) {
    return Response.json({ error: 'candidate_id and job_title are required' }, { status: 400 })
  }

  let candidate: CandidateContext
  try {
    candidate = await buildCandidateContext(candidate_id)
  } catch {
    return Response.json({ error: 'Failed to load candidate context' }, { status: 500 })
  }

  const userPrompt = `Evaluate this candidate for the role: ${job_title}

Required skills for the role: ${required_skills.join(', ') || 'not specified'}

Candidate context:
- Name: ${candidate.name}
- Headline: ${candidate.headline ?? 'not set'}
- All skills listed on Flex: ${candidate.skills.join(', ') || 'none'}
- Squad-verified skills (confirmed by peers): ${candidate.verified_skills.join(', ') || 'none'}
- Trust Score: ${candidate.trust_score}/100
- Squad confirmations: ${candidate.squad_count}
- Vouches received for roles: ${candidate.vouch_roles.join(', ') || 'none'}
- Past experience titles: ${candidate.experience_roles.join(', ') || 'none'}
- Candidate ID: ${candidate.candidate_id}

Assess this candidate strictly against the role requirements. Return the JSON assessment.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: RECRUITER_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: SHORTLIST_SCHEMA,
      },
      max_tokens: 600,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return Response.json({ error: 'No response from model' }, { status: 500 })

    const result = JSON.parse(content)
    return Response.json(result)
  } catch (err) {
    return Response.json(
      { error: 'Recruiter analysis failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
