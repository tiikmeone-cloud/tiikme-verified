interface Tab<T extends string> {
  key: T;
  label: string;
  badge?: number;
}

interface PrimaryTabsProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

/**
 * Bold-underline tab row. Use as Row 1 in the sticky header.
 * "Tab" = changes the fundamental view (different data source / primary mode).
 */
function PrimaryTabs<T extends string>({ tabs, active, onChange }: PrimaryTabsProps<T>) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button key={t.key} type="button" onClick={() => onChange(t.key)}
            className="shrink-0 relative flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              height: 44, padding: "0 16px",
              fontSize: 14, fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--text-1)" : "var(--text-3)",
              background: "none", border: "none",
            }}>
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span style={{
                minWidth: 20, height: 20, borderRadius: 10, padding: "0 6px",
                background: isActive ? "#FF5A1F" : "var(--surface-2)",
                color: isActive ? "#fff" : "var(--text-3)",
                fontSize: 10, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>{t.badge}</span>
            )}
            {isActive && (
              <span aria-hidden style={{
                position: "absolute", left: 12, right: 12, bottom: 0, height: 3,
                borderRadius: "3px 3px 0 0",
                background: "#FF5A1F",
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PrimaryTabs;
