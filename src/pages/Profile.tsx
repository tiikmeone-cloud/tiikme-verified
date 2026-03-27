import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Copy, Pencil, Download, Shield, ExternalLink,
  Layers, Link2, Users, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = ["Posts", "Projects", "About", "Verifications"] as const;

const mockProjects = [
  {
    title: "TelemedicineRx",
    description: "Telemedicine platform for rural India with AI triage",
    domain: "HealthTech",
    status: "active" as const,
    tech: ["React Native", "Supabase", "Python"],
  },
  {
    title: "SmartGrid Monitor",
    description: "IoT dashboard for electrical grid monitoring",
    domain: "IoT",
    status: "completed" as const,
    tech: ["React", "Node.js", "MQTT"],
  },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Projects");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        {/* Role stripe */}
        <div className="h-1.5 bg-gradient-to-r from-electric via-liquid-blue to-electric" />

        <div className="p-6 sm:p-8">
          {/* Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-electric/20 flex items-center justify-center text-2xl font-bold font-display text-electric ring-2 ring-electric/30">
                AK
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold">Arjun Kumar</h1>
                <Shield className="w-4 h-4 text-neon" />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-electric/20 text-electric">
                  Student
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                  <span className="text-neon font-medium">Open to work</span>
                </span>
              </div>
              <p className="text-sm font-mono text-muted-foreground mt-1">@arjunkumar</p>
              <p className="text-sm text-foreground/80 mt-2">Final year CSE student building at the intersection of health and technology.</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>Delhi, India</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Copy className="w-3 h-3" /> Copy link
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="w-3 h-3" /> Export
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
            {[
              { label: "Projects", value: "4", icon: Layers },
              { label: "Groups", value: "2", icon: Users },
              { label: "Strands", value: "156", icon: Link2 },
              { label: "Score", value: "72", icon: BarChart3 },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-xl font-bold">{stat.value}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <stat.icon className="w-3 h-3" />
                  <span>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="profile-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Projects" && (
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card rounded-xl p-5 border-l-4 ${
                    project.status === "active" ? "border-l-electric" : "border-l-neon"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold">{project.title}</h3>
                        {project.status === "completed" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neon/20 text-neon">
                            Verified Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground glass-card px-2 py-0.5 rounded">{project.domain}</span>
                        {project.tech.map((t) => (
                          <span key={t} className="text-[10px] text-muted-foreground/70 px-2 py-0.5 rounded bg-muted">{t}</span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "Posts" && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No posts yet</p>
              <Button variant="default" size="sm" className="mt-3">Share your first update</Button>
            </div>
          )}

          {activeTab === "About" && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Institution</p>
                <p>Delhi Technological University</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Languages</p>
                <p>Hindi, English, Punjabi</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Journey Stage</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-electric/20 text-electric font-semibold">Final Year</span>
              </div>
            </div>
          )}

          {activeTab === "Verifications" && (
            <div className="space-y-3">
              {[
                { label: "Phone verified", verified: true },
                { label: "Email verified (dtu.ac.in)", verified: true },
                { label: "Institution domain", verified: true },
                { label: "Document verification", verified: false },
              ].map((v) => (
                <div key={v.label} className="flex items-center gap-3 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${v.verified ? "bg-neon/20" : "bg-muted"}`}>
                    <Shield className={`w-3 h-3 ${v.verified ? "text-neon" : "text-muted-foreground"}`} />
                  </div>
                  <span className={v.verified ? "text-foreground" : "text-muted-foreground"}>{v.label}</span>
                  {v.verified && <span className="text-[10px] text-neon font-semibold ml-auto">Verified</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
