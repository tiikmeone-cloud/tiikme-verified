import { motion } from "framer-motion";
import { Bell, Shield, Users, Zap, MessageSquare } from "lucide-react";

const notifications = [
  { icon: Users, color: "#FF6B6B", title: "Kavita Rao wants to connect", desc: "HR Recruiter at TCS", time: "5m ago", read: false },
  { icon: Shield, color: "#00FFB2", title: "Email verified!", desc: "dtu.ac.in domain confirmed", time: "1h ago", read: false },
  { icon: Zap, color: "#FFB547", title: "New challenge posted", desc: "Smart Traffic AI — ₹30,000 reward", time: "3h ago", read: false },
  { icon: MessageSquare, color: "#7C6FFF", title: "Priya commented on TelemedicineRx", desc: '"Great progress on the triage module!"', time: "6h ago", read: true },
  { icon: Users, color: "#4FC3F7", title: "Rahul accepted your strand", desc: "You can now message each other", time: "1d ago", read: true },
];

const Alerts = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Bell className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Alerts</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Stay updated on your connections, projects, and challenges.
      </p>

      <div className="space-y-2">
        {notifications.map((notif, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`glass-card rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] ${
              !notif.read ? "border-l-[3px]" : ""
            }`}
            style={!notif.read ? { borderLeftColor: notif.color } : {}}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${notif.color}22` }}>
              <notif.icon className="w-4 h-4" style={{ color: notif.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notif.read ? "font-bold" : "font-medium"}`}>{notif.title}</p>
              <p className="text-xs text-muted-foreground">{notif.desc}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{notif.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
