import { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

const isValidImage = (url: string) => url && (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:"));

/* ── Lightbox ── */
interface LightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

const ImageLightbox = ({ images, startIndex, onClose }: LightboxProps) => {
  const [current, setCurrent] = useState(startIndex);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(images.length - 1, c + 1)), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const handleTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const handleTouchEnd = () => {
    if (touchDeltaX.current > 50) prev();
    else if (touchDeltaX.current < -50) next();
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 60, background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button type="button" onClick={onClose}
        className="absolute top-4 right-4 flex items-center justify-center cursor-pointer"
        style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "white", zIndex: 61 }}>
        <X style={{ width: 20, height: 20 }} />
      </button>

      {images.length > 1 && (
        <span className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 20, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.80)" }}>
          {current + 1} / {images.length}
        </span>
      )}

      {current > 0 && (
        <button type="button" onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
          style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "white", zIndex: 61 }}>
          <ChevronLeft style={{ width: 24, height: 24 }} />
        </button>
      )}
      {current < images.length - 1 && (
        <button type="button" onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
          style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "white", zIndex: 61 }}>
          <ChevronRight style={{ width: 24, height: 24 }} />
        </button>
      )}

      <img
        src={images[current]}
        alt=""
        style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", touchAction: "manipulation" }}
        onClick={e => e.stopPropagation()}
        loading="lazy"
      />
    </div>,
    document.body
  );
};

/* ── Single image item ── */
const ImageItem = ({ src, className, style, onClick }: { src: string; className?: string; style?: React.CSSProperties; onClick?: () => void }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className || ""}`} style={{ ...style, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3C0" }}>Image could not be loaded</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      crossOrigin="anonymous"
      className={className}
      style={{ borderRadius: 8, cursor: "pointer", ...style }}
      onError={() => setError(true)}
      onClick={onClick}
    />
  );
};

/* ── Main grid ── */
const ImageGrid = ({ images }: { images: string[] }) => {
  const validImages = images.filter(isValidImage);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!validImages.length) return null;

  const open = (idx: number) => setLightboxIdx(idx);

  // Single image — full aspect ratio, no crop
  if (validImages.length === 1) {
    return (
      <>
        <div style={{ width: "100%", borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.03)" }}>
          <ImageItem src={validImages[0]} style={{ width: "100%", height: "auto", maxHeight: 600, objectFit: "contain", display: "block" }} onClick={() => open(0)} />
        </div>
        {lightboxIdx !== null && <ImageLightbox images={validImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // 2 images
  if (validImages.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2" style={{ gap: 4 }}>
          {validImages.map((img, i) => (
            <ImageItem key={i} src={img} style={{ width: "100%", height: 250, objectFit: "cover" }} onClick={() => open(i)} />
          ))}
        </div>
        {lightboxIdx !== null && <ImageLightbox images={validImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // 3 images
  if (validImages.length === 3) {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 4 }}>
          <ImageItem src={validImages[0]} style={{ gridColumn: "1", gridRow: "1 / 3", width: "100%", height: 300, objectFit: "cover" }} onClick={() => open(0)} />
          <ImageItem src={validImages[1]} style={{ gridColumn: "2", gridRow: "1", width: "100%", height: 148, objectFit: "cover" }} onClick={() => open(1)} />
          <ImageItem src={validImages[2]} style={{ gridColumn: "2", gridRow: "2", width: "100%", height: 148, objectFit: "cover" }} onClick={() => open(2)} />
        </div>
        {lightboxIdx !== null && <ImageLightbox images={validImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // 4 images
  if (validImages.length === 4) {
    return (
      <>
        <div className="grid grid-cols-2" style={{ gap: 4 }}>
          {validImages.map((img, i) => (
            <ImageItem key={i} src={img} style={{ width: "100%", height: 200, objectFit: "cover" }} onClick={() => open(i)} />
          ))}
        </div>
        {lightboxIdx !== null && <ImageLightbox images={validImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // 5-9 images — 2x2 grid, 4th has overlay for remaining
  if (validImages.length <= 9) {
    const showImages = validImages.slice(0, 4);
    const remaining = validImages.length - 4;
    return (
      <>
        <div className="grid grid-cols-2" style={{ gap: 4 }}>
          {showImages.map((img, i) => (
            <div key={i} className="relative" style={{ borderRadius: 8, overflow: "hidden" }}>
              <ImageItem src={img} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 0 }} onClick={() => open(i)} />
              {i === 3 && remaining > 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.55)", borderRadius: 0 }}
                  onClick={() => open(3)}
                >
                  <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>+{remaining} more</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {lightboxIdx !== null && <ImageLightbox images={validImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // 10+ images — horizontal carousel
  return (
    <>
      <HorizontalImageCarousel images={validImages} onImageClick={open} />
      {lightboxIdx !== null && <ImageLightbox images={validImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </>
  );
};

/* ── Horizontal carousel for 10+ images ── */
const HorizontalImageCarousel = ({ images, onImageClick }: { images: string[]; onImageClick: (i: number) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft - el.scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIdx(closest);
  }, []);

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "4px 0" }}
      >
        {images.map((img, i) => (
          <div key={i} style={{ flexShrink: 0, width: "85%", maxWidth: 400, scrollSnapAlign: "start" }}>
            <ImageItem src={img} style={{ width: "100%", height: "auto", maxHeight: 400, objectFit: "contain", background: "rgba(0,0,0,0.03)" }} onClick={() => onImageClick(i)} />
          </div>
        ))}
      </div>
      <div className="flex justify-center" style={{ gap: 4, marginTop: 8 }}>
        {images.map((_, i) => (
          <div key={i} style={{
            height: 6,
            width: i === activeIdx ? 16 : 6,
            borderRadius: i === activeIdx ? 3 : "50%",
            background: i === activeIdx ? "#E8733A" : "#9CA3C0",
            transition: "all 0.2s",
          }} />
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;
