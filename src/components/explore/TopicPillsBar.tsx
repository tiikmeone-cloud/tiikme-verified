import { Plus, X } from "lucide-react";

interface TopicPillsBarProps {
  topics: string[];
  activeTopics: Set<string>;
  onToggle: (topic: string) => void;
  onEdit: () => void;
}

const TopicPillsBar = ({ topics, activeTopics, onToggle, onEdit }: TopicPillsBarProps) => {
  if (topics.length === 0) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="cursor-pointer flex items-center"
        style={{
          gap: 6, padding: "8px 14px", height: 34, borderRadius: 12,
          background: "var(--bg-card)", border: "1px dashed var(--border-glass)",
          color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Add interests
      </button>
    );
  }

  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{ gap: 6, scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
    >
      {topics.map(topic => {
        const isActive = activeTopics.has(topic);
        return (
          <button
            type="button"
            key={topic}
            onClick={() => onToggle(topic)}
            className="cursor-pointer flex items-center"
            style={{
              flexShrink: 0, scrollSnapAlign: "start",
              gap: 4, padding: "0 14px", height: 34, borderRadius: 12,
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              transition: "all 150ms", border: "none", whiteSpace: "nowrap",
              ...(isActive
                ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "white", boxShadow: "0 4px 14px rgba(232,115,58,0.25)" }
                : { background: "var(--bg-card)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }
              ),
            }}
          >
            #{topic}
            {isActive && <X style={{ width: 12, height: 12, opacity: 0.8 }} />}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onEdit}
        className="cursor-pointer flex items-center"
        style={{
          flexShrink: 0, scrollSnapAlign: "start",
          gap: 4, padding: "0 14px", height: 34, borderRadius: 12,
          background: "transparent", border: "1px dashed var(--border-glass)",
          color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        <Plus style={{ width: 12, height: 12 }} />
        Edit
      </button>
    </div>
  );
};

export default TopicPillsBar;
