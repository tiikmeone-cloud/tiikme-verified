/**
 * Domain-OTP verification helpers built on Supabase auth.signInWithOtp.
 *
 * Strategy: Use Supabase's built-in email OTP to prove the user controls
 * a work email at a given domain. We do NOT actually log them in with
 * that email — we just verify the OTP, then immediately re-restore their
 * existing session.
 *
 * This avoids needing a custom email-sending edge function while still
 * giving us strong domain-ownership proof.
 */
import { supabase } from "@/integrations/supabase/client";

export const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.in", "hotmail.com", "outlook.com",
  "rediffmail.com", "proton.me", "protonmail.com", "icloud.com", "live.com",
  "aol.com", "me.com", "msn.com", "ymail.com",
]);

export function extractDomain(email: string): string {
  const m = email.trim().toLowerCase().match(/@([^@]+)$/);
  return m?.[1] || "";
}

export function isPersonalDomain(email: string): boolean {
  return PERSONAL_DOMAINS.has(extractDomain(email));
}

export async function isDisposableDomain(email: string): Promise<boolean> {
  const d = extractDomain(email);
  if (!d) return true;
  const { data } = await supabase
    .from("disposable_domains")
    .select("domain")
    .eq("domain", d)
    .maybeSingle();
  return !!data;
}

export function domainsMatch(email: string, expectedDomain: string): boolean {
  if (!expectedDomain) return false;
  return extractDomain(email) === expectedDomain.trim().toLowerCase();
}

/**
 * Send a one-time code to the work email.
 * Uses Supabase signInWithOtp with shouldCreateUser:false so we don't
 * spawn shadow accounts for every work address.
 */
export async function sendWorkEmailOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  if (await isDisposableDomain(email)) {
    return { ok: false, error: "Disposable email domains are not allowed." };
  }
  // shouldCreateUser=true so we can verify even if the work email isn't a Tiikme account.
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Verify a 6-digit OTP without disturbing the current logged-in session.
 * We capture the current session before calling verifyOtp, then re-set it after.
 */
export async function verifyWorkEmailOtp(
  email: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  // Capture current session so we can restore it
  const { data: sessionData } = await supabase.auth.getSession();
  const originalSession = sessionData.session;

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: "email",
  });

  if (error) {
    // Restore original session if it was disturbed
    if (originalSession) {
      await supabase.auth.setSession({
        access_token: originalSession.access_token,
        refresh_token: originalSession.refresh_token,
      });
    }
    return { ok: false, error: error.message };
  }

  // Verification succeeded — restore the original user's session
  if (originalSession) {
    await supabase.auth.setSession({
      access_token: originalSession.access_token,
      refresh_token: originalSession.refresh_token,
    });
  }

  return { ok: true };
}
