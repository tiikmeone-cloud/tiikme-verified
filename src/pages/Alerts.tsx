import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Users, Zap, MessageSquare, Briefcase, TrendingUp, CheckCircle, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const filterTabs = ["All", "Unread (5)", "Recruiter", "Strands", "Project"];

const notifications = [
  { icon: Briefcase, color: "#FF6B6B", title: "Zepto HR viewed your TelemedicineRx project and saved your profile to their talent pool.", desc: "", time: "2 hours ago", read: false, badge: "HR", badgeColor: "#FF6B6B" },
  { icon: Users, color: "#7C6FFF", title: "Priya M. accepted your strand request. You can now message each other.", desc: "", time: "5 hours ago", read: false, badge: "Strand", badgeColor: "#7C6FFF" },
  { icon: CheckCircle, color: "#00FFB2", title: "Prof. Sharma approved SmartGrid Monitor as 'Verified Complete'. Your faculty badge is now live.", desc: "", time: "Yesterday · 4:32 PM", read: false, badge: "Verified", badgeColor: "#00FFB2" },
  { icon: Briefcase, color: "#FF6B6B", title: "TCS Recruiter viewed your profile and 2 projects.", desc: "", time: "Yesterday", read: false, badge: "HR", badgeColor: "#FF6B6B" },
  { icon: Shield, color: "#00FFB2", title: "Email verified! dtu.ac.in domain confirmed.", desc: "", time: "Yesterday", read: false, badge: "Verified", badgeColor: "#00FFB2" },
  { icon: AlertCircle, color: "#FFB547", title: "Rural Water IoT challenge closes in 12 days. You haven't submitted a solution yet.", desc: "", time: "2 days ago", read: true, badge: "Challenge", badgeColor: "#FFB547" },
  { icon: TrendingUp, color: "#7C6FFF", title: "Your Activity Score reached 72. You're in the top 30% of your domain.", desc: "", time: "3 days ago", read: true, badge: "", badgeColor: "" },
  { icon: Users, color: "#4FC3F7", title: "Mohan R. sent you a strand request.", desc: "", time: "3 days ago", read: true, badge: "Strand", badgeColor: "#7C6FFF", hasActions: true },
];

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-electric" />
          <h1 className="text-[28px] font-bold">Alerts</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => toast.success("All notifications marked as read")}>
          Mark all read
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0"
            style={{
              background: activeTab === tab ? "#7C6FFF" : "rgba(255,255,255,0.06)",
              border: `1px solid ${activeTab === tab ? "#7C6FFF" : "rgba(255,255,255,0.12)"}`,
              color: activeTab === tab ? "white" : "rgba(240,240,255,0.6)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {notifications.map((notif, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)]"
            style={{
              borderLeft: !notif.read ? `3px solid ${notif.color}` : undefined,
              background: !notif.read ? "rgba(255,255,255,0.08)" : undefined,
            }}
          >
            {/* Unread dot */}
            {!notif.read && <span className="w-2 h-2 rounded-full bg-neon shrink-0 mt-2" />}
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${notif.color}22` }}>
              <notif.icon className="w-4 h-4" style={{ color: notif.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notif.read ? "font-bold" : "font-medium"}`}>{notif.title}</p>
              {(notif as any).hasActions && (
                <div className="flex gap-2 mt-2">
                  <Button size="xs" onClick={() => toast.success("Strand accepted!")}>
                    <Check className="w-3 h-3" /> Accept
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => toast.info("Declined")}>
                    <X className="w-3 h-3" /> Decline
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">{notif.time}</span>
              {notif.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${notif.badgeColor}22`, color: notif.badgeColor }}>
                  {notif.badge}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
