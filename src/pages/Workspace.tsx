import { useState, useEffect, useCallback } from "react";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Users, Plus, Shield, Copy, Search, FileText, Briefcase, CheckCircle, XCircle,
  Clock, UserPlus, Send, Building2, Lock, Trash2, ChevronRight, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GlassBox from "@/components/ui/GlassBox";
import { Link, useNavigate } from "react-router-dom";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", admin: "Admin", hr_admin: "HR Admin", recruiter: "Recruiter",
  verifier: "Verifier", poster: "Poster", team_lead: "Team Lead / HOD", member: "Member",
};
const ROLE_COLORS: Record<string, string> = {
  owner: "#E8580A", admin: "#2563EB", hr_admin: "#7C3AED", recruiter: "#0E7490",
  verifier: "#059669", poster: "#F59E0B", team_lead: "#C2410C", member: "#6B7280",
};
const ACCESS_TYPES = [
  { value: "post_jobs", label: "Post Opportunities" },
  { value: "verify_members", label: "Verify Members" },
  { value: "manage_team", label: "Manage Team" },
  { value: "post_content", label: "Post Content" },
  { value: "issue_certificates", label: "Issue Certificates" },
];

export default function Workspace() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isInstitution = profile?.account_type === "institution" && !!profile?.org_id;
  const orgId = profile?.org_id;

  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [verifRequests, setVerifRequests] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string>("member");
  const [search, setSearch] = useState("");

  // Panels
  const [selectedPanel, setSelectedPanel] = useState<"feed" | "team" | "access" | "verifications" | "invites">("feed");

  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteDept, setInviteDept] = useState("");
  const [showAccess, setShowAccess] = useState(false);
  const [accessMemberId, setAccessMemberId] = useState("");
  const [accessType, setAccessType] = useState("post_jobs");
  const [accessDept, setAccessDept] = useState("");

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  const fetchData = useCallback(async () => {
    if (!orgId || !user) { setLoading(false); return; }
    setLoading(true);
    const [orgRes, membersRes, accessRes, verifRes, myRoleRes, postsRes] = await Promise.allSettled([
      supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, role, headline)")
        .eq("org_id", orgId).order("joined_at", { ascending: true }),
      supabase.from("org_access_rules").select("*, member:profiles!org_access_rules_member_id_fkey(full_name, avatar_url)")
        .eq("org_id", orgId),
      supabase.from("org_verif_requests").select("*, requester:profiles!org_verif_requests_user_id_fkey(full_name, avatar_url, role)")
        .eq("org_id", orgId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle(),
      supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(full_name, avatar_url)")
        .eq("posted_by_org", orgId).order("created_at", { ascending: false }).limit(30),
    ]);
    if (orgRes.status === "fulfilled") setOrg(orgRes.value.data);
    if (membersRes.status === "fulfilled") setMembers(membersRes.value.data || []);
    if (accessRes.status === "fulfilled") setAccessRules(accessRes.value.data || []);
    if (verifRes.status === "fulfilled") setVerifRequests(verifRes.value.data || []);
    if (myRoleRes.status === "fulfilled") setMyRole(myRoleRes.value.data?.role || "member");
    if (postsRes.status === "fulfilled") setPosts(postsRes.value.data || []);
    setLoading(false);
  }, [orgId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId || !user) return;
    const { data: found } = await supabase.from("profiles")
      .select("id, full_name").ilike("full_name", `%${inviteEmail}%`).limit(1).maybeSingle();
    if (found) {
      const { error } = await supabase.from("org_members").insert({
        org_id: orgId, user_id: found.id, role: inviteRole,
        department: inviteDept || null, granted_by: user.id,
        approval_status: isOwnerOrAdmin ? "approved" : "pending",
      });
      if (error) { toast.error(error.message); return; }
      toast.success(`${found.full_name} added as ${ROLE_LABELS[inviteRole]}`);
      await supabase.from("alerts").insert({
        user_id: found.id, type: "org_invite",
        title: `You've been added to ${org?.name}`,
        body: `Role: ${ROLE_LABELS[inviteRole]}${inviteDept ? ` · ${inviteDept}` : ""}`,
        action_url: `/app/workspace`,
      });
    } else {
      toast.info("User not found. Copy the invite link to share.");
    }
    setShowInvite(false); setInviteEmail(""); fetchData();
  };

  const handleGrantAccess = async () => {
    if (!accessMemberId || !orgId || !user) return;
    const { error } = await supabase.from("org_access_rules").insert({
      org_id: orgId, member_id: accessMemberId, access_type: accessType,
      department_scope: accessDept || null, created_by: user.id,
      access_scope: "general", delegation_approved: isOwnerOrAdmin ? true : null,
      delegated_by: !isOwnerOrAdmin ? user.id : null,
    });
    if (error) { toast.error(error.message); return; }
    if (!isOwnerOrAdmin) {
      const ownerMember = members.find(m => m.role === "owner");
      if (ownerMember) {
        await supabase.from("alerts").insert({
          user_id: ownerMember.user_id, type: "delegation_approval",
          title: "Access delegation needs approval",
          body: `A team member requested "${ACCESS_TYPES.find(a => a.value === accessType)?.label}" access`,
          action_url: "/app/workspace",
        });
      }
    }
    toast.success("Access granted"); setShowAccess(false); fetchData();
  };

  const handleRemoveAccess = async (ruleId: string) => {
    await supabase.from("org_access_rules").delete().eq("id", ruleId);
    toast.success("Access removed"); fetchData();
  };

  const handleApproveDelegation = async (ruleId: string, approved: boolean) => {
    await supabase.from("org_access_rules").update({ delegation_approved: approved }).eq("id", ruleId);
    toast.success(approved ? "Approved" : "Rejected"); fetchData();
  };

  const handleVerifAction = async (reqId: string, status: "approved" | "rejected", requesterId: string) => {
    await supabase.from("org_verif_requests").update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", reqId);
    if (status === "approved") {
      await supabase.from("org_members").update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("org_id", orgId).eq("user_id", requesterId);
      if (user) await supabase.rpc("increment_score", { uid: requesterId, amount: 25 });
    }
    await supabase.from("alerts").insert({
      user_id: requesterId, type: "verification",
      title: status === "approved" ? "Verification approved" : "Verification request declined",
      body: `Your verification at ${org?.name} has been ${status}.`,
      action_url: "/app/profile",
    });
    toast.success(`Request ${status}`); fetchData();
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from("org_members").delete().eq("id", memberId);
    toast.success("Member removed"); fetchData();
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`);
    toast.success("Invite link copied");
  };

  const filteredMembers = members.filter(m => !search.trim() || m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()));

  if (!isInstitution) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3AF" }} />
        <h1 className="text-[20px] font-bold mb-2" style={{ color: "#1A1A1A" }}>Workspace</h1>
        <p className="text-[14px] mb-4" style={{ color: "#9CA3AF" }}>Workspaces are available for organisation accounts.</p>
        <Button onClick={() => window.location.href = "/join-as-institution"}>Register Organisation</Button>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)" }} />
        <div className="h-64 rounded-xl" style={{ background: "rgba(255,255,255,0.5)" }} />
      </div>
    </div>
  );

  const NAV_ITEMS = [
    { key: "feed" as const, label: "Feed", icon: FileText, count: posts.length },
    { key: "team" as const, label: "Team", icon: Users, count: members.length },
    { key: "access" as const, label: "Access", icon: Lock, count: accessRules.length },
    { key: "verifications" as const, label: "Verifications", icon: Shield, count: verifRequests.length },
    { key: "invites" as const, label: "Invites", icon: UserPlus },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {org?.logo_url && (
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ border: "1.5px solid #F0E8E0" }}>
              <img src={storageImageUrl(org.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-[22px] font-extrabold" style={{ color: "#1A1A1A" }}>{org?.name || "Workspace"}</h1>
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>{members.length} members · {verifRequests.length} pending</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
          </Button>
          {isOwnerOrAdmin && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          )}
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 160px)" }}>
        {/* Left nav panel */}
        <div className="w-[220px] shrink-0 hidden md:block space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} type="button" onClick={() => setSelectedPanel(item.key)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all"
              style={{
                background: selectedPanel === item.key ? "rgba(232,88,10,0.08)" : "transparent",
                color: selectedPanel === item.key ? "#E8580A" : "#6B7280",
                fontWeight: selectedPanel === item.key ? 700 : 500,
              }}>
              <item.icon className="w-4 h-4" />
              <span className="text-[13px] flex-1">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: selectedPanel === item.key ? "#E8580A" : "#F3F4F6", color: selectedPanel === item.key ? "#fff" : "#6B7280" }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="flex md:hidden gap-1 mb-4 overflow-x-auto pb-1">
            {NAV_ITEMS.map(item => (
              <button key={item.key} type="button" onClick={() => setSelectedPanel(item.key)}
                className="px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer shrink-0"
                style={{
                  background: selectedPanel === item.key ? "#E8580A" : "#fff",
                  color: selectedPanel === item.key ? "#fff" : "#6B7280",
                  border: selectedPanel === item.key ? "none" : "1px solid #F0E8E0",
                }}>
                {item.label} {item.key === "verifications" && verifRequests.length > 0 && `(${verifRequests.length})`}
              </button>
            ))}
          </div>

          {/* Feed Panel */}
          {selectedPanel === "feed" && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <GlassBox accent="feed">
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
                    <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>No internal posts</p>
                    <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Posts from your team will appear here</p>
                  </div>
                </GlassBox>
              ) : posts.map(p => (
                <GlassBox key={p.id} accent="feed">
                  <Link to={`/post/${p.id}`} className="block">
                    <p className="text-[14px] line-clamp-3" style={{ color: "#1A1A1A" }}>{p.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>
                      {p.author?.full_name && <span>via {p.author.full_name}</span>}
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </GlassBox>
              ))}
            </div>
          )}

          {/* Team Panel */}
          {selectedPanel === "team" && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9" style={{ borderRadius: 12 }} />
              </div>
              <div className="space-y-2">
                {filteredMembers.map(m => {
                  const roleColor = ROLE_COLORS[m.role] || "#6B7280";
                  return (
                    <GlassBox key={m.id} accent={roleColor}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: roleColor }}>
                          {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A1A" }}>{m.profile?.full_name || "Member"}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor }}>
                              {ROLE_LABELS[m.role] || m.role}
                            </span>
                            {m.department && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{m.department}</span>}
                            {m.is_verified && <Shield className="w-3 h-3" style={{ color: "#F59E0B" }} />}
                            {m.approval_status === "pending" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#EA580C" }}>Pending</span>}
                          </div>
                        </div>
                        {isOwnerOrAdmin && m.role !== "owner" && (
                          <button type="button" onClick={() => handleRemoveMember(m.id)} className="p-2 rounded-lg cursor-pointer" style={{ color: "#9CA3AF" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </GlassBox>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
                    <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>No members found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Panel */}
          {selectedPanel === "access" && (
            <div>
              {isOwnerOrAdmin && (
                <Button size="sm" className="mb-4" onClick={() => setShowAccess(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Grant Access
                </Button>
              )}
              {accessRules.length === 0 ? (
                <GlassBox accent="contact">
                  <div className="text-center py-8">
                    <Lock className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
                    <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>No access rules</p>
                    <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Grant specific permissions to team members</p>
                  </div>
                </GlassBox>
              ) : (
                <div className="space-y-2">
                  {accessRules.map(r => (
                    <GlassBox key={r.id} accent="contact">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#64748B" }}>
                          {r.member?.avatar_url ? <img src={storageImageUrl(r.member.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (r.member?.full_name?.[0] || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A1A" }}>{r.member?.full_name || "Member"}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFF3EC", color: "#E8580A" }}>
                              {ACCESS_TYPES.find(a => a.value === r.access_type)?.label || r.access_type}
                            </span>
                            {r.department_scope && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{r.department_scope}</span>}
                            {r.delegation_approved === null && r.delegated_by && (
                              <>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#EA580C" }}>Pending</span>
                                {isOwnerOrAdmin && (
                                  <div className="flex gap-1 ml-1">
                                    <button type="button" onClick={() => handleApproveDelegation(r.id, true)} className="p-1 rounded cursor-pointer" style={{ color: "#059669" }}><CheckCircle className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => handleApproveDelegation(r.id, false)} className="p-1 rounded cursor-pointer" style={{ color: "#DC2626" }}><XCircle className="w-4 h-4" /></button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {isOwnerOrAdmin && (
                          <button type="button" onClick={() => handleRemoveAccess(r.id)} className="p-2 rounded-lg cursor-pointer" style={{ color: "#9CA3AF" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </GlassBox>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verifications Panel */}
          {selectedPanel === "verifications" && (
            <div>
              {verifRequests.length === 0 ? (
                <GlassBox accent="verified">
                  <div className="text-center py-8">
                    <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
                    <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>No pending verifications</p>
                  </div>
                </GlassBox>
              ) : (
                <div className="space-y-2">
                  {verifRequests.map(r => (
                    <GlassBox key={r.id} accent="verified">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#F59E0B" }}>
                          {r.requester?.avatar_url ? <img src={storageImageUrl(r.requester.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (r.requester?.full_name?.[0] || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>{r.requester?.full_name || "User"}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {r.title_at_org && <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{r.title_at_org}</span>}
                            {r.member_type && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: r.member_type === "ex" ? "#FEF2F2" : "#F0FDF4", color: r.member_type === "ex" ? "#DC2626" : "#059669" }}>
                                {r.member_type === "ex" ? "Alumni" : "Current"}
                              </span>
                            )}
                          </div>
                          {r.message && <p className="text-[12px] mt-1" style={{ color: "#374151" }}>{r.message}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button size="sm" onClick={() => handleVerifAction(r.id, "approved", r.user_id)} style={{ background: "#059669", height: 36 }}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleVerifAction(r.id, "rejected", r.user_id)} style={{ height: 36 }}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
                        Requested {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                      </p>
                    </GlassBox>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invites Panel */}
          {selectedPanel === "invites" && (
            <div className="space-y-4">
              <GlassBox accent="connections">
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "#1A1A1A" }}>Share Invite Link</h3>
                <p className="text-[12px] mb-3" style={{ color: "#9CA3AF" }}>Share this link with people you want to invite</p>
                <div className="flex gap-2">
                  <Input value={`${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`} readOnly className="flex-1 text-[12px]" />
                  <Button variant="outline" onClick={copyInviteLink}><Copy className="w-4 h-4" /></Button>
                </div>
              </GlassBox>
              <GlassBox accent="connections">
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "#1A1A1A" }}>WhatsApp Invite</h3>
                <p className="text-[12px] mb-3" style={{ color: "#9CA3AF" }}>Send a pre-written invite message</p>
                <Button variant="outline" onClick={() => {
                  const msg = `Join ${org?.name} on Tiikme! ${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                }}>
                  <Send className="w-4 h-4 mr-1" /> Send via WhatsApp
                </Button>
              </GlassBox>
            </div>
          )}
        </div>

        {/* Right info panel (desktop) */}
        <div className="w-[260px] shrink-0 hidden lg:block space-y-4">
          <GlassBox accent="stats">
            <h3 className="text-[13px] font-bold mb-3" style={{ color: "#10B981" }}>Quick Info</h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span style={{ color: "#9CA3AF" }}>Members</span>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#9CA3AF" }}>Pending Verif.</span>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>{verifRequests.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#9CA3AF" }}>Access Rules</span>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>{accessRules.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#9CA3AF" }}>Posts</span>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>{posts.length}</span>
              </div>
            </div>
          </GlassBox>

          {/* Recent members */}
          <GlassBox accent="team">
            <h3 className="text-[13px] font-bold mb-3" style={{ color: "#8B5CF6" }}>Recent Members</h3>
            <div className="space-y-2">
              {members.slice(-5).reverse().map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0" style={{ background: ROLE_COLORS[m.role] || "#6B7280" }}>
                    {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: "#1A1A1A" }}>{m.profile?.full_name || "Member"}</p>
                    <p className="text-[9px]" style={{ color: "#9CA3AF" }}>{ROLE_LABELS[m.role] || m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassBox>
        </div>
      </div>

      {/* ── Modals ── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-[440px] rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #F0E8E0" }} onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "#1A1A1A" }}>Add Team Member</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3AF" }}>Search by name</label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Enter name to search..." />
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3AF" }}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0", color: "#1A1A1A" }}>
                  <option value="admin">Admin</option>
                  <option value="hr_admin">HR Admin</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="verifier">Verifier</option>
                  <option value="team_lead">Team Lead / HOD</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3AF" }}>Department (optional)</label>
                <Input value={inviteDept} onChange={e => setInviteDept(e.target.value)} placeholder="e.g. Engineering" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleInvite}>Add Member</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAccess(false)}>
          <div className="w-full max-w-[440px] rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #F0E8E0" }} onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "#1A1A1A" }}>Grant Access</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3AF" }}>Member</label>
                <select value={accessMemberId} onChange={e => setAccessMemberId(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0", color: "#1A1A1A" }}>
                  <option value="">Select member</option>
                  {members.filter(m => m.role !== "owner").map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || "Member"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3AF" }}>Access type</label>
                <select value={accessType} onChange={e => setAccessType(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0", color: "#1A1A1A" }}>
                  {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3AF" }}>Department scope (optional)</label>
                <Input value={accessDept} onChange={e => setAccessDept(e.target.value)} placeholder="e.g. Computer Science" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAccess(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleGrantAccess}>Grant</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
