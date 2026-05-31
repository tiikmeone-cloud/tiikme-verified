import { useRef, useState } from "react";
import { FileText, Upload, ExternalLink, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VerifiedBadge from "@/components/VerifiedBadge";
import { track } from "@/lib/track";

interface Props {
  profile: any;
  workItems: any[];
  skills: string[];
  certifications: any[];
  customLinks: any[];
  userEmail: string | null;
  isOwnProfile: boolean;
  targetUserId: string | null;
  onResumeUploaded?: (url: string) => void;
}

const CvSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 22 }}>
    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 5 }}>{title}</p>
    {children}
  </div>
);

const fmtDate = (item: any): string => {
  const f = (y: number | null, m: string | null) => (m && y ? `${m} ${y}` : y ? String(y) : "");
  const s = f(item.start_year, item.start_month);
  if (item.is_current) return s ? `${s} – Present` : "Present";
  const e = f(item.end_year, item.end_month);
  return [s, e].filter(Boolean).join(" – ");
};

export default function ProfileResumeTab({
  profile, workItems, skills, certifications,
  customLinks, userEmail, isOwnProfile, targetUserId, onResumeUploaded,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const experiences = workItems
    .filter(w => w.item_type === "experience")
    .sort((a, b) => {
      if (a.is_current && !b.is_current) return -1;
      if (!a.is_current && b.is_current) return 1;
      return (b.start_year || 0) - (a.start_year || 0);
    });
  const education = workItems.filter(w => w.item_type === "education");

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("PDF only"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const path = `${user.id}/profile-resume.pdf`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
    const url = urlData?.publicUrl;
    if (url) {
      await supabase.from("profiles").update({ resume_url: url } as any).eq("id", user.id);
      onResumeUploaded?.(url);
      toast.success("Resume uploaded");
    }
    setUploading(false);
  };

  const isEmpty = experiences.length === 0 && education.length === 0 && skills.length === 0 && certifications.length === 0;

  return (
    <div>
      {/* Control bar — owner only */}
      {isOwnProfile && (
        <div className="flex items-center flex-wrap" style={{ gap: 10, marginBottom: 20 }}>
          <input
            ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
          />
          <button
            type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center cursor-pointer"
            style={{ height: 36, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--bg-card)", border: "1px solid var(--border-glass)", color: "var(--text-1)", gap: 6 }}
          >
            <Upload style={{ width: 14, height: 14 }} />
            {uploading ? "Uploading…" : profile?.resume_url ? "Replace PDF" : "Upload resume PDF"}
          </button>

          {targetUserId && (
            <Link
              to={`/app/profile/${targetUserId}/print`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => track("resume_export", { profile_id: targetUserId })}
              className="flex items-center"
              style={{ height: 36, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(232,115,58,0.08)", border: "1px solid rgba(232,115,58,0.20)", color: "#E8733A", gap: 6, textDecoration: "none" }}
            >
              <FileText style={{ width: 14, height: 14 }} />
              Export as PDF
              <ExternalLink style={{ width: 11, height: 11 }} />
            </Link>
          )}

          {profile?.resume_url && (
            <a
              href={profile.resume_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center"
              style={{ height: 36, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--bg-card)", border: "1px solid var(--border-glass)", color: "var(--text-2)", gap: 6, textDecoration: "none" }}
            >
              <FileText style={{ width: 14, height: 14 }} />
              View uploaded PDF
              <ExternalLink style={{ width: 11, height: 11 }} />
            </a>
          )}
        </div>
      )}

      {/* Document view */}
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="glass-card" style={{ padding: "28px 32px", borderRadius: 16 }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: 18, marginBottom: 20 }}>
            <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{profile?.full_name || "Name"}</h1>
              {profile?.is_verified && <VerifiedBadge size={16} />}
            </div>
            {profile?.headline && (
              <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 8 }}>{profile.headline}</p>
            )}
            <div className="flex items-center flex-wrap" style={{ gap: 12, fontSize: 12, color: "var(--text-3)" }}>
              {isOwnProfile && userEmail && <span>{userEmail}</span>}
              {(profile?.location_city || profile?.location_state) && (
                <span>{[profile.location_city, profile.location_state].filter(Boolean).join(", ")}</span>
              )}
              {customLinks.slice(0, 3).map((l: any, i: number) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-3)", textDecoration: "none" }}>
                  {l.label || l.url}
                </a>
              ))}
            </div>
          </div>

          {/* Summary */}
          {(profile?.bio || profile?.about) && (
            <CvSection title="Summary">
              <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--text-2)" }}>{profile.bio || profile.about}</p>
            </CvSection>
          )}

          {/* Experience */}
          {experiences.length > 0 && (
            <CvSection title="Experience">
              {experiences.map((exp: any) => (
                <div key={exp.id} style={{ marginBottom: 16 }}>
                  <div className="flex items-start" style={{ gap: 8, justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{exp.job_title || exp.title}</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)" }}>
                        {[exp.company_name, exp.employment_type, exp.work_location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>{fmtDate(exp)}</p>
                      {exp.verification_status === "verified" && (
                        <div className="flex items-center justify-end" style={{ gap: 3, marginTop: 2 }}>
                          <CheckCircle style={{ width: 11, height: 11, color: "#16A34A" }} />
                          <span style={{ fontSize: 11, color: "#16A34A" }}>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 5, lineHeight: "18px" }}>{exp.description}</p>
                  )}
                  {exp.skills_used?.length > 0 && (
                    <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>Skills: {exp.skills_used.join(", ")}</p>
                  )}
                </div>
              ))}
            </CvSection>
          )}

          {/* Education */}
          {education.length > 0 && (
            <CvSection title="Education">
              {education.map((edu: any) => (
                <div key={edu.id} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                    {edu.institution_name_edu || edu.institution_name}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-2)" }}>
                    {[edu.degree_type, edu.field_of_study].filter(Boolean).join(", ")}
                    {edu.grade_score ? ` · ${edu.grade_score}` : ""}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {[edu.start_year, edu.end_year || (edu.is_current ? "Present" : null)].filter(Boolean).join(" – ")}
                  </p>
                </div>
              ))}
            </CvSection>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <CvSection title="Skills">
              <div className="flex flex-wrap" style={{ gap: 6 }}>
                {skills.map((s: string) => (
                  <span key={s} style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border-subtle)" }}>{s}</span>
                ))}
              </div>
            </CvSection>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <CvSection title="Certifications">
              {certifications.map((c: any) => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div className="flex items-start justify-between" style={{ gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{c.title}</p>
                      <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {c.issued_by || c.org?.name}
                        {c.issued_date ? ` · ${new Date(c.issued_date).getFullYear()}` : ""}
                      </p>
                    </div>
                    {c.is_verified && (
                      <div className="flex items-center" style={{ gap: 3, flexShrink: 0 }}>
                        <CheckCircle style={{ width: 12, height: 12, color: "#16A34A" }} />
                        <span style={{ fontSize: 11, color: "#16A34A" }}>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CvSection>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "40px 0" }}>
              <FileText style={{ width: 32, height: 32, color: "var(--text-3)", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>No resume content yet</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, textAlign: "center", lineHeight: "19px" }}>
                Add experience, education, and skills to your profile<br />to build your resume here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
