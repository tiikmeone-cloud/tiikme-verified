const rawSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || "https://tiikme.com";

export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
