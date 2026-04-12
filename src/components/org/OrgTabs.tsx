interface OrgTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function OrgTabs({ tabs, active, onChange }: OrgTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: "#F0E8E0" }}>
      <div className="max-w-[960px] mx-auto px-4 md:px-6">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button type="button" key={tab} onClick={() => onChange(tab)}
              className="py-3 px-4 text-[13px] font-semibold cursor-pointer shrink-0 transition-colors"
              style={{
                color: active === tab ? "#E8580A" : "#6B6B6B",
                borderBottom: active === tab ? "2px solid #E8580A" : "2px solid transparent",
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
