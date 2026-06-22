// Onboarding state — frontend-only, stored in localStorage.
// When real auth lands, this gets replaced by a Supabase write on completion.
//
// Personas are plain-word "who you are + what you want here".
// No jargon. A person reading the tile should know exactly what it means.

export type Persona =
  | 'student'       // Studying. Want internships.
  | 'intern'        // Interning right now. Want a full-time next.
  | 'fresher'       // Out of college, no job yet. Want my first job.
  | 'employee'      // Currently working. Open to better roles.
  | 'creator'       // Audience-builder. Want collabs & brand deals.
  | 'brand'         // Run campaigns. Want verified creators.
  | 'organization'  // Hiring company. Want pre-vetted candidates.

export interface OnboardingState {
  persona: Persona | null
  /**
   * Extra hats this account also wears.
   * Only `brand` and `organization` are combinable — a company can hire AND
   * brief creators. Everyone else is single-persona for now.
   */
  alsoBrand?: boolean
  alsoOrganization?: boolean
  name: string
  location: string
  proof: {
    mode: 'resume' | 'chips' | 'manual' | null
    resumeName?: string
    chips?: string[]
    manual?: ManualFlex
  }
  /** Structured fields collected via the persona-specific form (SmartSelect). */
  flexDraft?: Record<string, string>
  completedAt?: string
}

/** Lightweight Flex object the user can write themselves (no LLM cost). */
export interface ManualFlex {
  headline?: string
  education?: string
  currentRole?: string
  experiences?: string                  // one per line
  skills?: string                        // comma-separated
  projects?: string                      // one per line
  links?: { github?: string; dribbble?: string; youtube?: string; website?: string }
  companyName?: string                   // brand/org
  hiringOrBriefing?: string              // brand/org
}

const KEY = 'tk_onboarding_v1'

export const PERSONA_LABEL: Record<Persona, string> = {
  student:      'Student',
  intern:       'Intern',
  fresher:      'Fresher',
  employee:     'Employee',
  creator:      'Creator',
  brand:        'Brand',
  organization: 'Organization',
}

/** Short "who you are + what you want" line shown under each tile. */
export const PERSONA_DESCRIPTION: Record<Persona, string> = {
  student:      'Studying. Looking for internships.',
  intern:       'Interning. Building toward my first full-time.',
  fresher:      'Out of college. Looking for my first job.',
  employee:     'Working a job. Open to better roles.',
  creator:      'I make content. Want collabs & brand deals.',
  brand:        'I run campaigns. Want verified creators.',
  organization: 'We’re hiring. Want pre-vetted candidates.',
}

export const PERSONA_GLYPH: Record<Persona, string> = {
  student:      '📚',
  intern:       '◔',
  fresher:      '🌱',
  employee:     '✦',
  creator:      '◉',
  brand:        '◆',
  organization: '⌘',
}

/** Persona-tuned "prove it" chips — asked only if the user skips the resume drop. */
export const PROOF_CHIPS: Record<Persona, { label: string; placeholder: string }[]> = {
  student: [
    { label: 'What are you studying?',           placeholder: 'e.g. B.Tech CS at VIT, 3rd year' },
    { label: 'A project you’re proud of',        placeholder: 'e.g. Built a campus library app with Flutter' },
    { label: 'One skill you’re sharpest at',     placeholder: 'e.g. Figma, React, Python' },
  ],
  intern: [
    { label: 'Where are you interning?',         placeholder: 'e.g. Product design intern at Razorpay' },
    { label: 'A thing you’ve shipped there',     placeholder: 'e.g. Redesigned KYC funnel — 12% lift' },
    { label: 'Role you want full-time',          placeholder: 'e.g. Product Designer' },
  ],
  fresher: [
    { label: 'A role you want',                  placeholder: 'e.g. Frontend developer' },
    { label: 'Strongest skill',                  placeholder: 'e.g. React + TypeScript' },
    { label: 'A thing you’ve shipped',           placeholder: 'e.g. Solo iOS app with 800 users' },
  ],
  employee: [
    { label: 'Current role + company',           placeholder: 'e.g. Senior Designer at Razorpay' },
    { label: 'Years of experience',              placeholder: 'e.g. 5' },
    { label: 'What you’re sharpest at',          placeholder: 'e.g. Banking flows, design systems' },
  ],
  creator: [
    { label: 'Where your audience lives',        placeholder: 'e.g. YouTube · 42k subs' },
    { label: 'What you make',                    placeholder: 'e.g. Design teardowns, weekly' },
    { label: 'A collab or deal you want',        placeholder: 'e.g. Co-build with a dev creator' },
  ],
  brand: [
    { label: 'Company name',                     placeholder: 'e.g. Atomberg' },
    { label: 'What you’re briefing',             placeholder: 'e.g. 5 fitness creators for Q3 launch' },
    { label: 'Budget band',                      placeholder: 'e.g. ₹4–8L per campaign' },
  ],
  organization: [
    { label: 'Company name',                     placeholder: 'e.g. Zeta' },
    { label: 'A role you’re hiring for',         placeholder: 'e.g. Senior Product Designer' },
    { label: 'How fast you need it filled',      placeholder: 'e.g. 3 weeks' },
  ],
}

export function emptyOnboarding(): OnboardingState {
  return { persona: null, name: '', location: '', proof: { mode: null } }
}

export function loadOnboarding(): OnboardingState {
  if (typeof window === 'undefined') return emptyOnboarding()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyOnboarding()
    return { ...emptyOnboarding(), ...JSON.parse(raw) }
  } catch { return emptyOnboarding() }
}

export function saveOnboarding(s: OnboardingState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearOnboarding() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}

export function isOnboarded(): boolean {
  if (typeof window === 'undefined') return false
  const s = loadOnboarding()
  return !!s.completedAt
}

/** Bucket the 7 onboarding personas down to the 3 chat-tone modes Twin uses. */
export function toChatPersona(p: Persona | null): 'professional' | 'student' | 'org' {
  if (!p) return 'professional'
  if (p === 'student' || p === 'intern' || p === 'fresher') return 'student'
  if (p === 'brand'   || p === 'organization')              return 'org'
  return 'professional'
}

/** "I am a brand / org / both" derived for combo personas. */
export function buyerKind(s: OnboardingState): 'brand' | 'organization' | 'both' | null {
  const isBrand = s.persona === 'brand' || !!s.alsoBrand
  const isOrg   = s.persona === 'organization' || !!s.alsoOrganization
  if (isBrand && isOrg) return 'both'
  if (isBrand) return 'brand'
  if (isOrg)   return 'organization'
  return null
}
