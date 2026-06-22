/**
 * Persona-specific onboarding schema.
 *
 * Each persona gets its own ordered steps + fields. Fields render through one
 * generic renderer (text · SmartSelect · multi · textarea), so adding/editing
 * a persona is pure data — no new components.
 *
 * The collected values become the user's structured Flex draft (localStorage
 * for now → Supabase `profiles` + related tables when auth lands).
 */

import type { Persona } from '@/lib/onboarding'
import type { FieldKey } from '@/lib/taxonomy'

export type FieldType = 'text' | 'select' | 'multi' | 'textarea' | 'number'

export interface FieldDef {
  id: string                 // key in the draft
  type: FieldType
  label: string
  placeholder?: string
  taxonomy?: FieldKey        // required for select / multi
  required?: boolean
  hint?: string
  half?: boolean             // render two-up on desktop
}

export interface StepDef {
  title: string
  subtitle: string
  fields: FieldDef[]
}

export type FlexDraft = Record<string, string>

/* ─────────────────────────────────────────────────────────────────
   Per-persona steps. Kept tight — 2 steps each, ≤4 fields per step.
   We never ask more than we need to build a strong first Flex.
   ───────────────────────────────────────────────────────────────── */

const STUDENT: StepDef[] = [
  {
    title: 'Tell me about your studies',
    subtitle: 'This anchors your Flex. You can refine anything later.',
    fields: [
      { id: 'degree',      type: 'select', taxonomy: 'degree',      label: 'Degree',  required: true, half: true },
      { id: 'field',       type: 'select', taxonomy: 'study_field', label: 'Field of study', required: true, half: true },
      { id: 'institution', type: 'text',   label: 'College / University', placeholder: 'e.g. VIT Vellore', required: true },
      { id: 'gradYear',    type: 'number', label: 'Graduation year', placeholder: 'e.g. 2027', half: true },
    ],
  },
  {
    title: 'What have you built + where you’re headed',
    subtitle: 'Projects are proof. A target role lets Twin match internships.',
    fields: [
      { id: 'targetRole', type: 'select', taxonomy: 'role_title', label: 'Internship / role you want', required: true },
      { id: 'skills',     type: 'multi',  taxonomy: 'role_title', label: 'Top skills', hint: 'Pick or type your own', required: true },
      { id: 'projects',   type: 'textarea', label: 'Projects you’ve shipped (one per line)', placeholder: 'Campus library app — Flutter, 200 users\nHackathon winner — IIT-B Summer' },
      { id: 'github',     type: 'text', label: 'GitHub (optional)', placeholder: 'github.com/yourhandle' },
    ],
  },
]

const INTERN: StepDef[] = [
  {
    title: 'Where you’re interning',
    subtitle: 'Real work is proof. Let’s capture it.',
    fields: [
      { id: 'company',  type: 'text',   label: 'Company', placeholder: 'e.g. Razorpay', required: true },
      { id: 'role',     type: 'select', taxonomy: 'role_title', label: 'Intern role', required: true },
      { id: 'industry', type: 'select', taxonomy: 'industry', label: 'Industry', half: true },
      { id: 'months',   type: 'number', label: 'Months so far', placeholder: 'e.g. 4', half: true },
    ],
  },
  {
    title: 'Your impact + full-time goal',
    subtitle: 'What you shipped, and the role you want next.',
    fields: [
      { id: 'shipped',     type: 'textarea', label: 'What you’ve shipped (one per line)', placeholder: 'Redesigned KYC funnel — 12% lift', required: true },
      { id: 'targetRole',  type: 'select', taxonomy: 'role_title', label: 'Full-time role you want', required: true },
      { id: 'skills',      type: 'multi',  taxonomy: 'role_title', label: 'Top skills', required: true },
    ],
  },
]

const FRESHER: StepDef[] = [
  {
    title: 'What you’re looking for',
    subtitle: 'No work history needed — proof of work beats pedigree here.',
    fields: [
      { id: 'targetRole', type: 'select', taxonomy: 'role_title', label: 'Role you want', required: true, half: true },
      { id: 'industry',   type: 'select', taxonomy: 'industry', label: 'Preferred industry', half: true },
      { id: 'workMode',   type: 'select', taxonomy: 'work_mode', label: 'Work mode', half: true },
      { id: 'degree',     type: 'select', taxonomy: 'degree', label: 'Degree', half: true },
    ],
  },
  {
    title: 'Your proof',
    subtitle: 'Projects, skills, and anything you’ve shipped.',
    fields: [
      { id: 'skills',   type: 'multi', taxonomy: 'role_title', label: 'Top skills', required: true },
      { id: 'projects', type: 'textarea', label: 'Things you’ve built (one per line)', placeholder: 'Solo iOS app — 800 users\nFinal-year ML project', required: true },
      { id: 'github',   type: 'text', label: 'GitHub / portfolio (optional)', placeholder: 'github.com/yourhandle' },
    ],
  },
]

