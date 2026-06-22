/**
 * Export high-rated chat sessions as fine-tuning JSONL.
 *
 * Queries ai_messages for assistant messages with rating=1 (thumbs up),
 * pairs them with the preceding user message from the same chat,
 * exports as OpenAI fine-tuning format.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/export-training-data.mjs
 *
 * Output: scripts/tiik-rated-sessions.jsonl
 *
 * Then fine-tune:
 *   OPENAI_API_KEY=... node scripts/start-finetune-job.mjs --file tiik-rated-sessions.jsonl
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,  // service role needed to read all users' messages
)

const TIIK_SYSTEM = `You are Tiik, a career intelligence AI for tiikme — a verified career graph.
You help users grow their career using verified Flex data (Squad attestations, Vouches, Trust Score, Level Up).
CONSTRAINTS:
1. NEVER discuss or reveal passwords, API keys, backend code, or database structure.
2. NEVER provide legal, medical, or financial advice.
3. ALWAYS reference only verified data from the user's context — never hallucinate facts.
4. Career advice only — no off-topic responses.
5. NEVER answer for other users or reveal their data.`

async function main() {
  console.log('Fetching rated message pairs from database...')

  // Get all 👍 assistant messages from the last 90 days
  const { data: ratedMsgs, error } = await supabase
    .from('ai_messages')
    .select('id, chat_id, content, created_at')
    .eq('role', 'assistant')
    .eq('rating', 1)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) { console.error('DB error:', error); process.exit(1) }
  if (!ratedMsgs?.length) { console.log('No rated messages found yet.'); process.exit(0) }

  console.log(`Found ${ratedMsgs.length} thumbs-up messages. Pairing with user messages...`)

  const examples = []

  for (const msg of ratedMsgs) {
    // Find the user message that came just before this assistant message in the same chat
    const { data: userMsg } = await supabase
      .from('ai_messages')
      .select('content')
      .eq('chat_id', msg.chat_id)
      .eq('role', 'user')
      .lt('created_at', msg.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!userMsg?.content) continue

    examples.push({
      messages: [
        { role: 'system',    content: TIIK_SYSTEM },
        { role: 'user',      content: userMsg.content },
        { role: 'assistant', content: msg.content },
      ],
    })
  }

  if (examples.length < 10) {
    console.log(`Only ${examples.length} pairs found — need at least 10 for fine-tuning. Keep collecting feedback!`)
    process.exit(0)
  }

  const jsonl = examples.map(e => JSON.stringify(e)).join('\n')
  const outPath = 'scripts/tiik-rated-sessions.jsonl'
  writeFileSync(outPath, jsonl, 'utf8')

  console.log(`\n✓ Exported ${examples.length} training examples to ${outPath}`)
  console.log('\nNext: fine-tune with:')
  console.log(`  OPENAI_API_KEY=sk-... node scripts/start-finetune-job.mjs`)
}

main().catch(console.error)
