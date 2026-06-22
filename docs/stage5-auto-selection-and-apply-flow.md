# Stage 5 — Auto-selection engine + Apply flow (spec)

Status: spec only (no running feature). Persistence/auth decision deferred.
Decisions locked: in-platform apply is the default and built first.
Date: 2026-06-10.

This spec wires the per-job `scoring_weights` + `screening` (shipped in stage 3,
`org_jobs` jsonb columns) into a real, explainable candidate ranking, and defines
the apply flow that produces the applications the engine ranks.

---

## 1. Market basis (why this shape)

- LinkedIn Easy Apply: convenient but ~2–4% callback — high volume, low quality,
  resumes don't parse. External/company-site apply: ~8–12% — higher intent.
- Naukri: express-apply with profile + custom questions; dual ranking (Naukri's
  own rank engine + the company ATS).
- apna: India needs collar/tier job types (white/grey/blue/gig), not just white-collar.
- Wellfound / Instahyre / Cutshort / Hirect: skill-driven, recruiters initiate,
  low application spam — "proof not volume."
- Eightfold / HireVue / Paradox / SeekOut: skills-graph matching, structured
  scoring, anonymized/diverse sourcing → our engine must be explainable + bias-aware.

tiikme wedge: in-platform apply (convenient) + verified Flex + screening knockouts
(quality) — fixes the Easy-Apply quality problem; keep external redirect for orgs
that insist on their own ATS.

---

## 2. Schema additions (proposed — NOT yet applied)

```sql
-- applications
alter table public.applications
  add column ai_score        numeric(5,2),              -- 0..100, null until scored
  add column match_breakdown jsonb default '{}'::jsonb, -- per-signal explainability
  add column knockout_passed boolean,                   -- null until evaluated
  add column source          text not null default 'in_platform', -- in_platform|external|hybrid|referral
  add column scored_at       timestamptz;

alter table public.applications
  add constraint applications_source_chk
    check (source in ('in_platform','external','hybrid','referral'));

create index applications_job_score_idx
  on public.applications (job_id, ai_score desc nulls last);

-- org_jobs.apply_mode already exists ('internal' today) — widen it
-- in_platform (default) | external | hybrid ; external_url column already exists
```

`match_breakdown` shape:
```json
{
  "skill":      {"weight":40,"raw":0.86,"points":34.4},
  "cert":       {"weight":15,"raw":1.0, "points":15.0},
  "squad":      {"weight":20,"raw":0.6, "points":12.0},
  "vector":     {"weight":15,"raw":null,"points":0,"note":"no embeddings yet"},
  "experience": {"weight":10,"raw":0.8, "points":8.0},
  "knockouts":  [{"q":"5+ yrs?","required":true,"passed":true}],
  "total": 69.4
}
```

---

## 3. The scoring model

### 3a. Knockout gate (deterministic, cheap, runs first)
For every `screening` question with `must_have = true`, the candidate's
`screening_answers` must satisfy the expected answer. Any miss →
`knockout_passed = false`. If `pipeline_config.auto_rules.auto_reject_on_knockout`
→ stage becomes `auto_rejected`; otherwise the application is flagged but kept.
`ai_score` is still computed (for transparency) but the breakdown records the fail.

### 3b. Weighted score (0..100), weights from `org_jobs.scoring_weights`
Each signal normalized to 0..1, multiplied by its weight (weights already sum to 100):

| Signal | Source | Normalized 0..1 |
|---|---|---|
| skill | `org_jobs.must_have_skills` + `nice_to_have` vs candidate verified skills | overlap ratio; verified skills score higher than unverified |
| cert | required certs present in `flex_certs` (verified=true) | fraction satisfied |
| squad | `get_vouch_quality_score` + squad density at the org | scaled vouch/squad signal |
| vector | cosine(flex_embedding, job_embedding) | 0 until embeddings backfilled — see fallback |
| experience | candidate experience vs `org_jobs` experience level | closeness, capped |

`score = Σ wᵢ·signalᵢ × 100`, stored as `ai_score` with each component in
`match_breakdown` for explainability (never a bare number).

Vector fallback (no embeddings yet): treat `vector` as neutral and renormalize the
remaining weights so the score isn't artificially depressed, OR show it as
"pending" and exclude from total. Chosen: renormalize remaining weights; note it in
the breakdown.

