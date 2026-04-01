import { useState } from "react";
import { Plus, Users, Layers, MessageCircle, Settings, Hash, Send, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const mockWorkspaces = [
  { id: "1", name: "TelemedicineRx Team", initials: "TR", lastActivity: "2 hours ago", unread: 3, type: "Project" },
  { id: "2", name: "DTU CS Club", initials: "DC", lastActivity: "Yesterday", unread: 0, type: "Club" },
  { id: "3", name: "DTU Announcements", initials: "DA", lastActivity: "3 days ago", unread: 1, type: "Institution" },
];

const mockMembers = [
  { name: "Arjun Kumar", initials: "AK", role: "Admin", color: "#4F46E5", joined: "Jan 2025" },
  { name: "Riya Sharma", initials: "RS", role: "Lead", color: "#4F46E5", joined: "Jan 2025" },
  { name: "Priya Menon", initials: "PM", role: "Member", color: "#92400E", joined: "Feb 2025" },
  { name: "Rahul Kumar", initials: "RK", role: "Member", color: "#0369A1", joined: "Mar 2025" },
];

const mockPosts = [
  { id: "1", author: "Riya Sharma", initials: "RS", color: "#4F46E5", type: "🏆 Achievement", content: "We won the Smart India Hackathon 2025! Our TelemedicineRx project secured 1st place.", time: "2h ago" },
  { id: "2", author: "Arjun Kumar", initials: "AK", color: "#4F46E5", type: "📦 Project update", content: "Shipped the offline-first sync module. Now works without internet in rural areas.", time: "5h ago" },
  { id: "3", author: "Priya Menon", initials: "PM", color: "#92400E", type: "📢 Announcement", content: "Weekly standup moved to Wednesday 6 PM. Please update your availability.", time: "Yesterday" },
];

const templates = [
  { id: "project", icon: Layers, title: "Project Team", desc: "Small team building together" },
  { id: "class", icon: Users, title: "Class / Batch", desc: "Students + faculty learning together" },
  { id: "department", icon: Hash, title: "Department", desc: "Company or hospital team" },
];

const Workspace = () => {
  const [selected, setSelected] = useState<string | null>("1");
  const [activeTab, setActiveTab] = useState("Feed");
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [createType, setCreateType] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const activeWs = mockWorkspaces.find(w => w.id === selected);
  const tabs = ["Feed", "Projects", "Members", "About"];

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Left panel */}
      <div className="w-[280px] shrink-0 flex flex-col" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-extrabold" style={{ color: "var(--text-1)" }}>Workspaces</h2>
          <button onClick={() => { setShowCreate(true); setCreateStep(0); }} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer active:scale-95" style={{ background: "var(--brand)", color: "white" }}><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <p className="micro-label px-4 pt-3 pb-1.5">YOUR WORKSPACES</p>
          {mockWorkspaces.map(ws => (
            <button key={ws.id} onClick={() => setSelected(ws.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-all duration-150"
              style={{ background: selected === ws.id ? "var(--brand-dim)" : "transparent", borderLeft: selected === ws.id ? "3px solid var(--brand)" : "3px solid transparent", borderBottom: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{ws.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{ws.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{ws.lastActivity}</p>
              </div>
              {ws.unread > 0 && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--brand)" }} />}
            </button>
          ))}
          <div className="p-4 space-y-2">
            <button onClick={() => { setShowCreate(true); setCreateStep(0); }} className="w-full text-[13px] font-semibold py-2.5 rounded-xl cursor-pointer" style={{ border: "1.5px dashed var(--border-2)", color: "var(--text-3)" }}>+ Create workspace</button>
            <button onClick={() => tiikToast("Join with code")} className="w-full text-[12px] cursor-pointer" style={{ color: "var(--brand)" }}>+ Join with code</button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg)" }}>
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-3)" }} />
              <h2 className="text-[22px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Your collaborative spaces</h2>
              <p className="text-[14px] mb-6" style={{ color: "var(--text-2)" }}>Workspaces let you build, share, and track projects with your team.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setCreateType(t.id); setShowCreate(true); setCreateStep(1); }}
                    className="t-card t-card-hover p-5 text-center cursor-pointer">
                    <t.icon className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--brand)" }} />
                    <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{t.title}</p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto px-4 py-6">
            {/* Header */}
            <div className="t-card p-5 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[18px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{activeWs?.initials}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>{activeWs?.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{activeWs?.type}</span>
                    <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{mockMembers.length} members · 2 projects</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => tiikToast("Compose post")}>Post</Button>
                  <Button variant="secondary" size="sm" onClick={() => tiikToast("Invite member")}>Add member</Button>
                  <Button variant="ghost" size="sm" onClick={() => tiikToast("Workspace settings")}><Settings className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className="py-3 px-4 text-[13px] font-semibold relative cursor-pointer"
                  style={{ color: activeTab === t ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === t ? "3px solid var(--brand)" : "3px solid transparent" }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Feed */}
            {activeTab === "Feed" && (
              <div className="space-y-3">
                {mockPosts.map(post => (
                  <article key={post.id} className="t-card t-card-hover p-4" style={{ borderLeft: post.type.includes("Announcement") ? "4px solid #F59E0B" : undefined }}>
                    <div className="flex items-center gap-3 mb-2">
                      <Link to="/app/profile"><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: post.color }}>{post.initials}</div></Link>
                      <div className="flex-1 min-w-0">
                        <Link to="/app/profile" className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{post.author}</Link>
                        <span className="text-[11px] ml-2" style={{ color: "var(--text-3)" }}>{post.time}</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{post.type}</span>
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{post.content}</p>
                    <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                      <button onClick={() => tiikToast.success("Shared to feed")} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>Share to my Feed</button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Projects */}
            {activeTab === "Projects" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[{ name: "TelemedicineRx", status: "Active", owner: "Arjun K." }, { name: "Health Camp Tracker", status: "Planning", owner: "Riya S." }].map(p => (
                  <Link key={p.name} to="/app/teams/1" className="t-card t-card-hover p-4 block">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5" style={{ color: "var(--brand)" }} />
                      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: p.status === "Active" ? "rgba(16,185,129,0.1)" : "var(--brand-dim)", color: p.status === "Active" ? "#10B981" : "var(--brand)" }}>{p.status}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>by {p.owner}</span>
                    </div>
                  </Link>
                ))}
                <button onClick={() => tiikToast("Link project")} className="rounded-2xl p-6 text-center cursor-pointer" style={{ border: "2px dashed var(--border-2)" }}>
                  <Plus className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--text-3)" }} />
                  <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Link a project</p>
                </button>
              </div>
            )}

            {/* Members */}
            {activeTab === "Members" && (
              <div className="space-y-1">
                {mockMembers.map(m => (
                  <div key={m.name} className="flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Link to="/app/profile"><div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: m.color }}>{m.initials}</div></Link>
                    <div className="flex-1 min-w-0">
                      <Link to="/app/profile" className="text-[14px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{m.name}</Link>
                      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Joined {m.joined}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: m.role === "Admin" ? "rgba(245,158,11,0.1)" : "var(--surface-2)", color: m.role === "Admin" ? "#F59E0B" : "var(--text-2)" }}>
                      {m.role === "Lead" && <Crown className="w-3 h-3" />}{m.role}
                    </span>
                    <Button variant="ghost" size="xs" onClick={() => tiikToast("Opening Ping...")}><MessageCircle className="w-3 h-3" /> Ping</Button>
                  </div>
                ))}
              </div>
            )}

            {/* About */}
            {activeTab === "About" && (
              <div className="t-card p-5">
                <h3 className="text-[16px] font-bold mb-3" style={{ color: "var(--text-1)" }}>About {activeWs?.name}</h3>
                <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--text-2)" }}>Building a telemedicine platform for rural India with AI triage and offline-first sync capabilities.</p>
                <div className="space-y-2 text-[13px]" style={{ color: "var(--text-3)" }}>
                  <p>Type: {activeWs?.type} workspace</p>
                  <p>Created: Jan 2025 by Arjun Kumar</p>
                  <p>Privacy: Members only</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              {createStep === 0 && (
                <>
                  <h2 className="text-[18px] font-extrabold mb-4" style={{ color: "var(--text-1)" }}>Choose workspace type</h2>
                  <div className="space-y-3">
                    {templates.map(t => (
                      <button key={t.id} onClick={() => { setCreateType(t.id); setCreateStep(1); }}
                        className="w-full t-card t-card-hover p-4 text-left flex items-center gap-3 cursor-pointer">
                        <t.icon className="w-8 h-8" style={{ color: "var(--brand)" }} />
                        <div>
                          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{t.title}</p>
                          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {createStep === 1 && (
                <>
                  <h2 className="text-[18px] font-extrabold mb-4" style={{ color: "var(--text-1)" }}>Create workspace</h2>
                  <div className="space-y-3">
                    <div><label className="micro-label block mb-1.5">Name</label><Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. AgriSense Project Team" /></div>
                    <div><label className="micro-label block mb-1.5">Description</label>
                      <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="What is this workspace for?" rows={2}
                        className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setCreateStep(0)}>Back</Button>
                      <Button className="flex-1" onClick={() => { setShowCreate(false); tiikToast.success(`"${createName || "New workspace"}" created!`); }}>Create workspace</Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workspace;
