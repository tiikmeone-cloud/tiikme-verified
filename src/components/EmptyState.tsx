import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-surface-2 border border-border/30">
      <Icon className="w-7 h-7 text-t3" strokeWidth={1.5} />
    </div>
    <h3 className="text-[16px] font-bold text-t1 mb-1.5">{title}</h3>
    <p className="text-[13px] text-t2 max-w-[280px] leading-relaxed mb-5">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="active:scale-95 transition-all duration-200">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
