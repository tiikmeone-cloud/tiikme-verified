const ImageGrid = ({ images }: { images: string[] }) => {
  if (!images.length) return null;

  if (images.length === 1) {
    return (
      <div className="px-5 pb-2">
        <img src={images[0]} alt="Post image" className="w-full max-h-96 object-cover rounded-xl border border-border/30" />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="px-5 pb-2 grid grid-cols-2 gap-1.5">
        {images.map((img, i) => (
          <img key={i} src={img} alt={`Post image ${i + 1}`} className="w-full h-56 object-cover rounded-xl border border-border/30" />
        ))}
      </div>
    );
  }

  // 3 or 4 images: masonry style
  return (
    <div className="px-5 pb-2 grid grid-cols-2 gap-1.5">
      <img src={images[0]} alt="Post image 1" className="w-full col-span-2 h-52 object-cover rounded-xl border border-border/30" />
      {images.slice(1, 4).map((img, i) => (
        <img key={i} src={img} alt={`Post image ${i + 2}`} className="w-full h-36 object-cover rounded-xl border border-border/30" />
      ))}
    </div>
  );
};

export default ImageGrid;
