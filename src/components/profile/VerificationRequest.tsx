import AvatarSquare from "@/components/ui/AvatarSquare";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Send, CheckCircle, Clock, XCircle, Mail, Copy, ExternalLink, RefreshCw, X } from "lucide-react";
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

const LOGO_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];
const hashColor = (name: string) => LOGO_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

export default function VerificationRequest({ item, itemType, onStatusChange }: VerificationRequestProps) {
  const { user, profile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<"search" | "confirm" | "not_found" | "direct">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [verifiers, setVerifiers] = useState<any[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [directEmail, setDirectEmail] = useState("");
  const [directSearch, setDirectSearch] = useState("");
  const [directResults, setDirectResults] = useState<any[]>([]);

  // Close on Escape key
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded]);

  const companyName = item.company_name || item.institution_name || item.institution_name_edu || "";

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

  useEffect(() => {
    if (!selectedOrg) return;
    (async () => {
      const itemDept = item.department || "";
      const { data: routes } = await supabase.from("org_verif_routes")
        .select("assigned_to_user_id, condition_type, condition_value")
        .eq("org_id", selectedOrg.id);

      let assignedIds: string[] = [];
      if (routes?.length) {
        const matched = routes.filter(r =>
          !r.condition_type || r.condition_type === "all" ||
          (r.condition_type === "department" && r.condition_value?.toLowerCase() === itemDept.toLowerCase())
        );
        assignedIds = matched.map(r => r.assigned_to_user_id).filter(Boolean) as string[];
      }

      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", assignedIds);
        setVerifiers((profiles || []).map(p => ({ user_id: p.id, profile: p, title: "Assigned Verifier", role: "verifier" })));
      } else {
        const { data } = await supabase.from("org_members")
          .select("user_id, title, role")
          .eq("org_id", selectedOrg.id)
          .or("role.in.(owner,admin)");
        if (!data?.length) return;
        const uids = data.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", uids);
        setVerifiers(data.map(d => ({ ...d, profile: profiles?.find(p => p.id === d.user_id) })));
      }
    })();
  }, [selectedOrg, item.department]);

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

    await supabase.from("alerts").insert({
      user_id: verifierId,
      type: "verification_request",
      title: "Verification Request",
      body: `${profile?.full_name || "Someone"} wants you to verify their ${itemType} at ${companyName}`,
      action_url: `/app/profile/${user.id}`,
      data: { actor_id: user.id, item_id: item.id, item_type: itemType, org_id: selectedOrg?.id } as any,
    });

    const table = itemType === "achievement" ? "achievements" : "work_items";
    await supabase.from(table).update({ verification_status: "pending" } as any).eq("id", item.id);

    onStatusChange(item.id, "pending");
    toast.success("Verification request sent");
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
    toast.success("Invite sent");
    setExpanded(false);
    setSubmitting(false);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/verify-invite?ref=${user?.id}&item=${item.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const shareWhatsApp = () => {
    const link = `${window.location.origin}/verify-invite?ref=${user?.id}&item=${item.id}`;
    const msg = `Hi! I'd like you to verify my ${itemType} at ${companyName} on Tiikme. ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // VERIFIED
  if (item.verification_status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full shrink-0 cursor-default"
        title={`Verified${item.verified_at ? ` on ${new Date(item.verified_at).toLocaleDateString()}` : ""}`}
        style={{ background: "linear-gradient(135deg, #FFB800, #FF8C00)", color: "#fff", boxShadow: "0 0 8px rgba(255,184,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }

  // PENDING
  if (item.verification_status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(245,158,11,0.10)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Clock className="w-3 h-3" /> Pending...
      </span>
    );
  }

  // REJECTED
  if (item.verification_status === "rejected" || item.verification_status === "declined") {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-semibold" style={{ color: "#DC2626" }}>Declined</span>
        <button type="button" onClick={() => { setExpanded(true); setStep("search"); }}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
          style={{ color: "#E8733A", border: "1px solid #E8733A", background: "transparent" }}>
          <RefreshCw className="w-2.5 h-2.5" /> Retry
        </button>
      </div>
    );
  }

  // UNVERIFIED — trigger button + full-screen modal
  return (
    <div className="shrink-0">
      <button type="button" onClick={() => { setExpanded(!expanded); setStep("search"); setSearchQuery(""); }}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all hover:shadow-md"
        style={{ color: "#E8733A", border: "1.5px solid #E8733A", background: expanded ? "rgba(232,115,58,0.08)" : "transparent" }}>
        {expanded ? "Cancel" : "Verify"}
      </button>

      {/* ── FIXED MODAL OVERLAY via Portal ── */}
      {expanded && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(26,26,78,0.40)", backdropFilter: "blur(8px)" }}
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full flex flex-col"
            style={{
              maxWidth: 520, maxHeight: "80vh", borderRadius: 20, padding: 0,
              background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 80px rgba(26,26,78,0.20)",
              overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0" style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>
                {step === "search" ? "Find Organization" : step === "confirm" ? "Select Verifier" : step === "not_found" ? "Invite via Email" : "Ask Someone Directly"}
              </p>
              <button type="button" onClick={() => setExpanded(false)} className="p-1 cursor-pointer" style={{ color: "#9CA3C0" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticky search bar (for search step) */}
            {step === "search" && (
              <div className="shrink-0" style={{ padding: "12px 20px 0", position: "sticky", top: 0, zIndex: 10, background: "#fff" }}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: "#9CA3C0" }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search organization to verify with..."
                    autoFocus
                    style={{
                      width: "100%", height: 44,
                      background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10,
                      padding: "0 16px 0 40px", fontSize: 14, color: "#1A1A2E", outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto" style={{ padding: "12px 20px" }}>
              {step === "search" && (
                <div className="space-y-2">
                  {orgs.map(org => (
                    <button type="button" key={org.id} onClick={() => { setSelectedOrg(org); setStep("confirm"); }}
                      className="flex items-center gap-3 w-full p-3 rounded-xl text-left cursor-pointer transition-colors hover:bg-gray-50"
                      style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-10 h-10 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
                        style={{ borderRadius: 0, background: org.logo_url ? "transparent" : hashColor(org.name) }}>
                        {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-cover" style={{ borderRadius: 0 }} /> : org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{org.name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3C0" }}>{org.type}</p>
                      </div>
                    </button>
                  ))}
                  {searchQuery.length >= 2 && orgs.length === 0 && (
                    <div className="p-4 rounded-xl text-center space-y-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#D97706" }}>"{searchQuery}" is not yet on Tiikme</p>
                      <p style={{ fontSize: 11, color: "#9CA3C0" }}>Invite them to verify your {itemType}</p>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={copyInviteLink}
                          className="flex items-center justify-center gap-2 w-full h-9 rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                          style={{ fontSize: 12, fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                          <Copy className="w-3.5 h-3.5" /> Copy Invite Link
                        </button>
                        <button type="button" onClick={() => setStep("not_found")}
                          className="flex items-center justify-center gap-2 w-full h-9 rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                          style={{ fontSize: 12, fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                          <Mail className="w-3.5 h-3.5" /> Send via Email
                        </button>
                        <button type="button" onClick={shareWhatsApp}
                          className="flex items-center justify-center gap-2 w-full h-9 rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                          style={{ fontSize: 12, fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                          <ExternalLink className="w-3.5 h-3.5" /> Send via WhatsApp
                        </button>
                        <button type="button" onClick={() => setStep("direct")}
                          className="cursor-pointer" style={{ fontSize: 11, fontWeight: 500, color: "#E8733A", marginTop: 4, background: "none", border: "none" }}>
                          Or ask someone directly →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "confirm" && selectedOrg && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                    <div className="w-10 h-10 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
                      style={{ borderRadius: 0, background: selectedOrg.logo_url ? "transparent" : hashColor(selectedOrg.name) }}>
                      {selectedOrg.logo_url ? <img src={selectedOrg.logo_url} className="w-full h-full object-cover" style={{ borderRadius: 0 }} /> : selectedOrg.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Send request to {selectedOrg.name}?</p>
                      <p style={{ fontSize: 11, color: "#9CA3C0" }}>Select who should verify you</p>
                    </div>
                  </div>

                  {verifiers.length === 0 && (
                    <p style={{ fontSize: 12, textAlign: "center", padding: 8, color: "#9CA3C0" }}>
                      No admins found. <button type="button" onClick={() => setStep("direct")} className="font-semibold cursor-pointer" style={{ color: "#E8733A", background: "none", border: "none" }}>Try asking someone directly</button>
                    </p>
                  )}

                  <div className="space-y-2" style={{ maxHeight: 200, overflowY: "auto" }}>
                    {verifiers.map(v => (
                      <button type="button" key={v.user_id} onClick={() => setSelectedVerifier(v)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl cursor-pointer transition-colors"
                        style={{
                          background: selectedVerifier?.user_id === v.user_id ? "rgba(232,115,58,0.06)" : "transparent",
                          border: `1.5px solid ${selectedVerifier?.user_id === v.user_id ? "#E8733A" : "rgba(0,0,0,0.06)"}`,
                        }}>
                        <AvatarSquare src={v.profile?.avatar_url} name={v.profile?.full_name || "U"} size="sm" />
                        <div className="text-left min-w-0">
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{v.profile?.full_name}</p>
                          <p style={{ fontSize: 10, color: "#9CA3C0" }}>{v.title || v.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message (100 chars)" maxLength={100}
                    style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px", fontSize: 12, color: "#1A1A2E", outline: "none" }} />
                </div>
              )}

              {step === "not_found" && (
                <div className="space-y-3">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Invite verifier via email</p>
                  <input value={directEmail} onChange={e => setDirectEmail(e.target.value)} placeholder="admin@company.com"
                    style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px", fontSize: 13, color: "#1A1A2E", outline: "none" }} />
                  <input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message" maxLength={100}
                    style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px", fontSize: 12, color: "#1A1A2E", outline: "none" }} />
                </div>
              )}

              {step === "direct" && (
                <div className="space-y-3">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Ask someone on Tiikme to verify you</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5" style={{ color: "#9CA3C0" }} />
                    <input value={directSearch} onChange={e => setDirectSearch(e.target.value)} placeholder="Search by name or @username..."
                      autoFocus
                      style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px 0 36px", fontSize: 13, color: "#1A1A2E", outline: "none" }} />
                  </div>
                  <div className="space-y-1" style={{ maxHeight: 200, overflowY: "auto" }}>
                    {directResults.map(u => (
                      <button type="button" key={u.id}
                        onClick={() => handleSubmit(u.id, u.full_name || "")}
                        disabled={submitting}
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                        style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
                        <AvatarSquare src={u.avatar_url} name={u.full_name || "U"} size="sm" />
                        <div className="text-left min-w-0 flex-1">
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{u.full_name}</p>
                          <p style={{ fontSize: 10, color: "#9CA3C0" }}>{u.role}{u.institution_name ? ` · ${u.institution_name}` : ""}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#E8733A", flexShrink: 0 }}>Send</span>
                      </button>
                    ))}
                    {directSearch.length >= 2 && directResults.length === 0 && (
                      <p style={{ fontSize: 12, textAlign: "center", padding: 12, color: "#9CA3C0" }}>No users found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer buttons */}
            <div className="shrink-0 flex items-center gap-3" style={{
              padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.06)",
              background: "#fff", position: "sticky", bottom: 0,
            }}>
              {step === "confirm" && selectedOrg && (
                <button type="button"
                  disabled={!selectedVerifier || submitting}
                  onClick={() => handleSubmit(selectedVerifier.user_id, selectedVerifier.profile?.full_name || "")}
                  className="cursor-pointer flex-1"
                  style={{
                    height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: selectedVerifier ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "#ddd",
                    color: selectedVerifier ? "#fff" : "#999", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  <Send className="w-3.5 h-3.5" /> {submitting ? "Sending..." : "Send Request"}
                </button>
              )}
              {step === "not_found" && (
                <button type="button"
                  disabled={!directEmail.includes("@") || submitting}
                  onClick={handleEmailInvite}
                  className="cursor-pointer flex-1"
                  style={{
                    height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: directEmail.includes("@") ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "#ddd",
                    color: directEmail.includes("@") ? "#fff" : "#999", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  <Mail className="w-3.5 h-3.5" /> {submitting ? "Sending..." : "Send Invite"}
                </button>
              )}
              {(step === "confirm" || step === "not_found") && (
                <button type="button" onClick={() => { setStep("search"); setSelectedOrg(null); setSelectedVerifier(null); }}
                  className="cursor-pointer"
                  style={{ height: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                  Back
                </button>
              )}
              {step === "search" && (
                <button type="button" onClick={() => setExpanded(false)}
                  className="cursor-pointer flex-1"
                  style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                  Cancel
                </button>
              )}
              {step === "direct" && (
                <button type="button" onClick={() => { setStep("search"); setDirectSearch(""); }}
                  className="cursor-pointer flex-1"
                  style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                  Back
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
