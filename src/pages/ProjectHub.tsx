import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, Send, ExternalLink, CheckCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ROLE_COLORS: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490",
  government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8",
  faculty: "#92400E", builder: "#7C3AED", aspirant: "#374151",
};

const ProjectHub = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateText, setUpdateText] = useState("");

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    const load = async () => {
      const [{ data: proj }, { data: team }] = await Promise.all([
        supabase.from("work_items").select("*, owner:profiles!work_items_owner_id_fkey(id, full_name, avatar_url, role)").eq("id", projectId).maybeSingle(),
        supabase.from("team_members").select("*, member:profiles!team_members_user_id_fkey(id, full_name, avatar_url, role, institution_name)").eq("work_item_id", projectId),
      ]);
      setProject(proj);
      setTeamMembers(team || []);
      setLoading(false);
    };
    load();
  }, [projectId]);

  const isOwner = user?.id === project?.owner_id;

  const handlePostUpdate = () => {
    if (!updateText.trim()) return;
    toast.success("Update posted to project timeline");
    setUpdateText("");
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="t-card p-6 animate-pulse">
          <div className="h-8 w-48 rounded mb-3" style={{ background: "var(--surface-2)" }} />
          <div className="h-4 w-full rounded mb-2" style={{ background: "var(--surface-2)" }} />
          <div className="h-4 w-3/4 rounded" style={{ background: "var(--surface-2)" }} />
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Link to="/app/teams" className="flex items-center gap-1.5 text-[13px] font-medium mb-6" style={{ color: "var(--text-3)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Teams & Projects
        </Link>
        <div className="text-center py-16">
          <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[15px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Project not found</p>
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>This project may have been deleted or you don't have access.</p>
        </div>
      </main>
    );
  }

  const statusColor = project.status === "active" ? "#10B981" : project.status === "completed" ? "var(--brand)" : "#F59E0B";
  const statusLabel = (project.status || "active").charAt(0).toUpperCase() + (project.status || "active").slice(1);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <Link to="/app/teams" className="flex items-center gap-1.5 text-[13px] font-medium active:scale-95" style={{ color: "var(--text-3)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Teams & Projects
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-liquid rounded-2xl md:rounded-3xl overflow-hidden relative min-h-[260px]">
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${statusColor}26 0%, transparent 100%)`
          }} />
          <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-3">
                <h1 className="text-[24px] md:text-[28px] font-extrabold" style={{ color: "var(--text-1)" }}>{project.title}</h1>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                  background: `${statusColor}1A`, color: statusColor,
                }}>{statusLabel}</span>
                {project.domain && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{project.domain}</span>}
              </div>
              <p className="text-[14px] leading-relaxed max-w-lg" style={{ color: "var(--text-2)" }}>{project.description || "No description provided."}</p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {project.links?.demo && (
                <Button className="active:scale-95 gap-1.5" onClick={() => window.open(project.links.demo, "_blank")}>
                  <ExternalLink className="w-3.5 h-3.5" /> View Live
                </Button>
              )}
              {isOwner && (
                <Button variant="secondary" className="active:scale-95 gap-1.5" onClick={() => toast.info("Opening invite...")}>
                  <Users className="w-3.5 h-3.5" /> Invite Member
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-liquid rounded-2xl md:rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5" style={{ color: "var(--text-2)" }} />
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Team ({teamMembers.length + 1})</p>
          </div>

          <div className="relative pl-5">
            <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "var(--border-2)" }} />
            {/* Owner */}
            {project.owner && (
              <Link to={`/app/profile/${project.owner.id}`} className="relative flex items-center gap-3 py-2.5 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 group-hover:scale-110 transition-transform relative z-10 overflow-hidden"
                  style={{ backgroundColor: ROLE_COLORS[project.owner.role || ""] || "#6B7280" }}>
                  {project.owner.avatar_url ? <img src={project.owner.avatar_url} alt="" className="w-full h-full object-cover" /> :
                    (project.owner.full_name || "O").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold group-hover:underline" style={{ color: "var(--text-1)" }}>{project.owner.full_name || "Owner"}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Owner</p>
                </div>
              </Link>
            )}
            {teamMembers.map(tm => {
              const m = tm.member;
              if (!m) return null;
              return (
                <Link key={tm.id} to={`/app/profile/${m.id}`} className="relative flex items-center gap-3 py-2.5 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 group-hover:scale-110 transition-transform relative z-10 overflow-hidden"
                    style={{ backgroundColor: ROLE_COLORS[m.role || ""] || "#6B7280" }}>
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> :
                      (m.full_name || "M").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold group-hover:underline" style={{ color: "var(--text-1)" }}>{m.full_name || "Member"}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{tm.role_in_project || "Member"}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {teamMembers.length === 0 && !project.owner && (
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>No team members yet.</p>
          )}
        </motion.div>
      </div>

      {isOwner && (
        <div className="glass-liquid rounded-2xl md:rounded-3xl p-5">
          <p className="micro-label mb-3">POST AN UPDATE</p>
          <textarea value={updateText} onChange={e => setUpdateText(e.target.value)}
            placeholder="Share a milestone, progress update, or achievement..."
            rows={2} className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none transition-all duration-200 mb-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 active:scale-95" onClick={handlePostUpdate}>
              <Send className="w-3.5 h-3.5" /> Post Update
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProjectHub;
