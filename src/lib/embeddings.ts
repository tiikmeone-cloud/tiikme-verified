/**
 * Embeddings job queue — fire-and-forget enqueue called from form save paths.
 *
 * The actual vector generation runs server-side (edge function / worker) and writes
 * to flex_embeddings (profile-side) or ai_job_corpus (job-side). This client only
 * enqueues by calling the `enqueue_embedding` SQL function.
 *
 * Errors are swallowed deliberately — embedding enqueue must never block the user.
 */

import { createClient } from '@/lib/supabase/client'

export type EmbeddingKind =
  | 'profile_headline'
  | 'profile_about'
  | 'profile_skills'
  | 'flex_experience'
  | 'flex_education'
  | 'flex_certificate'
  | 'flex_achievement'
  | 'org_job'
  | 'org_about'
  | 'learn_item'

export async function enqueueEmbedding(
  kind: EmbeddingKind,
  refId: string,
  sourceText: string,
  refUserId?: string,
): Promise<void> {
  if (!sourceText || !sourceText.trim()) return
  try {
    const supabase = createClient()
    await supabase.rpc('enqueue_embedding', {
      p_kind: kind,
      p_ref_id: refId,
      p_source_text: sourceText.trim(),
      p_ref_user_id: refUserId ?? null,
    })
  } catch (e) {
    console.warn('[embeddings] enqueue failed', e)
  }
}

/* Convenience helpers for the most common save paths. */

export const enqueueProfileText = (profileId: string, headline: string | null, about: string | null) => {
  if (headline) enqueueEmbedding('profile_headline', profileId, headline, profileId)
  if (about)    enqueueEmbedding('profile_about',    profileId, about,    profileId)
}

export const enqueueOrgJobText = (jobId: string, title: string, description?: string | null) => {
  const text = [title, description].filter(Boolean).join('\n\n')
  enqueueEmbedding('org_job', jobId, text)
}

// Fire-and-forget: regenerate the user's composite career embedding after any Flex change.
// Powers match_jobs_for_user() semantic job search.
export const triggerUserEmbed = (userId: string) => {
  fetch('/api/tiik/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).catch(() => {})
}
