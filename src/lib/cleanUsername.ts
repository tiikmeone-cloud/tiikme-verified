/**
 * Strips auto-generated hash suffixes from usernames.
 * e.g. "saainadhan-e34094" → "saainadhan"
 * Pattern: name followed by dash + 6 hex chars at the end.
 */
export function cleanUsername(username: string | null | undefined): string {
  if (!username) return "";
  return username.replace(/-[0-9a-f]{6,8}$/i, "");
}
