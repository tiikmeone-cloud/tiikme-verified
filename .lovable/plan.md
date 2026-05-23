## Goal
Resolve the two remaining security findings:

1. **Error**: `profiles.email` / `profiles.phone` still readable by any authenticated user that satisfies the row-level `profiles_select_public` policy.
2. **Warn**: `realtime.messages` has no RLS policies, so any authenticated user can subscribe to any channel topic.

---

## Why the previous fix didn't work

The earlier migration ran `REVOKE SELECT (email, phone) ON profiles FROM authenticated, anon`. In Postgres, column-level revokes are ignored when the role still holds **table-level** `SELECT` (or `ALL`). `pg_class.relacl` for `profiles` shows `authenticated=arwdDxtm` and `anon=arwdDxtm` (full privileges granted by Supabase by default), so `SELECT *` still returns every column for any row RLS allows.

## Fix 1 — Column-level lockdown that actually works

Strategy: revoke broad `SELECT` on `profiles`, then re-grant `SELECT` on every column **except** `email` and `phone`. RLS continues to filter rows; the column grant filters columns. Owner access keeps working via the existing `get_my_contact()` RPC (`SECURITY DEFINER`).

Migration sketch:
```sql
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, full_name, role, role_subtype, headline, bio,
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
  following_count)
ON public.profiles TO anon, authenticated;
```

Insert/Update/Delete privileges (already gated by RLS) keep their table-level grants on the columns owners need.

### App-code impact
- `AuthContext.fetchProfile` does `select("*")` for the **logged-in owner's own row** — RLS allows it and the owner's row still has email/phone selectable because the column grant covers everyone, but column SELECT for `email`/`phone` is removed for **all** roles. To keep the owner's app fetch from breaking, switch the AuthContext fetch to an explicit column list **excluding** `email`/`phone`, and let the owner read those via `get_my_contact()` when needed (already the pattern used elsewhere).
- Quick scan for other `.from("profiles").select("*")` call sites; tighten any that fail. Likely all rely on the typed `Database` shape, not actual `email`/`phone` access, so this should be a small change.

## Fix 2 — Realtime channel authorization

Currently the app uses `supabase.channel("…")` for: post reactions/likes/comments, conversations, workspaces, verification inbox, alerts, AppShell presence. Without `realtime.messages` RLS, any authenticated user can join any topic.

Add minimal authorization on `realtime.messages` that:
- Allows authenticated users to receive broadcasts/presence on topics that **start with their own `auth.uid()`** (e.g. `user:<uid>:alerts`).
- Allows authenticated users on `post:<id>` / `workspace:<id>` topics only if they can already read that resource (via existing `has_workspace_access`, public post visibility, etc.).
- Falls back to deny.

Concrete policy:
```sql
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realtime_authenticated_read"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    -- own-user channels
    (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
    OR (realtime.topic() LIKE 'profile:' || auth.uid()::text || ':%')
    -- workspace channels gated by membership
    OR (realtime.topic() LIKE 'workspace:%'
        AND public.has_workspace_access(
          (split_part(realtime.topic(), ':', 2))::uuid, auth.uid()))
    -- public feed channels (posts/comments/likes) — already public reads
    OR (realtime.topic() LIKE 'post:%')
    OR (realtime.topic() LIKE 'feed:%')
  );
```
We'll need to verify the actual topic names used by each hook and tighten the list before shipping. If a topic isn't matched, those subscribers will silently stop receiving events — so we audit `src/hooks/useConversations.ts`, `useFeedPosts.ts`, `useComments.ts`, `useLikes.ts`, `usePostReactions.ts`, `usePostInteractions.ts`, `usePostComments.ts`, `pages/Workspace.tsx`, `pages/Alerts.tsx`, `pages/VerificationInbox.tsx`, `components/layout/AppShell.tsx` first and normalize topic naming where needed.

For **conversations / pings** the topic must be gated by `is_conversation_participant(conv_id, auth.uid())` so DMs stay private.

## Steps

1. Audit realtime topic strings across the listed files; standardize to `user:<uid>:…`, `conversation:<id>`, `workspace:<id>`, `post:<id>`, `feed:public`.
2. Migration A: `profiles` column lockdown (REVOKE + GRANT explicit columns) for `anon` and `authenticated`.
3. Migration B: enable RLS on `realtime.messages` and add the topic-gated policy using existing helper functions (`has_workspace_access`, `is_conversation_participant`).
4. Update `src/contexts/AuthContext.tsx` to fetch profile with explicit column list excluding `email`/`phone`; expose owner contact via existing `get_my_contact()` consumers (no change to other call sites unless they break).
5. Smoke-test: sign in, open a profile other than your own (no email/phone leaks via network tab), subscribe to alerts/feed/DM channels (still work), try to subscribe to another user's `user:<otherUid>:alerts` (denied).
6. Mark both findings as fixed; update `@security-memory` to record the column-grant pattern and realtime topic-authz rules so future scans don't regress.

## Technical notes
- Postgres column-level REVOKE has no effect while a table-level SELECT/ALL grant is in place — must revoke table-level first, then re-grant per column. This is the actual root cause of the regression.
- `realtime.messages` policies use `realtime.topic()` (a SECURITY DEFINER helper Supabase provides) to read the current subscription topic; safe to reference from RLS.
- We are not modifying `auth`, `storage`, or `vault` schemas. Adding RLS to `realtime.messages` is the Supabase-documented authorization mechanism and is allowed.
