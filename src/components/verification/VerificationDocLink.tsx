/**
 * VerificationDocLink
 * Resolves a private storage path to a signed URL on demand.
 * Renders a small "View document" link.
 */
import { useState } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VerificationDocLink({ path, label = "View document" }: { path: string | null; label?: string }) {
  const [loading, setLoading] = useState(false);

  if (!path) return <span className="text-[11px]" style={{ color: "var(--text-3)" }}>No document</span>;

  const handleOpen = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("verification-docs")
      .createSignedUrl(path, 60 * 5); // 5 min
    setLoading(false);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer hover:underline disabled:opacity-60"
      style={{ color: "var(--brand)" }}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
      {label}
      <ExternalLink className="w-3 h-3" />
    </button>
  );
}
