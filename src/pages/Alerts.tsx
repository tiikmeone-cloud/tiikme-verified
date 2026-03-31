import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Briefcase, Link2, Shield, TrendingUp, Target, MessageSquare, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  HR: "#6B21A8", Strand: "#4F46E5", Verified: "#F59E0B",
  Work: "#0369A1", Opportunity: "#C2410C", Score: "#5B4FFF", Challenge: "#92400E",
};

const ROLE_BG: Record<string, string> = {
  HR: "#F3E8FF", Strand: "#EEF2FF", Verified: "#FEF3C7",
  Work: "#E0F2FE", Opportunity: "#FFEDD5", Score: "#EDE9FE", Challenge: "#FEF3C7",
};

interface Alert {
  icon: any; title: string; time: string; read: boolean;
  badge: string; hasActions?: boolean;
}

const allAlerts: Alert[] = [
  { icon: Briefcase, title: "Zepto HR viewed your TelemedicineRx work and saved your profile to their talent pool.", time: "2 hours ago", read: false, badge: "HR" },
  { icon: Link2, title: "Priya M. accepted your strand request. You can now message each other.", time: "5 hours ago", read: false, badge: "Strand" },
  { icon: Shield, title: "Prof. Sharma approved SmartGrid Monitor as 'Verified Complete'. Your faculty badge is now live.", time: "Yesterday · 4:32 PM", read: false, badge: "Verified" },
  { icon: Briefcase, title: "TCS Recruiter viewed your profile and 2 projects.", time: "Yesterday", read: false, badge: "HR" },
  { icon: Shield, title: "Email verified! dtu.ac.in domain confirmed.", time: "Yesterday", read: false, badge: "Verified" },
  { icon: Target, title: "Rural Water IoT challenge closes in 12 days. You haven't submitted a solution yet.", time: "2 days ago", read: true, badge: "Challenge" },
  { icon: TrendingUp, title: "Your Activity Score reached 72. You're in the top 30% of your domain.", time: "3 days ago", read: true, badge: "Score" },
  { icon: Link2, title: "Mohan R. sent you a strand request.", time: "3 days ago", read: true, badge: "Strand", hasActions: true },
];

const filterTabs = ["All", "Unread", "Recruiter", "Strands", "Work", "System"];

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [readState, setReadState] = useState<Set<number>>(new Set());
  const [acceptedRequests, setAcceptedRequests] = useState<Set<number>>(new Set());

  const markAllRead = () => {
    const all = new Set(allAlerts.map((_, i) => i));
    setReadState(all);
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-brand" />
          <h1 className="text-[20px] font-bold text-t1">Alerts</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0"
            style={{
              background: activeTab === tab ? "hsl(var(--brand))" : "var(--surface-2)",
              border: `1px solid ${activeTab === tab ? "hsl(var(--brand))" : "var(--border-2)"}`,
              color: activeTab === tab ? "white" : "var(--text-2)",
            }}>
            {tab === "Unread" ? `Unread (${unreadCount})` : tab}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredAlerts.map((notif, i) => {
          const origIdx = allAlerts.indexOf(notif);
          const unread = isUnread(origIdx);
          return (
            <motion.div key={origIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-[var(--border-2)]"
              style={{
                background: unread ? "var(--brand-dim)" : "var(--surface)",
                border: `1px solid var(--border)`,
                borderLeft: unread ? `4px solid hsl(var(--brand))` : `1px solid var(--border)`,
                borderRadius: 16,
              }}
              onClick={() => setReadState(p => new Set(p).add(origIdx))}>
              {/* Unread dot */}
              {unread && <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />}
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${ROLE_COLORS[notif.badge] || "#5B4FFF"}18` }}>
                <notif.icon className="w-4 h-4" style={{ color: ROLE_COLORS[notif.badge] || "#5B4FFF" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] ${unread ? "font-bold text-t1" : "font-medium text-t2"}`}>{notif.title}</p>
                {notif.hasActions && !acceptedRequests.has(origIdx) && (
                  <div className="flex gap-2 mt-2">
                    <Button size="xs" onClick={(e) => { e.stopPropagation(); setAcceptedRequests(p => new Set(p).add(origIdx)); toast.success("Strand accepted!"); }}>
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); toast.info("Declined"); }}>
                      <X className="w-3 h-3" /> Decline
                    </Button>
                  </div>
                )}
                {notif.hasActions && acceptedRequests.has(origIdx) && (
                  <p className="text-[12px] text-brand font-bold mt-1">Accepted ✓</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] text-t3">{notif.time}</span>
                {notif.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: ROLE_BG[notif.badge] || "#EDE9FE", color: ROLE_COLORS[notif.badge] || "#5B4FFF" }}>
                    {notif.badge}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-t3 mx-auto mb-3" />
            <p className="text-[14px] text-t2">No alerts in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
