import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PrintProfile {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location_city: string | null;
  location_state: string | null;
  email: string | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  skills: string[] | null;
  custom_links: any;
  username: string | null;
}

interface WorkItem {
  id: string;
  item_type: string | null;
  job_title: string | null;
  company_name: string | null;
  employment_type: string | null;
  start_month: string | null;
  start_year: number | null;
  end_month: string | null;
  end_year: number | null;
  is_current: boolean | null;
  description: string | null;
  work_location: string | null;
  skills_used: string[] | null;
  degree_type: string | null;
  field_of_study: string | null;
  institution_name_edu: string | null;
  grade_score: string | null;
  title: string | null;
  domain: string | null;
}

function dateStr(month: string | null, year: number | null, isCurrent?: boolean | null) {
  if (isCurrent) return "Present";
  if (!year) return "";
  return month ? `${month} ${year}` : `${year}`;
}

function dateRange(item: WorkItem) {
  const start = dateStr(item.start_month, item.start_year);
  const end = item.is_current ? "Present" : dateStr(item.end_month, item.end_year);
  if (!start && !end) return "";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

export default function ProfilePrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PrintProfile | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const targetId = id || user?.id;

  useEffect(() => {
    if (!targetId) { setError(true); setLoading(false); return; }
    Promise.all([
      supabase.from("profiles").select("id, full_name, headline, bio, location_city, location_state, email, is_verified, avatar_url, skills, custom_links, username").eq("id", targetId).maybeSingle(),
      supabase.from("work_items").select("id, item_type, job_title, company_name, employment_type, start_month, start_year, end_month, end_year, is_current, description, work_location, skills_used, degree_type, field_of_study, institution_name_edu, grade_score, title, domain").eq("owner_id", targetId).eq("visibility", "public").order("is_current", { ascending: false }).order("start_year", { ascending: false }),
    ]).then(([profileRes, workRes]) => {
      if (profileRes.error || !profileRes.data) { setError(true); setLoading(false); return; }
      setProfile(profileRes.data as PrintProfile);
      setWorkItems((workRes.data || []) as WorkItem[]);
      setLoading(false);
    });
  }, [targetId]);

  useEffect(() => {
    if (!loading && !error && profile) {
      document.title = `${profile.full_name || "Profile"} — Resume`;
    }
  }, [loading, error, profile]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      <p style={{ color: "#666", fontSize: 14 }}>Loading profile…</p>
    </div>
  );

  if (error || !profile) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>Profile not found or not public.</p>
        <button type="button" onClick={() => navigate(-1)} style={{ padding: "8px 16px", borderRadius: 6, background: "#E8733A", color: "#fff", border: "none", fontSize: 13, cursor: "pointer" }}>Go back</button>
      </div>
    </div>
  );

  const experiences = workItems.filter(w => w.item_type === "experience");
  const education = workItems.filter(w => w.item_type === "education");
  const projects = workItems.filter(w => w.item_type === "project");

  const location = [profile.location_city, profile.location_state].filter(Boolean).join(", ");
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const links: Array<{ label: string; url: string }> = Array.isArray(profile.custom_links) ? profile.custom_links : [];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", maxWidth: 780, margin: "0 auto", padding: "32px 40px 48px", color: "#1a1a1a", lineHeight: 1.5 }}>
      {/* Print controls — hidden in print */}
      <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 24 }}>
        <button type="button" onClick={() => navigate(-1)} style={{ padding: "8px 14px", borderRadius: 8, background: "#f3f4f6", color: "#444", border: "none", fontSize: 13, cursor: "pointer" }}>
          ← Back
        </button>
        <button type="button" onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 8, background: "#E8733A", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Download PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ borderBottom: "2px solid #E8733A", paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: "-0.3px" }}>
          {profile.full_name || "—"}
          {profile.is_verified && <span style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", marginLeft: 8, verticalAlign: "middle" }}>✓ Verified</span>}
        </h1>
        {profile.headline && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#444", fontWeight: 500 }}>{profile.headline}</p>}
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 12, color: "#555" }}>
          {location && <span>📍 {location}</span>}
          {profile.email && <span>✉ {profile.email}</span>}
          {profile.username && <span>🔗 tiikme.com/{profile.username}</span>}
          {links.map((l, i) => (
            <span key={i}>{l.label || "Link"}: {l.url}</span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {profile.bio && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={sectionHead}>Summary</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.65 }}>{profile.bio}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={sectionHead}>Experience</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {experiences.map(exp => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{exp.job_title || "Role"}</span>
                    {exp.employment_type && <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>· {exp.employment_type}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>{dateRange(exp)}</span>
                </div>
                <p style={{ margin: "1px 0 0", fontSize: 13, color: "#555" }}>
                  {exp.company_name}{exp.work_location ? ` · ${exp.work_location}` : ""}
                </p>
                {exp.description && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#444", lineHeight: 1.6 }}>{exp.description}</p>}
                {exp.skills_used?.length ? (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888" }}>Skills: {exp.skills_used.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={sectionHead}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map(edu => (
              <div key={edu.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                    {edu.degree_type}{edu.field_of_study ? ` in ${edu.field_of_study}` : ""}
                  </span>
                  <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {[edu.start_year, edu.end_year].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <p style={{ margin: "1px 0 0", fontSize: 13, color: "#555" }}>
                  {edu.institution_name_edu}{edu.grade_score ? ` · ${edu.grade_score}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={sectionHead}>Projects</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map(p => (
              <div key={p.id}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{p.title || "Project"}</span>
                {p.domain && <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>· {p.domain}</span>}
                {p.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#444", lineHeight: 1.6 }}>{p.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section style={{ marginBottom: 8 }}>
          <h2 style={sectionHead}>Skills</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#333" }}>{skills.join(" · ")}</p>
        </section>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 16mm 20mm; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
      `}</style>
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#E8733A",
  margin: "0 0 10px",
  paddingBottom: 4,
  borderBottom: "1px solid #f0ede8",
};
