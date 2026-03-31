import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Briefcase, Link2, Shield, TrendingUp, Target, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ICON_STYLES: Record<string, { bg: string; color: string }> = {
  HR: { bg: "rgba(107,33,168,0.1)", color: "#6B21A8" },
  Strand: { bg: "rgba(79,70,229,0.1)", color: "#4F46E5" },
  Verified: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  Work: { bg: "rgba(3,105,161,0.1)", color: "#0369A1" },
  Opportunity: { bg: "rgba(194,65,12,0.1)", color: "#C2410C" },
  Score: { bg: "rgba(91,79,255,0.1)", color: "#5B4FFF" },
  Challenge: { bg: "rgba(146,64,14,0.1)", color: "#92400E" },
};

interface Alert {
  icon: any; title: string; time: string; read: boolean;
  badge: string; hasActions?: boolean; group: string;
}

const allAlerts: Alert[] = [
  { icon: Briefcase, title: "Zepto HR viewed your TelemedicineRx work and saved your profile to their talent pool.", time: "2 hours ago", read: false, badge: "HR", group: "Today" },
  { icon: Link2, title: "Priya M. accepted your strand request. You can now message each other.", time: "5 hours ago", read: false, badge: "Strand", group: "Today" },
  { icon: Shield, title: "Prof. Sharma approved SmartGrid Monitor as 'Verified Complete'. Your faculty badge is now live.", time: "Yesterday · 4:32 PM", read: false, badge: "Verified", group: "Yesterday" },
  { icon: Briefcase, title: "TCS Recruiter viewed your profile and 2 projects.", time: "Yesterday", read: false, badge: "HR", group: "Yesterday" },
  { icon: Shield, title: "Email verified! dtu.ac.in domain confirmed.", time: "Yesterday", read: false, badge: "Verified", group: "Yesterday" },
  { icon: Target, title: "Rural Water IoT challenge closes in 12 days. You haven't submitted a solution yet.", time: "2 days ago", read: true, badge: "Challenge", group: "Earlier" },
  { icon: TrendingUp, title: "Your Activity Score reached 72. You're in the top 30% of your domain.", time: "3 days ago", read: true, badge: "Score", group: "Earlier" },
  { icon: Link2, title: "Mohan R. sent you a strand request.", time: "3 days ago", read: true, badge: "Strand", hasActions: true, group: "Earlier" },
];

const filterTabs = ["All", "Unread", "Recruiter", "Strands", "Work", "System"];

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [readState, setReadState] = useState<Set<number>>(new Set());
  const [acceptedRequests, setAcceptedRequests] = useState<Set<number>>(new Set());

  const markAllRead = () => {
    setReadState(new Set(allAlerts.map((_, i) => i)));
    toast.success("All notifications marked as read");
  };

  const isUnread = (i: number) => !allAlerts[i].read && !readState.has(i);

  const filteredAlerts = allAlerts.filter((a, i) => {
    if (activeTab === "Unread") return isUnread(i);
    if (activeTab === "Recruiter") return a.badge === "HR";
    if (activeTab === "Strands") return a.badge === "Strand";
    if (activeTab === "Work") return a.badge === "Verified" || a.badge === "Challenge";
    if (activeTab === "System") return a.badge === "Score";
    return true;
  });

  const unreadCount = allAlerts.filter((_, i) => isUnread(i)).length;

  // Group by date
  const groups: Record<string, typeof allAlerts> = {};
  filteredAlerts.forEach(a => {
    if (!groups[a.group]) groups[a.group] = [];
    groups[a.group].push(a);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-brand" />
          <h1 className="text-[20px] font-bold text-t1">Alerts</h1>
        </div>
        <Button variant="ghost" size="sm" className="active:scale-95 transition-all duration-200" onClick={markAllRead}>Mark all read</Button>
      </div>

      {/* Filter tabs — clean underline */}
      <div className="flex gap-0 border-b border-border/30 mb-6">
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 relative cursor-pointer ${
              activeTab === tab ? "text-brand" : "text-t3 hover:text-t1"
            }`}>
            {tab === "Unread" ? `Unread (${unreadCount})` : tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-full" />}
          </button>
        ))}
      </div>

      {/* Grouped alerts */}
      {Object.entries(groups).map(([group, alerts]) => (
        <div key={group} className="mb-6">
          <p className="text-[11px] font-bold tracking-wider uppercase text-t3 mb-2 px-1">{group}</p>
          <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)" }}>
            {alerts.map((notif, i) => {
              const origIdx = allAlerts.indexOf(notif);
              const unread = isUnread(origIdx);
              const style = ICON_STYLES[notif.badge] || ICON_STYLES.Score;
              return (
                <motion.div key={origIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 px-4 py-3.5 border-b border-border/30 last:border-b-0 hover:bg-surface-2/50 transition-all duration-200 cursor-pointer"
                  onClick={() => setReadState(p => new Set(p).add(origIdx))}>
                  {/* Unread dot */}
                  <div className="w-2 flex items-start pt-2 shrink-0">
                    {unread && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  {/* Icon with subtle background */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg }}>
                    <notif.icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-relaxed ${unread ? "font-semibold text-t1" : "font-normal text-t2"}`}>{notif.title}</p>
                    {notif.hasActions && !acceptedRequests.has(origIdx) && (
                      <div className="flex gap-2 mt-2">
                        <Button size="xs" className="active:scale-95 transition-all duration-200" onClick={(e) => { e.stopPropagation(); setAcceptedRequests(p => new Set(p).add(origIdx)); toast.success("Strand accepted!"); }}>
                          <Check className="w-3 h-3" /> Accept
                        </Button>
                        <Button variant="ghost" size="xs" className="active:scale-95 transition-all duration-200" onClick={(e) => { e.stopPropagation(); toast.info("Declined"); }}>
                          <X className="w-3 h-3" /> Decline
                        </Button>
                      </div>
                    )}
                    {notif.hasActions && acceptedRequests.has(origIdx) && (
                      <p className="text-[12px] text-brand font-bold mt-1">Accepted ✓</p>
                    )}
                  </div>
                  <span className="text-[10px] text-t3 shrink-0 pt-0.5">{notif.time}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 text-t3 mx-auto mb-3" />
          <p className="text-[14px] text-t2">No alerts in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
