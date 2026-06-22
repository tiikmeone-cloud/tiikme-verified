/**
 * flexFromDraft — converts the persona onboarding draft (flat key/value)
 * into the structured Flex entities the profile renders.
 *
 * This closes the loop: what you typed in /create now appears on /profile/me.
 * When auth lands, this same mapper writes to Supabase tables instead of
 * hydrating local state.
 */

import { loadOnboarding } from '@/lib/onboarding'
import { emptySquad, type ExperienceEntry, type EducationEntry } from '@/lib/profileTypes'

export interface HydratedFlex {
  headline: string | null
  about: string | null
  skills: string[]
  experiences: ExperienceEntry[]
  educations: EducationEntry[]
}

const lines = (s?: string) => (s ?? '').split('\n').map(x => x.trim()).filter(Boolean)
const csv   = (s?: string) => (s ?? '').split(/[,·]+/).map(x => x.trim()).filter(Boolean)

/** Read the onboarding draft from localStorage and shape it into Flex entities. */
export function hydrateFlexFromOnboarding(): HydratedFlex | null {
  const s = loadOnboarding()
  if (!s.completedAt || !s.persona) return null
  const d = s.flexDraft ?? {}
  const persona = s.persona

  const skills = csv(d.skills || d.lookingFor || d.platforms).slice(0, 12)

  // ── headline ──
  const headline =
    persona === 'student'      ? [d.degree, d.field].filter(Boolean).join(' · ') || 'Student'
    : persona === 'intern'     ? [d.role, d.company].filter(Boolean).join(' @ ') || 'Intern'
    : persona === 'fresher'    ? (d.targetRole ? `${d.targetRole} · seeking first role` : 'Fresher')
    : persona === 'employee'   ? [d.role, d.company].filter(Boolean).join(' @ ') || 'Professional'
    : persona === 'creator'    ? [d.niche, d.platforms].filter(Boolean).join(' · ') || 'Creator'
    : persona === 'brand'      ? [d.company, d.category].filter(Boolean).join(' · ') || 'Brand'
    :                            [d.company, d.orgType].filter(Boolean).join(' · ') || 'Organisation'

  // ── about (Twin-style summary from the draft) ──
  const about = buildAbout(persona, d, s.name)

  // ── experiences (employee / intern get a real entry) ──
  const experiences: ExperienceEntry[] = []
  if ((persona === 'employee' || persona === 'intern') && (d.company || d.role)) {
    experiences.push({
      id: 'exp-' + Date.now(),
      role: d.role || (persona === 'intern' ? 'Intern' : 'Professional'),
      company: d.company || '',
      empType: persona === 'intern' ? 'Internship' : 'Full-time',
      startMonth: 'Jan', startYear: String(2026 - (parseInt(d.years || '1') || 1)),
      currentlyWorking: true, endMonth: '', endYear: '',
      location: s.location || '', locationType: 'hybrid',
      description: (d.impact || d.shipped || ''),
      aiPoints: lines(d.impact || d.shipped).slice(0, 3),
      skillsUsed: skills.slice(0, 5),
      squad: emptySquad(),
    })
  }

  // ── education (student / intern / fresher) ──
  const educations: EducationEntry[] = []
  if (d.degree || d.field || d.institution) {
    educations.push({
      id: 'edu-' + Date.now(),
      institution: d.institution || '',
      degree: d.degree || '',
      field: d.field || '',
      startYear: '', endYear: d.gradYear || '',
      grade: '',
      squad: emptySquad(),
    })
  }

  return { headline, about, skills, experiences, educations }
}

function buildAbout(persona: string, d: Record<string, string>, name: string): string {
  const first = name.split(' ')[0] || 'I'
  switch (persona) {
    case 'student':
      return `${first} — ${[d.degree, d.field].filter(Boolean).join(' in ')}${d.institution ? ` at ${d.institution}` : ''}. Looking for ${d.targetRole || 'internships'}.${d.projects ? ' Already shipping real projects.' : ''}`
    case 'intern':
      return `${first} — ${d.role || 'intern'}${d.company ? ` at ${d.company}` : ''}, building toward ${d.targetRole || 'a full-time role'}.`
    case 'fresher':
      return `${first} — looking for my first role as a ${d.targetRole || 'professional'}${d.industry ? ` in ${d.industry}` : ''}. Proof over pedigree.`
    case 'employee':
      return `${first} — ${d.role || 'professional'}${d.company ? ` at ${d.company}` : ''}${d.years ? `, ${d.years} yrs in` : ''}.${d.targetRole ? ` Open to ${d.targetRole} roles that raise the bar.` : ''}`
    case 'creator':
      return `${first} — ${d.niche || 'creator'} on ${d.platforms || 'multiple platforms'}${d.audience ? ` · ${d.audience}` : ''}. Open to ${d.collab || 'collabs'}.`
    case 'brand':
      return `${d.company || 'We'} — ${d.category || 'a brand'} looking for verified ${d.lookingFor || 'creators'}${d.budget ? ` · ${d.budget}` : ''}.`
    default:
      return `${d.company || 'We'} — ${d.orgType || 'an organisation'}${d.industry ? ` in ${d.industry}` : ''}, hiring ${d.roles || 'across roles'}.`
  }
}
