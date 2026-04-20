// Source of truth for organization type → display config (label + colors).
// Used by ExploreCard, Explore search results, OrganizationPage, and PageProfile.

export interface OrgTypeConfig {
  label: string;
  color: string;
  bg: string;
}

export const ORG_TYPE_CONFIG: Record<string, OrgTypeConfig> = {
  company:    { label: "Company",    color: "#1F2937", bg: "rgba(59,130,246,0.12)" },
  startup:    { label: "Startup",    color: "#6B21A8", bg: "rgba(168,85,247,0.14)" },
  creator:    { label: "Creator",    color: "#B91C1C", bg: "rgba(239,68,68,0.12)" },
  community:  { label: "Community",  color: "#0E7490", bg: "rgba(14,165,233,0.12)" },
  education:  { label: "Education",  color: "#7C2D12", bg: "rgba(251,146,60,0.14)" },
  college:    { label: "College",    color: "#7C2D12", bg: "rgba(251,146,60,0.14)" },
  university: { label: "University", color: "#7C2D12", bg: "rgba(251,146,60,0.14)" },
  school:     { label: "School",     color: "#3F6212", bg: "rgba(132,204,22,0.14)" },
  hospital:   { label: "Hospital",   color: "#9F1239", bg: "rgba(244,63,94,0.12)" },
  clinic:     { label: "Clinic",     color: "#9F1239", bg: "rgba(244,63,94,0.12)" },
  ngo:        { label: "NGO",        color: "#065F46", bg: "rgba(16,185,129,0.14)" },
  government: { label: "Government", color: "#1E3A8A", bg: "rgba(30,58,138,0.12)" },
  investor:   { label: "Investor",   color: "#713F12", bg: "rgba(234,179,8,0.14)" },
  media:      { label: "Media",      color: "#831843", bg: "rgba(236,72,153,0.12)" },
};

/** True when this org's "follow" action should be presented as "Subscribe". */
export const isCreatorOrg = (type?: string | null, subtype?: string | null): boolean => {
  const t = (type || "").toLowerCase();
  if (t === "creator") return true;
  const s = (subtype || "").toLowerCase();
  return s === "youtube channel" || s === "podcast" || s === "newsletter" || s === "other creator";
};

export const getOrgTypeConfig = (type?: string | null): OrgTypeConfig => {
  const key = (type || "company").toLowerCase();
  return (
    ORG_TYPE_CONFIG[key] || {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: "#1F2937",
      bg: "rgba(107,112,148,0.12)",
    }
  );
};
