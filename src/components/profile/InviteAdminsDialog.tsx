/**
 * Page owners use this to invite other admins by email.
 * Each invite generates a unique token; recipients must OTP-verify
 * the email before becoming an admin.
 */
import { useState, useEffect } from "react";
import { Plus, X, Mail, Copy, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isDisposableDomain } from "@/lib/verificationOtp";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
  orgName: string;
}

function genToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function InviteAdminsDialog({ open, onOpenChange, orgId, orgName }: Props) {
  const { user } = useAuth();
  const [emails, setEmails] = useState<string[]>([""]);
  const [role, setRole] = useState<"admin" | "recruiter">("admin");
  const [submitting, setSubmitting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  const fetchPending = async () => {
    const { data } = await supabase
      .from("org_admin_invites")
      .select("*")
      .eq("org_id", orgId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false });
    setPendingInvites(data || []);
  };

  useEffect(() => { if (open) fetchPending(); }, [open, orgId]);

  const send = async () => {
    if (!user) return;
    const valid = emails
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@"));
    if (valid.length === 0) { toast.info("Enter at least one valid email"); return; }

    setSubmitting(true);
    const rows: any[] = [];
    for (const email of valid) {
      if (await isDisposableDomain(email)) continue;
      rows.push({
        org_id: orgId,
        invited_email: email,
        invited_by: user.id,
        role,
        token: genToken(),
      });
    }
    if (rows.length === 0) { setSubmitting(false); toast.error("All emails were invalid"); return; }

    const { error } = await supabase.from("org_admin_invites").insert(rows);
    if (error) { setSubmitting(false); toast.error(error.message); return; }

    setSubmitting(false);
    toast.success(`${rows.length} invite${rows.length === 1 ? "" : "s"} created`);
    setEmails([""]);
    fetchPending();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/accept-admin-invite?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const revoke = async (id: string) => {
    await supabase.from("org_admin_invites").delete().eq("id", id);
    fetchPending();
    toast.success("Invite revoked");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Invite admins to {orgName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Each invitee will receive a verification code at the email below before becoming an admin.
          </p>

          <div>
            <label className="text-[11px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Role</label>
            <div className="flex gap-2">
              {(["admin", "recruiter"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-bold capitalize"
                  style={{
                    background: role === r ? "var(--brand-dim)" : "var(--surface-2)",
                    border: role === r ? "1px solid var(--brand)" : "1px solid var(--border)",
                    color: role === r ? "var(--brand)" : "var(--text-2)",
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {emails.map((e, i) => (
              <div key={i} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
                  <Input
                    type="email"
                    placeholder="person@company.com"
                    value={e}
                    onChange={ev => {
                      const next = [...emails];
                      next[i] = ev.target.value;
                      setEmails(next);
                    }}
                    className="pl-9"
                  />
                </div>
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setEmails(emails.filter((_, idx) => idx !== i))}
                    className="px-2 cursor-pointer"
                    style={{ color: "var(--text-3)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEmails([...emails, ""])}
              className="text-[12px] font-bold flex items-center gap-1"
              style={{ color: "var(--brand)", cursor: "pointer" }}
            >
              <Plus className="w-3 h-3" /> Add another
            </button>
          </div>

          <Button onClick={send} disabled={submitting} className="w-full">
            {submitting ? "Creating..." : "Create invites"}
          </Button>

          {pendingInvites.length > 0 && (
            <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
                Pending invites
              </p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
                    <span className="text-[12px] truncate flex-1" style={{ color: "var(--text-1)" }}>{inv.invited_email}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{inv.role}</span>
                    <button type="button" onClick={() => copyLink(inv.token)} className="p-1 cursor-pointer" title="Copy link" style={{ color: "var(--text-2)" }}>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => revoke(inv.id)} className="p-1 cursor-pointer" title="Revoke" style={{ color: "#DC2626" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
