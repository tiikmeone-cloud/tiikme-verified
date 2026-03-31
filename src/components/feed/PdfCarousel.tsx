import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface PdfCarouselProps {
  fileName: string;
  totalPages: number;
}

const PdfCarousel = ({ fileName, totalPages }: PdfCarouselProps) => {
  const [page, setPage] = useState(1);

  return (
    <div className="mx-5 mb-2 rounded-xl border border-border/30 overflow-hidden" style={{ background: "var(--surface-2)" }}>
      {/* PDF preview area */}
      <div className="h-64 flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
        <div className="text-center">
          <FileText className="w-12 h-12 text-t3 mx-auto mb-2" strokeWidth={1.2} />
          <p className="text-[13px] font-semibold text-t1">{fileName}</p>
          <p className="text-[11px] text-t3">Page {page} preview</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-t2 hover:text-t1 hover:bg-surface-2 transition-all duration-200 disabled:opacity-30 cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[12px] font-semibold text-t2">{page} / {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-t2 hover:text-t1 hover:bg-surface-2 transition-all duration-200 disabled:opacity-30 cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PdfCarousel;
