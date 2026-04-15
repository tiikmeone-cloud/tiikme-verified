import { useState } from "react";

const isValidImage = (url: string) => url && (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:"));

const ImageItem = ({ src, className, style }: { src: string; className: string; style?: React.CSSProperties }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ ...style, background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>Image could not be loaded</span>
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
      style={{ borderRadius: 10, ...style }}
      onError={() => setError(true)}
    />
  );
};

const ImageGrid = ({ images }: { images: string[] }) => {
  const validImages = images.filter(isValidImage);
  if (!validImages.length) return null;

  if (validImages.length === 1) {
    return (
      <div style={{ width: "100%", maxHeight: 400, overflow: "hidden", borderRadius: 10 }}>
        <ImageItem src={validImages[0]} className="w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2" style={{ gap: 4 }}>
      {validImages.slice(0, 4).map((img, i) => (
        <ImageItem key={i} src={img} className="w-full object-cover" style={{ height: 200 }} />
      ))}
    </div>
  );
};

export default ImageGrid;
