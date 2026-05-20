-- Fix 1: Effective column-level lockdown for profiles.email / profiles.phone
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, username, full_name, role, role_subtype, headline, bio,
  avatar_url, designation, sector, institution_id, institution_name,
  location_city, location_state, languages, status, open_to_work,
  activity_score, phone_hash, theme_preference, is_public, created_at,
  updated_at, custom_links, department, role_metadata, is_verified,
  verified_by, verification_type, verification_badge_text, about_qa,
  onboarding_complete, skills, section_order, referred_by, cover_url,
  account_type, org_id, privacy_settings, about, contact_email_visible,
  currently_working_at, open_to_work_preferences, otw_visibility,
  interests, is_moderator, verified_at, public_key, key_created_at,
  score_penalty, spam_flag_count, days_active, last_active_date,
  activity_score_v2_live, display_preference, profession_type,
  terms_accepted_at, terms_version, pending_deletion,
  deletion_requested_at, location_district, country, years_exp,
  last_onboarding_step, privacy, clean_username, follower_count,
  following_count
) ON public.profiles TO anon, authenticated;

-- Fix 2: Authorize realtime channel topic subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
