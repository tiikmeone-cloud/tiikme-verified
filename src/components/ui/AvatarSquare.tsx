import { useState } from "react";
import { storageImageUrl } from "@/lib/imageTransform";

const FALLBACK_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];

function hashColor(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function getInitials(name: string, maxLen = 2): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, maxLen)
    .toUpperCase();
}

interface AvatarSquareProps {
  src?: string | null;
  name: string;
  size: number;
  className?: string;
  /** Use Supabase image transform preset */
  preset?: "avatar" | "feed" | "thumbnail";
  /** Override background color for fallback */
  bgColor?: string;
}

const AvatarSquare = ({
  src,
  name,
  size,
  className = "",
  preset = "avatar",
  bgColor,
}: AvatarSquareProps) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name || "U");
  const bg = bgColor || hashColor(name || "U");
  const showImage = !!src && !imgError;
  const fontSize = Math.max(size * 0.28, 9);

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        border: "2px solid rgba(255,255,255,0.30)",
        backgroundColor: showImage ? "rgba(255,255,255,0.50)" : bg,
      }}
    >
      {showImage ? (
        <img
          src={storageImageUrl(src!, preset)}
          alt={name}
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
export { hashColor, getInitials };
