// POST /api/tiik/embed
// Called after a user saves their Flex (experience, skills, about).
// Builds a composite text from their verified profile and generates an OpenAI embedding.
// Stored in flex_embeddings → powers match_jobs_for_user() semantic search.
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 })
  }

  const { userId } = await req.json() as { userId: string }
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const supabase = await createClient()

  // Fetch all the verified content that forms the career embedding
  const [profileRes, expRes, certsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('headline, about, skills')
      .eq('id', userId)
      .single(),
    supabase
      .from('flex_experience')
      .select('role, company, description, start_year, end_year, currently_working')
      .eq('user_id', userId)
      .order('start_year', { ascending: false })
      .limit(6),
    supabase
      .from('flex_certs')
      .select('name, issuer')
      .eq('user_id', userId)
      .limit(5),
  ])

  const p = profileRes.data
  const exp = expRes.data ?? []
  const certs = certsRes.data ?? []

  // Build composite text — this IS the user's career vector
  const parts = [
    p?.headline,
    p?.about,
    (p?.skills ?? []).join(' '),
    ...exp.map(e =>
      [
        e.currently_working ? `Currently: ${e.role} at ${e.company}` : `${e.role} at ${e.company}`,
        e.description,
      ].filter(Boolean).join('. ')
    ),
    ...certs.map(c => `Certified: ${c.name} by ${c.issuer}`),
  ].filter(Boolean)

  if (parts.length === 0) {
    return NextResponse.json({ ok: false, reason: 'No content to embed — user needs to fill in their Flex' })
  }

  const compositeText = parts.join('\n')

  // Generate embedding — $0.02 per 1M tokens, this call is ~200 tokens = $0.000004
  const embedRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: compositeText,
  })

  // Upsert into flex_embeddings (one composite row per user)
  const { error } = await supabase.from('flex_embeddings').upsert(
    {
      profile_id: userId,
      kind: 'composite',
      source_text: compositeText,
      embedding: embedRes.data[0].embedding,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id,kind' }
  )

  if (error) {
    console.error('flex_embeddings upsert failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, chars: compositeText.length })
}
