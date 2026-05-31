import { useEffect, useState } from "react";
import { Lock, Eye, Users, TrendingUp, Briefcase, Shield } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  profileId: string;
  followersCount: number;
}

interface AnalyticsData {
  views_30d: Array<{ day: string; views: number }>;
  activity_6m: Array<{ month: string; events: number }>;
  total_profile_views: number;
  views_30d_count: number;
  role_views: Array<{ id: string; job_title: string; company_name: string; total_views: number; recruiter_views: number }>;
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
      <p style={{ color: "var(--text-3)", marginBottom: 2 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill || "#E8733A", fontWeight: 600 }}>
          {(p.value ?? 0).toLocaleString()} {p.name}
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{title}</p>
    {children}
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div className="flex items-center justify-center" style={{ height: 120 }}>
    <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: "18px" }}>{msg}</p>
  </div>
);

export default function ProfileActivityTab({ profileId, followersCount }: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recruiterViews, setRecruiterViews] = useState(0);
  const [engagement, setEngagement] = useState({ likes: 0, comments: 0, reposts: 0, bookmarks: 0 });
  const [loading, setLoading] = useState(true);
  const [squadGrowth, setSquadGrowth] = useState<Array<{ month: string; count: number }>>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: rpcData } = await supabase.rpc("get_profile_analytics" as any, { p_profile_id: profileId });
      if (!cancelled && rpcData) setAnalytics(rpcData as AnalyticsData);

      const { data: wiData } = await supabase.from("work_items").select("recruiter_views").eq("owner_id", profileId);
      if (!cancelled && wiData) {
        setRecruiterViews((wiData as any[]).reduce((sum, w) => sum + (w.recruiter_views || 0), 0));
      }

      const { data: postsData } = await supabase.from("posts").select("id, repost_count").eq("author_id", profileId);
      if (!cancelled && postsData && postsData.length > 0) {
        const postIds = (postsData as any[]).map(p => p.id);
        const reposts = (postsData as any[]).reduce((sum, p) => sum + (p.repost_count || 0), 0);

        const [likesRes, commRes] = await Promise.all([
          supabase.from("post_reactions").select("id", { count: "exact", head: true }).in("post_id", postIds),
          supabase.from("post_comments").select("id", { count: "exact", head: true }).in("post_id", postIds),
        ]);

        let bookmarks = 0;
        try {
          const { count } = await (supabase.from("post_bookmarks" as any).select("id", { count: "exact", head: true }).in("post_id", postIds) as any);
          bookmarks = count || 0;
        } catch {}

        if (!cancelled) {
          setEngagement({ likes: likesRes.count || 0, comments: commRes.count || 0, reposts, bookmarks });
        }
      }

      // Squad growth: count confirmed co-signs per month (last 6 months)
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const { data: edgesData } = await (supabase
          .from("squad_edges" as any)
          .select("confirmed_at")
          .or(`user_a.eq.${profileId},user_b.eq.${profileId}`)
          .eq("status", "confirmed")
          .gte("confirmed_at", sixMonthsAgo.toISOString()) as any);
        if (!cancelled && edgesData) {
          const monthMap: Record<string, number> = {};
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            monthMap[`${months[d.getMonth()]} ${d.getFullYear()}`] = 0;
          }
          (edgesData as Array<{ confirmed_at: string }>).forEach(e => {
            const d = new Date(e.confirmed_at);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (key in monthMap) monthMap[key]++;
          });
          setSquadGrowth(Object.entries(monthMap).map(([month, count]) => ({ month: month.split(" ")[0], count })));
        }
      } catch {}

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profileId]);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ padding: "40px 0" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--border-subtle)", borderTopColor: "#E8733A", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const tiles = [
    { label: "Profile views", value: analytics?.total_profile_views ?? 0, icon: Eye, accent: "#E8733A" },
    { label: "Recruiter views", value: recruiterViews, icon: Briefcase, accent: "#6366F1" },
    { label: "Post reach", value: engagement.likes + engagement.comments + engagement.reposts, icon: TrendingUp, accent: "#16A34A" },
    { label: "Followers", value: followersCount, icon: Users, accent: "#FFB800" },
  ];

  const engagementData = [
    { name: "Likes", value: engagement.likes, fill: "#E8733A" },
    { name: "Comments", value: engagement.comments, fill: "#6366F1" },
    { name: "Reposts", value: engagement.reposts, fill: "#16A34A" },
    { name: "Bookmarks", value: engagement.bookmarks, fill: "#FFB800" },
  ];

  return (
    <div>
      {/* Owner-only notice */}
      <div className="flex items-center" style={{ gap: 6, marginBottom: 16, padding: "8px 12px", borderRadius: 10, background: "rgba(107,112,148,0.08)", border: "1px solid var(--border-subtle)", width: "fit-content" }}>
        <Lock style={{ width: 12, height: 12, color: "var(--text-3)" }} />
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>Only you can see this</span>
      </div>

      {/* Reach tiles */}
      <div className="flex" style={{ gap: 10, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {tiles.map(tile => (
          <div key={tile.label} className="glass-card" style={{ padding: "14px 16px", borderRadius: 16, minWidth: 130, flex: "0 0 auto" }}>
            <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
              <tile.icon style={{ width: 13, height: 13, color: tile.accent }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</span>
            </div>
            <p className="num" style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>
              {tile.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
        {/* Profile views 30d */}
        <ChartCard title="Profile views · 30 days">
          {!analytics?.views_30d?.length ? (
            <Empty msg="No views data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={analytics.views_30d} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="atGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8733A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#E8733A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickFormatter={d => d.slice(5)} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="views" name="views" stroke="#E8733A" strokeWidth={2} fill="url(#atGrad)" dot={false} activeDot={{ r: 4, fill: "#E8733A" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Monthly activity 6m */}
        <ChartCard title="Monthly activity · 6 months">
          {!analytics?.activity_6m?.length ? (
            <Empty msg={"Activity data will appear here\nas you use tiikme"} />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={analytics.activity_6m} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="events" name="actions" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Post engagement */}
        <ChartCard title="Post engagement">
          {engagementData.every(d => d.value === 0) ? (
            <Empty msg="Post on tiikme to see engagement data" />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={engagementData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {engagementData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Squad growth */}
        <ChartCard title="Co-sign growth">
          {squadGrowth.every(d => d.count === 0) ? (
            <div className="flex flex-col items-center justify-center" style={{ height: 120, gap: 8 }}>
              <Shield style={{ width: 24, height: 24, color: "var(--text-3)" }} />
              <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>Co-sign coworkers to build your squad</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={squadGrowth} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" name="co-signs" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Role views */}
      {(analytics?.role_views?.length ?? 0) > 0 && (
        <div className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Role views</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analytics!.role_views.map(r => (
              <div key={r.id} className="flex items-center" style={{ gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.job_title || "Role"}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.company_name}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="num" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{r.total_views.toLocaleString()}</p>
                  {r.recruiter_views > 0 && (
                    <p style={{ fontSize: 11, color: "#16A34A" }}>{r.recruiter_views} recruiter{r.recruiter_views !== 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
