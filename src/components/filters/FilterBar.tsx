import { useEffect, useRef, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";

export interface FilterChip {
  key: string;
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface FilterBarProps {
  chips: FilterChip[];
  activeCount: number;
  onClearAll: () => void;
  onMore: () => void;
  maxInline?: number;
  /** When true, collapses all active filters into "N filters" pill (used on scroll) */
  condensed?: boolean;
}

/**
 * Horizontal filter chip row. Active chips show filled orange background with
 * an X to remove. Beyond `maxInline`, a "More +N" pill opens a drawer.
 */
const FilterBar = ({
  chips,
  activeCount,
  onClearAll,
  onMore,
  maxInline = 6,
  condensed = false,
}: FilterBarProps) => {
  const visibleChips = chips.slice(0, maxInline);
  const overflow = Math.max(0, chips.length - maxInline);

  if (condensed && activeCount > 0) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" style={{ paddingBlock: 8 }}>
        <button type="button" onClick={onMore}
          className="shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
          style={{
            height: 32, padding: "0 12px", borderRadius: 999,
            fontSize: 12, fontWeight: 700, background: "#F97316", color: "#fff", border: "none",
          }}>
          <SlidersHorizontal style={{ width: 13, height: 13 }} />
          {activeCount} {activeCount === 1 ? "filter" : "filters"}
        </button>
        <button type="button" onClick={onClearAll}
          className="shrink-0 cursor-pointer"
          style={{ fontSize: 12, fontWeight: 600, color: "#6B7094", background: "none", border: "none" }}>
          Clear
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" style={{ paddingBlock: 8 }}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: "none" }}>
        {visibleChips.map(c => (
          <button key={c.key} type="button" onClick={c.onToggle}
            className="shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
            style={{
              height: 32, padding: "0 12px", borderRadius: 999,
              fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              ...(c.active
                ? { background: "#F97316", color: "#fff", border: "none" }
                : { background: "rgba(255,255,255,0.50)", color: "#1A1A2E", border: "1px solid rgba(0,0,0,0.08)" }),
            }}>
            {c.label}
            {c.active && <X style={{ width: 12, height: 12 }} />}
          </button>
        ))}
        {overflow > 0 && (
          <button type="button" onClick={onMore}
            className="shrink-0 flex items-center gap-1.5 cursor-pointer"
            style={{
              height: 32, padding: "0 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.50)", color: "#1A1A2E", border: "1px dashed rgba(0,0,0,0.18)",
            }}>
            <SlidersHorizontal style={{ width: 13, height: 13 }} />
            More +{overflow}
          </button>
        )}
      </div>
      {activeCount > 0 && (
        <button type="button" onClick={onClearAll}
          className="shrink-0 cursor-pointer"
          style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", background: "none", border: "none", whiteSpace: "nowrap" }}>
          Clear all
        </button>
      )}
    </div>
  );
};

/** Hook: returns true once the user has scrolled past `threshold` px. */
export function useScrollPastThreshold(threshold = 80): boolean {
  const [past, setPast] = useState(false);
  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setPast(window.scrollY > threshold);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return past;
}

export default FilterBar;
