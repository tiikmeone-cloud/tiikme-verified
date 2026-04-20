/**
 * XSS sanitization helpers.
 *
 * Use `sanitize(html)` only when you must render rich HTML (rare).
 * For normal user text, render it as a React child — React escapes by default.
 *
 * `sanitizeText(s)` — strips ALL tags, leaves plaintext (use for places where
 * a single line of free-form text might be reflected into a non-React surface,
 * e.g. document.title, share dialogs, image alts).
 */
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["b", "i", "em", "strong", "a", "br", "p", "ul", "ol", "li", "blockquote", "code", "pre"];
const ALLOWED_ATTR = ["href", "title", "target", "rel"];

export function sanitize(html: string): string {
  if (typeof window === "undefined") return ""; // SSR safety
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
  });
}

export function sanitizeText(text: string): string {
  if (typeof window === "undefined") return text.replace(/<[^>]*>/g, "");
  const el = document.createElement("div");
  el.textContent = text;
  return el.innerHTML;
}

/**
 * Sanitize a user-supplied URL before putting it in href/src.
 * Blocks javascript:, data:, vbscript:, file: schemes.
 */
export function safeUrl(url: string | null | undefined, fallback = "#"): string {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  // Disallow non-http(s)/mailto/tel
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return fallback;
  // Allow relative, protocol-relative, http(s), mailto, tel
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  // Bare domains → prefix https
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) return "https://" + trimmed;
  return fallback;
}
