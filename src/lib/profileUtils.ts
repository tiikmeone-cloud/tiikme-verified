/**
 * getProfileSubtitle — canonical identity subtitle.
 * Priority: headline → "Title @ Company" → role-specific fields → role label
 */
export function getProfileSubtitle(profile: any): string {
  if (!profile) return '';
  if (profile.headline) return profile.headline;

  const r = profile.role || '';
  const rm = profile.role_metadata || {};

  const at = (title: string, place: string) =>
    title && place ? `${title} @ ${place}` : title || place;

  if (r === 'student') {
    const parts = [rm.degree, profile.institution_name || profile.currently_working_at].filter(Boolean);
    return parts.join(' · ') || 'Student';
  }
  if (r === 'professional') {
    const title = profile.designation || rm.jobTitle || '';
    const company = profile.currently_working_at || rm.company || '';
    return at(title, company) || 'Professional';
  }
  if (r === 'founder') {
    const company = rm.company || profile.currently_working_at || '';
    return company ? `Founder @ ${company}` : 'Founder';
  }
  if (r === 'doctor') {
    const title = profile.designation || '';
    const place = rm.hospital || profile.institution_name || '';
    return at(title, place) || 'Doctor';
  }
  if (r === 'faculty') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return at(title, inst) || 'Faculty';
  }
  if (r === 'researcher') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return at(title, inst) || 'Researcher';
  }
  if (r === 'creator') {
    return rm.platform || rm.channel || 'Creator';
  }
  if (r === 'freelancer') {
    const title = profile.designation || rm.specialty || '';
    const company = profile.currently_working_at || '';
    return at(title, company) || 'Freelancer';
  }
  if (r === 'investor') {
    return rm.fund || rm.firm || profile.currently_working_at || 'Investor';
  }

  return r ? r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ') : '';
}

/**
 * getOrgSubtitle — subtitle for an org/page object.
 */
export function getOrgSubtitle(org: any): string {
  if (!org) return 'Organization';
  return org.type || org.industry || org.sector || 'Organization';
}