const EMPLOYEE: StepDef[] = [
  {
    title: 'Your current role',
    subtitle: 'This is the spine of your Flex.',
    fields: [
      { id: 'role',     type: 'select', taxonomy: 'role_title', label: 'Current role', required: true, half: true },
      { id: 'company',  type: 'text',   label: 'Company', placeholder: 'e.g. Razorpay', required: true, half: true },
      { id: 'industry', type: 'select', taxonomy: 'industry', label: 'Industry', half: true },
      { id: 'years',    type: 'number', label: 'Years of experience', placeholder: 'e.g. 5', half: true },
    ],
  },
  {
    title: 'Impact + what’s next',
    subtitle: 'Numbers + scope make recruiters stop scrolling.',
    fields: [
      { id: 'impact',     type: 'textarea', label: 'Biggest wins (one per line)', placeholder: 'Led account-opening redesign — 38% faster, 4M+ users', required: true },
      { id: 'skills',     type: 'multi',  taxonomy: 'role_title', label: 'Core skills', required: true },
      { id: 'targetRole', type: 'select', taxonomy: 'role_title', label: 'Open to (role)', hint: 'Tiik only surfaces roles above your bar' },
    ],
  },
]

const CREATOR: StepDef[] = [
  {
    title: 'Your creator identity',
    subtitle: 'Where you create and what you’re known for.',
    fields: [
      { id: 'platforms', type: 'multi',  taxonomy: 'creator_platform', label: 'Platforms', required: true },
      { id: 'niche',     type: 'select', taxonomy: 'creator_niche', label: 'Niche', required: true, half: true },
      { id: 'audience',  type: 'text',   label: 'Audience size', placeholder: 'e.g. 42k subs · 120k followers', half: true },
    ],
  },
  {
    title: 'Proof + what you want',
    subtitle: 'Past collabs are verified proof for brands.',
    fields: [
      { id: 'bestWork',  type: 'textarea', label: 'Best work / past collabs (one per line)', placeholder: 'Design teardown series — 1.2M views\nSponsored: Notion, Figma', required: true },
      { id: 'collab',    type: 'multi', taxonomy: 'collab_type', label: 'Collabs you want', required: true },
      { id: 'website',   type: 'text', label: 'Portfolio / link', placeholder: 'yoursite.com' },
    ],
  },
]

const BRAND: StepDef[] = [
  {
    title: 'About your brand',
    subtitle: 'So we can match the right creators.',
    fields: [
      { id: 'company',  type: 'text',   label: 'Brand / company name', placeholder: 'e.g. Atomberg', required: true },
      { id: 'category', type: 'select', taxonomy: 'brand_category', label: 'Category', required: true, half: true },
      { id: 'size',     type: 'select', taxonomy: 'company_size', label: 'Team size', half: true },
      { id: 'website',  type: 'text',   label: 'Website', placeholder: 'brand.com' },
    ],
  },
  {
    title: 'What you’re briefing',
    subtitle: 'Twin matches verified creators to this.',
    fields: [
      { id: 'lookingFor', type: 'multi',  taxonomy: 'creator_niche', label: 'Creator niches you want', required: true },
      { id: 'platforms',  type: 'multi',  taxonomy: 'creator_platform', label: 'Platforms', required: true },
      { id: 'budget',     type: 'text',   label: 'Budget band per campaign', placeholder: 'e.g. ₹4–8L', half: true },
    ],
  },
]

const ORGANIZATION: StepDef[] = [
  {
    title: 'About your organisation',
    subtitle: 'This sets up your hiring desk.',
    fields: [
      { id: 'company',  type: 'text',   label: 'Organisation name', placeholder: 'e.g. Zeta', required: true },
      { id: 'orgType',  type: 'select', taxonomy: 'org_type', label: 'Type', required: true, half: true },
      { id: 'industry', type: 'select', taxonomy: 'industry', label: 'Industry', half: true },
      { id: 'size',     type: 'select', taxonomy: 'company_size', label: 'Team size', half: true },
      { id: 'website',  type: 'text',   label: 'Website', placeholder: 'company.com', half: true },
    ],
  },
  {
    title: 'Who you’re hiring',
    subtitle: 'Twin surfaces verified candidates for these.',
    fields: [
      { id: 'roles',    type: 'multi',  taxonomy: 'role_title', label: 'Roles you’re hiring for', required: true },
      { id: 'workMode', type: 'select', taxonomy: 'work_mode', label: 'Work mode', half: true },
      { id: 'urgency',  type: 'text',   label: 'How fast to fill', placeholder: 'e.g. 3 weeks', half: true },
    ],
  },
]

export const PERSONA_SCHEMA: Record<Persona, StepDef[]> = {
  student: STUDENT,
  intern: INTERN,
  fresher: FRESHER,
  employee: EMPLOYEE,
  creator: CREATOR,
  brand: BRAND,
  organization: ORGANIZATION,
}

/** Are all required fields in a step filled? */
export function stepComplete(step: StepDef, draft: FlexDraft): boolean {
  return step.fields.every(f => !f.required || (draft[f.id] ?? '').trim().length > 0)
}
