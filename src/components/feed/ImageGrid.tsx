const isValidImage = (url: string) => url && (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:"));

const ImageGrid = ({ images }: { images: string[] }) => {
  const validImages = images.filter(isValidImage);
  if (!validImages.length) return null;

  if (validImages.length === 1) {
    return (
      <div className="px-5 pb-2">
        <img src={validImages[0]} alt="" className="w-full max-h-96 object-cover rounded-xl border border-border/30" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
    );
  }

  if (validImages.length === 2) {
    return (
      <div className="px-5 pb-2 grid grid-cols-2 gap-1.5">
        {validImages.map((img, i) => (
          <img key={i} src={img} alt="" className="w-full h-56 object-cover rounded-xl border border-border/30" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ))}
      </div>
    );
  }

  return (
    <div className="px-5 pb-2 grid grid-cols-2 gap-1.5">
      <img src={validImages[0]} alt="" className="w-full col-span-2 h-52 object-cover rounded-xl border border-border/30" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      {validImages.slice(1, 4).map((img, i) => (
        <img key={i} src={img} alt="" className="w-full h-36 object-cover rounded-xl border border-border/30" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ))}
    </div>
  );
};

export default ImageGrid;
