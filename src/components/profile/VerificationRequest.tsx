import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect } from "react";
import { Search, Send, CheckCircle, Clock, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VerificationRequestProps {
  item: any;
  itemType: "experience" | "project" | "education" | "achievement";
  onStatusChange: (itemId: string, status: string, verifierName?: string) => void;
}

export default function VerificationRequest({ item, itemType, onStatusChange }: VerificationRequestProps) {
  const { user, profile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [verifiers, setVerifiers] = useState<any[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"search" | "org_selected" | "not_found" | "direct">("search");
  const [directEmail, setDirectEmail] = useState("");
  const [directSearch, setDirectSearch] = useState("");
  const [directResults, setDirectResults] = useState<any[]>([]);

  const companyName = item.company_name || item.institution_name || item.institution_name_edu || "";

  // Search organizations
  useEffect(() => {
    if (searchQuery.length < 2) { setOrgs([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("organizations")
        .select("id, name, type, logo_url, slug")
        .ilike("name", `%${searchQuery}%`)
        .limit(5);
      setOrgs(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load verifiers for selected org — check org_verif_routes first, fallback to admins
  useEffect(() => {
    if (!selectedOrg) return;
    (async () => {
      // Check for department-specific routing rules
      const itemDept = item.department || "";
      const { data: routes } = await supabase.from("org_verif_routes")
        .select("assigned_to_user_id, condition_type, condition_value")
        .eq("org_id", selectedOrg.id);

      let assignedIds: string[] = [];
      if (routes?.length) {
        // Match by department if available
        const matched = routes.filter(r =>
          !r.condition_type || r.condition_type === "all" ||
          (r.condition_type === "department" && r.condition_value?.toLowerCase() === itemDept.toLowerCase())
        );
        assignedIds = matched.map(r => r.assigned_to_user_id).filter(Boolean) as string[];
      }

      // If routes found specific verifiers, use those; otherwise fall back to admins
      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", assignedIds);
        setVerifiers((profiles || []).map(p => ({ user_id: p.id, profile: p, title: "Assigned Verifier", role: "verifier" })));
      } else {
        // Fallback: load org admins/owners
        const { data } = await supabase.from("org_members")
          .select("user_id, title, role")
          .eq("org_id", selectedOrg.id)
          .or("role.in.(owner,admin)");
        if (!data?.length) return;
        const uids = data.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", uids);
        const merged = data.map(d => ({
          ...d,
          profile: profiles?.find(p => p.id === d.user_id),
        }));
        setVerifiers(merged);
      }
    })();
  }, [selectedOrg, item.department]);

  // Direct user search
  useEffect(() => {
    if (directSearch.length < 2) { setDirectResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles")
        .select("id, full_name, avatar_url, role, institution_name")
        .or(`full_name.ilike.%${directSearch}%,username.ilike.%${directSearch}%`)
        .neq("id", user?.id || "")
        .limit(5);
      setDirectResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [directSearch, user?.id]);

  const handleSubmit = async (verifierId: string, verifierName: string) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("item_verification_requests").insert({
      requester_id: user.id,
      work_item_id: item.id,
      verifier_id: verifierId,
      org_id: selectedOrg?.id || null,
      message: message.trim() || null,
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }

    // Create alert for verifier — route notification
    await supabase.from("alerts").insert({
      user_id: verifierId,
      type: "verification_request",
      title: "Verification Request",
      body: `${profile?.full_name || "Someone"} wants you to verify their ${itemType} at ${companyName}`,
      action_url: `/app/profile/${user.id}`,
      data: { actor_id: user.id, item_id: item.id, item_type: itemType, org_id: selectedOrg?.id } as any,
    });

    // Update work item status
    const table = itemType === "achievement" ? "achievements" : "work_items";
    await supabase.from(table).update({ verification_status: "pending" } as any).eq("id", item.id);

    onStatusChange(item.id, "pending");
    toast.success("Verification request sent ✓");
    setExpanded(false);
    setSubmitting(false);
  };

  const handleEmailInvite = async () => {
    if (!directEmail.includes("@")) { toast.error("Enter a valid email"); return; }
    setSubmitting(true);
    await supabase.from("item_verification_requests").insert({
      requester_id: user!.id,
      work_item_id: item.id,
      verifier_email: directEmail,
      message: message.trim() || null,
    } as any);
    const table = itemType === "achievement" ? "achievements" : "work_items";
    await supabase.from(table).update({ verification_status: "pending" } as any).eq("id", item.id);
    onStatusChange(item.id, "pending");
    toast.success("Invite sent ✓");
    setExpanded(false);
    setSubmitting(false);
  };

  // Badge display
  if (item.verification_status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
        style={{ background: "rgba(16,185,129,0.08)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }

  if (item.verification_status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
        style={{ background: "rgba(245,158,11,0.08)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}>
        <Clock className="w-3 h-3" /> Verification requested
      </span>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>○ Unverified</span>
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-[10px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>
          {expanded ? "Cancel" : "Request Verification →"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 p-3 rounded-xl space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {mode === "search" && (
            <>
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>
                Is {companyName || "this organization"} on Tiikme?
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search organization..."
                  className="pl-9 h-9 text-[12px]"
                />
              </div>
              {orgs.map(org => (
                <button type="button" key={org.id} onClick={() => { setSelectedOrg(org); setMode("org_selected"); }}
                  className="flex items-center gap-2 w-full p-2 rounded-lg text-left cursor-pointer"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "var(--brand)" }}>
                    {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-cover rounded-lg" /> : org.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>{org.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{org.type}</p>
                  </div>
                </button>
              ))}
              {searchQuery.length >= 2 && orgs.length === 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" className="text-[11px] h-7" onClick={() => setMode("not_found")}>
                    <Mail className="w-3 h-3 mr-1" /> Invite via email
                  </Button>
                  <Button size="sm" variant="secondary" className="text-[11px] h-7" onClick={() => setMode("direct")}>
                    Ask someone directly
                  </Button>
                </div>
              )}
            </>
          )}

          {mode === "org_selected" && (
            <>
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>
                Select who should verify you at {selectedOrg?.name}
              </p>
              {verifiers.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>No admins found. Try inviting directly.</p>}
              {verifiers.map(v => (
                <button type="button" key={v.user_id} onClick={() => setSelectedVerifier(v)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg cursor-pointer"
                  style={{ background: selectedVerifier?.user_id === v.user_id ? "var(--brand-dim)" : "var(--surface)", border: `1px solid ${selectedVerifier?.user_id === v.user_id ? "var(--brand)" : "var(--border)"}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden" style={{ background: "var(--brand)" }}>
                    {v.profile?.avatar_url ? <img src={storageImageUrl(v.profile.avatar_url, "avatar")} className="w-full h-full object-cover" /> : (v.profile?.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>{v.profile?.full_name}</p>
                    <p className="text-[9px]" style={{ color: "var(--text-3)" }}>{v.title || v.role}</p>
                  </div>
                </button>
              ))}
              <Input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message (100 chars)" className="h-8 text-[11px]" maxLength={100} />
              <Button size="sm" disabled={!selectedVerifier || submitting} className="w-full text-[11px]"
                onClick={() => handleSubmit(selectedVerifier.user_id, selectedVerifier.profile?.full_name || "")}>
                <Send className="w-3 h-3 mr-1" /> {submitting ? "Sending..." : "Send Request"}
              </Button>
              <button type="button" onClick={() => { setMode("search"); setSelectedOrg(null); }} className="text-[10px] cursor-pointer" style={{ color: "var(--text-3)" }}>← Back</button>
            </>
          )}

          {mode === "not_found" && (
            <>
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>Enter verifier's email</p>
              <Input value={directEmail} onChange={e => setDirectEmail(e.target.value)} placeholder="admin@company.com" className="h-8 text-[11px]" />
              <Input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message" className="h-8 text-[11px]" maxLength={100} />
              <Button size="sm" disabled={!directEmail.includes("@") || submitting} className="w-full text-[11px]" onClick={handleEmailInvite}>
                {submitting ? "Sending..." : "Send Invite"}
              </Button>
              <button type="button" onClick={() => setMode("search")} className="text-[10px] cursor-pointer" style={{ color: "var(--text-3)" }}>← Back</button>
            </>
          )}

          {mode === "direct" && (
            <>
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>Search for a person who can verify this</p>
              <Input value={directSearch} onChange={e => setDirectSearch(e.target.value)} placeholder="Search by name..." className="h-8 text-[11px]" />
              {directResults.map(p => (
                <button type="button" key={p.id} onClick={() => setSelectedVerifier({ user_id: p.id, profile: p })}
                  className="flex items-center gap-2 w-full p-2 rounded-lg cursor-pointer"
                  style={{ background: selectedVerifier?.user_id === p.id ? "var(--brand-dim)" : "var(--surface)", border: `1px solid ${selectedVerifier?.user_id === p.id ? "var(--brand)" : "var(--border)"}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden" style={{ background: "var(--brand)" }}>
                    {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} className="w-full h-full object-cover" /> : (p.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>{p.full_name}</p>
                </button>
              ))}
              <Input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message" className="h-8 text-[11px]" maxLength={100} />
              <Button size="sm" disabled={!selectedVerifier || submitting} className="w-full text-[11px]"
                onClick={() => handleSubmit(selectedVerifier.user_id, selectedVerifier.profile?.full_name || "")}>
                {submitting ? "Sending..." : "Send Request"}
              </Button>
              <button type="button" onClick={() => setMode("search")} className="text-[10px] cursor-pointer" style={{ color: "var(--text-3)" }}>← Back</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
