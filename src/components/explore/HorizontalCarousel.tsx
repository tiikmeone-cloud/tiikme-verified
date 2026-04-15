import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  title: string;
  count?: number;
  onSeeAll?: () => void;
  children: ReactNode;
}

export default function HorizontalCarousel({ title, count, onSeeAll, children }: Props) {
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
    <section style={{ marginBottom: 24 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Header */}
      <div className="flex items-center" style={{ marginBottom: 10 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: "#E8733A", marginRight: 8, flexShrink: 0 }} />
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", flex: 1, margin: 0 }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{count}</span>
        )}
        {onSeeAll && (
          <button type="button" onClick={onSeeAll}
            style={{ fontSize: 12, fontWeight: 400, color: "#E8733A", marginLeft: 8, background: "none", border: "none", cursor: "pointer" }}>
            See All &gt;
          </button>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left arrow */}
        <button type="button" onClick={() => scroll(-1)}
          className="hidden md:flex items-center justify-center absolute z-10"
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: "white", boxShadow: hovered && canLeft ? "0 2px 12px rgba(26,26,78,0.15)" : "0 2px 12px rgba(26,26,78,0.15)",
            left: -16, top: "50%", transform: "translateY(-50%)",
            opacity: hovered && canLeft ? 1 : 0, transition: "opacity 200ms", pointerEvents: hovered && canLeft ? "auto" : "none",
            border: "none", cursor: "pointer",
          }}>
          <ChevronLeft style={{ width: 16, height: 16, color: "var(--text-primary)" }} />
        </button>

        {/* Right arrow */}
        <button type="button" onClick={() => scroll(1)}
          className="hidden md:flex items-center justify-center absolute z-10"
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: "white", boxShadow: "0 2px 12px rgba(26,26,78,0.15)",
            right: -16, top: "50%", transform: "translateY(-50%)",
            opacity: hovered && canRight ? 1 : 0, transition: "opacity 200ms", pointerEvents: hovered && canRight ? "auto" : "none",
            border: "none", cursor: "pointer",
          }}>
          <ChevronRight style={{ width: 16, height: 16, color: "var(--text-primary)" }} />
        </button>

        <div
          ref={ref}
          onScroll={check}
          className="flex overflow-x-auto"
          style={{
            gap: 10, paddingBottom: 4,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
