import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { storageImageUrl } from "@/lib/imageTransform";

interface PostCarouselProps {
  images: string[];
}

const PostCarousel = ({ images }: PostCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(images.length - 1, c + 1)), [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const handleTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const handleTouchEnd = () => {
    if (touchDeltaX.current > 50) prev();
    else if (touchDeltaX.current < -50) next();
  };

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, prev, next]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <>
        <img
          src={storageImageUrl(images[0], "feed")}
          alt=""
          loading="lazy"
          className="w-full max-h-[500px] object-cover cursor-pointer"
          onClick={() => setLightbox(true)}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        {lightbox && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
            <button type="button" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer z-10" onClick={() => setLightbox(false)}>
              <X className="w-6 h-6 text-white" />
            </button>
            <img src={storageImageUrl(images[0], "lightbox")} alt="" className="max-w-[95vw] max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={storageImageUrl(images[current], "feed")}
          alt=""
          loading="lazy"
          className="w-full max-h-[500px] object-cover cursor-pointer"
          onClick={() => setLightbox(true)}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: "rgba(0,0,0,0.5)" }}>
          {current + 1} / {images.length}
        </span>
        {current > 0 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {current < images.length - 1 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button type="button" key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className="w-2 h-2 rounded-full cursor-pointer transition-all"
              style={{ background: i === current ? "white" : "rgba(255,255,255,0.4)", transform: i === current ? "scale(1.3)" : "scale(1)" }} />
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button type="button" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer z-10" onClick={() => setLightbox(false)}>
            <X className="w-6 h-6 text-white" />
          </button>
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-[14px] font-bold">{current + 1} / {images.length}</span>
          {current > 0 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {current < images.length - 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <img src={storageImageUrl(images[current], "lightbox")} alt="" className="max-w-[95vw] max-h-[85vh] object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button type="button" key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className="w-2.5 h-2.5 rounded-full cursor-pointer transition-all"
                style={{ background: i === current ? "white" : "rgba(255,255,255,0.3)", transform: i === current ? "scale(1.3)" : "scale(1)" }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default PostCarousel;
