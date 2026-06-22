/**
 * POST /api/tiik/coach
 *
 * Proactive career coach — fires after every Flex save (Experience_Updated event).
 * Uses OpenAI strict tool calling to generate a structured career roadmap:
 *   · Recommended next role + salary uplift
 *   · Missing skills for that promotion
 *   · Exact Level Up course query to close the gap
 *   · Proactive message to surface in-app or as push notification
 *
 * Result is saved to tiik_nudges so the user sees it on next app open.
 * Only runs if current role tenure ≥ 2 years (configurable via MIN_TENURE_YEARS).
 */

import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MIN_TENURE_YEARS = 2

// ── Strict tool schema (matches blueprint exactly) ───────────────────────────
const CAREER_ROADMAP_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'generate_career_roadmap',
    description: 'Analyzes a user\'s current role and tenure to recommend the next career step, salary band, required skills, and a proactive coaching message.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        recommended_next_role: {
          type: 'string',
          description: 'The logical next promotion title (e.g. "Senior Product Manager")',
        },
        estimated_salary_increase: {
          type: 'string',
          description: 'Market salary range for the next role (e.g. "₹28-35 LPA" or "$120-140k")',
        },
        missing_skills_for_promotion: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific skills the user lacks for the next role, based on market JDs',
        },
        recommended_level_up_query: {
          type: 'string',
          description: 'Exact search query to find the most relevant Level Up course in our DB',
        },
        tiik_proactive_message: {
          type: 'string',
          description: 'Short, direct, encouraging in-app message. Reference specific data. Under 200 chars.',
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Confidence in the recommendation based on data completeness',
        },
      },
      required: [
        'recommended_next_role',
        'estimated_salary_increase',
        'missing_skills_for_promotion',
        'recommended_level_up_query',
        'tiik_proactive_message',
        'confidence',
      ],
      additionalProperties: false,
    },
  },
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const { userId } = await req.json() as { userId: string }
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const supabase = await createClient()

  // ── Fetch user's Flex + trust context ──────────────────────────────────────
  const [profileRes, expRes, skillsRes, trustRes] = await Promise.all([
    supabase.from('profiles').select('full_name, headline, skills, location_city').eq('id', userId).single(),
    supabase.from('flex_experience')
      .select('role, company, start_year, end_year, currently_working, description, skills_used')
      .eq('user_id', userId)
      .order('start_year', { ascending: false })
      .limit(5),
    supabase.from('profiles').select('skills').eq('id', userId).single(),
    supabase.rpc('get_trust_score', { p_user_id: userId }).maybeSingle(),
  ])

  const profile  = profileRes.data
  const exps     = expRes.data ?? []
  const trust    = trustRes.data as { score: number } | null

  // Find current role + calculate tenure
  const current = exps.find(e => e.currently_working)
  if (!current) {
    return NextResponse.json({ skipped: true, reason: 'No current role in Flex' })
  }

  const startYear  = current.start_year ?? new Date().getFullYear()
  const tenureYears = new Date().getFullYear() - startYear
  if (tenureYears < MIN_TENURE_YEARS) {
    return NextResponse.json({ skipped: true, reason: `Tenure ${tenureYears}y < ${MIN_TENURE_YEARS}y threshold` })
  }

  // ── Check we haven't sent the same nudge in the last 30 days ───────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentNudge } = await supabase
    .from('tiik_nudges')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'trust_score')
    .gte('shown_at', thirtyDaysAgo)
    .limit(1)
    .maybeSingle()

  if (recentNudge) {
    return NextResponse.json({ skipped: true, reason: 'Recent nudge already sent' })
  }

  // ── Build context prompt ───────────────────────────────────────────────────
  const pastRoles = exps.filter(e => !e.currently_working)
    .map(e => `${e.role} at ${e.company} (${e.start_year}–${e.end_year ?? 'present'})`)
    .join(', ')

  const allSkills = [
    ...(profile?.skills ?? []),
    ...(current.skills_used ?? []),
  ]

  const prompt = `User career data:
Current role: ${current.role} at ${current.company}
Tenure: ${tenureYears} years (since ${startYear})
Location: ${profile?.location_city ?? 'India'}
Skills: ${allSkills.join(', ') || 'not specified'}
Past experience: ${pastRoles || 'none'}
Trust Score: ${trust?.score ?? 'N/A'}/100

Analyze this person's career. Given ${tenureYears} years as ${current.role}:
1. What is their logical next promotion title?
2. What skills are they missing for that next role (compare to real market JDs)?
3. What is the current salary band for that next role in their market?
4. What specific course or certification closes their #1 skill gap?
5. Write a short proactive coaching message they will see in-app (under 200 chars, direct, specific, no fluff).

Be specific. Use real job market data. Don't use clichés.`

  // ── Call OpenAI with strict tool forcing ──────────────────────────────────
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Tiik, a precise career coach. You have no tolerance for vague advice. Every recommendation must be specific, data-driven, and actionable.',
        },
        { role: 'user', content: prompt },
      ],
      tools: [CAREER_ROADMAP_TOOL],
      tool_choice: { type: 'function', function: { name: 'generate_career_roadmap' } },
      temperature: 0.3,
      max_tokens: 600,
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    const toolFn = toolCall && 'function' in toolCall ? toolCall.function : null
    if (!toolFn?.arguments) {
      return NextResponse.json({ error: 'No tool call in response' }, { status: 500 })
    }

    const roadmap = JSON.parse(toolFn.arguments) as {
      recommended_next_role: string
      estimated_salary_increase: string
      missing_skills_for_promotion: string[]
      recommended_level_up_query: string
      tiik_proactive_message: string
      confidence: string
    }

    // Skip low-confidence nudges — better to say nothing than noise
    if (roadmap.confidence === 'low') {
      return NextResponse.json({ skipped: true, reason: 'Low confidence — Flex needs more data' })
    }

    // ── Save nudge to DB ───────────────────────────────────────────────────
    const { error: nudgeErr } = await supabase.from('tiik_nudges').insert({
      user_id: userId,
      type: 'trust_score',
      content: roadmap.tiik_proactive_message,
      context: {
        next_role: roadmap.recommended_next_role,
        salary: roadmap.estimated_salary_increase,
        missing_skills: roadmap.missing_skills_for_promotion,
        level_up_query: roadmap.recommended_level_up_query,
        confidence: roadmap.confidence,
        current_role: current.role,
        tenure_years: tenureYears,
      },
    })

    if (nudgeErr) console.error('[coach] nudge insert failed:', nudgeErr)

    return NextResponse.json({ ok: true, roadmap })
  } catch (err) {
    return NextResponse.json(
      { error: 'Career coach failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
