import { getPrimaryRoleLine } from "@/lib/profileUtils";

/**
 * Resolves a profile's `display_preference` into per-field render flags so
 * every card/header across the app shows exactly what the profile owner
 * wants visible.
 *
 * Values mirror the onboarding picker:
 *   - "dp_only"                       → avatar only
 *   - "dp_name"                       → avatar + name
 *   - "dp_name_profession"            → avatar + name + role/headline (DEFAULT)
 *   - "dp_name_profession_company"    → avatar + name + role + company
 */

export type DisplayPreference =
  | "dp_only"
  | "dp_name"
  | "dp_name_profession"
  | "dp_name_profession_company";

export const DEFAULT_DISPLAY_PREFERENCE: DisplayPreference = "dp_name_profession";

interface DisplayInputProfile {
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  role_subtype?: string | null;
  headline?: string | null;
  designation?: string | null;
  currently_working_at?: string | null;
  institution_name?: string | null;
  display_preference?: string | null;
}

export interface DisplayFlags {
  showName: boolean;
  showRole: boolean;
  showCompany: boolean;
}

export function getDisplayFlags(profile: DisplayInputProfile | null | undefined): DisplayFlags {
  const pref = (profile?.display_preference as DisplayPreference) || DEFAULT_DISPLAY_PREFERENCE;
  return {
    showName: pref !== "dp_only",
    showRole: pref === "dp_name_profession" || pref === "dp_name_profession_company",
    showCompany: pref === "dp_name_profession_company",
  };
}

/** Single composed string for cards that show role inline. */
export function formatRoleLine(profile: DisplayInputProfile | null | undefined): string {
  if (!profile) return "";
  const primary = getPrimaryRoleLine(profile);
  if (primary) return primary;
  return profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace(/_/g, " ") : "";
}

export function formatCompanyLine(profile: DisplayInputProfile | null | undefined): string {
  return profile?.currently_working_at || profile?.institution_name || "";
}

/** Convenience: anonymized fallback name when only avatar is shown. */
export function safeDisplayName(profile: DisplayInputProfile | null | undefined, fallback = "User"): string {
  const flags = getDisplayFlags(profile);
  if (!flags.showName) return fallback;
  return profile?.full_name?.trim() || fallback;
}

export const DISPLAY_PREFERENCE_OPTIONS: { value: DisplayPreference; label: string; desc: string }[] = [
  { value: "dp_only",                     label: "Avatar only",                desc: "Just your photo" },
  { value: "dp_name",                     label: "Avatar + Name",              desc: "Photo and your name" },
  { value: "dp_name_profession",          label: "Avatar + Name + Role",       desc: "Recommended — adds your role" },
  { value: "dp_name_profession_company",  label: "Avatar + Name + Role + Company", desc: "Full identity with employer" },
];
