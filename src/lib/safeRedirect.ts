const DEFAULT_AUTH_REDIRECT = "/app/feed";
const LOCAL_ORIGIN = "https://tiikme.local";

function decodeRedirect(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function safeInternalRedirect(
  value: string | null | undefined,
  fallback: string | null = null
): string | null {
  if (!value) return fallback;

  const trimmed = value.trim();
  const decoded = decodeRedirect(trimmed).trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || decoded.includes("\\")) return fallback;
  if (decoded.startsWith("//")) return fallback;

  try {
    const url = new URL(trimmed, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN) return fallback;
    if (url.pathname === "/signin" || url.pathname === "/signup") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getStoredPostAuthRedirect(): string | null {
  const stored = sessionStorage.getItem("post_auth_redirect");
  return safeInternalRedirect(stored);
}

export function consumePostAuthRedirect(fallback = DEFAULT_AUTH_REDIRECT): string {
  const safe = getStoredPostAuthRedirect();
  sessionStorage.removeItem("post_auth_redirect");
  return safe || fallback;
}

export function storePostAuthRedirect(value: string | null | undefined): void {
  const safe = safeInternalRedirect(value);
  if (safe) sessionStorage.setItem("post_auth_redirect", safe);
}
