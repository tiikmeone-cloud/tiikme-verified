/**
 * ProfileAnalyticsRow — owner-only analytics charts.
 * Queries get_profile_analytics() RPC (SECURITY DEFINER, owner-only).
 * Charts: area (profile views 30d), bar (activity 6m), role views table, squad stub.
 */
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Activity, Briefcase, Users, Loader2 } from "lucide-react";

interface AnalyticsData {
  views_30d: Array<{ day: string; views: number }>;
  activity_6m: Array<{ month: string; events: number }>;
  total_profile_views: number;
  views_30d_count: number;
  role_views: Array<{ id: string; job_title: string; company_name: string; total_views: number; recruiter_views: number }>;
}

/* ── Shared card wrapper ── */
const ChartCard = ({ title, icon: Icon, accent = "#E8733A", children }: {
  title: string; icon: any; accent?: string; children: React.ReactNode;
}) => (
  <div className="glass-card" style={{ padding: 16, borderRadius: 16, flex: 1, minWidth: 0 }}>
    <div className="flex items-center" style={{ gap: 6, marginBottom: 14 }}>
      <Icon style={{ width: 14, height: 14, color: accent }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
    </div>
    {children}
  </div>
);

/* ── Empty state ── */
const Empty = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center" style={{ height: 120 }}>
    <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: "18px" }}>{message}</p>
  </div>
);

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "var(--text-1)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      <p style={{ color: "var(--text-3)", marginBottom: 2 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.value.toLocaleString()} {p.name}
        </p>
      ))}
    </div>
  );
};

/* ── Views chart ── */
const ViewsChart = ({ data, count30d }: { data: AnalyticsData["views_30d"]; count30d: number }) => (
  <ChartCard title="Profile views" icon={Eye} accent="#E8733A">
    <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
      <span className="num" style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{count30d}</span>
      <span style={{ fontSize: 12, color: "var(--text-3)" }}>last 30 days</span>
    </div>
    {data.length === 0 ? (
      <Empty message={"No views yet.\nShare your profile to start getting views."} />
    ) : (
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E8733A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#E8733A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickFormatter={d => d.slice(5)} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="views" name="views" stroke="#E8733A" strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, fill: "#E8733A" }} />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ── Activity chart ── */
const ActivityChart = ({ data }: { data: AnalyticsData["activity_6m"] }) => (
  <ChartCard title="Monthly activity" icon={Activity} accent="#6366F1">
    {data.length === 0 ? (
      <Empty message={"Activity data will appear here\nas you use tiikme."} />
    ) : (
      <ResponsiveContainer width="100%" height={148}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="events" name="actions" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ── Role views table ── */
const RoleViewsCard = ({ roles }: { roles: AnalyticsData["role_views"] }) => (
  <ChartCard title="Role views" icon={Briefcase} accent="#16A34A">
    {roles.length === 0 ? (
      <Empty message={"Add experience to see\nhow many people view each role."} />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {roles.map(r => (
          <div key={r.id} className="flex items-center" style={{ gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.job_title || "Role"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.company_name}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{r.total_views.toLocaleString()}</p>
              {r.recruiter_views > 0 && (
                <p style={{ fontSize: 10, color: "#16A34A" }}>{r.recruiter_views} recruiter{r.recruiter_views !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </ChartCard>
);

/* ── Squad growth stub ── */
const SquadGrowthStub = () => (
  <ChartCard title="Squad growth" icon={Users} accent="var(--text-3)">
    <div className="flex flex-col items-center justify-center" style={{ height: 148, gap: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users style={{ width: 18, height: 18, color: "var(--text-3)" }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", textAlign: "center" }}>Coming with Squads</p>
      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", lineHeight: "16px" }}>
        Squad graph ships in WS4.<br />Your coworker network will appear here.
      </p>
    </div>
  </ChartCard>
);

/* ── Main component ── */
export default function ProfileAnalyticsRow({ profileId }: { profileId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .rpc("get_profile_analytics" as any, { p_profile_id: profileId })
      .then(({ data: result, error }) => {
        if (!error && result) setData(result as AnalyticsData);
        setLoading(false);
      });
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: "32px 0", gap: 10 }}>
        <Loader2 style={{ width: 18, height: 18, color: "var(--text-3)", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13, color: "var(--text-3)" }}>Loading analytics…</span>
      </div>
    );
  }

  const views30d = data?.views_30d ?? [];
  const activity6m = data?.activity_6m ?? [];
  const roleViews = data?.role_views ?? [];
  const count30d = data?.views_30d_count ?? 0;

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        Your analytics — visible only to you
      </p>
      {/* Top row: views + activity */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
        <ViewsChart data={views30d} count30d={count30d} />
        <ActivityChart data={activity6m} />
      </div>
      {/* Bottom row: role views + squad stub */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        <RoleViewsCard roles={roleViews} />
        <SquadGrowthStub />
      </div>
    </div>
  );
}
