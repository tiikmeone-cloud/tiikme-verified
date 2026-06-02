import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Explicit column list — guardrail: email is intentionally excluded.
 *  SELECT on email is revoked at RLS level; including it would 403 the whole row. */
export const PROFILE_COLUMNS = [
  "id", "username", "clean_username", "full_name", "role", "role_subtype",
  "headline", "bio", "about", "avatar_url", "designation", "sector",
  "institution_name", "location_city", "location_state", "location_district", "country",
  "activity_score", "is_public", "custom_links", "open_to_work", "otw_visibility",
  "open_to_work_preferences", "languages", "department", "skills", "interests",
  "is_verified", "verified_at", "role_metadata", "about_qa", "verification_badge_text",
  "verification_type", "created_at", "account_type", "org_id",
  "display_preference", "profession_type", "currently_working_at", "years_exp",
  "privacy", "privacy_settings", "resume_url",
  "follower_count", "following_count",
].join(", ");

export interface UseProfileResult {
  profile: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Fetch a profile by user ID with the explicit safe column list. */
export function useProfile(userId: string | undefined): UseProfileResult {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (err) setError(err.message);
    else setProfile(data);
    setLoading(false);
  }, [userId]);

  return { profile, loading, error, refetch };
}

// TODO: RAG-match — wire when pgvector pipeline is ready
export interface JobMatchResult {
  score: number;
  factors: { label: string; weight: number }[];
  rank: number;
  totalApplicants: number;
  verdict: "strong" | "fair" | "weak";
  improvements: string[];
}

/** Stub — returns deterministic mock data until RAG pipeline is wired. */
export function getJobMatch(_profileId: string, _jobId: string): JobMatchResult {
  // TODO: RAG-match — embed profile (experience + skills + certs + squad signal),
  //   embed job description, cosine-score per factor, rank vs other applicants,
  //   generate improvements via model. Use existing embedding column on profiles.
  return {
    score: 74,
    factors: [
      { label: "Skills", weight: 0.85 },
      { label: "Experience", weight: 0.78 },
      { label: "Location", weight: 0.90 },
      { label: "Squad-verified", weight: 0.65 },
      { label: "Certificates", weight: 0.60 },
      { label: "Availability", weight: 1.0 },
    ],
    rank: 12,
    totalApplicants: 143,
    verdict: "fair",
    improvements: [
      "Add relevant certifications",
      "Get squad attestation for current role",
    ],
  };
}
