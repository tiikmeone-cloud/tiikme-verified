/**
 * POST /api/tiik/rate
 *
 * Saves a 👍 (+1) or 👎 (-1) rating on an ai_messages row.
 * Matched by sessionId (chat_id) + message content + role='assistant'.
 * Rated pairs are exported nightly as JSONL for GPT-4o-mini fine-tuning.
 *
 * Body: { sessionId: string, content: string, rating: 1 | -1 }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { sessionId, content, rating } = await req.json() as {
    sessionId: string
    content: string
    rating: 1 | -1
  }

  if (!sessionId || !content || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: 'sessionId, content, and rating (1 or -1) required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('ai_messages')
    .update({ rating })
    .eq('chat_id', sessionId)
    .eq('content', content)
    .eq('role', 'assistant')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
