import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect } from "react";
import { Search, Send, CheckCircle, Clock, XCircle, Mail, Copy, ExternalLink, RefreshCw } from "lucide-react";
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

  // Load verifiers for selected org
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

  /* ── Badge States ── */

  // VERIFIED — gold glow badge
  if (item.verification_status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full shrink-0 cursor-default"
        title={`Verified${item.verified_at ? ` on ${new Date(item.verified_at).toLocaleDateString()}` : ""}`}
        style={{
          background: "linear-gradient(135deg, #FFB800, #FF8C00)",
          color: "#fff",
          boxShadow: "0 0 8px rgba(255,184,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}>
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }

  // PENDING — amber pill
  if (item.verification_status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(245,158,11,0.10)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Clock className="w-3 h-3" /> Pending...
      </span>
    );
  }

  // REJECTED — red with retry
  if (item.verification_status === "rejected" || item.verification_status === "declined") {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-semibold" style={{ color: "#DC2626" }}>Declined</span>
        <button type="button" onClick={() => { setExpanded(true); setStep("search"); }}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
          style={{ color: "var(--color-accent)", border: "1px solid var(--color-accent)", background: "transparent" }}>
          <RefreshCw className="w-2.5 h-2.5" /> Retry
        </button>
      </div>
    );
  }

  // UNVERIFIED — orange outline "Verify" button
  return (
    <div className="shrink-0">
      <button type="button" onClick={() => { setExpanded(!expanded); setStep("search"); }}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all hover:shadow-md"
        style={{
          color: "#E8733A",
          border: "1.5px solid #E8733A",
          background: expanded ? "rgba(232,115,58,0.08)" : "transparent",
        }}>
        {expanded ? "Cancel" : "Verify"}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-[320px] p-4 rounded-2xl z-30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ background: "var(--glass-card-bg, #fff)", border: "1px solid var(--glass-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)", backdropFilter: "blur(20px)" }}>

          {/* STEP: Search org */}
          {step === "search" && (
            <>
              <p className="text-[12px] font-bold" style={{ color: "var(--color-text)" }}>
                Find {companyName || "the organization"} on Tiikme
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search organization..."
                  className="pl-9 h-9 text-[12px]"
                  autoFocus
                />
              </div>
              {orgs.map(org => (
                <button type="button" key={org.id} onClick={() => { setSelectedOrg(org); setStep("confirm"); }}
                  className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left cursor-pointer transition-colors"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                  <div className="w-9 h-9 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden"
                    style={{ borderRadius: 0, background: org.logo_url ? "transparent" : hashColor(org.name) }}>
                    {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-cover" style={{ borderRadius: 0 }} /> : org.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{org.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{org.type}</p>
                  </div>
                </button>
              ))}
              {searchQuery.length >= 2 && orgs.length === 0 && (
                <div className="p-3 rounded-xl text-center space-y-2" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <p className="text-[11px] font-semibold" style={{ color: "#D97706" }}>
                    "{searchQuery}" is not yet on Tiikme
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Invite them to verify your {itemType}</p>
                  <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={copyInviteLink}
                      className="flex items-center justify-center gap-1.5 w-full h-8 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--color-text)" }}>
                      <Copy className="w-3 h-3" /> Copy Invite Link
                    </button>
                    <button type="button" onClick={() => setStep("not_found")}
                      className="flex items-center justify-center gap-1.5 w-full h-8 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--color-text)" }}>
                      <Mail className="w-3 h-3" /> Send via Email
                    </button>
                    <button type="button" onClick={shareWhatsApp}
                      className="flex items-center justify-center gap-1.5 w-full h-8 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--color-text)" }}>
                      <ExternalLink className="w-3 h-3" /> Send via WhatsApp
                    </button>
                    <button type="button" onClick={() => setStep("direct")}
                      className="text-[10px] font-semibold mt-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                      Or ask someone directly →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP: Confirm — org found, select verifier */}
          {step === "confirm" && selectedOrg && (
            <>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div className="w-10 h-10 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
                  style={{ borderRadius: 0, background: selectedOrg.logo_url ? "transparent" : hashColor(selectedOrg.name) }}>
                  {selectedOrg.logo_url ? <img src={selectedOrg.logo_url} className="w-full h-full object-cover" style={{ borderRadius: 0 }} /> : selectedOrg.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: "var(--color-text)" }}>Send request to {selectedOrg.name}?</p>
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Select who should verify you</p>
                </div>
              </div>

              {verifiers.length === 0 && (
                <p className="text-[11px] text-center py-2" style={{ color: "var(--color-text-muted)" }}>
                  No admins found. <button type="button" onClick={() => setStep("direct")} className="font-semibold cursor-pointer" style={{ color: "var(--color-accent)" }}>Try asking someone directly</button>
                </p>
              )}

              {verifiers.map(v => (
                <button type="button" key={v.user_id} onClick={() => setSelectedVerifier(v)}
                  className="flex items-center gap-2.5 w-full p-2 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: selectedVerifier?.user_id === v.user_id ? "rgba(232,115,58,0.08)" : "var(--glass-bg)",
                    border: `1.5px solid ${selectedVerifier?.user_id === v.user_id ? "#E8733A" : "var(--glass-border)"}`,
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0"
                    style={{ background: hashColor(v.profile?.full_name || "U") }}>
                    {v.profile?.avatar_url ? <img src={storageImageUrl(v.profile.avatar_url, "avatar")} className="w-full h-full object-cover" /> : (v.profile?.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{v.profile?.full_name}</p>
                    <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{v.title || v.role}</p>
                  </div>
                </button>
              ))}

              <Input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message (100 chars)" className="h-8 text-[11px]" maxLength={100} />

              <Button size="sm" disabled={!selectedVerifier || submitting} className="w-full text-[11px] h-9 rounded-xl"
                style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", border: "none" }}
                onClick={() => handleSubmit(selectedVerifier.user_id, selectedVerifier.profile?.full_name || "")}>
                <Send className="w-3 h-3 mr-1" /> {submitting ? "Sending..." : "Send Request"}
              </Button>
              <button type="button" onClick={() => { setStep("search"); setSelectedOrg(null); setSelectedVerifier(null); }}
                className="text-[10px] cursor-pointer" style={{ color: "var(--color-text-muted)" }}>← Back</button>
            </>
          )}

          {/* STEP: Not found — email invite */}
          {step === "not_found" && (
            <>
              <p className="text-[12px] font-bold" style={{ color: "var(--color-text)" }}>Invite verifier via email</p>
              <Input value={directEmail} onChange={e => setDirectEmail(e.target.value)} placeholder="admin@company.com" className="h-8 text-[11px]" />
              <Input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message" className="h-8 text-[11px]" maxLength={100} />
              <Button size="sm" disabled={!directEmail.includes("@") || submitting} className="w-full text-[11px] h-9 rounded-xl"
                style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", border: "none" }}
                onClick={handleEmailInvite}>
                {submitting ? "Sending..." : "Send Invite"}
              </Button>
              <button type="button" onClick={() => setStep("search")} className="text-[10px] cursor-pointer" style={{ color: "var(--color-text-muted)" }}>← Back</button>
            </>
          )}

          {/* STEP: Direct — search a person */}
          {step === "direct" && (
            <>
              <p className="text-[12px] font-bold" style={{ color: "var(--color-text)" }}>Ask someone to verify this</p>
              <Input value={directSearch} onChange={e => setDirectSearch(e.target.value)} placeholder="Search by name..." className="h-8 text-[11px]" />
              {directResults.map(p => (
                <button type="button" key={p.id} onClick={() => setSelectedVerifier({ user_id: p.id, profile: p })}
                  className="flex items-center gap-2.5 w-full p-2 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: selectedVerifier?.user_id === p.id ? "rgba(232,115,58,0.08)" : "var(--glass-bg)",
                    border: `1.5px solid ${selectedVerifier?.user_id === p.id ? "#E8733A" : "var(--glass-border)"}`,
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0"
                    style={{ background: hashColor(p.full_name || "U") }}>
                    {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} className="w-full h-full object-cover" /> : (p.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-[11px] font-semibold text-left" style={{ color: "var(--color-text)" }}>{p.full_name}</p>
                </button>
              ))}
              <Input value={message} onChange={e => setMessage(e.target.value.slice(0, 100))} placeholder="Optional message" className="h-8 text-[11px]" maxLength={100} />
              <Button size="sm" disabled={!selectedVerifier || submitting} className="w-full text-[11px] h-9 rounded-xl"
                style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", border: "none" }}
                onClick={() => handleSubmit(selectedVerifier.user_id, selectedVerifier.profile?.full_name || "")}>
                {submitting ? "Sending..." : "Send Request"}
              </Button>
              <button type="button" onClick={() => setStep("search")} className="text-[10px] cursor-pointer" style={{ color: "var(--color-text-muted)" }}>← Back</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
