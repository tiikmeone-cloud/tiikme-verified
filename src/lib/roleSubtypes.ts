// Source of truth for role → role_subtype options.
// Used by onboarding, profile edit, and explore cards.

export const SUBTYPE_OPTIONS: Record<string, string[]> = {
  student: [
    "High School", "Diploma", "B.Tech / B.E.", "B.Sc", "B.Com", "BBA",
    "MBBS", "BDS", "LLB", "B.Arch", "M.Tech / M.E.", "MBA", "M.Sc", "MCA", "PhD", "Other",
  ],
  professional: [
    "Software Engineer", "Product Manager", "Designer", "Data Analyst",
    "Marketing Manager", "Sales", "HR", "Finance / CA", "Legal", "Operations",
    "CMO", "CTO", "CFO", "CEO / Founder", "Other",
  ],
  doctor: [
    "MBBS", "MD / MS", "BDS / MDS", "AYUSH (BAMS / BHMS)",
    "Nursing", "Pharmacy", "Physiotherapy", "Other",
  ],
  faculty: [
    "Professor", "Associate Professor", "Assistant Professor",
    "Research Scholar", "Post-doc", "Lecturer", "HOD", "Other",
  ],
  founder: [
    "Idea Stage", "Pre-seed", "Seed", "Series A+", "Bootstrapped",
  ],
  investor: [
    "Angel Investor", "Venture Capitalist", "Family Office",
    "Syndicate Lead", "Corporate VC", "Other",
  ],
  // creator & freelancer use profession_type (platform / field) instead of subtype
};

// Roles that do NOT take a subtype dropdown.
export const NO_SUBTYPE_ROLES = new Set(["institution", "hr", "creator", "freelancer", "other"]);

// profession_type options for creator / freelancer roles.
export const PROFESSION_TYPE_OPTIONS: Record<string, string[]> = {
  creator: ["YouTube", "Instagram", "Podcast", "Newsletter", "TikTok", "Multiple", "Other"],
  freelancer: [
    "Software Development", "Design", "Writing / Content", "Marketing",
    "Video / Photo", "Teaching / Tutoring", "Delivery / Logistics", "Other",
  ],
};

export const hasSubtypes = (role: string | null | undefined) =>
  !!role && !NO_SUBTYPE_ROLES.has(role) && Array.isArray(SUBTYPE_OPTIONS[role]) && SUBTYPE_OPTIONS[role].length > 0;

export const hasProfessionType = (role: string | null | undefined) =>
  !!role && Array.isArray(PROFESSION_TYPE_OPTIONS[role]) && PROFESSION_TYPE_OPTIONS[role].length > 0;
