import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  title: string;
  count?: number;
  seeAllLink?: string;
  onSeeAll?: () => void;
  accentColor?: string;
  children: ReactNode;
}

export default function HorizontalCarousel({ title, count, seeAllLink, onSeeAll, accentColor = "var(--color-accent)", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hovered, setHovered] = useState(false);

  const check = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => { check(); }, [children]);

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="mb-6" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-5 rounded-sm" style={{ background: accentColor }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>{title}</h2>
          {count != null && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-secondary)" }}>{count}</span>}
        </div>
        {(seeAllLink || onSeeAll) && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-[12px] font-semibold transition-colors"
            style={{ color: "var(--color-accent)" }}
          >
            See All &gt;
          </button>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Arrows (desktop) */}
        {hovered && canLeft && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full transition-all"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)", border: "1px solid var(--glass-border)", boxShadow: "0 4px 12px var(--glass-shadow)" }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-text)" }} />
          </button>
        )}
        {hovered && canRight && (
          <button
            type="button"
            onClick={() => scroll(1)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full transition-all"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)", border: "1px solid var(--glass-border)", boxShadow: "0 4px 12px var(--glass-shadow)" }}
          >
            <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text)" }} />
          </button>
        )}

        <div
          ref={ref}
          onScroll={check}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