### 3c. Auto-rules (from `pipeline_config.auto_rules`)
- `auto_reject_on_knockout` → failed knockout sets stage `auto_rejected`.
- `auto_shortlist_enabled` + `auto_shortlist_min_score` → if `knockout_passed` and
  `ai_score ≥ min` → stage `shortlisted`.

---

## 4. Where it runs

Trigger-driven for automatic scoring on apply:

```
after insert on public.applications
  → score_application(NEW.id)   -- SECURITY DEFINER, auth-aware
      sets ai_score, match_breakdown, knockout_passed, scored_at
      applies auto-rules → may set stage
```

Re-scoring (org changed weights, new vouch arrives, embeddings backfilled):
`recompute_application_scores(job_id)` callable by org-admin + a nightly cron for
stale rows. Both must derive `auth.uid()` / assert org-admin and `revoke ... from
anon` — consistent with the security hardening; do NOT repeat the `p_user` pattern.

---

## 5. Apply flow (in-platform — built first)

```
1. Candidate on a job (apply_mode = in_platform) → "Apply with my Flex"
2. ApplyModal:
     - Flex snapshot: verified skills, certs, evidence links (stage 4)
     - Screening questions rendered from org_jobs.screening
3. Local must-have hint ("you don't meet: X") for instant feedback;
   server remains source of truth
4. Submit → insert applications {
       user_id = auth.uid(), job_id, screening_answers,
       source = 'in_platform', stage = 'applied' }
5. Trigger scores it → ai_score, match_breakdown, knockout_passed
       auto-rules may move stage to auto_rejected / shortlisted
6. Candidate: sees live status in Applications view
   Org: sees ranked candidate in the Talent pipeline (stage 6), with breakdown
7. Shortlist → consent-gated contact reveal (stage 8)
```

Apply-mode behavior matrix:

| Mode | Modal? | Writes | Scored? | Tracking |
|---|---|---|---|---|
| in_platform | yes (Flex + screening) | applications(source=in_platform) | yes (auto) | full ATS pipeline |
| external | no — redirect to external_url | applications(source=external, stage=applied) | no | self-tracked, EXT badge |
| hybrid | yes (attach Flex) then redirect | applications(source=hybrid) | partial | attach tracked, final on company ATS |

Edge cases:
- Duplicate apply → unique (user_id, job_id); upsert updates answers, re-scores.
- Withdraw → stage `withdrawn`.
- Re-apply after Flex edit → re-score on demand.
- external/hybrid → no auto-score (no in-platform answers to score).

---

## 6. Personalization — "what jobs a background-X user sees"

Two-stage feed: deterministic eligibility filter, then ranking.

Eligibility filter (hard):
- role family / function match (designer → design roles)
- seniority vs experience (student → internships/entry only; senior → senior+)
- work mode + location fit
- open + not expired

Ranking (soft, reuse the job's `scoring_weights` from the candidate's side):
- verified skill overlap, certs, squad/vouch, (vector later)
- "level you up" stretch tier: surface one rung above current as a labeled section

Job-type axes a feed filters on:
- employment: full-time · part-time · contract · internship · gig/freelance · apprenticeship
- tier: white-collar · grey-collar · blue-collar/field · gig-hourly  (India-critical)
- seniority: student/fresher · junior · mid · senior · lead/exec
- work mode: remote · hybrid · onsite

---

## 7. Build order (when persistence is unblocked)

1. schema migration (section 2)
2. `score_application` fn + insert trigger (auth-hardened, anon revoked)
3. ApplyModal wired to in_platform insert + screening render
4. wire live reads: OrgShell header → live `orgs`, Jobs tab → live `org_jobs`,
   Applications view, Talent pipeline ranked by `ai_score`
5. `recompute_application_scores` + nightly cron
6. embeddings backfill → activate the vector signal

## 8. Hard dependencies
- Identity/auth — required for applications.user_id and the org-admin scoring RPCs.
- Embeddings (flex_embeddings / ai_job_corpus, currently empty) — for the vector term.
- Live org wiring — the org page is stub-driven today (`getOrg` returns Creative
  Labs for any slug); must read live `orgs`/`org_jobs` for posts to appear.
