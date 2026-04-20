/**
 * Mask email/phone for public display so scrapers can't harvest contact info.
 * Examples:
 *   sajan@gmail.com   → s***n@gmail.com
 *   +919876543210     → +91 98******10
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const start = digits.slice(0, 4);
  const end = digits.slice(-2);
  return `${start}${"*".repeat(Math.max(digits.length - 6, 4))}${end}`;
}
