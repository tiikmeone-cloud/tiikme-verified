const GENERIC_ROLE_PREFIX_RE =
  /^(student|professional|founder|doctor|faculty|researcher|creator|freelancer|investor|member)(?:\s*[^\p{L}\p{N}]+\s*|\s+)/iu;

export function sanitizeIdentityText(text?: string | null): string {
  const value = (text || "").trim();
  if (!value) return "";
  return value.replace(GENERIC_ROLE_PREFIX_RE, "").trim();
}

function stripCompanySuffix(text?: string | null): string {
  const value = sanitizeIdentityText(text);
  if (!value) return "";
  return value
    .replace(/\s+(?:at|@)\s+.+$/i, "")
    .trim();
}

/**
 * getProfileSubtitle — canonical identity subtitle.
 * Priority: headline → "Title @ Company" → role-specific fields → role_subtype
 * NEVER returns a generic role name like "Professional", "Doctor", "Student"
 */
export function getProfileSubtitle(profile: any): string {
  if (!profile) return '';
  if (profile.headline) return sanitizeIdentityText(profile.headline);

  const r = profile.role || '';
  const rm = profile.role_metadata || {};

  const at = (title: string, place: string) =>
    title && place ? `${title} @ ${place}` : title || place;

  const sub = (profile.role_subtype || '').replace(/_/g, ' ');

  if (r === 'student') {
    const parts = [rm.degree, profile.institution_name || profile.currently_working_at].filter(Boolean);
    return sanitizeIdentityText(parts.join(' · ') || sub);
  }
  if (r === 'professional' || r === 'working') {
    const title = profile.designation || rm.jobTitle || '';
    const company = profile.currently_working_at || rm.company || '';
    return sanitizeIdentityText(at(title, company) || (profile.role_subtype ? profile.role_subtype.replace(/_/g,' ') : '') || sub);
  }
  if (r === 'founder') {
    const company = rm.company || profile.currently_working_at || '';
    return sanitizeIdentityText(company ? `Founder @ ${company}` : sub);
  }
  if (r === 'doctor') {
    const title = profile.designation || '';
    const place = rm.hospital || profile.institution_name || '';
    return sanitizeIdentityText(at(title, place) || sub);
  }
  if (r === 'faculty') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return sanitizeIdentityText(at(title, inst) || sub);
  }
  if (r === 'researcher' || r === 'educator') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return sanitizeIdentityText(at(title, inst) || sub);
  }
  if (r === 'healthcare') {
    const title = profile.designation || '';
    const place = rm.hospital || profile.institution_name || profile.currently_working_at || '';
    return sanitizeIdentityText(at(title, place) || sub);
  }
  if (r === 'gig_worker') {
    const title = profile.designation || '';
    const city = (profile as any).location_city || '';
    return sanitizeIdentityText(at(title, city) || sub);
  }
  if (r === 'creator') {
    return sanitizeIdentityText(rm.platform || rm.channel || sub);
  }
  if (r === 'freelancer') {
    const title = profile.designation || rm.specialty || '';
    const company = profile.currently_working_at || '';
    return sanitizeIdentityText(at(title, company) || sub);
  }
  if (r === 'investor') {
    return sanitizeIdentityText(rm.fund || rm.firm || profile.currently_working_at || sub);
  }

  const desig = profile.designation || profile.currently_working_at || '';
  return sanitizeIdentityText(desig || sub || '');
}

/**
 * Primary role line for cards/headers where we want the person's title,
 * not a generic role label and not a duplicated company suffix.
 */
export function getPrimaryRoleLine(profile: any): string {
  if (!profile) return "";

  const rm = profile.role_metadata || {};
  const candidates = [
    profile.designation,
    rm.jobTitle,
    profile.role_subtype,
    stripCompanySuffix(profile.headline),
    stripCompanySuffix(getProfileSubtitle(profile)),
  ];

  for (const candidate of candidates) {
    const cleaned = sanitizeIdentityText(candidate);
    if (cleaned) return cleaned;
  }

  return "";
}

/**
 * getOrgSubtitle — subtitle for an org/page object.
 */
export function getOrgSubtitle(org: any): string {
  if (!org) return 'Organization';
  return org.type || org.industry || org.sector || 'Organization';
}
