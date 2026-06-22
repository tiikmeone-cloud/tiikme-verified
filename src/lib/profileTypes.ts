// Shared domain types for the profile app.
// Resume entities, squad attestation, activity feed.

export type ViewId =
  | 'rundown'
  | 'my-flex'
  | 'squads'
  | 'vouches'
  | 'stash'
  | 'my-applications'
  | 'alerts'
  | 'settings'
  | 'requests'

/* ─── Multi-role identity ─────────────────────────────
   One person can wear many hats simultaneously:
   "CEO @ Acme" + "Angel Investor", or "Co-founder & CTO".
   This is tiikme's core differentiator vs a linear resume. */
export type RoleType = 'work' | 'founder' | 'investor' | 'creator' | 'gig' | 'student' | 'advisor'

export interface UserRole {
  id: string
  title: string          // free text: "Co-founder & CTO", "Angel Investor", "CS Student"
  org?: string           // "Acme", "IIT Bombay" (optional for creator/gig)
  type: RoleType
  current: boolean
  primary: boolean       // primary roles render large; others as chips
}

export const ROLE_META: Record<RoleType, { label: string; color: string; soft: string; emoji: string }> = {
  work:     { label: 'Professional', color: '#6E6E73', soft: 'rgba(110,110,115,.12)', emoji: '💼' },
  founder:  { label: 'Founder',      color: '#FF5C28', soft: 'rgba(255,92,40,.12)',   emoji: '🚀' },
  investor: { label: 'Investor',     color: '#6D4BD8', soft: 'rgba(109,75,216,.12)',  emoji: '📈' },
  creator:  { label: 'Creator',      color: '#2BB3A3', soft: 'rgba(43,179,163,.12)',  emoji: '✨' },
  gig:      { label: 'Gig / Freelance', color: '#F5A524', soft: 'rgba(245,165,36,.14)', emoji: '⚡' },
  student:  { label: 'Student',      color: '#2FB866', soft: 'rgba(47,184,102,.12)',  emoji: '🎓' },
  advisor:  { label: 'Advisor',      color: '#6E6E73', soft: 'rgba(110,110,115,.12)', emoji: '🧭' },
}

/* Custom, user-named resume sections (no fixed limit) */
export interface CustomSectionItem {
  id: string
  title: string
  sub: string
  detail: string
  date?: string   // free-text: "2023", "Jan 2023 – Mar 2024", etc.
  url?: string    // optional link
}

export interface CustomSection {
  id: string
  name: string
  items: CustomSectionItem[]
}

/* ─── Squad attestation ──────────────────────────────
   A "squad" = people you actually worked / studied with.
   Attached to a resume entry (experience, education, etc).
   Different from follow/following (that's just a social graph). */
export interface SquadMember {
  id: string
  name: string
  initials: string
  avatarColor: string
  role: string                       // e.g. "Frontend Engineer"
  status: 'verified' | 'pending' | 'invited'
}

export interface AttachableSquad {
  /** total colleagues found on tiikme for this org/school */
  foundOnPlatform: number
  /** the label rendered on the entry, e.g. "12 engineer team" */
  teamLabel?: string
  members: SquadMember[]
}

/* ─── Resume entries ─────────────────────────────────── */
export interface ExperienceEntry {
  id: string
  role: string
  company: string
  empType: string
  startMonth: string
  startYear: string
  currentlyWorking: boolean
  endMonth: string
  endYear: string
  location: string
  locationType: 'remote' | 'onsite' | 'hybrid'
  description: string
  aiPoints: string[]
  skillsUsed: string[]
  squad: AttachableSquad
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
  grade: string
  squad: AttachableSquad
}

export interface CertEntry {
  id: string
  name: string
  issuer: string
  year: string
  squad: AttachableSquad
}

export interface AchievementEntry {
  id: string
  title: string
  description: string
  squad: AttachableSquad
}

export const emptySquad = (): AttachableSquad => ({
  foundOnPlatform: 0,
  members: [],
})
