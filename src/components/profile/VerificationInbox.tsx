/**
 * VerificationInbox
 * Shown at the top of /app/alerts ONLY for users who are admins of at least
 * one organization. Lists pending employer_endorsement_requests for the orgs they admin.
 */
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Check, X, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import AvatarSquare from "@/components/ui/AvatarSquare";

type Row = {
  id: string;
  requester_id: string;
  org_id: string;
  requested_role: string;
  work_email: string | null;
  email_verified: boolean;
  status: string;
  created_at: string;
  requester?: { id: string; full_name: string | null; username: string | null; avatar_url: string | null };
  org?: { id: string; name: string; slug: string; logo_url: string | null };
};

export default function VerificationInbox() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Find orgs this user admins
    const { data: adminOrgs } = await supabase
      .from("org_admins")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);

    const orgIds = (adminOrgs || []).map(a => a.org_id);
    if (orgIds.length === 0) { setRows([]); setLoading(false); return; }

    const { data } = await supabase
      .from("employer_endorsement_requests")
      .select("id, requester_id, org_id, requested_role, work_email, email_verified, status, created_at")
      .in("org_id", orgIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!data || data.length === 0) { setRows([]); setLoading(false); return; }

    const reqIds = [...new Set(data.map(r => r.requester_id))];
    const orgIdsSet = [...new Set(data.map(r => r.org_id))];

    const [profilesRes, orgsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", reqIds),
      supabase.from("organizations").select("id, name, slug, logo_url").in("id", orgIdsSet),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const orgMap = new Map((orgsRes.data || []).map(o => [o.id, o]));

    setRows(data.map(r => ({
      ...r,
      requester: profileMap.get(r.requester_id) as Row["requester"],
      org: orgMap.get(r.org_id) as Row["org"],
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("verif-inbox-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "employer_endorsement_requests" }, () => fetchRows())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchRows]);

  const handleApprove = async (row: Row) => {
    if (!user) return;
    setBusyId(row.id);
    const { error } = await supabase
      .from("employer_endorsement_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) { toast.error(error.message); setBusyId(null); return; }

    // Mark requester as verified
    await supabase.from("profiles").update({ is_verified: true }).eq("id", row.requester_id);

    // Notify requester
    sendNotification({
      userId: row.requester_id,
      actorId: user.id,
      type: "verification_approved",
      title: `${row.org?.name || "Your organisation"} approved your verification`,
      body: `You're now verified as "${row.requested_role}".`,
      actionUrl: "/app/profile",
      data: { org_id: row.org_id, role: row.requested_role },
    });

    setRows(prev => prev.filter(r => r.id !== row.id));
    setBusyId(null);
    toast.success("Approved & requester notified");
  };

  const handleReject = async (row: Row) => {
    if (!user) return;
    setBusyId(row.id);
    const { error } = await supabase
      .from("employer_endorsement_requests")
      .update({
        status: "rejected",
        approved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) { toast.error(error.message); setBusyId(null); return; }

    sendNotification({
      userId: row.requester_id,
      actorId: user.id,
      type: "verification_declined",
      title: `${row.org?.name || "Your organisation"} couldn't endorse you`,
      body: "You can update your work email or role and try again.",
      actionUrl: "/app/profile",
      data: { org_id: row.org_id },
    });

    setRows(prev => prev.filter(r => r.id !== row.id));
    setBusyId(null);
    toast.success("Request rejected");
  };

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 px-1">
        <ShieldCheck className="w-4 h-4" style={{ color: "var(--brand)" }} />
        <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--brand)" }}>
          Verification requests · {rows.length}
        </p>
      </div>
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="flex items-start gap-3 p-3"
            style={{ borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border)" }}
          >
            <AvatarSquare src={r.requester?.avatar_url} name={r.requester?.full_name || "U"} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ color: "var(--text-1)" }}>
                <Link to={`/app/profile/${r.requester_id}`} className="font-bold hover:underline">
                  {r.requester?.full_name || "Someone"}
                </Link>
                <span style={{ color: "var(--text-2)" }}> wants to verify as </span>
                <strong>{r.requested_role}</strong>
                <span style={{ color: "var(--text-2)" }}> at </span>
                <strong>{r.org?.name}</strong>
              </p>
              {r.work_email && (
                <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: r.email_verified ? "#10B981" : "var(--text-3)" }}>
                  <Mail className="w-3 h-3" />
                  {r.work_email}
                  {r.email_verified && <Check className="w-3 h-3" />}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => handleApprove(r)}
                  className="h-8 px-3 rounded-xl text-[11px] font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  <Check className="w-3 h-3 inline mr-1" /> Endorse
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => handleReject(r)}
                  className="h-8 px-3 rounded-xl text-[11px] font-bold disabled:opacity-50"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)", cursor: "pointer" }}
                >
                  <X className="w-3 h-3 inline mr-1" /> Reject
                </button>
                <Link
                  to={`/app/profile/${r.requester_id}`}
                  className="h-8 px-3 rounded-xl text-[11px] font-bold inline-flex items-center"
                  style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)" }}
                >
                  <ExternalLink className="w-3 h-3 inline mr-1" /> Profile
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
