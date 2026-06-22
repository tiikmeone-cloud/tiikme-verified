/**
 * Quiet logger for Supabase RPC wrappers.
 *
 * While the app runs anonymously (pre-auth), the hardened RPCs return
 * Postgres error 42501 (permission denied) by design — anon EXECUTE was
 * revoked in the security pass. That's the expected logged-out state, not a
 * bug, so we don't want it spamming the console or popping the Next dev
 * error overlay. Real (unexpected) errors still log.
 */
export function logRpc(label: string, error: { code?: string } | null | undefined) {
  if (error && error.code !== '42501') console.error(label, error)
}
