import { useState, useEffect, useCallback } from "react";
import { Shield, UserPlus, Check, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import { toast } from "sonner";

const ACCESS_TYPES = [
  { value: "post_jobs", label: "Post Opportunities", desc: "Can post job listings on behalf of the organization" },
  { value: "verify_members", label: "Verify Members", desc: "Can approve member verification requests" },
  { value: "manage_workspace", label: "Manage Workspace", desc: "Can add members and post in workspace" },
  { value: "issue_certificates", label: "Issue Certificates", desc: "Can issue certificates on behalf of the org" },
];

interface Props {
  orgId: string;
  isOwner: boolean;
}

export default function AccessManager({ orgId, isOwner }: Props) {
  const { user } = useAuth();
  const { org } = useOrgIdentity();
  const [rules, setRules] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrant, setShowGrant] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedAccess, setSelectedAccess] = useState("");
  const [selectedScope, setSelectedScope] = useState("");
  const [granting, setGranting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch rules and members separately to avoid FK issues
      const [rulesRes, membersRes] = await Promise.all([
        supabase.from("org_access_rules").select("*").eq("org_id", orgId),
        supabase.from("org_members").select("*").eq("org_id", orgId),
      ]);

      const rulesData = rulesRes.data || [];
      const membersData = membersRes.data || [];

      // Fetch profiles for members and rule targets
      const allUserIds = [
        ...membersData.map(m => m.user_id),
        ...rulesData.map(r => r.member_id).filter(Boolean),
      ].filter((id, i, arr) => arr.indexOf(id) === i);

      let profiles: Record<string, any> = {};
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles")
          .select("id, full_name, avatar_url, username, role")
          .in("id", allUserIds);
        (profilesData || []).forEach(p => { profiles[p.id] = p; });
      }

      setRules(rulesData.map(r => ({ ...r, member: profiles[r.member_id] || null })));
      setMembers(membersData.map(m => ({ ...m, profile: profiles[m.user_id] || null })));
    } catch (e) {
      console.warn("[AccessManager] fetch error:", e);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGrant = async () => {
    if (!selectedMember || !selectedAccess || !user) return;
    setGranting(true);
    try {
      const { error } = await supabase.from("org_access_rules").insert({
        org_id: orgId,
        member_id: selectedMember,
        access_type: selectedAccess,
        access_scope: selectedScope || "general",
        created_by: user.id,
        delegated_by: isOwner ? null : user.id,
        delegation_approved: isOwner ? true : null,
      } as any);

      if (error) { toast.error(error.message); setGranting(false); return; }

      // Notify owner if delegation needs approval
      if (!isOwner) {
        const owner = members.find(m => m.role === "owner");
        if (owner) {
          const memberProfile = members.find(m => m.user_id === selectedMember)?.profile;
          await supabase.from("alerts").insert({
            user_id: owner.user_id,
            type: "delegation_approval",
            title: "Access delegation request",
            body: `${memberProfile?.full_name || "A team member"} was granted "${selectedAccess}" access and needs your approval`,
            action_url: `/app/workspace`,
            data: { org_id: orgId, member_id: selectedMember, access_type: selectedAccess } as any,
          });
        }
      }

      toast.success(isOwner ? "Access granted" : "Access requested — pending owner approval");
      setShowGrant(false);
      setSelectedMember("");
      setSelectedAccess("");
      setSelectedScope("");
      fetchData();
    } catch (e) { console.warn("[AccessManager] grant error:", e); }
    setGranting(false);
  };

  const handleRevoke = async (ruleId: string) => {
    const { error } = await supabase.from("org_access_rules").delete().eq("id", ruleId);
    if (error) { toast.error("Failed to revoke: " + error.message); return; }
    setRules(prev => prev.filter(r => r.id !== ruleId));
    toast.success("Access revoked");
  };

  const handleApprove = async (ruleId: string) => {
    const { error } = await supabase.from("org_access_rules").update({ delegation_approved: true } as any).eq("id", ruleId);
    if (error) { toast.error("Failed to approve: " + error.message); return; }
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, delegation_approved: true } : r));
    toast.success("Delegation approved");
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?org=${orgId}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  if (loading) return <div className="animate-pulse space-y-3">{[1, 2].map(i => <div key={i} className="h-16 rounded-xl" style={{ background: "var(--surface-2)" }} />)}</div>;

  const eligibleMembers = members.filter(m => m.role !== "owner" && m.user_id !== user?.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: "var(--brand)" }} />
          <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Access Management</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={copyInviteLink}>
            <Link2 className="w-3.5 h-3.5" /> Copy Invite Link
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowGrant(true)}>
            <UserPlus className="w-3.5 h-3.5" /> Grant Access
          </Button>
        </div>
      </div>

      {/* Active rules */}
      {rules.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>No access rules configured yet</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Grant team members specific permissions like posting jobs or verifying members</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
                  {rule.member?.full_name || "Unknown"}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  {ACCESS_TYPES.find(a => a.value === rule.access_type)?.label || rule.access_type}
                  {rule.department_scope ? ` · ${rule.department_scope}` : ""}
                </p>
              </div>
              {rule.delegation_approved === null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFF3EC", color: "#E8580A" }}>Pending</span>
              )}
              {rule.delegation_approved === true && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#16A34A" }}>Active</span>
              )}
              <div className="flex gap-1">
                {isOwner && rule.delegation_approved === null && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleApprove(rule.id)}>
                    <Check className="w-4 h-4" style={{ color: "#16A34A" }} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRevoke(rule.id)}>
                  <X className="w-4 h-4" style={{ color: "#DC2626" }} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grant modal */}
      {showGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowGrant(false)}>
          <div className="rounded-2xl p-6 max-w-[420px] w-full" style={{ background: "var(--surface)" }} onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Grant Access</h2>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold block mb-1" style={{ color: "var(--text-2)" }}>Team member</label>
                <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                  className="w-full h-11 rounded-lg px-3 text-[13px] outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">Select member...</option>
                  {eligibleMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || m.profile?.username || "Unknown"} — {m.role || "member"}
                    </option>
                  ))}
                </select>
                {eligibleMembers.length === 0 && (
                  <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Add team members to your workspace first before granting access</p>
                )}
              </div>

              <div>
                <label className="text-[12px] font-semibold block mb-1" style={{ color: "var(--text-2)" }}>Access type</label>
                <div className="space-y-1.5">
                  {ACCESS_TYPES.map(a => (
                    <label key={a.value} className="flex items-start gap-2 p-2.5 rounded-lg cursor-pointer"
                      style={{ background: selectedAccess === a.value ? "var(--brand-dim)" : "transparent", border: selectedAccess === a.value ? "1px solid var(--brand)" : "1px solid transparent" }}>
                      <input type="radio" name="access" checked={selectedAccess === a.value} onChange={() => setSelectedAccess(a.value)} className="mt-0.5" />
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{a.label}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{a.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold block mb-1" style={{ color: "var(--text-2)" }}>Department scope (optional)</label>
                <Input value={selectedScope} onChange={e => setSelectedScope(e.target.value)} placeholder="e.g. Engineering, Marketing" style={{ height: 40 }} />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowGrant(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!selectedMember || !selectedAccess || granting} onClick={handleGrant}>
                {granting ? "Granting..." : isOwner ? "Grant Access" : "Request Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}