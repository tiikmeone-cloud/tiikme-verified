/**
 * Input + output guardrails for Tiik.
 *
 * Input guard:  blocks prompt injection, backend probing, vulgar content.
 * Output guard: blocks leaking backend internals, passwords, schema names, profanity.
 * The model will NEVER see a blocked input, and a blocked output is replaced with
 * a safe refusal before it reaches the client.
 */

// ── Input blocklist ──────────────────────────────────────────────────────────
// Patterns that should never reach the model at all.
const INPUT_BLOCKED: RegExp[] = [
  // Prompt injection
  /ignore\s+(previous|above|prior|all)\s+instructions/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(a\s+)?(different|new|other|DAN|jailbreak)/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+(me\s+)?(your\s+)?(system|hidden|secret)\s+(prompt|instruction)/i,
  /what\s+(are|were)\s+your\s+(initial\s+)?instructions/i,
  /override\s+(your\s+)?(safety|rules|constraints)/i,

  // Backend / architecture probing
  /supabase\s*(url|key|password|secret)/i,
  /openai.?(api.?key|token|secret)/i,
  /\.env\b/i,
  /database\s+(schema|table|column|rpc|function)/i,
  /flex_embeddings|ai_job_corpus|match_jobs_for_user|get_trust_score/i,
  /how\s+(does|is)\s+tiikme\s+(built|coded|implemented|stored|structured)/i,
  /what\s+(tables|columns|schema|database)\s+(does\s+tiikme|you\s+use)/i,
  /show\s+(me\s+)?the\s+(code|source|backend|api|endpoint|database)/i,

  // Other users' private data
  /other\s+users?\s*(email|password|phone|data|location|salary)/i,
  /give\s+me\s+.*user.*email/i,
  /list\s+all\s+(users|candidates|applicants|profiles)/i,

  // Explicit/vulgar content (extend as needed)
  /\b(fuck|shit|cunt|nigger|faggot|bitch|asshole|bastard|motherfucker|whore|slut|porn|nude|naked|rape|dick|pussy|cock)\b/i,
]

// ── Output blocklist ─────────────────────────────────────────────────────────
// If the model's response contains any of these, replace with the safe fallback.
const OUTPUT_BLOCKED: RegExp[] = [
  // Credentials / secrets
  /OPENAI_API_KEY/i,
  /SUPABASE_URL|SUPABASE_KEY|SUPABASE_SERVICE/i,
  /sk-[a-zA-Z0-9]{20,}/,         // OpenAI key pattern
  /eyJ[a-zA-Z0-9_-]{20,}/,       // JWT / supabase anon key pattern

  // Internal table / function names (backend should be invisible)
  /flex_embeddings|ai_job_corpus|ai_chats|ai_messages/i,
  /match_jobs_for_user|get_trust_score|search_open_candidates|get_approved_candidate_flex/i,
  /tiik_response_cache|tiik_user_model|flex_requests/i,
  /SECURITY DEFINER|RLS|ROW LEVEL SECURITY/i,
  /CREATE TABLE|ALTER TABLE|CREATE INDEX|CREATE POLICY|CREATE FUNCTION/i,
  /\bpgvector\b|\bpg_vector\b|\bHNSW\b|\bIVFFlat\b/i,

  // Terms / legal / pricing (Tiik is a coach, not a legal/terms service)
  /terms\s+(of\s+)?(service|use)|privacy\s+policy|GDPR|data\s+processing\s+agreement/i,
  /tiikme\s+(charges|costs|pricing|subscription|billing|payment)/i,

  // Vulgar output (model should never produce this, but safety net)
  /\b(fuck|shit|cunt|faggot|motherfucker|whore|slut|rape)\b/i,
]

const BLOCKED_INPUT_REPLY = "I can't respond to that type of message. Ask me anything about your career, Flex, Trust Score, job matching, or Level Up."

const BLOCKED_OUTPUT_FALLBACK = "I can't share that information. Ask me about your career profile, job matches, Trust Score, or how to improve your Flex."

/** Returns a safe refusal string if the input should be blocked, or null if safe. */
export function checkInput(text: string): string | null {
  for (const pattern of INPUT_BLOCKED) {
    if (pattern.test(text)) return BLOCKED_INPUT_REPLY
  }
  return null
}

/** Returns true if the output contains blocked content. */
export function isOutputBlocked(text: string): boolean {
  return OUTPUT_BLOCKED.some(p => p.test(text))
}

/** Safe fallback to send if the output is blocked. */
export function blockedOutputFallback(): string {
  return BLOCKED_OUTPUT_FALLBACK
}
