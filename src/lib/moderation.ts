/**
 * Content moderation pipeline.
 *
 * Phase 1 (current): client-side regex hard-block list. Catches obvious slurs
 * and abusive terms in English + common Hindi transliterations.
 *
 * Phase 2 (later): wire this same `moderateText` to a Supabase edge function
 * that calls OpenAI Moderation. The interface stays the same so callers
 * never change.
 *
 * Severity model:
 *   < 0.3   → allow silently
 *   0.3-0.7 → soft-warn (show modal, user must confirm)
 *   ≥ 0.7   → hard block (cannot post; auto-flagged)
 */
import { supabase } from "@/integrations/supabase/client";

// Minimal hard-block list. Keep small; AI moderation will catch the long tail.
const HARD_BLOCK = [
  /\b(fuck(ing|ed|er|s)?|shit|cunt|asshole)\b/gi,
  /\b(bhenchod|behenchod|bhosdike|madarchod|mc|bc|chutiya|chutiye|gandu|randi|launde|harami)\b/gi,
  /\b(nigg(er|a)s?|fag(got|s)?|retard(ed)?)\b/gi,
];

const SOFT_WARN = [
  /\b(damn|hell|crap|wtf|bullshit)\b/gi,
  /\b(idiot|stupid|moron|loser)\b/gi,
];

export interface ModerationResult {
  allowed: boolean;
  severity: number;
  category?: string;
  matchedTerm?: string;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  if (!text || !text.trim()) return { allowed: true, severity: 0 };

  // Layer 1: hard block
  for (const re of HARD_BLOCK) {
    const m = text.match(re);
    if (m) {
      return { allowed: false, severity: 1.0, category: "hate_or_abuse", matchedTerm: m[0] };
    }
  }

  // Layer 2: soft warn
  for (const re of SOFT_WARN) {
    const m = text.match(re);
    if (m) {
      return { allowed: true, severity: 0.5, category: "mild_profanity", matchedTerm: m[0] };
    }
  }

  return { allowed: true, severity: 0 };
}

/**
 * Logs a hard-blocked piece of content into moderation_flags so internal mods
 * can see what's being attempted. Caller must pass authorId (auth.uid()).
 */
export async function logModerationFlag(opts: {
  contentType: "post" | "comment" | "bio" | "circle_name" | "circle_post" | "review";
  contentId?: string;
  authorId: string;
  textPreview: string;
  result: ModerationResult;
}) {
  await supabase.from("moderation_flags").insert({
    content_type: opts.contentType,
    content_id: opts.contentId ?? null,
    author_id: opts.authorId,
    text_preview: opts.textPreview.slice(0, 200),
    severity: opts.result.severity,
    category: opts.result.category ?? null,
    status: "flagged",
    source: "auto",
  } as any);
}
