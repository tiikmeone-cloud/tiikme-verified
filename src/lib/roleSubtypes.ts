// Source of truth for role → role_subtype options.
// Used by onboarding, profile edit, and explore cards.

export const SUBTYPE_OPTIONS: Record<string, string[]> = {
  student: ["Undergraduate", "Masters", "PhD", "Diploma", "School"],
  professional: ["Full-time", "Freelancer", "Founder", "Consultant", "Contract"],
  doctor: ["MBBS", "MD", "Specialist", "Surgeon", "Dentist", "Ayurveda", "Homeopathy", "Nurse", "Intern"],
  faculty: ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Researcher", "HOD"],
};

// Roles that do NOT take a subtype.
export const NO_SUBTYPE_ROLES = new Set(["institution", "hr"]);

export const hasSubtypes = (role: string | null | undefined) =>
  !!role && !NO_SUBTYPE_ROLES.has(role) && Array.isArray(SUBTYPE_OPTIONS[role]) && SUBTYPE_OPTIONS[role].length > 0;
