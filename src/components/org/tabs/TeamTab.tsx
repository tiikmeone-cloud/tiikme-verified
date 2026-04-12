import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, CheckCircle, X, Search, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { storageImageUrl } from "@/lib/imageTransform";

interface TeamTabProps {
  org: any;
  members: any[];
  isAdmin: boolean;
}

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  owner: { bg: "#FFF3EC", text: "#E8580A" },
  admin: { bg: "#EFF6FF", text: "#2563EB" },
  recruiter: { bg: "#F0FDF4", text: "#16A34A" },
  verifier: { bg: "#FAF5FF", text: "#7C3AED" },
  member: { bg: "#F3F4F6", text: "#374151" },
};

const COMPANY_ROLES = ["admin", "recruiter", "verifier", "poster", "member"];
const EDU_ROLES = ["admin", "hod", "faculty", "verifier", "member"];

const TIERS = [
  { key: "leadership", label: "Leadership", roles: ["owner", "admin"] },
  { key: "heads", label: "Department Heads", roles: ["hod", "team_lead"] },
  { key: "team", label: "Team Members", roles: ["member", "hr_admin", "recruiter", "verifier", "poster", "faculty"] },
];

export default function TeamTab({ org, members, isAdmin }: TeamTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("member");
  const [dept, setDept] = useState("");
  const [staffId, setStaffId] = useState("");
  const [adding, setAdding] = useState(false);

  const pendingMembers = members.filter(m => m.approval_status === "pending");

  // Search users
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const existingIds = members.map(m => m.user_id);
        const { data } = await supabase.from("profiles")
          .select("id, full_name, username, avatar_url, role")
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(8);
        setSearchResults((data || []).filter(p => !existingIds.includes(p.id) && p.id !== user?.id));
      } catch (e) { console.warn("[TeamTab] search failed:", e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, members, user?.id]);

  const handleInvite = async () => {
    if (!selectedUser || !user) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("org_members").insert({
        org_id: org.id,
        user_id: selectedUser.id,
        role: selectedRole,
        department: dept.trim() || null,
        approval_status: "pending",
        granted_by: user.id,
      });
      if (error) throw error;

      // Send ping invitation
      const { data: conv } = await supabase.from("conversations").insert({
        participant_1: user.id,
        participant_2: selectedUser.id,
      }).select().single();

      if (conv) {
        await supabase.from("pings").insert({
          conversation_id: conv.id,
          sender_id: user.id,
          content: `${org.name} invited you to join their team as ${selectedRole}. Check your Alerts to accept or decline.`,
          is_opener: true,
        });
      }

      // Send alert
      await supabase.from("alerts").insert({
        user_id: selectedUser.id,
        type: "strand",
        title: `${org.name} invited you to join their team as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`,
        body: "Accept or decline this invitation.",
        data: { actor_id: user.id, org_id: org.id } as any,
      });

      toast.success(`Invite sent to ${selectedUser.full_name}`);
      setShowAddModal(false);
      setSelectedUser(null);
      setSearchQuery("");
      setDept("");
      setStaffId("");
    } catch (e: any) {
      if (e.code === "23505") toast.error("Already a member");
      else toast.error(e.message || "Failed to invite");
    }
    setAdding(false);
  };

  const handleRevoke = async (memberId: string) => {
    try {
      await supabase.from("org_members").delete().eq("id", memberId);
      toast.success("Invitation revoked");
    } catch (e) { console.warn("[TeamTab] revoke failed:", e); }
  };

  const groupedMembers = TIERS.map(tier => ({
    ...tier,
    items: members.filter(m => m.approval_status !== "pending" && tier.roles.includes(m.role || "member")),
  })).filter(g => g.items.length > 0);

  const ungrouped = members.filter(m => m.approval_status !== "pending" && !TIERS.some(t => t.roles.includes(m.role || "member")));
  if (ungrouped.length > 0) {
    const existing = groupedMembers.find(g => g.key === "team");
    if (existing) existing.items.push(...ungrouped);
    else groupedMembers.push({ key: "team", label: "Team Members", roles: [], items: ungrouped });
  }

  const isEdu = org.type === "education";
  const roleOptions = isEdu ? EDU_ROLES : COMPANY_ROLES;

  return (
    <div>
      {/* Pending banner */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p className="text-[13px] font-bold mb-2" style={{ color: "#D97706" }}>
            <AlertTriangle className="w-4 h-4 inline mr-1" /> {pendingMembers.length} pending invitation{pendingMembers.length > 1 ? "s" : ""}
          </p>
          {pendingMembers.map(m => {
            const p = m.profile || {};
            return (
              <div key={m.id} className="flex items-center gap-2 py-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden" style={{ background: "#E8580A" }}>
                  {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (p.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium flex-1" style={{ color: "#1A1A1A" }}>{p.full_name || "User"}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#FFF3EC", color: "#E8580A" }}>{m.role}</span>
                <button type="button" onClick={() => handleRevoke(m.id)} className="text-[11px] font-medium cursor-pointer" style={{ color: "#DC2626" }}>Revoke</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView("grid")} className="text-[12px] font-semibold px-3 py-1 rounded-lg cursor-pointer"
            style={{ background: view === "grid" ? "rgba(232,88,10,0.1)" : "transparent", color: view === "grid" ? "#E8580A" : "#6B6B6B" }}>Grid</button>
          <button type="button" onClick={() => setView("list")} className="text-[12px] font-semibold px-3 py-1 rounded-lg cursor-pointer"
            style={{ background: view === "list" ? "rgba(232,88,10,0.1)" : "transparent", color: view === "list" ? "#E8580A" : "#6B6B6B" }}>List</button>
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-1" style={{ background: "#E8580A", color: "#fff" }}
            onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Team Member
          </Button>
        )}
      </div>

      {members.filter(m => m.approval_status !== "pending").length === 0 && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
          <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
          <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>No team members yet</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Verified team members will appear here</p>
        </div>
      )}

      {view === "grid" && groupedMembers.map(group => (
        <div key={group.key} className="mb-6">
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1A1A1A" }}>{group.label}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {group.items.map((m: any) => {
              const profile = m.profile || {};
              const name = profile.full_name || "User";
              const memberInitials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const badge = ROLE_BADGES[m.role] || ROLE_BADGES.member;
              return (
                <div key={m.id} className="rounded-xl p-4 text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
                  style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  onClick={() => navigate(`/app/profile/${profile.id}`)}>
                  <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-[14px] font-bold overflow-hidden"
                    style={{ background: "#E8580A", color: "#fff" }}>
                    {profile.avatar_url ? <img src={storageImageUrl(profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : memberInitials}
                  </div>
                  <p className="text-[15px] font-semibold leading-tight" style={{ color: "#1A1A1A", maxHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{name}</p>
                  <p className="text-[13px] truncate" style={{ color: "#6B6B6B" }}>{m.title || m.role || "Member"}</p>
                  {m.department && <span className="inline-block text-[11px] px-2 py-0.5 rounded-full mt-1" style={{ background: "#F3F4F6", color: "#374151" }}>{m.department}</span>}
                  {m.role && m.role !== "member" && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ml-1 capitalize" style={{ background: badge.bg, color: badge.text }}>{m.role}</span>
                  )}
                  {m.is_verified && (
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <CheckCircle className="w-3 h-3" style={{ color: "#16A34A" }} />
                      <span className="text-[10px] font-medium" style={{ color: "#16A34A" }}>Verified</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {view === "list" && (
        <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #F0E8E0" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#9CA3AF" }}>Member</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#9CA3AF" }}>Role</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#9CA3AF" }}>Department</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#9CA3AF" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.filter(m => m.approval_status !== "pending").map((m: any) => {
                const profile = m.profile || {};
                const name = profile.full_name || "User";
                const memberInitials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" style={{ borderBottom: "1px solid #F0E8E0" }}
                    onClick={() => navigate(`/app/profile/${profile.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0"
                          style={{ background: "#E8580A", color: "#fff" }}>
                          {profile.avatar_url ? <img src={storageImageUrl(profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : memberInitials}
                        </div>
                        <span className="font-medium" style={{ color: "#1A1A1A" }}>{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize" style={{ color: "#6B6B6B" }}>{m.title || m.role || "Member"}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: "#6B6B6B" }}>{m.department || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {m.is_verified ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Verified</span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6"
            style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-bold" style={{ color: "#1A1A1A" }}>Add Team Member</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-2 rounded-lg cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-5 h-5" /></button>
            </div>

            {!selectedUser ? (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Tiikme users..."
                    className="w-full h-12 rounded-xl pl-10 pr-4 text-[14px] outline-none"
                    style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} autoFocus />
                </div>
                {searchResults.length === 0 && searchQuery.length >= 2 && (
                  <p className="text-center py-4 text-[13px]" style={{ color: "#9CA3AF" }}>No users found</p>
                )}
                <div className="space-y-1">
                  {searchResults.map(p => (
                    <button key={p.id} type="button" onClick={() => setSelectedUser(p)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer text-left">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden" style={{ background: "#E8580A" }}>
                        {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (p.full_name || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>{p.full_name || p.username}</p>
                        <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{p.role || "User"}</p>
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: "#E8580A" }}>Add</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleInvite(); }} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#FFF8F2", border: "1px solid #F0E8E0" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden" style={{ background: "#E8580A" }}>
                    {selectedUser.avatar_url ? <img src={storageImageUrl(selectedUser.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (selectedUser.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>{selectedUser.full_name}</p>
                    <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{selectedUser.role || "User"}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedUser(null)} className="cursor-pointer"><X className="w-4 h-4" style={{ color: "#9CA3AF" }} /></button>
                </div>

                <div>
                  <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Role</label>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map(r => (
                      <button key={r} type="button" onClick={() => setSelectedRole(r)}
                        className="px-4 py-2 text-[13px] font-semibold rounded-full capitalize cursor-pointer"
                        style={{ background: selectedRole === r ? "#E8580A" : "#F3F4F6", color: selectedRole === r ? "#fff" : "#374151" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Department</label>
                  <input value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Engineering"
                    className="w-full h-12 rounded-xl px-4 text-[14px] outline-none"
                    style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
                </div>

                <div>
                  <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Staff/Employee ID (optional)</label>
                  <input value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="Optional"
                    className="w-full h-12 rounded-xl px-4 text-[14px] outline-none"
                    style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
                </div>

                <Button type="submit" className="w-full" disabled={adding}
                  style={{ height: 52, background: "#E8580A", color: "#fff", borderRadius: 12 }}>
                  {adding ? "Sending..." : "Send Invite →"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
