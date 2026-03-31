const SkeletonCard = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-border/30 p-5 animate-pulse" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-surface-2" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded-full bg-surface-2" />
            <div className="h-2.5 w-20 rounded-full bg-surface-2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-surface-2" />
          <div className="h-3 w-4/5 rounded-full bg-surface-2" />
        </div>
        <div className="flex gap-3 mt-4">
          <div className="h-7 w-16 rounded-full bg-surface-2" />
          <div className="h-7 w-16 rounded-full bg-surface-2" />
          <div className="h-7 w-16 rounded-full bg-surface-2" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonCard;
