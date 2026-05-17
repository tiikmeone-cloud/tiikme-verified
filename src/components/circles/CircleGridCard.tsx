import { Link } from "react-router-dom";
import { CIRCLE_TYPE_CONFIG } from "@/lib/circlesMeta";

type Circle = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon_url?: string | null;
  type?: string;
  member_count?: number;
};

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function CircleGridCard({
  circle,
  isMember,
  onJoin,
}: {
  circle: Circle;
  isMember: boolean;
  onJoin: (id: string) => void;
}) {
  const conf = (CIRCLE_TYPE_CONFIG as any)[circle.type || "topic"] || CIRCLE_TYPE_CONFIG.topic;
  const Icon = conf.icon;
  const customIcon = circle.icon_url && circle.icon_url.length <= 4;

  return (
    <Link
      to={`/app/circles/${circle.slug}`}
      className="group block rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:shadow-md hover:border-neutral-300 transition"
    >
      <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${conf.bg}, rgba(255, 90, 31,0.10))` }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 36 }}>
          {customIcon ? (
            <span>{circle.icon_url}</span>
          ) : (
            <Icon className="w-9 h-9" style={{ color: conf.color }} />
          )}
        </div>
        <span
          className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.92)", color: "#1A1A2E" }}
        >
          {conf.label}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[15px] text-[#1A1A2E] line-clamp-2 break-words">{circle.name}</h3>
        <p className="text-sm text-neutral-600 mt-1 line-clamp-2 min-h-[40px]">
          {circle.description || "—"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-neutral-500">
            <span className="num">{formatCount(circle.member_count || 0)}</span> members
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!isMember) onJoin(circle.id);
            }}
            className="text-[12px] font-bold rounded-lg px-3 py-1.5 transition active:scale-95"
            style={{
              background: isMember ? "rgba(107,112,148,0.12)" : "#FF5A1F",
              color: isMember ? "#1A1A2E" : "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isMember ? "Joined" : "Join"}
          </button>
        </div>
      </div>
    </Link>
  );
}

export function CircleGrid({
  circles,
  joined,
  onJoin,
}: {
  circles: Circle[];
  joined: string[];
  onJoin: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {circles.map((c) => (
        <CircleGridCard key={c.id} circle={c} isMember={joined.includes(c.id)} onJoin={onJoin} />
      ))}
    </div>
  );
}
