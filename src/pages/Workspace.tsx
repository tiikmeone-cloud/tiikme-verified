import { useState, useEffect, useCallback } from "react";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Users, Plus, Shield, Copy, Link2, Settings, ChevronRight, Search,
  FileText, Briefcase, CheckCircle, XCircle, Clock, UserPlus, Send, Building2, Bell, Eye, Lock, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

const TABS = ["Team", "Access", "Invites", "Verification Requests"] as const;

export default function Workspace() {
  const { user, profile } = useAuth();
  const isInstitution = profile?.account_type === "institution" && !!profile?.org_id;
  const orgId = profile?.org_id;

  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [verifRequests, setVerifRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("Team");
  const [myRole, setMyRole] = useState<string>("member");
  const [search, setSearch] = useState("");

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteDept, setInviteDept] = useState("");

  // Access grant
  const [showAccess, setShowAccess] = useState(false);
  const [accessMemberId, setAccessMemberId] = useState("");
  const [accessType, setAccessType] = useState("post_jobs");
  const [accessDept, setAccessDept] = useState("");

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  const fetchData = useCallback(async () => {
    if (!orgId || !user) { setLoading(false); return; }
    setLoading(true);

    const [orgRes, membersRes, accessRes, verifRes, myRoleRes] = await Promise.allSettled([
      supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, role, headline)")
        .eq("org_id", orgId).order("joined_at", { ascending: true }),
      supabase.from("org_access_rules").select("*, member:profiles!org_access_rules_member_id_fkey(full_name, avatar_url)")
        .eq("org_id", orgId),
      supabase.from("org_verif_requests").select("*, requester:profiles!org_verif_requests_user_id_fkey(full_name, avatar_url, role)")
        .eq("org_id", orgId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle(),
    ]);

    if (orgRes.status === "fulfilled") setOrg(orgRes.value.data);
    if (membersRes.status === "fulfilled") setMembers(membersRes.value.data || []);
    if (accessRes.status === "fulfilled") setAccessRules(accessRes.value.data || []);
    if (verifRes.status === "fulfilled") setVerifRequests(verifRes.value.data || []);
    if (myRoleRes.status === "fulfilled") setMyRole(myRoleRes.value.data?.role || "member");
    setLoading(false);
  }, [orgId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId || !user) return;
    // Search for user by email-like username or create invite
    const { data: found } = await supabase.from("profiles")
      .select("id, full_name").ilike("full_name", `%${inviteEmail}%`).limit(1).maybeSingle();

    if (found) {
      // Add as member
      const { error } = await supabase.from("org_members").insert({
        org_id: orgId, user_id: found.id, role: inviteRole,
        department: inviteDept || null, granted_by: user.id,
        approval_status: isOwnerOrAdmin ? "approved" : "pending",
      });
      if (error) { toast.error(error.message); return; }
      toast.success(`${found.full_name} added as ${ROLE_LABELS[inviteRole]}`);

      // Send alert
      await supabase.from("alerts").insert({
        user_id: found.id, type: "org_invite",
        title: `You've been added to ${org?.name}`,
        body: `Role: ${ROLE_LABELS[inviteRole]}${inviteDept ? ` · ${inviteDept}` : ""}`,
        action_url: `/app/workspace`,
      });
    } else {
      toast.info("User not found. Copy the invite link below to share.");
    }
    setShowInvite(false);
    setInviteEmail("");
    fetchData();
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

    // If delegated, notify owner for approval
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

    toast.success("Access granted");
    setShowAccess(false);
    fetchData();
  };

  const handleRemoveAccess = async (ruleId: string) => {
    await supabase.from("org_access_rules").delete().eq("id", ruleId);
    toast.success("Access removed");
    fetchData();
  };

  const handleApproveDelegation = async (ruleId: string, approved: boolean) => {
    await supabase.from("org_access_rules").update({ delegation_approved: approved }).eq("id", ruleId);
    toast.success(approved ? "Delegation approved" : "Delegation rejected");
    fetchData();
  };

  const handleVerifAction = async (reqId: string, status: "approved" | "rejected", requesterId: string) => {
    await supabase.from("org_verif_requests").update({
      status, reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq("id", reqId);

    if (status === "approved") {
      // Mark member as verified
      await supabase.from("org_members").update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("org_id", orgId).eq("user_id", requesterId);
      // Award score
      if (user) await supabase.rpc("increment_score", { uid: requesterId, amount: 15 });
    }

    // Alert the requester
    await supabase.from("alerts").insert({
      user_id: requesterId, type: "verification",
      title: status === "approved" ? `Verification approved` : `Verification request declined`,
      body: `Your verification request at ${org?.name} has been ${status}.`,
      action_url: `/app/profile`,
    });

    toast.success(`Request ${status}`);
    fetchData();
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from("org_members").delete().eq("id", memberId);
    toast.success("Member removed");
    fetchData();
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  const filteredMembers = members.filter(m => {
    if (!search.trim()) return true;
    return m.profile?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  if (!isInstitution) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
        <h1 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Workspace</h1>
        <p className="text-[14px] mb-4" style={{ color: "var(--text-3)" }}>
          Workspaces are available for organisation accounts. Join or create an organisation to access this feature.
        </p>
        <Button onClick={() => window.location.href = "/join-as-institution"}>Register Organisation</Button>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded-xl" style={{ background: "var(--surface)" }} />
        <div className="h-64 rounded-xl" style={{ background: "var(--surface)" }} />
      </div>
    </div>
  );

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {org?.logo_url && (
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ border: "1.5px solid var(--border)" }}>
              <img src={storageImageUrl(org.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{org?.name || "Workspace"}</h1>
            <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
              {members.length} members · {verifRequests.length} pending requests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Invite Link
          </Button>
          {isOwnerOrAdmin && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto mb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-4 py-2.5 text-[13px] font-bold whitespace-nowrap cursor-pointer relative"
            style={{ color: tab === t ? "var(--brand)" : "var(--text-3)" }}>
            {t}
            {t === "Verification Requests" && verifRequests.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "var(--brand)" }}>{verifRequests.length}</span>
            )}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" style={{ background: "var(--brand)" }} />}
          </button>
        ))}
      </div>

      {/* ── Team Tab ── */}
      {tab === "Team" && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9" style={{ borderRadius: 12 }} />
          </div>
          <div className="space-y-2">
            {filteredMembers.map(m => {
              const roleColor = ROLE_COLORS[m.role] || "#6B7280";
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: roleColor }}>
                    {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{m.profile?.full_name || "Member"}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor }}>
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                      {m.department && <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{m.department}</span>}
                      {m.is_verified && <Shield className="w-3 h-3" style={{ color: "var(--tiik-gold)" }} />}
                      {!m.is_current && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>Alumni</span>}
                      {m.approval_status === "pending" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#EA580C" }}>Pending</span>}
                    </div>
                  </div>
                  {isOwnerOrAdmin && m.role !== "owner" && (
                    <button type="button" onClick={() => handleRemoveMember(m.id)} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
                <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No members found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Access Tab ── */}
      {tab === "Access" && (
        <div>
          {isOwnerOrAdmin && (
            <Button size="sm" className="mb-4" onClick={() => setShowAccess(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Grant Access
            </Button>
          )}
          {accessRules.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No access rules yet</p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Grant team members specific permissions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accessRules.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0" style={{ background: "var(--brand)" }}>
                    {r.member?.avatar_url ? <img src={storageImageUrl(r.member.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (r.member?.full_name?.[0] || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{r.member?.full_name || "Member"}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
                        {ACCESS_TYPES.find(a => a.value === r.access_type)?.label || r.access_type}
                      </span>
                      {r.department_scope && <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{r.department_scope}</span>}
                      {r.delegation_approved === false && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>Rejected</span>
                      )}
                      {r.delegation_approved === null && r.delegated_by && (
                        <>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#EA580C" }}>Pending Approval</span>
                          {isOwnerOrAdmin && (
                            <div className="flex gap-1 ml-2">
                              <button type="button" onClick={() => handleApproveDelegation(r.id, true)} className="p-1 rounded cursor-pointer" style={{ color: "#059669" }}>
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => handleApproveDelegation(r.id, false)} className="p-1 rounded cursor-pointer" style={{ color: "#DC2626" }}>
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {isOwnerOrAdmin && (
                    <button type="button" onClick={() => handleRemoveAccess(r.id)} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Invites Tab ── */}
      {tab === "Invites" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Share Invite Link</h3>
            <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>
              Share this link with people you want to invite to your organisation
            </p>
            <div className="flex gap-2">
              <Input value={`${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`} readOnly className="flex-1 text-[12px]" />
              <Button variant="outline" onClick={copyInviteLink}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>WhatsApp Invite</h3>
            <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>Send a pre-written invite message</p>
            <Button variant="outline" onClick={() => {
              const msg = `Join ${org?.name} on Tiikme! ${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
            }}>
              <Send className="w-4 h-4 mr-1" /> Send via WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* ── Verification Requests Tab ── */}
      {tab === "Verification Requests" && (
        <div>
          {verifRequests.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No pending verification requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {verifRequests.map(r => (
                <div key={r.id} className="p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: "var(--brand)" }}>
                      {r.requester?.avatar_url ? <img src={storageImageUrl(r.requester.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (r.requester?.full_name?.[0] || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{r.requester?.full_name || "User"}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.title_at_org && <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{r.title_at_org}</span>}
                        {r.member_type && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: r.member_type === "ex" ? "#FEF2F2" : "#F0FDF4", color: r.member_type === "ex" ? "#DC2626" : "#059669" }}>
                            {r.member_type === "ex" ? "Ex-Employee/Alumni" : "Current"}
                          </span>
                        )}
                      </div>
                      {r.message && <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>{r.message}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" onClick={() => handleVerifAction(r.id, "approved", r.user_id)}
                        style={{ background: "#059669", height: 36 }}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleVerifAction(r.id, "rejected", r.user_id)}
                        style={{ height: 36 }}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: "var(--text-3)" }}>
                    Requested {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Member Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-[440px] rounded-2xl p-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Add Team Member</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Search by name</label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Enter name to search..." />
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="admin">Admin</option>
                  <option value="hr_admin">HR Admin</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="verifier">Verifier</option>
                  <option value="team_lead">Team Lead / HOD</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Department (optional)</label>
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

      {/* ── Grant Access Modal ── */}
      {showAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAccess(false)}>
          <div className="w-full max-w-[440px] rounded-2xl p-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Grant Access</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Member</label>
                <select value={accessMemberId} onChange={e => setAccessMemberId(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">Select member</option>
                  {members.filter(m => m.role !== "owner").map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || "Member"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Access type</label>
                <select value={accessType} onChange={e => setAccessType(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Department scope (optional)</label>
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
