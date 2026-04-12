/**
 * Transforms Supabase Storage URLs from /object/public/ to /render/image/public/
 * with size & format query params for optimized delivery.
 *
 * Only transforms URLs that contain "/storage/v1/object/public/".
 * Non-Supabase URLs are returned unchanged.
 */

type ImagePreset = "feed" | "avatar" | "lightbox";

const presetParams: Record<ImagePreset, string> = {
  feed: "width=800&quality=75&format=webp",
  avatar: "width=160&height=160&quality=85&format=webp",
  lightbox: "width=1600&quality=85&format=webp",
};

export function storageImageUrl(url: string, preset: ImagePreset = "feed"): string {
  if (!url || !url.includes("/storage/v1/object/public/")) return url;
  const transformed = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const separator = transformed.includes("?") ? "&" : "?";
  return `${transformed}${separator}${presetParams[preset]}`;
}
