import { useState, useEffect } from "react";
import { ArrowLeft, Layers, Copy, Shield, ExternalLink, Users, MessageSquare, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WorkDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [work, setWork] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!slug) { setLoading(false); return; }
      // Try to find by slug or ID
      const { data } = await supabase
        .from("work_items")
        .select("*, owner:profiles!work_items_owner_id_fkey(id, full_name, username, avatar_url, role)")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      setWork(data);

      if (data?.id) {
        const { data: members } = await supabase
          .from("team_members")
          .select("*, user:profiles!team_members_user_id_fkey(id, full_name, avatar_url, role)")
          .eq("work_item_id", data.id);
        setTeam(members || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-7 space-y-4">
        <div className="t-card p-6 animate-pulse space-y-4">
          <div className="h-6 w-48 rounded" style={{ background: "var(--surface-2)" }} />
          <div className="h-4 w-96 rounded" style={{ background: "var(--surface-2)" }} />
          <div className="h-20 rounded" style={{ background: "var(--surface-2)" }} />
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
        <p className="text-[16px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Work item not found</p>
        <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>It may have been removed or made private.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const owner = work.owner;
  const ownerName = owner?.full_name || owner?.username || "Unknown";
  const links = work.links || {};
  const techStack = work.tech_stack || [];

  const ROLE_COLORS: Record<string, string> = { student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490", government: "#166534", skilled_trade: "#C2410C" };

  return (
    <div className="max-w-5xl mx-auto px-4 py-7">
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: "var(--text-2)" }}>
        <button onClick={() => navigate(-1)} className="cursor-pointer" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-4 h-4" /></button>
        {owner?.username && <Link to={`/app/profile/${owner.id}`} className="hover:underline" style={{ color: "var(--brand)" }}>{owner.username}</Link>}
        <span>/</span>
        <span className="font-bold" style={{ color: "var(--text-1)" }}>{work.title}</span>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="t-card p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: work.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: work.status === "active" ? "#10B981" : "#F59E0B" }}>
                {(work.status || "active").charAt(0).toUpperCase() + (work.status || "active").slice(1)}
              </span>
              {techStack.map((d: string) => <span key={d} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{d}</span>)}
            </div>
            <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text-1)" }}>{work.title}</h1>
            {work.description && <p className="text-sm leading-[1.75] mb-4" style={{ color: "var(--text-2)" }}>{work.description}</p>}
            <div className="flex gap-2 mb-4">
              {links.github && <a href={links.github} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm" className="gap-1.5"><Github className="w-3 h-3" /> GitHub</Button></a>}
              {links.demo && <a href={links.demo} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm" className="gap-1.5"><Globe className="w-3 h-3" /> Demo</Button></a>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}><Copy className="w-3 h-3 mr-1" /> Share</Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Profile views", value: work.total_views || 0 },
              { label: "Recruiter views", value: work.recruiter_views || 0 },
              { label: "Team size", value: team.length + 1 },
              { label: "Status", value: (work.status || "active").charAt(0).toUpperCase() + (work.status || "active").slice(1) },
            ].map(m => (
              <div key={m.label} className="t-card p-4 text-center">
                <p className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{m.value}</p>
                <p className="micro-label mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {(team.length > 0 || owner) && (
            <div className="t-card p-5">
              <p className="micro-label mb-3">TEAM</p>
              <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
                {owner && (
                  <Link to={`/app/profile/${owner.id}`} className="text-center shrink-0 hover:-translate-y-1 transition-transform">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white mx-auto mb-1 overflow-hidden" style={{ backgroundColor: ROLE_COLORS[owner.role || ""] || "#6B7280" }}>
                      {owner.avatar_url ? <img src={owner.avatar_url} alt="" className="w-full h-full object-cover" /> : (ownerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase())}
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{ownerName.split(" ")[0]}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Owner</p>
                  </Link>
                )}
                {team.map(m => {
                  const u = m.user;
                  const name = u?.full_name || "User";
                  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <Link key={m.id} to={`/app/profile/${u?.id}`} className="text-center shrink-0 hover:-translate-y-1 transition-transform">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white mx-auto mb-1 overflow-hidden" style={{ backgroundColor: ROLE_COLORS[u?.role || ""] || "#6B7280" }}>
                        {u?.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{name.split(" ")[0]}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{m.role_in_project || "Member"}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {work.is_tiik_approved && (
            <div className="t-card p-5">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: "#F59E0B" }} />
                <p className="text-[14px] font-bold" style={{ color: "#F59E0B" }}>Tiik Approved</p>
              </div>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>This work has been verified by a trusted authority.</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="t-card p-5">
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-1)" }}>Interested?</h3>
            <div className="space-y-2">
              <Button className="w-full" size="sm" onClick={() => toast.info("Coming soon")}>Reach out</Button>
              <Button variant="secondary" className="w-full" size="sm" onClick={() => toast.success("Saved")}>Save to pool</Button>
            </div>
          </div>
          {work.institution_name && (
            <div className="t-card p-5">
              <p className="micro-label mb-2">INSTITUTION</p>
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{work.institution_name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
