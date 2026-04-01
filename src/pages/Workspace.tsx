import { useState } from "react";
import { Plus, Users, Layers, MessageCircle, Settings, Hash, Send, Crown, Lock, Rocket, Building2, ChevronDown, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const mockWorkspaces = [
  { id: "1", name: "TelemedicineRx Team", initials: "TR", lastActivity: "2 hours ago", unread: 3, type: "Project", channels: [
    { id: "c1", name: "general", type: "public", members: 4 },
    { id: "c2", name: "dev-updates", type: "public", members: 3 },
  ]},
  { id: "2", name: "Zepto Engineering", initials: "ZE", lastActivity: "Yesterday", unread: 0, type: "Company", channels: [
    { id: "c3", name: "company-wide", type: "public", members: 847 },
    { id: "c4", name: "engineering", type: "restricted", members: 120 },
    { id: "c5", name: "hiring", type: "public", members: 15 },
    { id: "c6", name: "announcements", type: "announcement_only", members: 847 },
  ]},
  { id: "3", name: "DTU CS Club", initials: "DC", lastActivity: "3 days ago", unread: 1, type: "Club" },
];

const discoverWorkspaces = [
  { id: "d1", name: "DTU Announcements", initials: "DA", type: "Institution", members: 4200 },
  { id: "d2", name: "DTU Placement Cell", initials: "DP", type: "Institution", members: 3100 },
];

const mockMembers = [
  { name: "Arjun Kumar", initials: "AK", role: "Admin", color: "#4F46E5", joined: "Jan 2025" },
  { name: "Riya Sharma", initials: "RS", role: "Lead", color: "#4F46E5", joined: "Jan 2025" },
  { name: "Priya Menon", initials: "PM", role: "Member", color: "#92400E", joined: "Feb 2025" },
  { name: "Rahul Kumar", initials: "RK", role: "Member", color: "#0369A1", joined: "Mar 2025" },
  { name: "Sunita Devi", initials: "SD", role: "Alumni", color: "#C2410C", joined: "Nov 2024" },
];

const postTypes = [
  { emoji: "📢", label: "Announcement", type: "announcement" },
  { emoji: "🏆", label: "Achievement", type: "achievement" },
  { emoji: "📦", label: "Update", type: "project_update" },
  { emoji: "💬", label: "Discussion", type: "discussion" },
  { emoji: "🗓", label: "Event", type: "event" },
];

const mockPosts = [
  { id: "1", author: "Riya Sharma", initials: "RS", color: "#4F46E5", type: "achievement", typeLabel: "🏆 Achievement", content: "We won the Smart India Hackathon 2025! Our TelemedicineRx project secured 1st place.", time: "2h ago", sharable: true },
  { id: "2", author: "Arjun Kumar", initials: "AK", color: "#4F46E5", type: "project_update", typeLabel: "📦 Project update", content: "Shipped the offline-first sync module. Now works without internet in rural areas.", time: "5h ago", sharable: true },
  { id: "3", author: "Priya Menon", initials: "PM", color: "#92400E", type: "announcement", typeLabel: "📢 Announcement", content: "Weekly standup moved to Wednesday 6 PM. Please update your availability.", time: "Yesterday", sharable: false },
];

const templates = [
  { id: "project", icon: Rocket, title: "Project Team", desc: "Build something together" },
  { id: "club", icon: Users, title: "Club / Society", desc: "For college groups" },
  { id: "company", icon: Building2, title: "Company Team", desc: "For organisations" },
];

const Workspace = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>("1");
  const [activeTab, setActiveTab] = useState("Feed");
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [createType, setCreateType] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPrivacy, setCreatePrivacy] = useState("members_only");
  const [expandedChannels, setExpandedChannels] = useState<string[]>(["2"]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [searchWs, setSearchWs] = useState("");
  const [mobileShowRight, setMobileShowRight] = useState(false);

  const activeWs = mockWorkspaces.find(w => w.id === selected);
  const tabs = ["Feed", "Projects", "Members", "About"];
  const hasChannels = activeWs?.channels && activeWs.channels.length > 0;

  const selectWs = (id: string) => {
    setSelected(id);
    setActiveTab("Feed");
    setActiveChannel(null);
    setMobileShowRight(true);
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Left panel */}
      <div className={`w-full md:w-[260px] md:shrink-0 flex flex-col ${mobileShowRight ? "hidden md:flex" : "flex"}`}
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-extrabold" style={{ color: "var(--text-1)" }}>Workspaces</h2>
          <button onClick={() => { setShowCreate(true); setCreateStep(0); }} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer active:scale-95" style={{ background: "var(--brand)", color: "white" }}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <input value={searchWs} onChange={e => setSearchWs(e.target.value)} placeholder="Search workspaces..."
            className="w-full h-9 glass-input px-3 text-[12px] outline-none" style={{ color: "var(--text-1)" }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="micro-label px-4 pt-3 pb-1.5">MY WORKSPACES</p>
          {mockWorkspaces.filter(ws => !searchWs || ws.name.toLowerCase().includes(searchWs.toLowerCase())).map(ws => (
            <div key={ws.id}>
              <button onClick={() => selectWs(ws.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer transition-all duration-150"
                style={{ background: selected === ws.id ? "var(--brand-dim)" : "transparent", borderLeft: selected === ws.id ? "3px solid var(--brand)" : "3px solid transparent" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{ws.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>{ws.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{ws.type} · {ws.lastActivity}</p>
                </div>
                {ws.unread > 0 && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--brand)" }} />}
                {ws.channels && (
                  <ChevronDown className={`w-3 h-3 transition-transform shrink-0 ${expandedChannels.includes(ws.id) ? "rotate-180" : ""}`}
                    style={{ color: "var(--text-3)" }}
                    onClick={e => { e.stopPropagation(); setExpandedChannels(p => p.includes(ws.id) ? p.filter(x => x !== ws.id) : [...p, ws.id]); }} />
                )}
              </button>
              {/* Channels */}
              {ws.channels && expandedChannels.includes(ws.id) && (
                <div className="pl-9 pr-3 pb-1">
                  {ws.channels.map(ch => (
                    <button key={ch.id} onClick={() => { setSelected(ws.id); setActiveChannel(ch.id); setActiveTab("Feed"); setMobileShowRight(true); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left cursor-pointer text-[11px]"
                      style={{ background: activeChannel === ch.id ? "var(--surface-2)" : "transparent", color: "var(--text-2)" }}>
                      {ch.type === "restricted" ? <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-3)" }} /> :
                       ch.type === "announcement_only" ? <Globe className="w-3 h-3 shrink-0" style={{ color: "var(--text-3)" }} /> :
                       <Hash className="w-3 h-3 shrink-0" style={{ color: "var(--text-3)" }} />}
                      {ch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="px-4 pt-3">
            <p className="micro-label pb-1.5">DISCOVER</p>
            {discoverWorkspaces.map(ws => (
              <div key={ws.id} className="flex items-center gap-2.5 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{ws.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{ws.name}</p>
                  <p className="text-[9px]" style={{ color: "var(--text-3)" }}>{ws.members} members</p>
                </div>
                <button className="text-[10px] font-bold cursor-pointer" style={{ color: "var(--brand)" }} onClick={() => tiikToast.success("Join request sent")}>Join →</button>
              </div>
            ))}
          </div>

          <div className="p-4 space-y-2">
            <button onClick={() => { setShowCreate(true); setCreateStep(0); }} className="w-full text-[12px] font-semibold py-2 rounded-xl cursor-pointer" style={{ border: "1.5px dashed var(--border-2)", color: "var(--text-3)" }}>+ Create workspace</button>
            <button onClick={() => tiikToast("Enter invite code")} className="w-full text-[11px] cursor-pointer" style={{ color: "var(--brand)" }}>+ Join with code</button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={`flex-1 overflow-y-auto ${mobileShowRight ? "flex flex-col" : "hidden md:flex md:flex-col"}`} style={{ background: "var(--bg)" }}>
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <Users className="w-14 h-14 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <h2 className="text-[20px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Your collaborative spaces</h2>
              <p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>Workspaces let you build, share, and track projects with your team.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setCreateType(t.id); setShowCreate(true); setCreateStep(1); }}
                    className="t-card t-card-hover p-5 text-center cursor-pointer">
                    <t.icon className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--brand)" }} />
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{t.title}</p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>{t.desc}</p>
                  </button>
                ))}
              </div>
              <Link to="/app/explore" className="text-[13px] font-semibold mt-4 inline-flex items-center gap-1" style={{ color: "var(--brand)" }}>
                Browse workspaces <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto w-full px-4 py-5">
            {/* Mobile back */}
            <button onClick={() => setMobileShowRight(false)} className="md:hidden flex items-center gap-1 mb-3 text-[13px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>
              ← Workspaces
            </button>

            {/* Header */}
            <div className="t-card p-4 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{activeWs?.initials}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>{activeWs?.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{activeWs?.type}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{mockMembers.length} members · 2 projects</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => tiikToast("Compose post")}>Post</Button>
                  <Button variant="secondary" size="sm" onClick={() => tiikToast("Invite member")}>Add member</Button>
                  <Button variant="ghost" size="sm" onClick={() => tiikToast("Workspace settings")}><Settings className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex mb-4 overflow-x-auto scrollbar-hide" style={{ borderBottom: "1px solid var(--border)" }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className="py-2.5 px-4 text-[12px] font-semibold relative cursor-pointer shrink-0"
                  style={{ color: activeTab === t ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === t ? "2px solid var(--brand)" : "2px solid transparent" }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Feed */}
            {activeTab === "Feed" && (
              <div className="space-y-3">
                {/* Post type selector + compose */}
                <div className="t-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "var(--brand)" }}>AK</div>
                    <button onClick={() => tiikToast("Opening compose...")} className="flex-1 text-left text-[12px] h-9 glass-input px-3 cursor-pointer" style={{ color: "var(--text-3)" }}>
                      Share with {activeWs?.name}...
                    </button>
                  </div>
                  <div className="flex gap-1.5 ml-10 overflow-x-auto scrollbar-hide">
                    {postTypes.map(pt => (
                      <button key={pt.type} onClick={() => tiikToast(`Creating ${pt.label}...`)}
                        className="shrink-0 text-[10px] font-semibold h-7 px-2.5 rounded-full cursor-pointer active:scale-95"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                        {pt.emoji} {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeChannel && (
                  <div className="flex items-center gap-2 px-1">
                    <Hash className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
                    <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{activeWs?.channels?.find(c => c.id === activeChannel)?.name}</span>
                    <button onClick={() => setActiveChannel(null)} className="text-[10px] cursor-pointer" style={{ color: "var(--brand)" }}>Show all</button>
                  </div>
                )}

                {mockPosts.map(post => (
                  <article key={post.id} className="t-card t-card-hover p-4" style={{ borderLeft: post.type === "announcement" ? "3px solid #F59E0B" : post.type === "achievement" ? "3px solid var(--brand)" : undefined }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <Link to="/app/profile"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: post.color }}>{post.initials}</div></Link>
                      <div className="flex-1 min-w-0">
                        <Link to="/app/profile" className="text-[12px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{post.author}</Link>
                        <span className="text-[10px] ml-1.5" style={{ color: "var(--text-3)" }}>{post.time}</span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{post.typeLabel}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{post.content}</p>
                    {post.sharable && (
                      <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <button onClick={() => tiikToast.success("Shared to your feed")} className="text-[11px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>Share to my Feed</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {/* Projects */}
            {activeTab === "Projects" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[{ name: "TelemedicineRx", status: "Active", owner: "Arjun K.", domain: "HealthTech" }, { name: "Health Camp Tracker", status: "Planning", owner: "Riya S.", domain: "Health" }].map(p => (
                  <Link key={p.name} to="/app/teams/1" className="t-card t-card-hover p-4 block">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4" style={{ color: "var(--brand)" }} />
                      <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: p.status === "Active" ? "rgba(16,185,129,0.1)" : "var(--brand-dim)", color: p.status === "Active" ? "#10B981" : "var(--brand)" }}>{p.status}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{p.domain} · by {p.owner}</span>
                    </div>
                    <div className="flex -space-x-1.5 mt-2">
                      {mockMembers.slice(0, 3).map(m => (
                        <div key={m.name} className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: m.color, border: "2px solid var(--surface)" }}>{m.initials}</div>
                      ))}
                    </div>
                  </Link>
                ))}
                <button onClick={() => tiikToast("Link project from My Work")} className="rounded-2xl p-6 text-center cursor-pointer" style={{ border: "2px dashed var(--border-2)" }}>
                  <Plus className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--text-3)" }} />
                  <p className="text-[12px]" style={{ color: "var(--text-2)" }}>Link a project</p>
                </button>
              </div>
            )}

            {/* Members */}
            {activeTab === "Members" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <Button size="sm" variant="secondary" onClick={() => tiikToast("Invite by phone/email")}>Invite member</Button>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText("tiikme.in/ws/invite/abc123"); tiikToast.success("Invite link copied"); }}>Copy invite link</Button>
                </div>
                <div className="space-y-1">
                  {mockMembers.filter(m => !m.role.includes("Alumni")).map(m => (
                    <div key={m.name} className="flex items-center gap-2.5 py-2.5 px-2 rounded-xl" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Link to="/app/profile"><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: m.color }}>{m.initials}</div></Link>
                      <div className="flex-1 min-w-0">
                        <Link to="/app/profile" className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{m.name}</Link>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Joined {m.joined}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: m.role === "Admin" ? "rgba(245,158,11,0.1)" : "var(--surface-2)", color: m.role === "Admin" ? "#F59E0B" : "var(--text-2)" }}>
                        {m.role === "Lead" && <Crown className="w-2.5 h-2.5" />}{m.role}
                      </span>
                      <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => navigate("/app/pings")}><MessageCircle className="w-3 h-3 mr-1" />Ping</Button>
                    </div>
                  ))}
                  {/* Alumni */}
                  {mockMembers.filter(m => m.role === "Alumni").length > 0 && (
                    <>
                      <p className="micro-label pt-3 pb-1">ALUMNI</p>
                      {mockMembers.filter(m => m.role === "Alumni").map(m => (
                        <div key={m.name} className="flex items-center gap-2.5 py-2 px-2 opacity-60">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                          <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{m.name}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full ml-auto" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>Alumni</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {activeTab === "About" && (
              <div className="t-card p-5">
                <h3 className="text-[15px] font-bold mb-3" style={{ color: "var(--text-1)" }}>About {activeWs?.name}</h3>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-2)" }}>Building a telemedicine platform for rural India with AI triage and offline-first sync capabilities.</p>
                <div className="space-y-2 text-[12px]" style={{ color: "var(--text-3)" }}>
                  <p>Type: {activeWs?.type} workspace</p>
                  <p>Created: Jan 2025 by Arjun Kumar</p>
                  <p>Privacy: Members only</p>
                  <p>Institution: <Link to="/app/institution/1" className="hover:underline" style={{ color: "var(--brand)" }}>Delhi Technological University</Link></p>
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <Button variant="ghost" className="w-full text-[12px]" style={{ color: "#DC2626" }} onClick={() => tiikToast("Leave workspace?")}>Leave workspace</Button>
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
                  <h2 className="text-[17px] font-extrabold mb-4" style={{ color: "var(--text-1)" }}>Choose workspace type</h2>
                  <div className="space-y-2.5">
                    {templates.map(t => (
                      <button key={t.id} onClick={() => { setCreateType(t.id); setCreateStep(1); }}
                        className="w-full t-card t-card-hover p-4 text-left flex items-center gap-3 cursor-pointer">
                        <t.icon className="w-7 h-7" style={{ color: "var(--brand)" }} />
                        <div>
                          <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{t.title}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {createStep === 1 && (
                <>
                  <h2 className="text-[17px] font-extrabold mb-4" style={{ color: "var(--text-1)" }}>Create workspace</h2>
                  <div className="space-y-3">
                    <div><label className="micro-label block mb-1">Name *</label><Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. AgriSense Project Team" /></div>
                    <div><label className="micro-label block mb-1">Description</label>
                      <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value.slice(0, 200))} placeholder="What is this workspace for?" rows={2} maxLength={200}
                        className="w-full rounded-xl p-3 text-[12px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                      <p className="text-[10px] text-right" style={{ color: "var(--text-3)" }}>{createDesc.length}/200</p>
                    </div>
                    <div>
                      <label className="micro-label block mb-1">Privacy</label>
                      <div className="flex gap-2">
                        {[{ v: "public", l: "Public" }, { v: "members_only", l: "Members only" }, { v: "invite_only", l: "Invite only" }].map(o => (
                          <button key={o.v} onClick={() => setCreatePrivacy(o.v)}
                            className="flex-1 py-2 rounded-lg text-[11px] font-semibold cursor-pointer"
                            style={{ background: createPrivacy === o.v ? "var(--brand-dim)" : "var(--surface-2)", border: createPrivacy === o.v ? "1px solid var(--brand)" : "1px solid var(--border)", color: createPrivacy === o.v ? "var(--brand)" : "var(--text-2)" }}>
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setCreateStep(0)}>Back</Button>
                      <Button className="flex-1" disabled={!createName.trim()} onClick={() => { setCreateStep(2); }}>Next</Button>
                    </div>
                  </div>
                </>
              )}
              {createStep === 2 && (
                <>
                  <h2 className="text-[17px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Invite members</h2>
                  <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>Add team members by email or phone</p>
                  <textarea placeholder="Enter emails or phone numbers (one per line)" rows={3}
                    className="w-full rounded-xl p-3 text-[12px] outline-none resize-none mb-3" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                  <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setCreateStep(1)}>Back</Button>
                    <Button className="flex-1" onClick={() => { setShowCreate(false); tiikToast.success(`"${createName || "New workspace"}" created!`); setCreateName(""); setCreateDesc(""); }}>Create workspace</Button>
                  </div>
                  <button onClick={() => { setShowCreate(false); tiikToast.success(`"${createName || "New workspace"}" created!`); setCreateName(""); setCreateDesc(""); }}
                    className="w-full text-[12px] mt-2 cursor-pointer" style={{ color: "var(--text-3)" }}>Skip — I'll invite later</button>
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
