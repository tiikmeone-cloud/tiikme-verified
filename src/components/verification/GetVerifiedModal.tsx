/**
 * GetVerifiedModal
 * Handles three verification paths:
 *  1. Org on Tiikme with admins → org admin review
 *  2. Org on Tiikme but no admins / org NOT on Tiikme → platform review
 *  3. Certificate / Award / Achievement → platform review (no org required)
 */
import { useState, useEffect } from "react";
import { ShieldCheck, Search, Upload, Loader2, X, Building2, Award } from "lucide-react";
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
  /** When set, modal is in "add more info" mode — updates the existing request */
  amendRequestId?: string;
}

type Org = { id: string; name: string; slug: string; logo_url: string | null };
type VerifType = "org" | "certificate";

const DOC_OPTIONS = [
  { value: "offer_letter",   label: "Offer letter" },
  { value: "employee_id",    label: "Employee ID" },
  { value: "student_id",     label: "Student ID" },
  { value: "appointment",    label: "Appointment letter" },
  { value: "certificate",    label: "Certificate" },
  { value: "transcript",     label: "Transcript / Marksheet" },
  { value: "other",          label: "Other" },
];

export default function GetVerifiedModal({ open, onClose, onSubmitted, suggestions = [], amendRequestId }: Props) {
  const { user, profile } = useAuth();

  // Verification type
  const [verifType, setVerifType] = useState<VerifType>("org");

  // Org-mode state
  const [orgQuery, setOrgQuery] = useState("");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [unlistedOrgName, setUnlistedOrgName] = useState<string | null>(null); // org typed but not in DB

  // Certificate-mode state
  const [certName, setCertName] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [issueDate, setIssueDate] = useState("");

  // Shared fields
  const [requestedRole, setRequestedRole] = useState("");
  const [roleCategory, setRoleCategory] = useState("default");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("offer_letter");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search orgs (debounced)
  useEffect(() => {
    if (!open || orgQuery.trim().length < 2) { setOrgs([]); setSearchedOnce(false); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url")
        .ilike("name", `%${orgQuery.trim()}%`)
        .limit(8);
      setOrgs((data as Org[]) || []);
      setSearchedOnce(true);
    }, 250);
    return () => clearTimeout(t);
  }, [orgQuery, open]);

  const reset = () => {
    setVerifType("org");
    setOrgQuery(""); setOrgs([]); setSearchedOnce(false);
    setSelectedOrg(null); setUnlistedOrgName(null);
    setCertName(""); setIssuerName(""); setIssueDate("");
    setRequestedRole(""); setRoleCategory("default");
    setDocFile(null); setDocType("offer_letter"); setNote("");
  };
  const handleClose = () => { reset(); onClose(); };

  const pickSuggestion = (s: ExpSuggestion) => {
    if (s.org) {
      setSelectedOrg(s.org);
    } else {
      // Org not in DB — go straight to unlisted path
      setUnlistedOrgName(s.company_name);
    }
    if (s.job_title) setRequestedRole(s.job_title);
  };

  const chooseUnlisted = () => {
    setUnlistedOrgName(orgQuery.trim());
    setOrgQuery(""); setOrgs([]);
  };

  const uploadDoc = async (): Promise<string | null> => {
    if (!docFile || !user) return null;
    const ext = docFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("verification-docs")
      .upload(path, docFile, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const documentUrl = await uploadDoc();

      // ── AMEND MODE ──
      if (amendRequestId) {
        const { error } = await supabase.from("verification_requests").update({
          status: "pending",
          ...(documentUrl ? { document_url: documentUrl, document_type: docType } : {}),
          ...(note ? { context_note: note } : {}),
        }).eq("id", amendRequestId);
        if (error) throw error;
        toast.success("Additional info submitted");
        onSubmitted?.(); handleClose(); return;
      }

      // ── CERTIFICATE / AWARD MODE ──
      if (verifType === "certificate") {
        if (!certName.trim()) { toast.error("Enter the certificate or award name"); setSubmitting(false); return; }
        if (!issuerName.trim()) { toast.error("Enter the issuing organisation or institution"); setSubmitting(false); return; }
        const contextParts = [`Issuer: ${issuerName}`];
        if (issueDate) contextParts.push(`Date: ${issueDate}`);
        if (note) contextParts.push(note);
        const { error } = await supabase.from("verification_requests").insert({
          requester_id: user!.id,
          org_id: null,
          entity_type: "document",
          entity_id: user!.id,
          item_type: "document",
          item_id: user!.id,
          submitted_id: certName,
          requested_role: certName,
          document_url: documentUrl,
          document_type: docType,
          context_note: contextParts.join("\n"),
          status: "pending",
          review_queue: "platform",
        });
        if (error) throw error;
        toast.success("Certificate verification request sent — our team will review it");
        onSubmitted?.(); handleClose(); return;
      }

      // ── ORG MODE ──
      const effectiveOrgId = selectedOrg?.id || null;
      const effectiveOrgName = selectedOrg?.name || unlistedOrgName || "";
      if (!effectiveOrgName) { toast.error("Select or enter an organisation"); setSubmitting(false); return; }
      if (!requestedRole.trim()) { toast.error("Enter your role"); setSubmitting(false); return; }

      // Determine review queue: check if org (if on Tiikme) has any admins
      let assignee: string | null = null;
      let reviewQueue: "org_admin" | "platform" = effectiveOrgId ? "org_admin" : "platform";

      if (effectiveOrgId) {
        const [{ data: rpcAssignee }, { data: adminRows }] = await Promise.all([
          supabase.rpc("resolve_verification_assignee", {
            _org_id: effectiveOrgId,
            _role_category: roleCategory,
          }),
          supabase.from("org_admins").select("user_id").eq("org_id", effectiveOrgId).limit(1),
        ]);
        if (!adminRows || adminRows.length === 0) {
          reviewQueue = "platform"; // org has no admins — Tiikme team reviews
        } else {
          assignee = (rpcAssignee as string | null) || null;
        }
      }

      const contextNote = unlistedOrgName
        ? [`Org: ${unlistedOrgName}`, note].filter(Boolean).join("\n")
        : note || null;

      const { error } = await supabase.from("verification_requests").insert({
        requester_id: user!.id,
        org_id: effectiveOrgId,
        entity_type: "user_org",
        entity_id: user!.id,
        item_type: "user_org",
        item_id: user!.id,
        submitted_id: requestedRole,
        requested_role: requestedRole,
        role_category: roleCategory,
        document_url: documentUrl,
        document_type: docType,
        context_note: contextNote,
        status: "pending",
        assigned_to: assignee,
        review_queue: reviewQueue,
      });
      if (error) throw error;

      // Notify org admins (only if org is in DB and has admins)
      if (effectiveOrgId && reviewQueue === "org_admin") {
        const toNotify = new Set<string>();
        if (assignee) toNotify.add(assignee);
        const { data: orgAdmins } = await supabase
          .from("org_admins").select("user_id").eq("org_id", effectiveOrgId);
        (orgAdmins || []).forEach((a: any) => {
          if (a.user_id && a.user_id !== user!.id) toNotify.add(a.user_id);
        });
        const senderName = profile?.full_name || "Someone";
        const notifInserts = [...toNotify].map(userId => ({
          user_id: userId,
          type: "verification_request",
          title: "New verification request",
          body: `${senderName} requested verification as "${requestedRole}" at ${effectiveOrgName}.`,
          action_url: "/app/verification-inbox",
          data: { org_id: effectiveOrgId, requester_id: user!.id },
        }));
        if (notifInserts.length > 0) await supabase.from("notifications").insert(notifInserts);
      }

      const msg = reviewQueue === "platform"
        ? "Verification request sent — our team will review it since the org has no admins on Tiikme"
        : "Verification request sent";
      toast.success(msg);
      onSubmitted?.(); handleClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // ── AMEND MODE UI ──
  if (amendRequestId) {
    return (
      <GlassModal open={open} onClose={handleClose} title="Add more information"
        icon={ShieldCheck} accentColor="#E8733A"
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
        }>
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.60)" }}>
          The reviewer asked for more information. Upload an updated document and/or add a note, then resubmit.
        </p>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <select value={docType} onChange={e => setDocType(e.target.value)}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13, outline: "none", cursor: "pointer" }}>
            {DOC_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#1A1A4E" }}>{o.label}</option>)}
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

  const canSubmit = verifType === "certificate"
    ? !!certName.trim() && !!issuerName.trim()
    : !!(selectedOrg || unlistedOrgName) && !!requestedRole.trim();

  return (
    <GlassModal open={open} onClose={handleClose} title="Request verification"
      icon={ShieldCheck} accentColor="#E8733A"
      actions={
        <>
          <button type="button" onClick={handleClose}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
            Cancel
          </button>
          <button type="button" disabled={submitting || !canSubmit} onClick={handleSubmit}
            className="flex-1 h-11 rounded-xl text-[14px] font-bold cursor-pointer disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Submit request"}
          </button>
        </>
      }>

      {/* ── Type picker ── */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: "org" as VerifType, label: "Work / Education", icon: Building2, desc: "Verify your role at a workplace or institution" },
          { key: "certificate" as VerifType, label: "Certificate / Award", icon: Award, desc: "Verify a certificate, degree, or achievement" },
        ]).map(t => (
          <button key={t.key} type="button" onClick={() => { setVerifType(t.key); reset(); setVerifType(t.key); }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer text-center"
            style={{
              background: verifType === t.key ? "rgba(232,115,58,0.15)" : "rgba(255,255,255,0.05)",
              border: verifType === t.key ? "1px solid rgba(232,115,58,0.50)" : "1px solid rgba(255,255,255,0.10)",
            }}>
            <t.icon className="w-5 h-5" style={{ color: verifType === t.key ? "#E8733A" : "rgba(255,255,255,0.50)" }} />
            <p className="text-[12px] font-bold" style={{ color: verifType === t.key ? "#E8733A" : "rgba(255,255,255,0.80)" }}>{t.label}</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.40)" }}>{t.desc}</p>
          </button>
        ))}
      </div>

      {/* ── CERTIFICATE FIELDS ── */}
      {verifType === "certificate" && (
        <>
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Certificate / Award name <span style={{ color: "#E8733A" }}>*</span></label>
            <input value={certName} onChange={e => setCertName(e.target.value)} placeholder="e.g. AWS Certified Solutions Architect"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%" }} />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Issuing organisation / institution <span style={{ color: "#E8733A" }}>*</span></label>
            <input value={issuerName} onChange={e => setIssuerName(e.target.value)} placeholder="e.g. Amazon Web Services, MIT, Coursera"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%" }} />
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>
              Not on Tiikme? That's fine — our team will verify the document you upload.
            </p>
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Date of issue (optional)</label>
            <input type="month" value={issueDate} onChange={e => setIssueDate(e.target.value)}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%", colorScheme: "dark" }} />
          </div>
          <DocUploadRow docFile={docFile} setDocFile={setDocFile} docType={docType} setDocType={setDocType} />
          <NoteRow note={note} setNote={setNote} placeholder="Anything that helps the reviewer — e.g. credential ID, programme name…" />
          <PlatformReviewNote />
        </>
      )}

      {/* ── ORG FIELDS ── */}
      {verifType === "org" && (
        <>
          {/* Unlisted org confirmed → show as locked selection */}
          {unlistedOrgName ? (
            <UnlistedOrgCard name={unlistedOrgName} onClear={() => setUnlistedOrgName(null)} />
          ) : selectedOrg ? (
            /* Org from DB selected */
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
          ) : (
            /* Org picker */
            <div className="space-y-3">
              {/* Quick-pick from experience */}
              {suggestions.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>From your profile</p>
                  <div className="space-y-1">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => pickSuggestion(s)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer text-left"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
                          <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.80)", background: "rgba(232,115,58,0.20)" }}>
                            platform review
                          </span>
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
                <input autoFocus={suggestions.length === 0} value={orgQuery} onChange={e => setOrgQuery(e.target.value)}
                  placeholder="Search organisations…"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, paddingLeft: 38, paddingRight: 14, fontSize: 14, outline: "none", width: "100%" }} />
              </div>

              {/* Search results */}
              {orgs.length > 0 && (
                <div className="space-y-1">
                  {orgs.map(o => (
                    <button key={o.id} type="button" onClick={() => setSelectedOrg(o)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer text-left"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <AvatarSquare src={o.logo_url} name={o.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{o.name}</p>
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.50)" }}>@{o.slug}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* "Not found" CTA — shown after search with no results */}
              {searchedOnce && orgs.length === 0 && orgQuery.trim().length >= 2 && (
                <div className="rounded-xl p-3" style={{ background: "rgba(232,115,58,0.08)", border: "1px dashed rgba(232,115,58,0.30)" }}>
                  <p className="text-[12px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.80)" }}>
                    "{orgQuery.trim()}" isn't on Tiikme yet
                  </p>
                  <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>
                    No problem — upload your proof document and our team will verify your role directly.
                  </p>
                  <button type="button" onClick={chooseUnlisted}
                    className="h-8 px-3 rounded-lg text-[12px] font-bold cursor-pointer"
                    style={{ background: "rgba(232,115,58,0.20)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.30)" }}>
                    Continue with platform review →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Role + dept — shown once org is chosen */}
          {(selectedOrg || unlistedOrgName) && (
            <>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Your role <span style={{ color: "#E8733A" }}>*</span></label>
                <input value={requestedRole} onChange={e => setRequestedRole(e.target.value)} placeholder="e.g. Senior Software Engineer"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%" }} />
              </div>

              {/* Department — only relevant when org is on Tiikme */}
              {selectedOrg && (
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Department</label>
                  <select value={roleCategory} onChange={e => setRoleCategory(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer" }}>
                    {ROLE_CATEGORIES.map(rc => (
                      <option key={rc.value} value={rc.value} style={{ background: "#1A1A4E", color: "#F0F2F7" }}>{rc.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Routes your request to the right admin.</p>
                </div>
              )}

              <DocUploadRow docFile={docFile} setDocFile={setDocFile} docType={docType} setDocType={setDocType} />
              <NoteRow note={note} setNote={setNote} placeholder="Anything that helps the reviewer confirm your role…" />

              {unlistedOrgName && <PlatformReviewNote />}
            </>
          )}
        </>
      )}
    </GlassModal>
  );
}

/* ── Small reusable sub-components ── */

function UnlistedOrgCard({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(232,115,58,0.08)", border: "1px solid rgba(232,115,58,0.25)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(232,115,58,0.15)" }}>
        <Building2 className="w-4 h-4" style={{ color: "#E8733A" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white truncate">{name}</p>
        <p className="text-[10px]" style={{ color: "#E8733A" }}>Not on Tiikme · Platform review</p>
      </div>
      <button type="button" onClick={onClear} className="p-1 cursor-pointer" style={{ color: "rgba(255,255,255,0.50)" }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function DocUploadRow({ docFile, setDocFile, docType, setDocType }: {
  docFile: File | null; setDocFile: (f: File | null) => void;
  docType: string; setDocType: (t: string) => void;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <select value={docType} onChange={e => setDocType(e.target.value)}
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13, outline: "none", cursor: "pointer" }}>
        {DOC_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#1A1A4E" }}>{o.label}</option>)}
      </select>
      <label className="flex items-center gap-2 cursor-pointer truncate"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px dashed rgba(255,255,255,0.20)", borderRadius: 14, color: "#F0F2F7", height: 42, padding: "0 14px", fontSize: 13 }}>
        <Upload className="w-4 h-4 shrink-0" />
        <span className="truncate">{docFile ? docFile.name : "Upload proof (PDF / image)"}</span>
        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

function NoteRow({ note, setNote, placeholder }: { note: string; setNote: (n: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>Message to reviewer (optional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 400))} rows={3} placeholder={placeholder}
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#F0F2F7", padding: "10px 14px", fontSize: 14, outline: "none", width: "100%", resize: "none" }} />
    </div>
  );
}

function PlatformReviewNote() {
  return (
    <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(232,115,58,0.06)", border: "1px solid rgba(232,115,58,0.20)" }}>
      <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#E8733A" }} />
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.60)" }}>
        Since this organisation isn't on Tiikme, our team will review your documents directly and verify your role. You'll be notified once it's done.
      </p>
    </div>
  );
}
