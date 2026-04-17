import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Briefcase, Link2, Shield, TrendingUp, Target, Check, X, UserCheck, Heart, MessageSquare, Repeat2, AtSign, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AvatarSquare from "@/components/ui/AvatarSquare";

const ICON_MAP: Record<string, any> = {
  strand: Link2, hr: Briefcase, verified: Shield, work: Target, score: TrendingUp,
  strand_request: UserCheck, verification_request: Shield, opportunity: Briefcase, offer: Briefcase,
  delegation_approval: Shield, ex_member_verification: UserCheck,
  like: Heart, comment: MessageSquare, repost: Repeat2, mention: AtSign,
  connection_request: Users, connection_accepted: UserCheck, follow: Users,
  new_message: MessageSquare, verification_approved: Shield, verification_declined: Shield,
};

const ICON_STYLES: Record<string, { bg: string; color: string }> = {
  hr: { bg: "rgba(107,33,168,0.1)", color: "#6B21A8" },
  strand: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  strand_request: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  verified: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  verification_request: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  verification_approved: { bg: "rgba(22,163,74,0.1)", color: "#16A34A" },
  verification_declined: { bg: "rgba(220,38,38,0.1)", color: "#DC2626" },
  work: { bg: "rgba(3,105,161,0.1)", color: "#0369A1" },
  opportunity: { bg: "rgba(194,65,12,0.1)", color: "#C2410C" },
  offer: { bg: "rgba(22,163,74,0.1)", color: "#16A34A" },
  score: { bg: "rgba(91,79,255,0.1)", color: "#5B4FFF" },
  challenge: { bg: "rgba(146,64,14,0.1)", color: "#92400E" },
  like: { bg: "rgba(232,88,10,0.1)", color: "#E8580A" },
  comment: { bg: "rgba(232,88,10,0.1)", color: "#E8580A" },
  repost: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  mention: { bg: "rgba(232,115,58,0.1)", color: "#E8733A" },
  connection_request: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  connection_accepted: { bg: "rgba(22,163,74,0.1)", color: "#16A34A" },
  follow: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  new_message: { bg: "rgba(232,115,58,0.1)", color: "#E8733A" },
  delegation_approval: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  ex_member_verification: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [actorProfiles, setActorProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState<any>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query both alerts AND notifications tables, merge results
      const [alertsRes, notifsRes] = await Promise.allSettled([
        supabase.from("alerts").select("id, type, title, body, action_url, is_read, data, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("notifications").select("id, type, title, body, action_url, is_read, data, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      const alertsData = alertsRes.status === "fulfilled" ? ((alertsRes.value as any).data || []).map((a: any) => ({ ...a, _source: "alerts" })) : [];
      const notifsData = notifsRes.status === "fulfilled" ? ((notifsRes.value as any).data || []).map((n: any) => ({ ...n, _source: "notifications" })) : [];
      
      // Merge and deduplicate by id, sort newest first
      const merged = [...alertsData, ...notifsData].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 80);
      setAlerts(merged);
      setLoading(false);

      // Fetch actor profiles for avatars
      const actorIds = [...new Set(merged.map((a: any) => a.data?.actor_id).filter(Boolean))] as string[];
      if (actorIds.length > 0) {
        supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", actorIds)
          .then(({ data: profiles }) => {
            const map: Record<string, any> = {};
            for (const p of profiles || []) map[p.id] = p;
            setActorProfiles(map);
          });
      }
    } catch {
      setAlerts([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Realtime: refetch when new alerts/notifications arrive
  useEffect(() => {
    if (!user) return;
    const ch1 = supabase.channel("alerts-rt-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchAlerts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` }, () => fetchAlerts())
      .subscribe();
    return () => { supabase.removeChannel(ch1); };
  }, [user, fetchAlerts]);

  const markAllRead = async () => {
    if (!user) return;
    await Promise.allSettled([
      supabase.from("alerts").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false),
      supabase.from("notifications").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false),
    ]);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const acceptStrand = async (alert: any) => {
    const senderId = alert.data?.actor_id;
    if (!user || !senderId) return;
    await supabase.from("strands").update({ status: "accepted" }).eq("requester_id", senderId).eq("receiver_id", user.id).eq("status", "pending");
    await supabase.from("alerts").insert({ user_id: senderId, type: "strand", title: `${profile?.full_name || "Someone"} accepted your Strand request!`, body: "You are now connected.", action_url: `/app/profile/${user.id}`, data: { actor_id: user.id } as any });
    await supabase.from("alerts").update({ is_read: true } as any).eq("id", alert.id);
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true, _accepted: true } : a));
    toast.success("Strand accepted ✓");
  };

  const declineStrand = async (alert: any) => {
    const senderId = alert.data?.actor_id;
    if (!user || !senderId) return;
    await supabase.from("strands").update({ status: "declined" }).eq("requester_id", senderId).eq("receiver_id", user.id).eq("status", "pending");
    await supabase.from("alerts").update({ is_read: true } as any).eq("id", alert.id);
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true, _declined: true } : a));
    toast.success("Strand declined");
  };

  const acceptOffer = async (alert: any) => { setShowJoinModal(alert); };
  const declineOffer = async (alert: any) => {
    await supabase.from("alerts").update({ is_read: true } as any).eq("id", alert.id);
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true, _declined: true } : a));
    toast.success("Offer declined");
  };

  const confirmJoin = async (alert: any) => {
    if (!user) return;
    try {
      const oppId = alert.data?.opportunity_id;
      const orgId = alert.data?.org_id;
      const roleTitle = alert.data?.role_title || "Team Member";
      if (oppId) {
        await supabase.from("opportunity_applications").update({ offer_accepted: true, joined_confirmed: true } as any)
          .eq("opportunity_id", oppId).eq("applicant_id", user.id);
      }
      if (orgId) {
        await supabase.from("work_items").insert({
          owner_id: user.id, title: roleTitle, job_title: roleTitle,
          item_type: "experience", is_current: true,
          start_date: new Date().toISOString().split("T")[0],
          status: "active", visibility: "public",
          company_name: alert.data?.org_name || "Organization",
        } as any);
      }
      try { await supabase.rpc("increment_score", { uid: user.id, amount: 15 }); } catch {}
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, _accepted: true, is_read: true } : a));
      setShowJoinModal(null);
      toast.success("Experience updated! Check your profile. 🎉");
    } catch { toast.error("Something went wrong"); }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const filteredAlerts = activeTab === "Unread" ? alerts.filter(a => !a.is_read) : alerts;

  const groups: Record<string, any[]> = {};
  filteredAlerts.forEach(a => {
    const g = getGroup(a.created_at);
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  });

  if (loading && alerts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-light animate-pulse" style={{ height: 60, borderRadius: 16, padding: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" style={{ color: "#E8733A" }} />
          <h1 className="text-[20px] font-bold" style={{ color: "#1A1A2E" }}>Alerts</h1>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllRead}
            className="h-8 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filterTabs.map(ftab => (
          <button type="button" key={ftab} onClick={() => setActiveTab(ftab)}
            className="px-5 py-2 rounded-[20px] text-[13px] font-semibold transition-all duration-200"
            style={activeTab === ftab
              ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)", cursor: "pointer" }
              : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }
            }>
            {ftab === "Unread" ? `Unread (${unreadCount})` : ftab}
          </button>
        ))}
      </div>

      {Object.entries(groups).map(([group, groupAlerts]) => (
        <div key={group} className="mb-6">
          <p className="text-[11px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "#6B7094" }}>{group}</p>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #F1F3F5", background: "#FFFFFF" }}>
            {groupAlerts.map((notif, i) => {
              const unread = !notif.is_read;
              const style = ICON_STYLES[notif.type] || ICON_STYLES.score;
              const Icon = ICON_MAP[notif.type] || Bell;
              const isStrandRequest = notif.type === "connection_request" || (notif.type === "strand" && notif.title?.toLowerCase().includes("connect"));
              const isOffer = notif.type === "offer" || (notif.type === "opportunity" && notif.title?.toLowerCase().includes("selected"));
              const isDelegation = notif.type === "delegation_approval";
              const isExVerification = notif.type === "ex_member_verification";
              const handled = notif._accepted || notif._declined;

              return (
                <motion.div key={notif.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 cursor-pointer transition-colors duration-150"
                  style={{
                    padding: 16,
                    background: unread ? "#FFF8F5" : "#FFFFFF",
                    borderBottom: "1px solid #F1F3F5",
                    borderRadius: i === 0 ? "12px 12px 0 0" : i === groupAlerts.length - 1 ? "0 0 12px 12px" : 0,
                  }}
                  onClick={async () => {
                    if (unread) {
                      const table = notif._source === "notifications" ? "notifications" : "alerts";
                      await supabase.from(table).update({ is_read: true } as any).eq("id", notif.id);
                      setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true } : a));
                    }
                    if (notif.action_url && !isStrandRequest && !isOffer) navigate(notif.action_url);
                  }}>
                  <div className="w-2 flex items-start pt-2 shrink-0">
                    {unread && <span className="w-2 h-2 rounded-full" style={{ background: "#E8733A" }} />}
                  </div>
                  {(() => {
                    const actor = notif.data?.actor_id ? actorProfiles[notif.data.actor_id] : null;
                    if (actor) {
                      return (
                        <div className="relative shrink-0">
                          <AvatarSquare src={actor.avatar_url} name={actor.full_name || "U"} size={36} />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: isOffer ? "rgba(22,163,74,0.9)" : style.bg, border: "2px solid #FFFFFF" }}>
                            <Icon className="w-2.5 h-2.5" style={{ color: isOffer ? "#fff" : style.color }} />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ backgroundColor: isOffer ? "rgba(22,163,74,0.1)" : style.bg, borderRadius: 0 }}>
                        <Icon className="w-4 h-4" style={{ color: isOffer ? "#16A34A" : style.color }} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-relaxed" style={{ color: "#1A1A2E", fontWeight: 500 }}>
                      {notif.title || notif.body}
                    </p>
                    {notif.body && notif.title && (
                      <p className="text-[13px] mt-0.5" style={{ color: "#6B7094" }}>{notif.body}</p>
                    )}
                    {isStrandRequest && !handled && notif.data?.actor_id && (
                      <div className="flex gap-2 mt-2">
                        <button type="button" className="h-8 px-4 rounded-xl text-[11px] font-bold" style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); acceptStrand(notif); }}>
                          <Check className="w-3 h-3 inline mr-1" /> Accept
                        </button>
                        <button type="button" className="h-8 px-3 rounded-xl text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); declineStrand(notif); }}>
                          <X className="w-3 h-3 inline mr-1" /> Decline
                        </button>
                      </div>
                    )}
                    {isOffer && !handled && (
                      <div className="flex gap-2 mt-2">
                        <button type="button" className="h-8 px-4 rounded-xl text-[11px] font-bold" style={{ background: "#16A34A", color: "#fff", border: "none", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); acceptOffer(notif); }}>
                          Accept Offer
                        </button>
                        <button type="button" className="h-8 px-3 rounded-xl text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); declineOffer(notif); }}>
                          Decline
                        </button>
                      </div>
                    )}
                    {isDelegation && !handled && (
                      <div className="flex gap-2 mt-2">
                        <button type="button" className="h-8 px-4 rounded-xl text-[11px] font-bold" style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer" }} onClick={async (e) => {
                          e.stopPropagation();
                          const ruleData = notif.data;
                          if (ruleData?.org_id && ruleData?.member_id && ruleData?.access_type) {
                            await supabase.from("org_access_rules").update({ delegation_approved: true } as any)
                              .eq("org_id", ruleData.org_id).eq("member_id", ruleData.member_id).eq("access_type", ruleData.access_type);
                          }
                          await supabase.from("alerts").update({ is_read: true } as any).eq("id", notif.id);
                          setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true, _accepted: true } : a));
                          toast.success("Delegation approved");
                        }}>
                          <Check className="w-3 h-3 inline mr-1" /> Approve
                        </button>
                        <button type="button" className="h-8 px-3 rounded-xl text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }} onClick={async (e) => {
                          e.stopPropagation();
                          const ruleData = notif.data;
                          if (ruleData?.org_id && ruleData?.member_id && ruleData?.access_type) {
                            await supabase.from("org_access_rules").delete()
                              .eq("org_id", ruleData.org_id).eq("member_id", ruleData.member_id).eq("access_type", ruleData.access_type);
                          }
                          await supabase.from("alerts").update({ is_read: true } as any).eq("id", notif.id);
                          setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true, _declined: true } : a));
                          toast.success("Delegation declined");
                        }}>
                          <X className="w-3 h-3 inline mr-1" /> Decline
                        </button>
                      </div>
                    )}
                    {isExVerification && !handled && (
                      <div className="flex gap-2 mt-2">
                        <button type="button" className="h-8 px-4 rounded-xl text-[11px] font-bold" style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer" }} onClick={async (e) => {
                          e.stopPropagation();
                          await supabase.from("alerts").update({ is_read: true } as any).eq("id", notif.id);
                          setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true, _accepted: true } : a));
                          toast.success("Verification approved");
                          if (notif.action_url) navigate(notif.action_url);
                        }}>
                          <Check className="w-3 h-3 inline mr-1" /> Approve
                        </button>
                        <button type="button" className="h-8 px-3 rounded-xl text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }} onClick={async (e) => {
                          e.stopPropagation();
                          await supabase.from("alerts").update({ is_read: true } as any).eq("id", notif.id);
                          setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true, _declined: true } : a));
                          toast.success("Verification declined");
                        }}>
                          <X className="w-3 h-3 inline mr-1" /> Decline
                        </button>
                      </div>
                    )}
                    {notif._accepted && <span className="text-[11px] font-bold mt-1 block" style={{ color: "#10B981" }}>✓ {isOffer ? "Joined" : "Accepted"}</span>}
                    {notif._declined && <span className="text-[11px] font-bold mt-1 block" style={{ color: "#6B7094" }}>Declined</span>}
                  </div>
                  <span className="text-[12px] shrink-0 pt-0.5" style={{ color: "#6B7094" }}>
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
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: "#6B7094" }} />
          <p className="text-[15px] font-bold mb-1" style={{ color: "#1A1A2E" }}>No alerts yet</p>
          <p className="text-[13px]" style={{ color: "#6B7094" }}>You'll be notified about connections, opportunities, and activity here.</p>
        </div>
      )}

      {/* Join confirmation modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(26, 26, 78, 0.40)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowJoinModal(null)}>
          <div className="glass-light w-full max-w-[400px]" style={{ padding: 24, borderRadius: 24 }} onClick={e => e.stopPropagation()}>
            <h2 className="text-[22px] font-bold mb-2" style={{ color: "#1A1A2E" }}>Did you join {showJoinModal.data?.org_name || "the organization"}?</h2>
            <p className="text-[14px] mb-6" style={{ color: "#6B7094" }}>We'll update your profile automatically</p>
            <button type="button" onClick={() => confirmJoin(showJoinModal)}
              className="w-full h-[52px] rounded-2xl text-[15px] font-bold mb-3"
              style={{ background: "#16A34A", color: "#fff", border: "none", cursor: "pointer" }}>
              Yes, I joined!
            </button>
            <button type="button" onClick={() => setShowJoinModal(null)}
              className="w-full text-center text-[13px] cursor-pointer" style={{ color: "#6B7094" }}>
              Not yet — I'll confirm later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
