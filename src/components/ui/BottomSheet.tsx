import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Responsive drawer: slides up from bottom on mobile (<640px),
 * from the right on desktop. Wraps shadcn Sheet.
 */
const BottomSheet = ({ open, onClose, title, description, children, footer }: BottomSheetProps) => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="flex flex-col p-0 gap-0"
        style={isMobile
          ? { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85vh" }
          : { width: "min(420px, 100vw)" }}
      >
        <div className="flex flex-col gap-1 px-5 pt-5 pb-3 border-b border-border/40">
          <SheetTitle className="text-[16px] font-bold" style={{ color: "#1A1A2E" }}>{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-[12px]" style={{ color: "#6B7094" }}>{description}</SheetDescription>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3 border-t border-border/40 flex items-center gap-2">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default BottomSheet;
