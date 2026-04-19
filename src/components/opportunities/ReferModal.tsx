import { useState, useEffect } from "react";
import { X, Link2, ChevronLeft, ChevronRight, Briefcase, Users as UsersIcon, MessageSquare, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Either pass a candidate (Find tab flow) or a single opportunity (legacy direct refer) */
  candidateId?: string;
  candidateName?: string;
  /** Legacy: when refer button is clicked from a known opportunity row */
  opportunity?: any;
}

export default function ReferModal({ open, onClose, candidateId, candidateName, opportunity }: Props) {
  const { user, profile } = useAuth();

  // Resolve candidate from props (FindTab passes candidateId/candidateName; legacy callers may pass opportunity only)
  const resolvedCandidateId = candidateId || null;
  const resolvedCandidateName = candidateName || "this candidate";

  // ── Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — opportunity choice
  const [myOpps, setMyOpps] = useState<any[]>([]);
  const [oppMode, setOppMode] = useState<"my" | "external">("my");
  const [selectedOppId, setSelectedOppId] = useState<string>(opportunity?.id || "");
  const [externalTitle, setExternalTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  // Step 2 — tag a hiring manager
  const [managerSearch, setManagerSearch] = useState("");
  const [managerResults, setManagerResults] = useState<any[]>([]);
  const [taggedManager, setTaggedManager] = useState<any | null>(null);

  // Step 3 — message
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setMessage(`Hi, I'd like to refer ${resolvedCandidateName} for the {role}. They're a strong fit because…`);
  }, [open, resolvedCandidateName]);

  // Load my open opportunities
  useEffect(() => {
    if (!open || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("id, title, org:organizations!opportunities_org_id_fkey(name)")
        .eq("poster_id", user.id)
        .eq("is_open", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setMyOpps(data || []);
      if (opportunity?.id) setSelectedOppId(opportunity.id);
      else if (!selectedOppId && (data || []).length === 1) setSelectedOppId(data![0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  // Search accepted strands for "tag a manager"
  useEffect(() => {
    if (!open || !user?.id) return;
    if (!managerSearch.trim() || managerSearch.length < 2) { setManagerResults([]); return; }
    const t = setTimeout(async () => {
      const { data: strands } = await supabase
        .from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      const otherIds = (strands || []).map((s: any) => s.requester_id === user.id ? s.receiver_id : s.requester_id);
      if (!otherIds.length) { setManagerResults([]); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline")
        .in("id", otherIds)
        .ilike("full_name", `%${managerSearch}%`)
        .limit(8);
      setManagerResults(profs || []);
    }, 250);
    return () => clearTimeout(t);
  }, [managerSearch, user?.id, open]);

  if (!open) return null;

  // Update message template when opp changes
  const selectedOpp = myOpps.find(o => o.id === selectedOppId);
  const roleTitle = oppMode === "my" ? (selectedOpp?.title || "role") : (externalTitle || "role");

  const canNext = () => {
    if (step === 1) {
      if (oppMode === "my") return !!selectedOppId;
      return externalTitle.trim().length > 0;
    }
    if (step === 2) return true; // tagging is optional
    if (step === 3) return message.trim().length > 0 && message.length <= 500;
    return false;
  };

  const handleSubmit = async () => {
    if (!user || !resolvedCandidateId || submitting) {
      if (!resolvedCandidateId) toast.error("No candidate selected");
      return;
    }
    setSubmitting(true);

    // Only persist when we have an internal opportunity (table requires opportunity_id NOT NULL)
    if (oppMode === "my" && selectedOppId) {
      const { error } = await supabase.from("opportunity_referrals").insert({
        opportunity_id: selectedOppId,
        referrer_id: user.id,
        referred_user_id: resolvedCandidateId,
      } as any);
      if (error) {
        if (error.code === "23505") toast.info("Already referred this person for that role");
        else { toast.error(error.message); setSubmitting(false); return; }
      }
    }

    // Notify the candidate
    sendNotification({
      userId: resolvedCandidateId,
      actorId: user.id,
      type: "referral_received",
      title: `You were referred by ${profile?.full_name || "someone"}`,
      body: oppMode === "my"
        ? `For ${selectedOpp?.title || "an opportunity"} at ${selectedOpp?.org?.name || "their organization"}`
        : `For ${externalTitle}${externalUrl ? ` — ${externalUrl}` : ""}`,
      actionUrl: `/app/profile/${user.id}`,
      data: { opportunity_id: selectedOppId || null, external_title: oppMode === "external" ? externalTitle : null, external_url: oppMode === "external" ? externalUrl : null, message },
    });

    // Notify tagged manager if any
    if (taggedManager?.id) {
      sendNotification({
        userId: taggedManager.id,
        actorId: user.id,
        type: "referral_cc",
        title: `${profile?.full_name || "Someone"} cc'd you on a referral`,
        body: `Referred ${resolvedCandidateName} for ${roleTitle}`,
        actionUrl: `/app/opportunities?tab=referrals`,
      });
    }

    toast.success(`Referral sent. ${resolvedCandidateName} will be notified.`);
    setSubmitting(false);
    onClose();
  };

  const stepMeta = [
    { icon: Briefcase, title: "Refer to one of your roles", subtitle: "Pick an opportunity or share an external one" },
    { icon: UsersIcon, title: "Who else to tag?", subtitle: "Optional — cc a hiring manager" },
    { icon: MessageSquare, title: "Add a personal note", subtitle: "Tell them why this candidate is a fit" },
  ][step - 1];
  const StepIcon = stepMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-[480px] rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5" style={{ color: "#E8733A" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>Refer {resolvedCandidateName}</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "none" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-5 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= step ? "#E8733A" : "var(--surface-2)", transition: "background 200ms" }} />
          ))}
        </div>

        {/* Step header */}
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2">
            <StepIcon className="w-4 h-4" style={{ color: "#E8733A" }} />
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{stepMeta.title}</p>
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{stepMeta.subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 min-h-[200px]">
          {step === 1 && (
            <div className="space-y-3 mt-2">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setOppMode("my")} className="flex-1 h-9 rounded-lg text-[12px] font-semibold cursor-pointer"
                  style={oppMode === "my"
                    ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }
                    : { background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }}>
                  My opportunities
                </button>
                <button type="button" onClick={() => setOppMode("external")} className="flex-1 h-9 rounded-lg text-[12px] font-semibold cursor-pointer"
                  style={oppMode === "external"
                    ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }
                    : { background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }}>
                  External role
                </button>
              </div>

              {oppMode === "my" ? (
                myOpps.length ? (
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                    {myOpps.map(o => (
                      <button key={o.id} type="button" onClick={() => setSelectedOppId(o.id)}
                        className="w-full text-left p-3 rounded-xl cursor-pointer transition-all"
                        style={{ border: selectedOppId === o.id ? "1.5px solid #E8733A" : "1px solid var(--border)", background: selectedOppId === o.id ? "rgba(232,115,58,0.06)" : "#fff" }}>
                        <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{o.title}</p>
                        {o.org?.name && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{o.org.name}</p>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-center py-6" style={{ color: "var(--text-3)" }}>You have no open opportunities. Try External role instead.</p>
                )
              ) : (
                <div className="space-y-2">
                  <input value={externalTitle} onChange={e => setExternalTitle(e.target.value.slice(0, 100))} placeholder="Role title (e.g. Senior Designer at Acme)"
                    className="w-full h-10 rounded-xl px-3.5 text-[13px] outline-none glass-input" maxLength={100} />
                  <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="Job URL (optional)"
                    className="w-full h-10 rounded-xl px-3.5 text-[13px] outline-none glass-input" />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 mt-2">
              {taggedManager ? (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(232,115,58,0.06)", border: "1px solid rgba(232,115,58,0.20)" }}>
                  <AvatarSquare src={taggedManager.avatar_url} name={taggedManager.full_name || "U"} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{taggedManager.full_name}</p>
                    {taggedManager.headline && <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{taggedManager.headline}</p>}
                  </div>
                  <button type="button" onClick={() => setTaggedManager(null)} className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "none" }}>
                    <X className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
                    <input value={managerSearch} onChange={e => setManagerSearch(e.target.value)} placeholder="Search your connections by name…"
                      className="w-full h-10 rounded-xl pl-9 pr-4 text-[13px] outline-none glass-input" autoFocus />
                  </div>
                  <div className="space-y-1 max-h-[220px] overflow-y-auto">
                    {managerResults.map(p => (
                      <div key={p.id} onClick={() => setTaggedManager(p)} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-[var(--surface-2)]">
                        <AvatarSquare src={p.avatar_url} name={p.full_name || "U"} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{p.full_name}</p>
                          {p.headline && <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{p.headline}</p>}
                        </div>
                      </div>
                    ))}
                    {managerSearch.length >= 2 && managerResults.length === 0 && (
                      <p className="text-[12px] text-center py-4" style={{ color: "var(--text-3)" }}>No matching connections</p>
                    )}
                  </div>
                </>
              )}
              <button type="button" onClick={() => setStep(3)} className="text-[12px] font-semibold cursor-pointer mt-1" style={{ color: "var(--text-3)", background: "none", border: "none" }}>
                Skip — no tag
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 mt-2">
              <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 500))} rows={6} maxLength={500}
                placeholder="Why is this candidate a strong fit?"
                className="w-full rounded-xl px-3.5 py-3 text-[13px] outline-none resize-none glass-input" />
              <p className="text-right text-[11px]" style={{ color: message.length >= 480 ? "#EF4444" : "var(--text-3)" }}>
                {message.length}/500
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="h-10 px-4 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center gap-1" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "none" }}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button type="button" onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)} disabled={!canNext()}
              className="h-10 px-5 rounded-xl text-[13px] font-bold cursor-pointer flex items-center gap-1 btn-liquid-primary disabled:opacity-40"
              style={{ border: "none" }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={!canNext() || submitting}
              className="h-10 px-6 rounded-xl text-[13px] font-bold cursor-pointer btn-liquid-primary disabled:opacity-40"
              style={{ border: "none" }}>
              {submitting ? "Sending…" : "Send referral"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
