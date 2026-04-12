import { useState } from "react";
import { Link2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  workspaceId?: string;
}

export default function InviteLinkModal({ open, onClose, orgId, orgName, workspaceId }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const baseUrl = window.location.origin;
  const inviteLink = workspaceId
    ? `${baseUrl}/join-redirect?org=${orgId}&ws=${workspaceId}`
    : `${baseUrl}/join-redirect?org=${orgId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-[420px] w-full" style={{ background: "var(--surface)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5" style={{ color: "var(--brand)" }} />
            <h2 className="text-[18px] font-bold" style={{ color: "var(--text-1)" }}>Invite to {orgName}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>
          Share this link with people you want to invite. They'll be directed to join Tiikme and connect with your organization.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <input value={inviteLink} readOnly className="flex-1 text-[12px] bg-transparent outline-none truncate" style={{ color: "var(--text-1)" }} />
          <Button size="sm" className="gap-1 shrink-0" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
            Anyone with this link can request to join. You'll need to approve their membership.
          </p>
        </div>
      </div>
    </div>
  );
}
