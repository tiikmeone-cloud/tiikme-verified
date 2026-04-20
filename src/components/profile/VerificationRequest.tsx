import AvatarSquare from "@/components/ui/AvatarSquare";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Send, CheckCircle, Clock, RefreshCw, X, ArrowLeft, Copy } from "lucide-react";
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
  const [step, setStep] = useState<"search" | "confirm" | "not_found" | "sent">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [verifiers, setVerifiers] = useState<any[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded]);

  // Lock body scroll
  useEffect(() => {
    if (expanded) { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }
  }, [expanded]);

  const companyName = item.company_name || item.institution_name || item.institution_name_edu || "";

  // Search organizations AND pages
  useEffect(() => {
    if (searchQuery.length < 2) { setOrgs([]); return; }
    const t = setTimeout(async () => {
      const term = `%${searchQuery}%`;
      const [orgRes, pageRes] = await Promise.all([
        supabase.from("organizations").select("id, name, type, logo_url, slug").ilike("name", term).limit(5),
        supabase.from("pages").select("id, name, page_type, logo_url, slug").or(`name.ilike.${term},also_known_as.ilike.${term}`).limit(5),
      ]);
      const results: any[] = [];
      (orgRes.data || []).forEach(o => results.push({ ...o, source: "org" }));
      (pageRes.data || []).forEach(p => results.push({ id: p.id, name: p.name, type: p.page_type, logo_url: p.logo_url, slug: p.slug, source: "page" }));
      // Deduplicate by name
      const seen = new Set<string>();
      setOrgs(results.filter(r => { const k = r.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch verifiers for selected org
  useEffect(() => {
    if (!selectedOrg) return;
    (async () => {
      const itemDept = item.department || "";
      const orgId = selectedOrg.id;

      const { data: routes } = await supabase.from("org_verif_routes")
        .select("assigned_to_user_id, condition_type, condition_value")
        .eq("org_id", orgId);

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
          .eq("org_id", orgId)
          .or("role.in.(owner,admin)");
        if (!data?.length) { setVerifiers([]); return; }
        const uids = data.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", uids);
        setVerifiers(data.map(d => ({ ...d, profile: profiles?.find(p => p.id === d.user_id) })));
      }
    })();
  }, [selectedOrg, item.department]);

  const handleSubmit = async (verifierId: string | null, verifierName: string) => {
    // Always pull live auth user — RLS check uses auth.uid()
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast.error("Please log in"); return; }
    setSubmitting(true);

    const payload: any = {
      requester_id: authUser.id,
      item_type: item.item_type || itemType || "experience",
      item_id: item.id,
      submitted_id: item.id,                    // has DB default, set explicitly to be safe
      org_id: selectedOrg?.id || null,
      entity_type: "work_item",
      entity_id: item.id,
      assigned_to: verifierId || null,          // null when org has no admin
      requested_role: item.job_title || item.title || null,
      role_category: item.domain || null,
      context_note: message.trim() || null,
      status: "pending",
    };

    const { error } = await supabase.from("verification_requests").insert(payload);

    if (error) {
      console.error("[verify] error:", error);
      toast.error("Could not submit verification. Please try again.");
      setSubmitting(false);
      return;
    }

    // Notify the assigned verifier (if any)
    if (verifierId) {
      try {
        const { sendNotification } = await import("@/lib/notify");
        sendNotification({
          userId: verifierId,
          actorId: authUser.id,
          type: "verification_request",
          title: "Verification Request",
          body: `${profile?.full_name || "Someone"} wants you to verify their ${itemType} at ${companyName}`,
          actionUrl: `/app/profile/${authUser.id}`,
          data: { item_id: item.id, item_type: itemType, org_id: selectedOrg?.id },
        });
      } catch (e) { console.warn("notify failed", e); }
    }

    // Mark the item as pending (scoped to owner — RLS-safe)
    if (itemType === "achievement") {
      await supabase.from("achievements").update({ verification_status: "pending" } as any)
        .eq("id", item.id).eq("user_id", authUser.id);
    } else {
      await supabase.from("work_items").update({ verification_status: "pending" } as any)
        .eq("id", item.id).eq("owner_id", authUser.id);
    }

    onStatusChange(item.id, "pending");
    toast.success(verifierId
      ? "Verification request sent"
      : "Submitted — the Tiikme team will review it soon.");
    setStep("sent");
    setSubmitting(false);
  };

  const handleInvite = () => {
    const inviteLink = `${window.location.origin}/invite?ref=${user?.id}&org=${encodeURIComponent(searchQuery || companyName)}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const goBack = () => {
    if (step === "confirm" || step === "not_found") {
      setStep("search");
      setSelectedOrg(null);
      setSelectedVerifier(null);
    } else if (step === "sent") {
      setExpanded(false);
    }
  };

  const stepTitle = step === "search" ? `Verify: ${item.title || companyName}`
    : step === "confirm" ? "Select Verifier"
    : step === "not_found" ? "Organization Not Found"
    : "Request Sent";

  // VERIFIED
  if (item.verification_status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 shrink-0 cursor-default"
        title={`Verified${item.verified_at ? ` on ${new Date(item.verified_at).toLocaleDateString()}` : ""}`}
        style={{ color: "#F59E0B", fontSize: 16, fontWeight: 700 }}>
        <CheckCircle className="w-4 h-4" style={{ color: "#F59E0B" }} />
      </span>
    );
  }

  // PENDING
  if (item.verification_status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(245,158,11,0.10)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  }

  // REJECTED
  if (item.verification_status === "rejected" || item.verification_status === "declined") {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-semibold" style={{ color: "#DC2626" }}>Declined</span>
        <button type="button" onClick={() => { setExpanded(true); setStep("search"); setSearchQuery(""); }}
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
      <button type="button" onClick={() => { setExpanded(true); setStep("search"); setSearchQuery(""); }}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all hover:shadow-md"
        style={{ color: "#E8733A", border: "1.5px solid #E8733A", background: "transparent" }}>
        Verify
      </button>

      {expanded && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            background: "rgba(26,26,78,0.40)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setExpanded(false)}
        >
          <div
            className="flex flex-col"
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "85vh",
              borderRadius: 20,
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 80px rgba(26,26,78,0.20)",
              overflow: "hidden",
              margin: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 shrink-0" style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {step !== "search" && (
                <button type="button" onClick={goBack} className="cursor-pointer p-1" style={{ color: "#1A1A2E" }}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <p className="flex-1 truncate" style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{stepTitle}</p>
              <button type="button" onClick={() => setExpanded(false)} className="p-1 cursor-pointer" style={{ color: "#9CA3C0" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Work item summary */}
            {step === "search" && companyName && (
              <div className="shrink-0" style={{ padding: "10px 20px", background: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{item.title}</p>
                <p style={{ fontSize: 12, color: "#9CA3C0" }}>{companyName}{item.start_date ? ` · ${new Date(item.start_date).getFullYear()}` : ""}</p>
              </div>
            )}

            {/* Search bar */}
            {step === "search" && (
              <div className="shrink-0" style={{ padding: "12px 20px 0" }}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: "#9CA3C0" }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search organization..."
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
                    <button type="button" key={`${org.source}-${org.id}`} onClick={() => { setSelectedOrg(org); setStep("confirm"); }}
                      className="flex items-center gap-3 w-full p-3 rounded-xl text-left cursor-pointer transition-colors hover:bg-gray-50"
                      style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-10 h-10 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
                        style={{ borderRadius: 0, background: org.logo_url ? "transparent" : hashColor(org.name) }}>
                        {org.logo_url ? <img src={org.logo_url} loading="lazy" className="w-full h-full object-cover" style={{ borderRadius: 0 }} alt="" /> : org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{org.name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3C0" }}>{org.type}</p>
                      </div>
                    </button>
                  ))}

                  {/* Not found — invite only */}
                  {searchQuery.length >= 2 && orgs.length === 0 && (
                    <div className="p-5 rounded-xl text-center space-y-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>"{searchQuery}" is not on Tiikme yet</p>
                      <p style={{ fontSize: 12, color: "#9CA3C0" }}>Invite them to join so they can verify your {itemType}</p>
                      <button type="button" onClick={handleInvite}
                        className="flex items-center justify-center gap-2 mx-auto cursor-pointer"
                        style={{
                          height: 40, padding: "0 24px", borderRadius: 10,
                          background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff",
                          fontSize: 13, fontWeight: 600, border: "none",
                        }}>
                        <Copy className="w-4 h-4" /> Invite
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === "confirm" && selectedOrg && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                    <div className="w-10 h-10 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
                      style={{ borderRadius: 0, background: selectedOrg.logo_url ? "transparent" : hashColor(selectedOrg.name) }}>
                      {selectedOrg.logo_url ? <img src={selectedOrg.logo_url} loading="lazy" className="w-full h-full object-cover" style={{ borderRadius: 0 }} alt="" /> : selectedOrg.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Send request to {selectedOrg.name}?</p>
                      <p style={{ fontSize: 11, color: "#9CA3C0" }}>Select who should verify you</p>
                    </div>
                  </div>

                  {verifiers.length === 0 && (
                    <p style={{ fontSize: 12, textAlign: "center", padding: 8, color: "#9CA3C0" }}>
                      No admins found for this organization yet.
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

              {step === "sent" && (
                <div className="p-6 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 mx-auto" style={{ color: "#34C759" }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Request Sent!</p>
                  <p style={{ fontSize: 13, color: "#9CA3C0" }}>You'll be notified when they respond.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center gap-3" style={{
              padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fff",
            }}>
              {step === "confirm" && (
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
              {step === "search" && (
                <button type="button" onClick={() => setExpanded(false)}
                  className="cursor-pointer flex-1"
                  style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E" }}>
                  Cancel
                </button>
              )}
              {step === "sent" && (
                <button type="button" onClick={() => setExpanded(false)}
                  className="cursor-pointer flex-1"
                  style={{
                    height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
                  }}>
                  Done
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
