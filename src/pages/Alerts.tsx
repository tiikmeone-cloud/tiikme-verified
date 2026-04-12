import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Briefcase, Link2, Shield, TrendingUp, Target, Check, X, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, any> = {
  strand: Link2, hr: Briefcase, verified: Shield, work: Target, score: TrendingUp,
  strand_request: UserCheck, verification_request: Shield,
};

const ICON_STYLES: Record<string, { bg: string; color: string }> = {
  hr: { bg: "rgba(107,33,168,0.1)", color: "#6B21A8" },
  strand: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  strand_request: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  verified: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  verification_request: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  work: { bg: "rgba(3,105,161,0.1)", color: "#0369A1" },
  opportunity: { bg: "rgba(194,65,12,0.1)", color: "#C2410C" },
  score: { bg: "rgba(91,79,255,0.1)", color: "#5B4FFF" },
  challenge: { bg: "rgba(146,64,14,0.1)", color: "#92400E" },
  like: { bg: "rgba(232,88,10,0.1)", color: "#E8580A" },
  comment: { bg: "rgba(232,88,10,0.1)", color: "#E8580A" },
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function getGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Earlier";
}

const filterTabs = ["All", "Unread"];

const Alerts = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) { console.warn("[Alerts] fetch failed:", error.message); setAlerts([]); setLoading(false); return; }
      setAlerts(data || []);
      setLoading(false);
      if ((data || []).some((a: any) => !a.is_read)) {
        supabase.from("alerts").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false).then(({ error: e }) => { if (e) console.warn("[Alerts] mark-read failed:", e.message); });
      }
    } catch (e) {
      console.warn("[Alerts] fetch exception:", e);
      setAlerts([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Mark all read
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("alerts").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    toast.success("All notifications marked as read");
  };

  // Accept strand request
  const acceptStrand = async (alert: any) => {
    const senderId = alert.actor_id;
    if (!user || !senderId) return;

    // Update strand status
    await supabase.from("strands")
      .update({ status: "accepted" })
      .eq("requester_id", senderId)
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    // Send notification to sender
    await supabase.from("alerts").insert({
      user_id: senderId,
      actor_id: user.id,
      type: "strand",
      title: `${profile?.full_name || "Someone"} accepted your Strand request!`,
      body: "You are now connected.",
      link: `/app/profile/${user.id}`,
    });

    // Mark this alert as read
    await supabase.from("alerts").update({ is_read: true } as any).eq("id", alert.id);
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true, _accepted: true } : a));
    toast.success("Strand accepted ✓");
  };

  // Decline strand request
  const declineStrand = async (alert: any) => {
    const senderId = alert.actor_id;
    if (!user || !senderId) return;

    await supabase.from("strands")
      .update({ status: "declined" })
      .eq("requester_id", senderId)
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    await supabase.from("alerts").update({ is_read: true } as any).eq("id", alert.id);
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true, _declined: true } : a));
    toast.success("Strand declined");
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const filteredAlerts = activeTab === "Unread" ? alerts.filter(a => !a.is_read) : alerts;

  const groups: Record<string, any[]> = {};
  filteredAlerts.forEach(a => {
    const g = getGroup(a.created_at);
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="t-card p-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ background: "var(--surface-2)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded" style={{ background: "var(--surface-2)" }} />
                <div className="h-3 w-24 rounded" style={{ background: "var(--surface-2)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" style={{ color: "var(--brand)" }} />
          <h1 className="text-[20px] font-bold" style={{ color: "var(--text-1)" }}>Alerts</h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="active:scale-95" onClick={markAllRead}>Mark all read</Button>
        )}
      </div>

      <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 relative cursor-pointer"
            style={{ color: activeTab === tab ? "var(--brand)" : "var(--text-3)" }}>
            {tab === "Unread" ? `Unread (${unreadCount})` : tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />}
          </button>
        ))}
      </div>

      {Object.entries(groups).map(([group, groupAlerts]) => (
        <div key={group} className="mb-6">
          <p className="text-[11px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-3)" }}>{group}</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {groupAlerts.map((notif, i) => {
              const unread = !notif.is_read;
              const style = ICON_STYLES[notif.type] || ICON_STYLES.score;
              const Icon = ICON_MAP[notif.type] || Bell;
              const isStrandRequest = notif.type === "strand" && notif.title?.toLowerCase().includes("connect");
              const handled = notif._accepted || notif._declined;

              return (
                <motion.div key={notif.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
                  style={{ borderBottom: i < groupAlerts.length - 1 ? "1px solid var(--border)" : "none" }}
                  onClick={async () => {
                    if (unread) {
                      await supabase.from("alerts").update({ is_read: true } as any).eq("id", notif.id);
                      setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true } : a));
                    }
                  }}>
                  <div className="w-2 flex items-start pt-2 shrink-0">
                    {unread && <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-relaxed ${unread ? "font-semibold" : "font-normal"}`} style={{ color: unread ? "var(--text-1)" : "var(--text-2)" }}>
                      {notif.title || notif.body}
                    </p>
                    {notif.body && notif.title && (
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>{notif.body}</p>
                    )}
                    {/* Strand request actions */}
                    {isStrandRequest && !handled && notif.actor_id && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="h-7 text-[11px] gap-1" onClick={(e) => { e.stopPropagation(); acceptStrand(notif); }}>
                          <Check className="w-3 h-3" /> Accept
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={(e) => { e.stopPropagation(); declineStrand(notif); }}>
                          <X className="w-3 h-3" /> Decline
                        </Button>
                      </div>
                    )}
                    {notif._accepted && (
                      <span className="text-[11px] font-bold mt-1 block" style={{ color: "#10B981" }}>✓ Accepted</span>
                    )}
                    {notif._declined && (
                      <span className="text-[11px] font-bold mt-1 block" style={{ color: "var(--text-3)" }}>Declined</span>
                    )}
                  </div>
                  <span className="text-[10px] shrink-0 pt-0.5" style={{ color: "var(--text-3)" }}>
                    {notif.created_at ? getTimeAgo(new Date(notif.created_at)) : ""}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[15px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No alerts yet</p>
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>You'll be notified about strands, opportunities, and activity here.</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
