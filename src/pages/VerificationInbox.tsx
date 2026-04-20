/**
 * VerificationInbox page (/app/verification-inbox)
 * Replaces the old employer_endorsement_requests inbox.
 * Lists verification_requests assigned to the current user (or any pending requests
 * for orgs they own/admin), with Approve / Reject / Request more info actions.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Check, X, Info, Mail, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AvatarSquare from "@/components/ui/AvatarSquare";
import VerificationDocLink from "@/components/verification/VerificationDocLink";
import { roleCategoryLabel } from "@/lib/verificationRoles";
import { PageSEO } from "@/hooks/usePageSEO";

type Row = {
  id: string;
  requester_id: string;
  org_id: string | null;
  requested_role: string | null;
  role_category: string | null;
  document_url: string | null;
  document_type: string | null;
  context_note: string | null;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  requester?: { id: string; full_name: string | null; username: string | null; avatar_url: string | null };
  org?: { id: string; name: string; slug: string; logo_url: string | null };
};

type Tab = "pending" | "resolved";

export default function VerificationInbox() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [askingId, setAskingId] = useState<string | null>(null);
  const [askMessage, setAskMessage] = useState("");

  const fetchRows = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Org IDs this user admins
    const { data: adminOrgs } = await supabase
      .from("org_admins")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);
    const orgIds = (adminOrgs || []).map(a => a.org_id);

    // Pull requests where I'm assigned OR for an org I admin
    let query = supabase
      .from("verification_requests")
      .select("id, requester_id, org_id, requested_role, role_category, document_url, document_type, context_note, status, created_at, rejection_reason")
      .eq("entity_type", "user_org")
      .order("created_at", { ascending: false })
      .limit(50);

    const filters: string[] = [`assigned_to.eq.${user.id}`];
    if (orgIds.length > 0) filters.push(`org_id.in.(${orgIds.join(",")})`);
    query = query.or(filters.join(","));

    if (tab === "pending") {
      query = query.in("status", ["pending", "more_info_requested"]);
    } else {
      query = query.in("status", ["approved", "rejected"]);
    }

    const { data, error } = await query;
    if (error) { console.warn(error); setRows([]); setLoading(false); return; }
    if (!data || data.length === 0) { setRows([]); setLoading(false); return; }

    const reqIds = [...new Set(data.map(r => r.requester_id))];
    const orgIdsSet = [...new Set(data.map(r => r.org_id).filter(Boolean) as string[])];

    const [profilesRes, orgsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", reqIds),
      orgIdsSet.length > 0
        ? supabase.from("organizations").select("id, name, slug, logo_url").in("id", orgIdsSet)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const pMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const oMap = new Map((orgsRes.data || []).map((o: any) => [o.id, o]));

    setRows(
      data.map(r => ({
        ...r,
        requester: pMap.get(r.requester_id) as Row["requester"],
        org: r.org_id ? (oMap.get(r.org_id) as Row["org"]) : undefined,
      })),
    );
    setLoading(false);
  }, [user, tab]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("verif-inbox-page-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "verification_requests" }, () => fetchRows())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchRows]);

  const handleApprove = async (row: Row) => {
    if (!user) return;
    setBusyId(row.id);
    const { error } = await supabase
      .from("verification_requests")
      .update({ status: "approved", reviewed_by: user.id })
      .eq("id", row.id);
    if (error) { toast.error(error.message); setBusyId(null); return; }

    await supabase.from("notifications").insert({
      user_id: row.requester_id,
      type: "verification_approved",
      title: `${row.org?.name || "Your organisation"} approved your verification`,
      body: `You're now verified as "${row.requested_role}".`,
      action_url: "/app/profile",
      data: { org_id: row.org_id, role: row.requested_role },
    });

    setBusyId(null);
    toast.success("Approved");
    fetchRows();
  };

  const handleReject = async (row: Row) => {
    if (!user) return;
    if (!rejectReason.trim()) { toast.error("Please provide a reason"); return; }
    setBusyId(row.id);
    const { error } = await supabase
      .from("verification_requests")
      .update({ status: "rejected", reviewed_by: user.id, rejection_reason: rejectReason.trim() })
      .eq("id", row.id);
    if (error) { toast.error(error.message); setBusyId(null); return; }

    await supabase.from("notifications").insert({
      user_id: row.requester_id,
      type: "verification_declined",
      title: `${row.org?.name || "Your organisation"} couldn't endorse you`,
      body: rejectReason.trim().slice(0, 200),
      action_url: "/app/profile",
      data: { org_id: row.org_id, reason: rejectReason.trim() },
    });

    setBusyId(null);
    setRejectingId(null);
    setRejectReason("");
    toast.success("Request rejected");
    fetchRows();
  };

  const handleRequestInfo = async (row: Row) => {
    if (!user) return;
    if (!askMessage.trim()) { toast.error("Add a message"); return; }
    setBusyId(row.id);

    const newEntry = {
      by: user.id,
      role: "reviewer",
      message: askMessage.trim(),
      at: new Date().toISOString(),
    };
    // Append to review_thread
    const { data: existing } = await supabase
      .from("verification_requests")
      .select("review_thread")
      .eq("id", row.id)
      .maybeSingle();
    const thread = Array.isArray((existing as any)?.review_thread) ? (existing as any).review_thread : [];

    const { error } = await supabase
      .from("verification_requests")
      .update({
        status: "more_info_requested",
        requested_doc_message: askMessage.trim(),
        review_thread: [...thread, newEntry],
      })
      .eq("id", row.id);
    if (error) { toast.error(error.message); setBusyId(null); return; }

    await supabase.from("notifications").insert({
      user_id: row.requester_id,
      type: "verification_request",
      title: "More info needed for your verification",
      body: askMessage.trim().slice(0, 200),
      action_url: "/app/profile",
      data: { request_id: row.id },
    });

    setBusyId(null);
    setAskingId(null);
    setAskMessage("");
    toast.success("Asked for more info");
    fetchRows();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5" style={{ color: "var(--brand)" }} />
        <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Verification Inbox</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--surface-2)", width: "fit-content" }}>
        {(["pending", "resolved"] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-3 h-8 rounded-lg text-[12px] font-bold cursor-pointer capitalize"
            style={{
              background: tab === t ? "var(--surface)" : "transparent",
              color: tab === t ? "var(--text-1)" : "var(--text-2)",
              boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-3)" }} /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {tab === "pending" ? "No pending requests" : "No resolved requests yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-3">
                <AvatarSquare src={r.requester?.avatar_url} name={r.requester?.full_name || "U"} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]" style={{ color: "var(--text-1)" }}>
                    <Link to={`/app/profile/${r.requester_id}`} className="font-bold hover:underline">
                      {r.requester?.full_name || "Someone"}
                    </Link>
                    <span style={{ color: "var(--text-2)" }}> wants to verify as </span>
                    <strong>{r.requested_role}</strong>
                    {r.org && (
                      <>
                        <span style={{ color: "var(--text-2)" }}> at </span>
                        <strong className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 inline" />
                          {r.org.name}
                        </strong>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px]" style={{ color: "var(--text-3)" }}>
                    <span>Department: <strong style={{ color: "var(--text-2)" }}>{roleCategoryLabel(r.role_category)}</strong></span>
                    {r.document_type && <span>Type: <strong style={{ color: "var(--text-2)" }}>{r.document_type}</strong></span>}
                    <VerificationDocLink path={r.document_url} />
                  </div>
                  {r.context_note && (
                    <p className="mt-2 text-[12px] p-2 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                      “{r.context_note}”
                    </p>
                  )}
                  {r.rejection_reason && tab === "resolved" && (
                    <p className="mt-2 text-[12px]" style={{ color: "#B91C1C" }}>Reason: {r.rejection_reason}</p>
                  )}

                  {/* Inline actions */}
                  {tab === "pending" && (
                    <>
                      {rejectingId === r.id ? (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection…"
                            className="flex-1 h-9 rounded-lg px-3 text-[12px]"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)", outline: "none" }}
                          />
                          <button type="button" onClick={() => handleReject(r)} disabled={busyId === r.id}
                            className="h-9 px-3 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50"
                            style={{ background: "#DC2626", color: "#fff", border: "none" }}>
                            Confirm
                          </button>
                          <button type="button" onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="h-9 px-3 rounded-lg text-[11px] font-bold cursor-pointer"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                            Cancel
                          </button>
                        </div>
                      ) : askingId === r.id ? (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={askMessage}
                            onChange={e => setAskMessage(e.target.value)}
                            placeholder="What do you need from them?"
                            className="flex-1 h-9 rounded-lg px-3 text-[12px]"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)", outline: "none" }}
                          />
                          <button type="button" onClick={() => handleRequestInfo(r)} disabled={busyId === r.id}
                            className="h-9 px-3 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50"
                            style={{ background: "var(--brand)", color: "#fff", border: "none" }}>
                            Send
                          </button>
                          <button type="button" onClick={() => { setAskingId(null); setAskMessage(""); }}
                            className="h-9 px-3 rounded-lg text-[11px] font-bold cursor-pointer"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button type="button" disabled={busyId === r.id} onClick={() => handleApprove(r)}
                            className="h-8 px-3 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
                            <Check className="w-3 h-3 inline mr-1" /> Approve
                          </button>
                          <button type="button" onClick={() => setAskingId(r.id)}
                            className="h-8 px-3 rounded-xl text-[11px] font-bold cursor-pointer"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                            <Info className="w-3 h-3 inline mr-1" /> Request info
                          </button>
                          <button type="button" onClick={() => setRejectingId(r.id)}
                            className="h-8 px-3 rounded-xl text-[11px] font-bold cursor-pointer"
                            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                            <X className="w-3 h-3 inline mr-1" /> Reject
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
