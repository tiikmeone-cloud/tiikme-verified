/**
 * GetVerifiedModal
 * User-facing modal to request org-based verification.
 * - Shows experience-based quick-pick orgs first
 * - Search org → pick role + role_category → upload proof doc → add note → submit
 * - Notifies ALL org admins (not just the routed assignee)
 * - Falls back to org creator if no admins at all
 */
import { useState, useEffect } from "react";
import { ShieldCheck, Search, Upload, Loader2, X, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GlassModal from "@/components/ui/GlassModal";
import { ROLE_CATEGORIES } from "@/lib/verificationRoles";
import AvatarSquare from "@/components/ui/AvatarSquare";
import type { ExpSuggestion } from "./VerificationStatusCard";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  suggestions?: ExpSuggestion[];
  /** When set, modal is in "add more info" mode — updates the existing request instead of creating a new one */
  amendRequestId?: string;
}

type Org = { id: string; name: string; slug: string; logo_url: string | null };

export default function GetVerifiedModal({ open, onClose, onSubmitted, suggestions = [], amendRequestId }: Props) {
  const { user, profile } = useAuth();
  const [orgQuery, setOrgQuery] = useState("");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [requestedRole, setRequestedRole] = useState("");
  const [roleCategory, setRoleCategory] = useState("default");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("offer_letter");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search orgs
  useEffect(() => {
    if (!open || orgQuery.trim().length < 2) { setOrgs([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url")
        .ilike("name", `%${orgQuery.trim()}%`)
        .limit(8);
      setOrgs((data as Org[]) || []);
    }, 250);
    return () => clearTimeout(t);
  }, [orgQuery, open]);

  const reset = () => {
    setOrgQuery(""); setOrgs([]); setSelectedOrg(null);
    setRequestedRole(""); setRoleCategory("default");
    setDocFile(null); setDocType("offer_letter"); setNote("");
  };
  const handleClose = () => { reset(); onClose(); };

  const pickSuggestion = (s: ExpSuggestion) => {
    if (s.org) {
      setSelectedOrg(s.org);
    } else {
      // Org not in DB — pre-fill search so user can confirm
      setOrgQuery(s.company_name);
    }
    if (s.job_title) setRequestedRole(s.job_title);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Upload doc (optional)
      let documentUrl: string | null = null;
      if (docFile) {
        const ext = docFile.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("verification-docs")
          .upload(path, docFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        documentUrl = path;
      }

      // ── AMEND MODE: update existing more_info_requested row back to pending ──
      if (amendRequestId) {
        const { error } = await supabase.from("verification_requests").update({
          status: "pending",
          ...(documentUrl ? { document_url: documentUrl, document_type: docType } : {}),
          ...(note ? { context_note: note } : {}),
        }).eq("id", amendRequestId);
        if (error) throw error;
        toast.success("Additional info submitted");
        onSubmitted?.();
        handleClose();
        return;
      }

      // ── NEW REQUEST MODE ──
      if (!user || !selectedOrg || !requestedRole.trim()) {
        toast.error("Fill organisation and role");
        setSubmitting(false);
        return;
      }

      // Resolve routed assignee (specific admin based on role_category routing)
      const { data: assignee } = await supabase.rpc("resolve_verification_assignee", {
        _org_id: selectedOrg.id,
        _role_category: roleCategory,
      });

      const { error } = await supabase.from("verification_requests").insert({
        requester_id: user.id,
        org_id: selectedOrg.id,
        entity_type: "user_org",
        entity_id: selectedOrg.id,
        item_type: "user_org",
        item_id: user.id,
        submitted_id: requestedRole,
        requested_role: requestedRole,
        role_category: roleCategory,
        document_url: documentUrl,
        document_type: docType,
        context_note: note || null,
        status: "pending",
        assigned_to: assignee || null,
      });
      if (error) throw error;

      // Notify ALL org admins — not just the routed assignee
      const toNotify = new Set<string>();
      if (assignee) toNotify.add(assignee as string);

      const { data: orgAdmins } = await supabase
        .from("org_admins")
        .select("user_id")
        .eq("org_id", selectedOrg.id);
      (orgAdmins || []).forEach((a: any) => {
        if (a.user_id && a.user_id !== user.id) toNotify.add(a.user_id);
      });

      // Fallback: if org has no admins at all, notify the org creator profile
      if (toNotify.size === 0) {
        const { data: orgCreator } = await supabase
          .from("profiles")
          .select("id")
          .eq("org_id", selectedOrg.id)
          .eq("account_type", "institution")
          .limit(1)
          .maybeSingle();
        if (orgCreator?.id && orgCreator.id !== user.id) toNotify.add(orgCreator.id);
      }

      const senderName = profile?.full_name || "Someone";
      const notifInserts = [...toNotify].map(userId => ({
        user_id: userId,
        type: "verification_request",
        title: "New verification request",
        body: `${senderName} requested verification as "${requestedRole}" at ${selectedOrg.name}.`,
        action_url: "/app/verification-inbox",
        data: { org_id: selectedOrg.id, requester_id: user.id },
      }));
      if (notifInserts.length > 0) {
        await supabase.from("notifications").insert(notifInserts);
      }

      toast.success("Verification request sent");
      onSubmitted?.();
      handleClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // Amend mode: simplified UI — just doc upload + note
  if (amendRequestId) {
    return (
      <GlassModal
        open={open}
        onClose={handleClose}
        title="Add more information"
        icon={ShieldCheck}
        accentColor="#E8733A"
        actions={
          <>
            <button type="button" onClick={handleClose}
              className="flex-1 h-11 rounded-xl text-[14px] font-semibold cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
              Cancel
            </button>
            <button type="button" disabled={submitting} onClick={handleSubmit}
              className="flex-1 h-11 rounded-xl text-[14px] font-bold cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Resubmit"}
            </button>
          </>
        }
      >
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.60)" }}>
          The reviewer asked for more information. Upload an updated document and/or add a note, then resubmit.
        </p>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <select value={docType} onChange={e => setDocType(e.target.value)}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13, outline: "none", cursor: "pointer" }}>
            <option value="offer_letter" style={{ background: "#1A1A4E" }}>Offer letter</option>
            <option value="employee_id" style={{ background: "#1A1A4E" }}>Employee ID</option>
            <option value="student_id" style={{ background: "#1A1A4E" }}>Student ID</option>
            <option value="appointment" style={{ background: "#1A1A4E" }}>Appointment letter</option>
            <option value="other" style={{ background: "#1A1A4E" }}>Other</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer truncate"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px dashed rgba(255,255,255,0.20)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13 }}>
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">{docFile ? docFile.name : "Upload updated proof (PDF / image)"}</span>
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div>
          <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Message to reviewer (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 400))} rows={3}
            placeholder="Explain what you've added or clarified…"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", padding: "10px 14px", fontSize: 14, outline: "none", width: "100%", resize: "none" }} />
        </div>
      </GlassModal>
    );
  }

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Request verification"
      icon={ShieldCheck}
      accentColor="#E8733A"
      actions={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !selectedOrg || !requestedRole.trim()}
            onClick={handleSubmit}
            className="flex-1 h-11 rounded-xl text-[14px] font-bold cursor-pointer disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Submit request"}
          </button>
        </>
      }
    >
      {/* Org picker */}
      {!selectedOrg ? (
        <div className="space-y-3">
          {/* Quick-pick from experience */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-[12px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>From your profile</p>
              <div className="space-y-1">
                {suggestions.map((s, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => pickSuggestion(s)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer text-left"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {s.org ? (
                      <AvatarSquare src={s.org.logo_url} name={s.org.name} size={28} />
                    ) : (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.10)" }}>
                        <Building2 className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.50)" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{s.company_name}</p>
                      {s.job_title && <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.50)" }}>{s.job_title}</p>}
                    </div>
                    {!s.org && (
                      <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>not on Tiikme</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>or search</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
              </div>
            </div>
          )}

          <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Select organisation</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.50)" }} />
            <input
              autoFocus={suggestions.length === 0}
              value={orgQuery}
              onChange={e => setOrgQuery(e.target.value)}
              placeholder="Search organisations…"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, paddingLeft: 38, paddingRight: 14, fontSize: 14, outline: "none", width: "100%" }}
            />
          </div>
          {orgs.length > 0 && (
            <div className="mt-2 space-y-1">
              {orgs.map(o => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setSelectedOrg(o)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer text-left"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <AvatarSquare src={o.logo_url} name={o.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{o.name}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.50)" }}>@{o.slug}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Selected org */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <AvatarSquare src={selectedOrg.logo_url} name={selectedOrg.name} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.60)" }} />
                {selectedOrg.name}
              </p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.50)" }}>@{selectedOrg.slug}</p>
            </div>
            <button type="button" onClick={() => setSelectedOrg(null)} className="p-1 cursor-pointer" style={{ color: "rgba(255,255,255,0.50)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Your role</label>
            <input
              value={requestedRole}
              onChange={e => setRequestedRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%" }}
            />
          </div>

          {/* Role category */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Department</label>
            <select
              value={roleCategory}
              onChange={e => setRoleCategory(e.target.value)}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer" }}
            >
              {ROLE_CATEGORIES.map(rc => (
                <option key={rc.value} value={rc.value} style={{ background: "#1A1A4E", color: "#F0F2F7" }}>{rc.label}</option>
              ))}
            </select>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Routes your request to the right admin.</p>
          </div>

          {/* Document type + upload */}
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13, outline: "none", cursor: "pointer" }}
            >
              <option value="offer_letter" style={{ background: "#1A1A4E" }}>Offer letter</option>
              <option value="employee_id" style={{ background: "#1A1A4E" }}>Employee ID</option>
              <option value="student_id" style={{ background: "#1A1A4E" }}>Student ID</option>
              <option value="appointment" style={{ background: "#1A1A4E" }}>Appointment letter</option>
              <option value="other" style={{ background: "#1A1A4E" }}>Other</option>
            </select>
            <label
              className="flex items-center gap-2 cursor-pointer truncate"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px dashed rgba(255,255,255,0.20)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13 }}
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">{docFile ? docFile.name : "Upload proof (PDF / image)"}</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={e => setDocFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Optional note */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Message to reviewer (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 400))}
              rows={3}
              placeholder="Anything that helps the reviewer confirm your role…"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", padding: "10px 14px", fontSize: 14, outline: "none", width: "100%", resize: "none" }}
            />
          </div>
        </>
      )}
    </GlassModal>
  );
}
