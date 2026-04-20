/**
 * Centralized upload validation.
 *
 * Always reject SVG (can carry inline scripts). Always cap size.
 * Server-side, RLS + bucket policies are the ultimate gate.
 */

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOC_MIME = ["application/pdf"];
export const ALLOWED_OFFICE_MIME = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const BLOCKED_MIME = ["image/svg+xml", "text/html", "application/xhtml+xml"];

export interface ValidateOptions {
  maxBytes?: number;
  allowImages?: boolean;
  allowPdf?: boolean;
  allowOffice?: boolean;
}

const FIVE_MB = 5 * 1024 * 1024;

/**
 * Returns null if valid, or a user-facing error message string if invalid.
 */
export function validateUpload(file: File, opts: ValidateOptions = {}): string | null {
  const {
    maxBytes = FIVE_MB,
    allowImages = true,
    allowPdf = false,
    allowOffice = false,
  } = opts;

  if (BLOCKED_MIME.includes(file.type)) {
    return "This file type is blocked for security (SVG/HTML uploads not allowed).";
  }

  // Block by extension too — type can be spoofed
  const lowerName = file.name.toLowerCase();
  if (/\.(svg|html?|xhtml|exe|bat|cmd|sh|js|mjs|jsp|php|asp)$/i.test(lowerName)) {
    return "This file extension is blocked for security.";
  }

  const allowed: string[] = [];
  if (allowImages) allowed.push(...ALLOWED_IMAGE_MIME);
  if (allowPdf) allowed.push(...ALLOWED_DOC_MIME);
  if (allowOffice) allowed.push(...ALLOWED_OFFICE_MIME);

  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return "Unsupported file type.";
  }

  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return `File must be under ${mb} MB.`;
  }

  return null;
}

/**
 * Stronger check: read first bytes and verify magic number matches the MIME.
 * Optional but recommended for trusted upload paths.
 */
export async function verifyImageMagicBytes(file: File): Promise<boolean> {
  const buf = await file.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(buf);
  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return file.type === "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return file.type === "image/png";
  // WebP: RIFF....WEBP
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return file.type === "image/webp";
  // GIF: GIF87a or GIF89a
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return file.type === "image/gif";
  return false;
}
