/**
 * getProfileSubtitle — canonical identity subtitle.
 * Priority: headline → "Title @ Company" → role-specific fields → role_subtype
 * NEVER returns a generic role name like "Professional", "Doctor", "Student"
 */
export function getProfileSubtitle(profile: any): string {
  if (!profile) return '';
  if (profile.headline) return profile.headline;

  const r = profile.role || '';
  const rm = profile.role_metadata || {};

  const at = (title: string, place: string) =>
    title && place ? `${title} @ ${place}` : title || place;

  const sub = (profile.role_subtype || '').replace(/_/g, ' ');

  if (r === 'student') {
    const parts = [rm.degree, profile.institution_name || profile.currently_working_at].filter(Boolean);
    return parts.join(' · ') || sub;
  }
  if (r === 'professional') {
    const title = profile.designation || rm.jobTitle || '';
    const company = profile.currently_working_at || rm.company || '';
    return at(title, company) || sub;
  }
  if (r === 'founder') {
    const company = rm.company || profile.currently_working_at || '';
    return company ? `Founder @ ${company}` : sub;
  }
  if (r === 'doctor') {
    const title = profile.designation || '';
    const place = rm.hospital || profile.institution_name || '';
    return at(title, place) || sub;
  }
  if (r === 'faculty') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return at(title, inst) || sub;
  }
  if (r === 'researcher') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return at(title, inst) || sub;
  }
  if (r === 'creator') {
    return rm.platform || rm.channel || sub;
  }
  if (r === 'freelancer') {
    const title = profile.designation || rm.specialty || '';
    const company = profile.currently_working_at || '';
    return at(title, company) || sub;
  }
  if (r === 'investor') {
    return rm.fund || rm.firm || profile.currently_working_at || sub;
  }

  return sub;
}

/**
 * getOrgSubtitle — subtitle for an org/page object.
 */
export function getOrgSubtitle(org: any): string {
  if (!org) return 'Organization';
  return org.type || org.industry || org.sector || 'Organization';
}

