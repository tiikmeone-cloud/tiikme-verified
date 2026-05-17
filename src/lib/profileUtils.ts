/**
 * getProfileSubtitle — canonical subtitle priority chain for any profile object.
 *
 * Priority:
 *   headline → role-specific fields → role label fallback
 */
export function getProfileSubtitle(profile: any): string {
  if (!profile) return '';
  if (profile.headline) return profile.headline;

  const r = profile.role || '';
  const rm = profile.role_metadata || {};

  if (r === 'student') {
    const parts = [rm.degree, profile.institution_name || profile.currently_working_at].filter(Boolean);
    return parts.join(' · ') || 'Student';
  }
  if (r === 'faculty') {
    return [profile.designation, profile.institution_name].filter(Boolean).join(' · ') || 'Faculty';
  }
  if (r === 'researcher') {
    return [profile.designation, profile.institution_name].filter(Boolean).join(' · ') || 'Researcher';
  }
  if (r === 'founder') {
    return rm.company || profile.currently_working_at || 'Founder';
  }
  if (r === 'creator') {
    return rm.platform || rm.channel || 'Creator';
  }
  if (r === 'doctor') {
    return [profile.designation, profile.institution_name].filter(Boolean).join(' · ') || 'Doctor';
  }
  if (r === 'freelancer') {
    return rm.specialty || 'Freelancer';
  }
  if (r === 'investor') {
    return rm.fund || rm.firm || 'Investor';
  }
  if (r === 'professional') {
    return profile.designation || profile.currently_working_at || 'Professional';
  }

  return r ? r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ') : '';
}

/**
 * getOrgSubtitle — canonical subtitle for an org/page object.
 * Never falls back to "Professional".
 */
export function getOrgSubtitle(org: any): string {
  if (!org) return 'Organization';
  return org.type || org.industry || org.sector || 'Organization';
}
