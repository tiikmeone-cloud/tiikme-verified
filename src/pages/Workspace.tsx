import { useState, useEffect } from "react";
import { Plus, Users, Layers, MessageCircle, Settings, Hash, Send, Crown, Lock, Rocket, Building2, ChevronDown, Globe, ArrowRight, X, Link2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { supabase } from "@/integrations/supabase/client";

const postTypes = [
  { emoji: "📢", label: "Announcement", type: "announcement" },
  { emoji: "🏆", label: "Achievement", type: "achievement" },
  { emoji: "📦", label: "Update", type: "project_update" },
  { emoji: "💬", label: "Discussion", type: "discussion" },
  { emoji: "🗓", label: "Event", type: "event" },
];

const defaultVisibility: Record<string, string> = {
  announcement: "team",
  achievement: "followers",
  project_update: "followers",
  discussion: "team",
  event: "team",
};

const templates = [
  { id: "project", icon: Rocket, title: "Project Team", desc: "Build something together" },
  { id: "club", icon: Users, title: "Club / Society", desc: "For college groups" },
  { id: "company", icon: Building2, title: "Company Team", desc: "For organisations" },
];

const Workspace = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, initials: userInitials } = useAuth();
  const { workspaces: realWorkspaces, loading: wsLoading, members: realMembers, fetchMembers, createWorkspace } = useWorkspaces(user?.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Feed");
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [createType, setCreateType] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPrivacy, setCreatePrivacy] = useState("members_only");
  const [searchWs, setSearchWs] = useState("");
  const [mobileShowRight, setMobileShowRight] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeType, setComposeType] = useState("discussion");
  const [composeVisibility, setComposeVisibility] = useState("team");
  const [posts, setPosts] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");
  const [settingsPrivacy, setSettingsPrivacy] = useState("members_only");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [expandedChannels, setExpandedChannels] = useState<string[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  

  // Members: use real data only
  const members = realMembers.map(m => ({
    id: m.id,
    name: m.profile?.full_name || m.profile?.username || "User",
    initials: (m.profile?.full_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    role: m.role === "admin" ? "Admin" : "Member",
    color: "#4F46E5",
    joined: m.joined_at ? new Date(m.joined_at).toLocaleDateString("en", { month: "short", year: "numeric" }) : "",
    stranded: false,
  }));

  const handleJoinDiscover = (id: string, privacy: string) => {
    tiikToast.success(privacy === "public" ? "Joined ✓" : "Join request sent ✓");
  };

  const handleStrand = (memberId: string) => {
    tiikToast.success("Strand request sent ✓");
  };

  // Use real workspaces only
  const displayWorkspaces = realWorkspaces.map(ws => ({
    id: ws.id,
    name: ws.name,
    initials: ws.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    lastActivity: ws.created_at ? new Date(ws.created_at).toLocaleDateString() : "",
    unread: 0,
    type: ws.type || "Project",
    channels: [] as any[],
  }));

  const activeWs = displayWorkspaces.find(w => w.id === selected);
  const tabs = ["Feed", "Projects", "Members", "About"];

  // Load members when workspace changes
  useEffect(() => {
    if (selected && realWorkspaces.some(w => w.id === selected)) {
      fetchMembers(selected);
    }
  }, [selected, realWorkspaces, fetchMembers]);

  // Load workspace posts
  useEffect(() => {
    if (!selected) return;
    const loadPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, author:profiles!author_id(id, full_name, username, avatar_url, role)")
        .eq("workspace_id", selected)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setPosts(data);
    };
    loadPosts();
  }, [selected]);

  const selectWs = (id: string) => {
    setSelected(id);
    setActiveTab("Feed");
    setMobileShowRight(true);
  };

  const handlePost = async () => {
    if (!composeText.trim() || !user) return;
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: composeText.trim(),
        post_type: composeType,
        type: composeType,
        visibility: composeVisibility === "public" ? "everyone" : "workspace",
        workspace_id: selected,
        workspace_name: activeWs?.name || "",
      })
      .select("*, author:profiles!author_id(id, full_name, username, avatar_url, role)")
      .single();
    if (!error && data) {
      setPosts(prev => [data, ...prev]);
      setComposeText("");
      setComposeOpen(false);
      tiikToast.success("Posted ✓");
    } else {
      tiikToast.error("Failed to post");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!createName.trim()) return;
    const ws = await createWorkspace(createName, createDesc, createType || "project", createPrivacy);
    if (ws) {
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
      setSelected(ws.id);
      setMobileShowRight(true);
      tiikToast.success("Workspace created ✓");
    } else {
      tiikToast.error("Failed to create workspace");
    }
  };

  const handleShareToFeed = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_shared_to_feed: true } : p));
    setShowShareConfirm(null);
    tiikToast.success("Shared to your feed ✓");
  };

  const handleLeave = async () => {
    if (user && selected) {
      await supabase.from("workspace_members").update({ status: "left", left_at: new Date().toISOString() }).eq("workspace_id", selected).eq("user_id", user.id);
    }
    setShowLeaveConfirm(false);
    setSelected(null);
    setMobileShowRight(false);
    tiikToast("You've left the workspace.");
  };

  const visIcons = { team: Lock, followers: Users, public: Globe };
  const visLabels = { team: "Team only", followers: "Followers", public: "Public feed" };

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

        <div className="px-3 pt-3 pb-1">
          <input value={searchWs} onChange={e => setSearchWs(e.target.value)} placeholder="Search workspaces..."
            className="w-full h-9 glass-input px-3 text-[12px] outline-none" style={{ color: "var(--text-1)" }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="micro-label px-4 pt-3 pb-1.5">MY WORKSPACES</p>
          {displayWorkspaces.filter(ws => !searchWs || ws.name.toLowerCase().includes(searchWs.toLowerCase())).map(ws => (
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
              {ws.channels && expandedChannels.includes(ws.id) && (
                <div className="pl-9 pr-3 pb-1">
                  {ws.channels.map(ch => (
                    <button key={ch.id} onClick={() => { setSelected(ws.id); setActiveChannel(ch.id); setActiveTab("Feed"); setMobileShowRight(true); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left cursor-pointer text-[11px]"
                      style={{ background: activeChannel === ch.id ? "var(--surface-2)" : "transparent", color: activeChannel === ch.id ? "var(--brand)" : "var(--text-2)", fontWeight: activeChannel === ch.id ? 700 : 400 }}>
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


          <div className="p-4">
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
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{members.filter(m => m.role !== "Alumni").length} members · 2 projects</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => { setComposeOpen(true); setComposeType("discussion"); setComposeVisibility("team"); }}>Post</Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>Add member</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSettingsName(activeWs?.name || ""); setSettingsDesc(""); setSettingsPrivacy("members_only"); setShowSettings(true); }}><Settings className="w-4 h-4" /></Button>
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
                {/* Compose */}
                <div className="t-card p-3">
                  {!composeOpen ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" style={{ background: "var(--brand)" }}>
                          {authProfile?.avatar_url ? <img src={authProfile.avatar_url} alt="" className="w-full h-full object-cover" /> : userInitials}
                        </div>
                        <button onClick={() => setComposeOpen(true)} className="flex-1 text-left text-[12px] h-9 glass-input px-3 cursor-pointer" style={{ color: "var(--text-3)" }}>
                          {activeChannel ? `Post to #${activeWs?.channels?.find(c => c.id === activeChannel)?.name}...` : `Share with ${activeWs?.name}...`}
                        </button>
                      </div>
                      <div className="flex gap-1.5 ml-10 overflow-x-auto scrollbar-hide">
                        {postTypes.map(pt => (
                          <button key={pt.type} onClick={() => { setComposeType(pt.type); setComposeVisibility(defaultVisibility[pt.type] || "team"); setComposeOpen(true); }}
                            className="shrink-0 text-[10px] font-semibold h-7 px-2.5 rounded-full cursor-pointer active:scale-95"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                            {pt.emoji} {pt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" style={{ background: "var(--brand)" }}>
                          {authProfile?.avatar_url ? <img src={authProfile.avatar_url} alt="" className="w-full h-full object-cover" /> : userInitials}
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                          {postTypes.map(pt => (
                            <button key={pt.type} onClick={() => { setComposeType(pt.type); if (pt.type !== "discussion") setComposeVisibility(defaultVisibility[pt.type] || "team"); else setComposeVisibility("team"); }}
                              className="shrink-0 text-[10px] font-semibold h-7 px-2.5 rounded-full cursor-pointer"
                              style={{ background: composeType === pt.type ? "var(--brand-dim)" : "var(--surface-2)", border: composeType === pt.type ? "1px solid var(--brand)" : "1px solid var(--border)", color: composeType === pt.type ? "var(--brand)" : "var(--text-2)" }}>
                              {pt.emoji} {pt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea value={composeText} onChange={e => setComposeText(e.target.value)} placeholder={`Share with ${activeWs?.name}...`} rows={3}
                        className="w-full rounded-xl p-3 text-[13px] outline-none resize-none mb-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} autoFocus />
                      
                      {/* Visibility selector */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-3)" }}>Who sees this:</span>
                        {(["team", "followers", "public"] as const).map(v => {
                          const VisIcon = visIcons[v];
                          const locked = composeType === "discussion" && v !== "team";
                          return (
                            <button key={v} disabled={locked} onClick={() => !locked && setComposeVisibility(v)}
                              className="text-[10px] font-semibold h-7 px-2.5 rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                              style={{ background: composeVisibility === v ? "var(--brand-dim)" : "var(--surface-2)", border: composeVisibility === v ? "1px solid var(--brand)" : "1px solid var(--border)", color: composeVisibility === v ? "var(--brand)" : "var(--text-2)" }}>
                              <VisIcon className="w-3 h-3" /> {visLabels[v]}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setComposeOpen(false)}>Cancel</Button>
                        <Button size="sm" disabled={!composeText.trim()} onClick={handlePost}>Post</Button>
                      </div>
                    </div>
                  )}
                </div>

                {activeChannel && (
                  <div className="flex items-center gap-2 px-1">
                    <Hash className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
                    <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{activeWs?.channels?.find(c => c.id === activeChannel)?.name}</span>
                    <button onClick={() => setActiveChannel(null)} className="text-[10px] cursor-pointer" style={{ color: "var(--brand)" }}>Show all</button>
                  </div>
                )}

                {posts.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>No posts yet</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Be the first to share with this workspace.</p>
                  </div>
                )}
                {posts.map(post => {
                  const author = post.author as any;
                  const authorName = author?.full_name || author?.username || "User";
                  const authorInitials = authorName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  const ROLE_COLORS: Record<string, string> = { student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490", government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8", faculty: "#92400E" };
                  const authorColor = ROLE_COLORS[author?.role || ""] || "#6B7280";
                  const timeAgo = post.created_at ? (() => { const s = Math.floor((Date.now() - new Date(post.created_at).getTime()) / 1000); if (s < 60) return "just now"; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; })() : "";
                  return (
                    <article key={post.id} className="t-card t-card-hover p-4" style={{ borderLeft: post.type === "announcement" ? "3px solid #F59E0B" : post.type === "achievement" ? "3px solid var(--brand)" : undefined }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <Link to={`/app/profile/${author?.id || ""}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform overflow-hidden" style={{ backgroundColor: authorColor }}>
                            {author?.avatar_url ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" /> : authorInitials}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/app/profile/${author?.id || ""}`} className="text-[12px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{authorName}</Link>
                          <span className="text-[10px] ml-1.5" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {post.visibility === "workspace" && <Lock className="w-3 h-3" style={{ color: "var(--text-3)" }} />}
                          {post.visibility === "everyone" && <Globe className="w-3 h-3" style={{ color: "#F59E0B" }} />}
                          {post.post_type && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{post.post_type}</span>}
                        </div>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{post.content}</p>
                      {!post.is_shared_to_feed && post.visibility === "everyone" && (
                        <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                          <button onClick={() => setShowShareConfirm(post.id)} className="text-[11px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>Share to my Feed</button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Projects - show real work items linked to workspace */}
            {activeTab === "Projects" && (
              <div className="text-center py-10">
                <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
                <p className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No projects linked yet</p>
                <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>Link projects from My Work to this workspace.</p>
                <Button variant="secondary" size="sm" onClick={() => navigate("/app/teams")}>Go to My Work</Button>
              </div>
            )}

            {/* Members */}
            {activeTab === "Members" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <Button size="sm" variant="secondary" onClick={() => setShowInvite(true)}>Invite member</Button>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText("tiikme.in/join/abc123"); tiikToast.success("Invite link copied"); }}>Copy invite link</Button>
                </div>
                <div className="space-y-1">
                  {members.filter(m => m.role !== "Alumni").map(m => (
                    <div key={m.id} className="flex items-center gap-2.5 py-2.5 px-2 rounded-xl" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Link to="/app/profile"><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: m.color }}>{m.initials}</div></Link>
                      <div className="flex-1 min-w-0">
                        <Link to="/app/profile" className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{m.name}</Link>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Joined {m.joined}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: m.role === "Admin" ? "rgba(245,158,11,0.1)" : "var(--surface-2)", color: m.role === "Admin" ? "#F59E0B" : "var(--text-2)" }}>
                        {m.role === "Lead" && <Crown className="w-2.5 h-2.5" />}{m.role}
                      </span>
                      {m.stranded ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>Stranded ✓</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => handleStrand(m.id)}><Link2 className="w-3 h-3 mr-1" />Strand</Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => navigate("/app/pings")}><MessageCircle className="w-3 h-3 mr-1" />Ping</Button>
                    </div>
                  ))}
                  {members.filter(m => m.role === "Alumni").length > 0 && (
                    <>
                      <p className="micro-label pt-3 pb-1">ALUMNI</p>
                      {members.filter(m => m.role === "Alumni").map(m => (
                        <div key={m.id} className="flex items-center gap-2.5 py-2 px-2 opacity-60">
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
                {(() => {
                  const realWs = realWorkspaces.find(w => w.id === selected);
                  return (
                    <>
                      {realWs?.description && <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-2)" }}>{realWs.description}</p>}
                      <div className="space-y-2 text-[12px]" style={{ color: "var(--text-3)" }}>
                        <p>Type: {activeWs?.type} workspace</p>
                        <p>Created: {realWs?.created_at ? new Date(realWs.created_at).toLocaleDateString("en", { month: "short", year: "numeric" }) : "—"}</p>
                        <p>Privacy: {realWs?.privacy || "Members only"}</p>
                        <p>Members: {members.length}</p>
                      </div>
                    </>
                  );
                })()}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <Button variant="ghost" className="w-full text-[12px]" style={{ color: "#DC2626" }} onClick={() => setShowLeaveConfirm(true)}>Leave workspace</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {/* Share to Feed Confirmation */}
        {showShareConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowShareConfirm(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-[17px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Share to your public feed?</h2>
              <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>This achievement will appear in the Tiikme feed and be attributed to your profile.</p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowShareConfirm(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => handleShareToFeed(showShareConfirm)}>Share to feed →</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leave Confirmation */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowLeaveConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-[17px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Leave {activeWs?.name}?</h2>
              <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Your past contributions will remain visible.</p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
                <Button className="flex-1" style={{ background: "#DC2626" }} onClick={handleLeave}>Leave workspace</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowInvite(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>Invite to {activeWs?.name}</h2>
                <button onClick={() => setShowInvite(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Email or Tiikme username" value={inviteInput} onChange={e => setInviteInput(e.target.value)} />
                <div>
                  <label className="micro-label block mb-1">Role</label>
                  <div className="flex gap-2">
                    {["admin", "editor", "member"].map(r => (
                      <button key={r} onClick={() => setInviteRole(r)}
                        className="flex-1 py-2 rounded-lg text-[11px] font-semibold cursor-pointer capitalize"
                        style={{ background: inviteRole === r ? "var(--brand-dim)" : "var(--surface-2)", border: inviteRole === r ? "1px solid var(--brand)" : "1px solid var(--border)", color: inviteRole === r ? "var(--brand)" : "var(--text-2)" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setShowInvite(false); tiikToast.success("Invite sent!"); setInviteInput(""); }}>Send invite</Button>
                <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--text-3)" }}>Or share this link:</p>
                  <div className="flex gap-2">
                    <Input value="tiikme.in/join/abc123" readOnly className="flex-1 text-[11px]" />
                    <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText("tiikme.in/join/abc123"); tiikToast.success("Link copied!"); }}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowSettings(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>Workspace settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="micro-label block mb-1">Name</label><Input value={settingsName} onChange={e => setSettingsName(e.target.value)} /></div>
                <div><label className="micro-label block mb-1">Description</label>
                  <textarea value={settingsDesc} onChange={e => setSettingsDesc(e.target.value)} placeholder="Workspace description" rows={2}
                    className="w-full rounded-xl p-3 text-[12px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                </div>
                <div>
                  <label className="micro-label block mb-1">Privacy</label>
                  <div className="flex gap-2">
                    {[{ v: "public", l: "Public" }, { v: "members_only", l: "Members only" }, { v: "invite_only", l: "Invite only" }].map(o => (
                      <button key={o.v} onClick={() => setSettingsPrivacy(o.v)}
                        className="flex-1 py-2 rounded-lg text-[11px] font-semibold cursor-pointer"
                        style={{ background: settingsPrivacy === o.v ? "var(--brand-dim)" : "var(--surface-2)", border: settingsPrivacy === o.v ? "1px solid var(--brand)" : "1px solid var(--border)", color: settingsPrivacy === o.v ? "var(--brand)" : "var(--text-2)" }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setShowSettings(false); tiikToast.success("Settings saved!"); }}>Save changes</Button>
                <div className="pt-3 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="micro-label mb-2" style={{ color: "#DC2626" }}>DANGER ZONE</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-[11px]" style={{ color: "#F59E0B" }}>Archive workspace</Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-[11px]" style={{ color: "#DC2626" }}>Delete workspace</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create modal */}
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
                  <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>Add team members by email (optional)</p>
                  <textarea placeholder="Enter emails (one per line)" rows={3}
                    className="w-full rounded-xl p-3 text-[12px] outline-none resize-none mb-3" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                  <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setCreateStep(1)}>Back</Button>
                    <Button className="flex-1" onClick={handleCreateWorkspace}>Create workspace</Button>
                  </div>
                  <button onClick={handleCreateWorkspace}
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
