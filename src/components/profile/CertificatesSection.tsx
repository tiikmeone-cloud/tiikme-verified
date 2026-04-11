import { useState } from "react";
import { Award, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CertificatesSectionProps {
  certificates: any[];
  setCertificates: (fn: (prev: any[]) => any[]) => void;
  isOwnProfile: boolean;
}

export default function CertificatesSection({ certificates, setCertificates, isOwnProfile }: CertificatesSectionProps) {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", issuedBy: "", date: "", url: "" });

  const handleSave = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase.from("achievements").insert({
      user_id: user.id,
      title: form.title.trim(),
      issued_by: form.issuedBy.trim() || null,
      achievement_date: form.date || null,
      certificate_url: form.url.trim() || null,
      type: "certificate",
      visibility: "public",
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setCertificates(prev => [data, ...prev]);
    setShowAdd(false);
    setForm({ title: "", issuedBy: "", date: "", url: "" });
    toast.success("Certificate added ✓");
  };

  // Separate org-issued (from certificates table) and self-added
  const orgIssued = certificates.filter(c => c.org_id);
  const selfAdded = certificates.filter(c => !c.org_id);

  return (
    <div className="t-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full" style={{ background: "var(--brand)" }} />
          <Award className="w-4 h-4" style={{ color: "var(--brand)" }} />
          <h2 className="text-[16px] font-extrabold" style={{ color: "var(--text-1)" }}>Certificates</h2>
        </div>
        {isOwnProfile && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer active:scale-95" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {certificates.length === 0 && !showAdd && (
        <div className="rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border-2)" }}>
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>{isOwnProfile ? "Add your certificates" : "No certificates yet"}</p>
        </div>
      )}

      {/* Org-issued certificates */}
      {orgIssued.map((cert: any) => (
        <div key={cert.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}>
            {cert.org?.logo_url ? <img src={cert.org.logo_url} className="w-full h-full object-cover rounded-xl" /> : <Award className="w-4 h-4" style={{ color: "var(--brand)" }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{cert.title}</p>
            <p className="text-[11px]" style={{ color: "var(--text-2)" }}>{cert.org?.name || "Organization"}</p>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{cert.issued_date}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ Verified
            </span>
          </div>
          {cert.certificate_url && (
            <a href={cert.certificate_url} target="_blank" rel="noopener" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ))}

      {/* Self-added certificates */}
      {selfAdded.map((cert: any) => (
        <div key={cert.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}>
            <span className="text-[16px]">🏅</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{cert.title}</p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{[cert.issued_by, cert.achievement_date].filter(Boolean).join(" · ")}</p>
          </div>
          {cert.certificate_url && (
            <a href={cert.certificate_url} target="_blank" rel="noopener" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>View ↗</a>
          )}
        </div>
      ))}

      {showAdd && (
        <div className="mt-3 p-4 rounded-xl" style={{ borderLeft: "3px solid var(--brand)", background: "var(--surface-2)" }}>
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Add Certificate</h3>
          <div className="space-y-3">
            <Input placeholder="Certificate title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Issued by" value={form.issuedBy} onChange={e => setForm({ ...form, issuedBy: e.target.value })} />
            <Input placeholder="Date (e.g. June 2024)" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Certificate URL (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
