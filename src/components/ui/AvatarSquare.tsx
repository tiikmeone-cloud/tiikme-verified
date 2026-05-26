import { useState } from "react";

const FALLBACK_COLORS = ["#E8733A", "#2D7A4F", "#C44A1F", "#7E22CE", "#166534", "#B7640A", "#9F1239", "#0369A1"];

function hashColor(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function getInitials(name: string, maxLen = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((w) => w[0]).join("").slice(0, maxLen).toUpperCase();
  }
  // Single word — return first 2 characters
  return (parts[0] || "U").substring(0, maxLen).toUpperCase();
}

const NAMED_SIZES: Record<string, number> = {
  xs: 24, sm: 32, md: 40, lg: 56, xl: 80, profile: 120,
};

const NAMED_FONTS: Record<string, number> = {
  xs: 10, sm: 12, md: 14, lg: 20, xl: 28, profile: 40,
};

function fixStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url
    .replace("/storage/v1/render/image/public/", "/storage/v1/object/public/")
    .replace("/storage/v1/render/image/", "/storage/v1/object/public/");
}

interface AvatarSquareProps {
  src?: string | null;
  name: string;
  /** Pixel size (number) or named preset */
  size?: number | "xs" | "sm" | "md" | "lg" | "xl" | "profile";
  className?: string;
  /** Override background color for fallback */
  bgColor?: string;
  style?: React.CSSProperties;
}

const AvatarSquare = ({
  src,
  name,
  size = "md",
  className = "",
  bgColor,
  style,
}: AvatarSquareProps) => {
  const [imgError, setImgError] = useState(false);
  const px = typeof size === "number" ? size : (NAMED_SIZES[size] || 40);
  const initials = getInitials(name || "U");
  const bg = bgColor || hashColor(name || "U");
  const fixedSrc = fixStorageUrl(src);
  const showImage = !!fixedSrc && !imgError;
  const fontSize = typeof size === "string" && NAMED_FONTS[size]
    ? NAMED_FONTS[size]
    : Math.max(px * 0.28, 9);

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        borderRadius: 0,
        border: "2px solid rgba(255,255,255,0.30)",
        backgroundColor: showImage ? "rgba(255,255,255,0.50)" : bg,
      }}
    >
      {showImage ? (
        <img
          src={fixedSrc!}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ borderRadius: 0 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default AvatarSquare;
export { hashColor, getInitials, fixStorageUrl };
