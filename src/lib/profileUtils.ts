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
 * Priority: headline → "Title @ Company" → role-specific fields → role label
 */
export function getProfileSubtitle(profile: any): string {
  if (!profile) return '';
  if (profile.headline) return sanitizeIdentityText(profile.headline);

  const r = profile.role || '';
  const rm = profile.role_metadata || {};

  const at = (title: string, place: string) =>
    title && place ? `${title} @ ${place}` : title || place;

  if (r === 'student') {
    const parts = [rm.degree, profile.institution_name || profile.currently_working_at].filter(Boolean);
    return sanitizeIdentityText(parts.join(' · ') || 'Student');
  }
  if (r === 'professional') {
    const title = profile.designation || rm.jobTitle || '';
    const company = profile.currently_working_at || rm.company || '';
    return sanitizeIdentityText(at(title, company) || (profile.role_subtype ? profile.role_subtype.replace(/_/g,' ') : ''));
  }
  if (r === 'founder') {
    const company = rm.company || profile.currently_working_at || '';
    return sanitizeIdentityText(company ? `Founder @ ${company}` : 'Founder');
  }
  if (r === 'doctor') {
    const title = profile.designation || '';
    const place = rm.hospital || profile.institution_name || '';
    return sanitizeIdentityText(at(title, place) || 'Doctor');
  }
  if (r === 'faculty') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return sanitizeIdentityText(at(title, inst) || 'Faculty');
  }
  if (r === 'researcher') {
    const title = profile.designation || '';
    const inst = profile.institution_name || rm.institution || '';
    return sanitizeIdentityText(at(title, inst) || 'Researcher');
  }
  if (r === 'creator') {
    return sanitizeIdentityText(rm.platform || rm.channel || 'Creator');
  }
  if (r === 'freelancer') {
    const title = profile.designation || rm.specialty || '';
    const company = profile.currently_working_at || '';
    return sanitizeIdentityText(at(title, company) || 'Freelancer');
  }
  if (r === 'investor') {
    return sanitizeIdentityText(rm.fund || rm.firm || profile.currently_working_at || 'Investor');
  }

  const sub = profile.role_subtype ? profile.role_subtype.replace(/_/g,' ') : '';
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
