# Job personalization feed — "what jobs a background-X user sees"

Status: spec only. Companion to `stage5-auto-selection-and-apply-flow.md`.
Date: 2026-06-10.

The org side ranks candidates for a job (stage 5). This is the mirror: rank jobs
for a candidate, and decide which job *types* are even eligible to show a given
background. Two stages — a hard eligibility filter, then soft ranking.

---

## 1. Reading "background" from the Flex

Derive a lightweight candidate profile from data we already store:

| Signal | Source |
|---|---|
| role family / function | `profiles.headline` + roles (designer, engineer, PM, …) |
| seniority band | experience years + titles → student/fresher · junior · mid · senior · lead/exec |
| is_student / fresher | headline/education keywords (reuse `detectPersona` logic from `getChat.ts`) |
| verified skills | `profiles.skills` + `flex_certs.verified` (verified > claimed) |
| location + work mode | `location_city/state/country` + stated preference |
| open_to_work | `profiles.open_to_work` |
| social signals | squad density, `get_vouch_quality_score` |
| emerging skills | Level Up completions → `flex_certs` (signals a pivot) |

Cold start (thin Flex): fall back to popular-in-function + location, and ask two
onboarding questions (desired role, work mode). Personalization deepens as the Flex fills.

---

## 2. Stage A — eligibility filter (hard gates, deterministic)

A job is eligible to appear only if all pass:

- open + not expired
- seniority band fits (see persona matrix) — students don't see senior; seniors don't see internships unless flagged
- function matches OR is adjacent within the same family (allow lateral moves)
- work-mode/location: if the user requires remote, drop onsite-only; otherwise location is a soft signal, not a gate
- tier lane matches (white-collar / grey / blue / gig) — lanes don't bleed into each other
- the user does not fail *every* must-have (if they do, hide it or label "needs X")

Cheap to compute; runs over the public `org_jobs` set, so it works for logged-out
browsing too (no personal data — filter by chosen function/location).

---

## 3. Stage B — ranking (soft, orders the eligible set)

Rank using the job's own `scoring_weights` applied from the candidate's side, plus:

- verified skill overlap (must-have + nice-to-have vs verified skills)
- cert match
- squad/vouch boost — "N from your squad works here"
- semantic similarity (vector term, activates when embeddings exist)
- freshness / recency
- mutual interest (org viewed you, or a referral exists) — strong boost
- stretch label for roles one tier above current

Quality rule (proof-not-volume, countering Easy-Apply spam): prefer fewer high-fit
roles over many low-fit; cap low-fit entries; de-dupe reposts.

---

## 4. Persona → job surfaces matrix

| Background | Employment types shown | Tier / seniority | Special sections |
|---|---|---|---|
| Student / fresher | internship, apprenticeship, entry full-time, gig | white/grey, entry only | "First job", "Free certs to qualify", hide senior |
| Junior pro (0–3y) | junior/mid full-time, contract, some gig | white/grey, junior–mid | stretch = mid roles |
| Mid pro (3–7y) | mid/senior full-time, contract | white, mid–senior | stretch = senior/lead |
| Senior / lead (8y+) | senior/lead/exec full-time, fractional, advisory | white, senior+ | hide junior/intern |
| Career switcher | entry/junior in the NEW function | cross-function allowed | "Bridge" Level Up to qualify |
| Freelancer / creator | gig, contract, freelance, brand campaigns | project-based | "Briefs for you", campaign matches |
| Blue / grey-collar / field | field roles, shift work, quick-join | grey/blue, local | "Quick apply near you" (apna-style, proximity-first) |
| Founder / investor | advisory, board, co-founder, investor matches | exec/network | separate surface, not the job feed |

---

## 5. Feed composition (the actual sections rendered)

Ordered, deduped across sections:
1. "Roles that fit you" — top-ranked eligible
2. "Level you up" — stretch tier (one rung above)
3. "Internships made for you" — students only
4. "From your squad" — social-proof jobs (squad/following at the org)
5. "Quick apply near you" — blue/grey/gig, proximity-first
6. "Based on your Level Up" — roles matching newly-earned skills

---

## 6. Where it computes

- `recommend_jobs_for_user(p_user, p_limit, p_filter)` — auth-aware RPC; eligibility
  filter + ranking. Personalized order needs identity.
- Logged-out browsing: deterministic client/RPC filter over public `org_jobs` by
  chosen function/location only (no personal data).
- Cache the ranked result in `job_match_cache` (TTL) so the feed loads instantly;
  the eligibility filter itself is cheap enough to run live.

## 7. Dependencies
- Identity — for personalized ranking and the "from your squad / mutual interest" signals.
- Embeddings — for the semantic term (degrade gracefully without).
- Live `org_jobs` wiring — the feed must read live jobs, not the `getOrg` stub.
