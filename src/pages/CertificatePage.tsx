import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Award, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLoader from "@/components/PageLoader";

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("certificates")
        .select("*, org:organizations(name, logo_url), recipient:profiles!issued_to(full_name, avatar_url, role)")
        .eq("id", id)
        .single();
      setCert(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!cert) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F2" }}>
      <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Certificate not found</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F2" }} data-theme="light">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "2px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          {/* Header */}
          <div className="p-8 text-center" style={{ borderBottom: "1px solid var(--border)" }}>
            {cert.org?.logo_url ? (
              <img src={cert.org.logo_url} alt="" loading="lazy" className="w-16 h-16 mx-auto rounded-xl object-cover mb-3" />
            ) : (
              <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--brand)" }}>
                <Award className="w-8 h-8 text-white" />
              </div>
            )}
            <p className="text-[14px] font-bold mb-1" style={{ color: "var(--brand)" }}>{cert.org?.name || "Organization"}</p>
            <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>Certificate of</p>
            <h1 className="text-[28px] font-extrabold" style={{ color: "var(--text-1)" }}>{cert.title}</h1>
          </div>

          {/* Body */}
          <div className="p-8 text-center">
            <p className="text-[13px] mb-1" style={{ color: "var(--text-3)" }}>Awarded to</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              {cert.recipient?.avatar_url && (
                <img src={cert.recipient.avatar_url} alt="" loading="lazy" className="w-12 h-12 object-cover" style={{ borderRadius: 0 }} />
              )}
              <p className="text-[20px] font-bold" style={{ color: "var(--text-1)" }}>{cert.recipient?.full_name || "User"}</p>
            </div>
            {cert.description && <p className="text-[14px] mt-4" style={{ color: "var(--text-2)" }}>{cert.description}</p>}
            <div className="flex items-center justify-center gap-4 mt-6 text-[12px]" style={{ color: "var(--text-3)" }}>
              {cert.issued_date && <span>Issued: {cert.issued_date}</span>}
              {cert.expiry_date && <span>Expires: {cert.expiry_date}</span>}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold mt-4 px-3 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ Organization Verified
            </span>
          </div>

          {/* Actions */}
          {cert.certificate_url && (
            <div className="px-8 pb-6 flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => window.open(cert.certificate_url, "_blank")} className="gap-1.5">
                <ExternalLink className="w-4 h-4" /> View Original
              </Button>
              <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="gap-1.5">
                Share Link
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
