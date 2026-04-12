

# Full Institution System Overhaul -- Implementation Plan

This is a large initiative spanning 4 major areas. I will implement them in phases so each phase is testable before moving to the next.

---

## Phase 1: Fix Institution Onboarding & Profile (Priority -- do first)

### Problem
- The onboarding flow already asks for org name in Step 3 (StepOrgType) -- this works correctly. But the org name field in StepEmail passes `full_name: ""` in signup metadata, so the profile's `full_name` stays blank. The profile trigger (`handle_new_user`) sets `full_name` from metadata, which is empty.
- Institution profiles still show Experience/Education/Skills tabs when viewed at `/app/profile`.

### Changes
1. **StepEmail.tsx** -- After signup, store the email but do NOT set `full_name` from email. Already correct (passes `full_name: ""`). No change needed here.
2. **StepPageSetup.tsx** -- After org creation, update `profiles.full_name` to the org name so sidebar displays correctly. Currently sets `institution_name` but not `full_name`.
3. **Profile.tsx** -- The redirect logic already sends institution accounts to `/org/{slug}`. Verify this works end-to-end.
4. **OrganizationPage.tsx** -- Ensure the institution profile tabs are: Posts, About, Team, Opportunities, Verified Members (remove "Home" duplicate with "Posts"). Already mostly correct.

---

## Phase 2: Workspace Access Delegation & Approval Chain

### New Features
1. **Role-based access in Workspace** -- Admins (CTO, CMO, CXO) can grant workspace access to team members
2. **Team Leader delegation** -- Company admin grants "Team Lead" role; Team Lead can then approve within their scope, but only after the institution page admin approves the delegation
3. **Invite link from Workspace** -- "Copy invite link" button that generates a shareable link for non-platform users
4. **Approval notifications** -- When a Team Lead is granted access, notification goes to institution page admin for approval. Only after approval can the Team Lead act.
5. **Ex-employee/student verification** -- Separate verification category for people who previously worked/studied there. Company can approve directly or delegate to a specific verifier. Notifications route to the assigned verifier.

### Database Changes
- Add `access_scope` column to `org_access_rules` (e.g., 'workspace', 'opportunities', 'verification')
- Add `is_current` boolean to `org_members` to distinguish current vs ex-members
- Add `delegated_by` and `delegation_approved` columns to `org_access_rules` for approval chains

### Files to Create/Modify
- `src/pages/Workspace.tsx` -- Add admin access panel, invite link UI, approval queue
- `src/components/org/tabs/TeamTab.tsx` -- Add role delegation UI
- New component: `src/components/workspace/AccessManager.tsx`
- New component: `src/components/workspace/InviteLinkModal.tsx`

---

## Phase 3: LinkedIn-style Opportunity Posting & Application Dashboard

### Opportunity Form Enhancements
The current `PostOpportunityModal.tsx` already has: title, department, location, employment type, experience, salary, skills, screening questions, visibility. 

**Add:**
1. **Company/About section** -- Auto-populated from org data (name, type, size, location, website)
2. **Role details** -- Responsibilities list, qualifications (education, certifications)
3. **Screening questions** -- Already exists, enhance with required/optional flag
4. **Profile attachment requirement** -- Toggle for "Require profile sharing"
5. **Activity score minimum** -- Optional minimum activity score filter
6. **Qualification criteria** -- Education level, specific degree, years of experience as hard filters

### Application Dashboard Enhancements
Current `ApplicationsDashboard.tsx` has: status filters, profile/resume/answers tabs, notes, status management.

**Add:**
1. **Named applications** -- Each opportunity shows as a named application (e.g., "Frontend Developer - April 2026")
2. **Qualified vs Total count** -- Show "X applied, Y qualified" based on screening criteria
3. **Resume attachment view** -- Already exists, improve PDF embed
4. **Direct HR contact** -- "Contact via Pings" button that opens a conversation
5. **Post attribution** -- Feed shows "[Company Name] posted by [HR Name]" format

### Database Changes
- Add `qualification_criteria` (JSONB) to `opportunities` table -- stores min education, min score, required skills
- Add `is_qualified` boolean to `opportunity_applications` -- computed on submission

### Files to Modify
- `src/components/opportunities/PostOpportunityModal.tsx` -- Add company info section, qualification criteria, enhanced questions
- `src/pages/ApplicationsDashboard.tsx` -- Add qualified filter, application naming, HR contact button
- `src/components/org/tabs/OpportunitiesTab.tsx` -- Show application counts per opportunity

---

## Phase 4: Notification Routing & Access Control

### Changes
1. **Verification request routing** -- When someone requests verification, check `org_verif_routes` for department-specific routing. Route notification to assigned verifier.
2. **Delegation approval flow** -- When admin grants Team Lead access, create a pending `org_access_rules` record. Send notification to org page admin. On approval, activate the rule.
3. **Ex-employee verification** -- New alert type `ex_member_verification`. Route to assigned verifier or default admin.
4. **Opportunity access delegation** -- HR can be granted `post_jobs` access. Posts show as "Company Name -- posted by HR Name".

### Files to Modify
- `src/pages/Alerts.tsx` -- Handle new alert types (delegation_approval, ex_member_verification)
- `src/components/org/OrgAdmin.tsx` -- Add access management UI

---

## Implementation Order

I will implement these in this exact sequence:
1. Phase 1 first (fix onboarding profile creation) -- ~1 session
2. Phase 3 next (opportunity form is user-facing and high impact) -- ~2 sessions  
3. Phase 2 (workspace access delegation) -- ~2 sessions
4. Phase 4 (notification routing) -- ~1 session

Each phase will be independently testable.

### Technical Notes
- All Supabase queries will have `{ data, error }` destructuring with `console.warn` on error
- All loading states use skeleton placeholders
- Organization pages remain locked to Light Mode (#FFF8F2)
- No emojis in UI (Lucide icons only, per brand guidelines)
- Minimum 44px touch targets on all interactive elements

