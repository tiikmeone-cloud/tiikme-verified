/**
 * Privacy enforcement helper.
 * Every component that renders ANOTHER user's profile MUST pipe through this.
 * Owner always sees everything. Others see only what the owner has allowed.
 *
 * Reads from `profiles.privacy` (jsonb) — the canonical column.
 * Falls back to legacy `profiles.privacy_settings` keys when present so the app
 * keeps working during the migration window.
 */

export type PrivacyConnVis = "everyone" | "connections" | "only_me";
export type PrivacyMessageRule = "everyone" | "connections" | "verified_only" | "no_one";
export type PrivacyPostsVis = "everyone" | "connections" | "only_me";

export interface PrivacySettings {
  show_location: boolean;
  show_company: boolean;
  show_in_explore: boolean;
  show_connections: PrivacyConnVis;
  who_can_message: PrivacyMessageRule;
  who_can_see_posts: PrivacyPostsVis;
  show_email: boolean;
  show_phone: boolean;
  show_education: boolean;
  show_experience: boolean;
  searchable_by_email: boolean;
  show_online_status: boolean;
  show_activity: boolean;
  show_in_pilot_search: boolean;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  show_location: true,
  show_company: true,
  show_in_explore: true,
  show_connections: "everyone",
  who_can_message: "everyone",
  who_can_see_posts: "everyone",
  show_email: false,
  show_phone: false,
  show_education: true,
  show_experience: true,
  searchable_by_email: false,
  show_online_status: true,
  show_activity: true,
  show_in_pilot_search: true,
};

/** Normalize whatever the DB stored into a fully-populated PrivacySettings object. */
export function normalizePrivacy(raw: any): PrivacySettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PRIVACY };
  const map = (legacy: string | undefined, fallback: any) => (legacy === undefined ? fallback : legacy);
  // Translate a few legacy keys from `privacy_settings`
  const legacyConn = raw.who_can_see_connections;
  const legacyMsg = raw.who_can_message;
  const legacyExplore = raw.show_in_search;
  const legacyEmail = raw.contact_email_visible;
  const legacyCompany = raw.show_current_company;

  const connVis: PrivacyConnVis =
    raw.show_connections ??
    (legacyConn === "connections_only" ? "connections" :
     legacyConn === "only_me" ? "only_me" :
     legacyConn === "everyone" ? "everyone" : "everyone");

  const msgRule: PrivacyMessageRule =
    raw.who_can_message === "connections_only" ? "connections" :
    raw.who_can_message ?? (legacyMsg === "connections_only" ? "connections" : legacyMsg ?? "everyone");

  const postsVis: PrivacyPostsVis = raw.who_can_see_posts ?? "everyone";

  return {
    show_location: raw.show_location ?? true,
    show_company: raw.show_company ?? legacyCompany ?? true,
    show_in_explore: raw.show_in_explore ?? legacyExplore ?? true,
    show_connections: connVis,
    who_can_message: msgRule,
    who_can_see_posts: postsVis,
    show_email: raw.show_email ?? legacyEmail ?? false,
    show_phone: raw.show_phone ?? false,
    show_education: raw.show_education ?? true,
    show_experience: raw.show_experience ?? true,
    searchable_by_email: raw.searchable_by_email ?? false,
    show_online_status: raw.show_online_status ?? true,
    show_activity: raw.show_activity ?? true,
    show_in_pilot_search: raw.show_in_pilot_search ?? true,
  };
}

export interface ViewerContext {
  id: string | null;
  isConnection: boolean;
  isVerified: boolean;
}

/**
 * Strip fields from a profile row according to the owner's privacy settings.
 * If the viewer is the owner, returns the row untouched.
 */
export function applyPrivacyToProfile<T extends Record<string, any>>(profile: T, viewer: ViewerContext): T {
  if (!profile) return profile;
  const ownerId = profile.id ?? profile.user_id;
  if (viewer.id && ownerId && viewer.id === ownerId) return profile;

  const priv = normalizePrivacy(profile.privacy ?? profile.privacy_settings);
  const p: any = { ...profile };

  if (!priv.show_location) {
    p.location_city = null;
    p.location_state = null;
    p.city = null;
    p.state = null;
    p.district = null;
  }
  if (!priv.show_company) {
    p.currently_working_at = null;
    p.institution_name = null;
    p.company = null;
  }
  if (!priv.show_education) {
    p.institution = null;
    p.course = null;
  }
  if (!priv.show_experience) {
    p.experience = [];
  }
  if (!priv.show_email) {
    p.email = null;
  }
  if (!priv.show_phone) {
    p.phone = null;
  }
  if (!priv.show_online_status) {
    p.last_seen_at = null;
    p.last_active_date = null;
  }
  if (!priv.show_activity) {
    p.activity_score = null;
    p.recent_activity = [];
  }

  const connVis = priv.show_connections;
  if (connVis === "only_me" || (connVis === "connections" && !viewer.isConnection)) {
    p.connections = null;
    p.connection_count = null;
  }

  // Expose the normalized privacy back so downstream UI can reason about it
  p.privacy = priv;
  return p as T;
}

/** Can the viewer message this profile owner? Mirror of the SQL `can_message_user` RPC. */
export function canMessageProfile(profile: any, viewer: ViewerContext): boolean {
  if (!profile) return false;
  if (viewer.id && (profile.id === viewer.id || profile.user_id === viewer.id)) return true;
  const priv = normalizePrivacy(profile.privacy ?? profile.privacy_settings);
  switch (priv.who_can_message) {
    case "no_one": return false;
    case "everyone": return true;
    case "connections": return viewer.isConnection;
    case "verified_only": return viewer.isVerified;
    default: return true;
  }
}
