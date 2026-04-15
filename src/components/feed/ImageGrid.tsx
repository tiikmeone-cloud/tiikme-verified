import { storageImageUrl } from "@/lib/imageTransform";
import { useState } from "react";

const isValidImage = (url: string) => url && (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:"));

const ImageItem = ({ src, className }: { src: string; className: string }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ background: "var(--surface-2, #F0F2F7)", border: "1px solid var(--border, rgba(0,0,0,0.08))" }}>
        <span className="text-[12px] font-medium" style={{ color: "var(--text-3, #9CA3AF)" }}>Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={storageImageUrl(src, "feed")}
      alt=""
      className={className}
      style={{ borderRadius: 12 }}
      onError={() => setError(true)}
    />
  );
};

const ImageGrid = ({ images }: { images: string[] }) => {
  const validImages = images.filter(isValidImage);
  if (!validImages.length) return null;

  if (validImages.length === 1) {
    return (
      <div className="px-5 pb-2">
        <ImageItem src={validImages[0]} className="w-full max-h-96 object-cover" />
      </div>
    );
  }

  if (validImages.length === 2) {
    return (
      <div className="px-5 pb-2 grid grid-cols-2 gap-1.5">
        {validImages.map((img, i) => (
          <ImageItem key={i} src={img} className="w-full h-56 object-cover" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-5 pb-2 grid grid-cols-2 gap-1.5">
      <ImageItem src={validImages[0]} className="w-full col-span-2 h-52 object-cover" />
      {validImages.slice(1, 4).map((img, i) => (
        <ImageItem key={i} src={img} className="w-full h-36 object-cover" />
      ))}
    </div>
  );
};

export default ImageGrid;
