/**
 * POST /api/tiik/org-search
 *
 * Org outbound candidate discovery — two-stage pipeline:
 *   Stage 1: Semantic vector search  → pgvector cosine on flex_embeddings
 *             Embeds the org's natural-language query, finds top-50 matches
 *   Stage 2: LLM reranker            → strict JSON output per candidate
 *             Reads Squad verifications, trust scores, missing skills
 *             Outputs final Match Score 0-100 + Tiik summary sentence
 *
 * Privacy: Returns anonymized cards (candidate_id, not name/email).
 * Full identity only revealed after candidate approves a flex_request.
 *
 * Body: { orgId: string, query: string, limit?: number }
 */

import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Strict reranker schema ────────────────────────────────────────────────────
const RERANK_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'rerank_candidates',
    description: 'Score and summarize a shortlist of candidates against a job requirement.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        ranked: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              candidate_id:      { type: 'string' },
              match_score:       { type: 'number', description: '0-100' },
              trust_rating:      { type: 'string', enum: ['High', 'Medium', 'Low'] },
              verified_skills:   { type: 'array', items: { type: 'string' } },
              missing_skills:    { type: 'array', items: { type: 'string' } },
              squad_count:       { type: 'number' },
              shortlist:         { type: 'string', enum: ['Shortlist', 'Maybe', 'Skip'] },
              tiik_summary:      { type: 'string', description: '1-2 sentence match summary. No filler.' },
            },
            required: ['candidate_id','match_score','trust_rating','verified_skills','missing_skills','squad_count','shortlist','tiik_summary'],
            additionalProperties: false,
          },
        },
      },
      required: ['ranked'],
      additionalProperties: false,
    },
  },
}

interface CandidateRow {
  id: string
  username: string
  headline: string | null
  location_city: string | null
  skills: string[] | null
  trust_score?: number
  squad_count?: number
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const { orgId, query, limit = 5 } = await req.json() as {
    orgId: string
    query: string
    limit?: number
  }

  if (!orgId || !query?.trim()) {
    return NextResponse.json({ error: 'orgId and query required' }, { status: 400 })
  }

  const supabase = await createClient()

  // ── Stage 1: Embed the org's search query ────────────────────────────────
  const embedRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query.trim(),
  })
  const queryVec = embedRes.data[0].embedding

  // ── Stage 1b: Vector search for open-to-work candidates ─────────────────
  // Uses pgvector cosine similarity on flex_embeddings → profiles join
  const { data: vectorMatches, error: vecErr } = await supabase.rpc(
    'search_candidates_by_vector',
    { p_embedding: queryVec, p_limit: 50 }
  )

  if (vecErr) {
    // Fallback: plain search_open_candidates if vector RPC not ready
    const { data: plainMatches } = await supabase.rpc('search_open_candidates', {
      p_limit: 50, p_offset: 0,
    })
    if (!plainMatches?.length) return NextResponse.json({ candidates: [] })
    return rerankWithLLM(plainMatches as CandidateRow[], query, limit, supabase, openai)
  }

  if (!vectorMatches?.length) return NextResponse.json({ candidates: [] })
  return rerankWithLLM(vectorMatches as CandidateRow[], query, limit, supabase, openai)
}

async function rerankWithLLM(
  candidates: CandidateRow[],
  query: string,
  limit: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  openai: OpenAI,
) {
  // Fetch trust scores + squad counts for the top 50
  const ids = candidates.slice(0, 50).map(c => c.id)
  const { data: trustRows } = await supabase.rpc('get_trust_scores_bulk', { p_user_ids: ids })
    .catch(() => ({ data: null }))
  const trustMap = new Map<string, { score: number; squad: number }>(
    (trustRows ?? []).map((r: { user_id: string; score: number; squad_count: number }) =>
      [r.user_id, { score: r.score, squad: r.squad_count }]
    )
  )

  // Build compact candidate context for the LLM (no names, no emails — privacy)
  const candidateContext = candidates.slice(0, 50).map(c => {
    const trust = trustMap.get(c.id)
    return {
      id: c.id,
      headline: c.headline ?? 'No headline',
      location: c.location_city ?? 'Unknown',
      skills: (c.skills ?? []).join(', ') || 'None listed',
      trust_score: trust?.score ?? 0,
      squad_confirmations: trust?.squad ?? 0,
    }
  })

  // ── Stage 2: LLM reranker ─────────────────────────────────────────────────
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Tiik Recruiter. You rank candidates strictly by evidence — Squad-verified skills matter 2× more than self-reported. Never hallucinate. If a skill is not in the candidate data, mark it as missing.',
        },
        {
          role: 'user',
          content: `Org requirement: "${query}"

Candidates (anonymized):
${JSON.stringify(candidateContext, null, 2)}

Rank the top ${limit} candidates. For each:
- match_score 0-100 (Squad-verified skills = 2× weight)
- trust_rating: High(≥70), Medium(50-69), Low(<50)
- verified_skills: skills present in their data that match the requirement
- missing_skills: required skills NOT in their data
- squad_count: from the data provided
- shortlist: Shortlist(≥75), Maybe(55-74), Skip(<55)
- tiik_summary: 1-2 sentences why they fit or don't. Be direct and specific.`,
        },
      ],
      tools: [RERANK_TOOL],
      tool_choice: { type: 'function', function: { name: 'rerank_candidates' } },
      temperature: 0.2,
      max_tokens: 1200,
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    const toolFn = toolCall && 'function' in toolCall ? toolCall.function : null
    if (!toolFn?.arguments) {
      return NextResponse.json({ error: 'Reranker returned no result' }, { status: 500 })
    }

    const { ranked } = JSON.parse(toolFn.arguments) as {
      ranked: Array<{
        candidate_id: string
        match_score: number
        trust_rating: string
        verified_skills: string[]
        missing_skills: string[]
        squad_count: number
        shortlist: string
        tiik_summary: string
      }>
    }

    // Only return Shortlist + Maybe (skip Skip-rated)
    const filtered = ranked.filter(r => r.shortlist !== 'Skip').slice(0, limit)
    return NextResponse.json({ candidates: filtered, total_searched: candidates.length })
  } catch (err) {
    return NextResponse.json(
      { error: 'Reranker failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
