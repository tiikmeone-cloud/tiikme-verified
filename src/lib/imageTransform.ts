/**
 * Returns the original Supabase Storage URL without image transformations.
 * Previously this rewrote URLs to /render/image/ which causes 503 errors
 * on plans that don't support Supabase Image Transformations.
 *
 * Now it simply ensures URLs use /object/public/ (the working path)
 * and strips any leftover render/image rewrites.
 */

type ImagePreset = "feed" | "avatar" | "lightbox" | "thumbnail" | "cover";

export function storageImageUrl(url: string, _preset?: ImagePreset): string {
  if (!url) return url;
  // Fix any URLs that were previously rewritten to /render/image/
  return url.replace("/storage/v1/render/image/public/", "/storage/v1/object/public/");
}
