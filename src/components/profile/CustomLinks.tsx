import { ExternalLink } from "lucide-react";

interface CustomLink {
  url: string;
  label: string;
}

interface CustomLinksProps {
  links: CustomLink[];
  maxVisible?: number;
}

export default function CustomLinks({ links, maxVisible = 5 }: CustomLinksProps) {
  if (!links || links.length === 0) return null;
  const visible = links.slice(0, maxVisible);

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((link, i) => (
        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 hover:opacity-80"
          style={{ background: "var(--brand-dim)", border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}>
          <ExternalLink className="w-3 h-3" />
          {link.label || link.url}
        </a>
      ))}
      {links.length > maxVisible && (
        <span className="text-[11px] font-semibold px-2 py-1" style={{ color: "var(--text-3)" }}>+{links.length - maxVisible} more</span>
      )}
    </div>
  );
}
