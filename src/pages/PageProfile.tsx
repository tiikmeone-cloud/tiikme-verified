import { useState, useEffect, useMemo } from "react";
import {
  MapPin, Globe, Calendar, Users, MessageCircle, ExternalLink, Trophy, Share2,
  Shield, Briefcase, Plus, Image as ImageIcon, Heart, Building2, Award,
  FileText, GraduationCap, Stethoscope, Landmark, Star, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { storageImageUrl } from "@/lib/imageTransform";

/* ── helpers ── */
const daysAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "1d ago" : `${diff}d ago`;
};
const AVATAR_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const initials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

const PLATFORM_MAP: Record<string, { icon: string; color: string }> = {
  linkedin: { icon: "LinkedIn", color: "#0A66C2" },
  github: { icon: "GitHub", color: "#181717" },
  twitter: { icon: "X", color: "#000" },
  instagram: { icon: "Instagram", color: "#E4405F" },
  youtube: { icon: "YouTube", color: "#FF0000" },
};
const detectPlatform = (url: string) => {
  const host = url.toLowerCase();
  for (const [key, val] of Object.entries(PLATFORM_MAP)) {
    if (host.includes(key)) return val;
  }
  return null;
};

const pageTabs = ["About", "Members", "Awards", "Media", "Opportunities", "Posts"] as const;
type Tab = typeof pageTabs[number];

const PageProfile = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("About");
  const [tracking, setTracking] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [oppFilter, setOppFilter] = useState<"all" | "active" | "closed">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setPage(data);

      // parallel fetches
      const orgId = data.institution_id;
      const [membersRes, oppsRes, postsRes] = await Promise.allSettled([
        supabase.from("org_members")
          .select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, headline, role)")
          .eq("org_id", orgId || "00000000-0000-0000-0000-000000000000")
          .eq("is_current", true),
        orgId
          ? supabase.from("opportunities").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50)
          : Promise.resolve({ data: [] }),
        orgId
          ? supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(full_name, avatar_url)")
              .eq("posted_by_org", orgId).order("created_at", { ascending: false }).limit(20)
          : Promise.resolve({ data: [] }),
      ]);

      if (membersRes.status === "fulfilled") setMembers((membersRes.value as any).data || []);
      if (oppsRes.status === "fulfilled") setOpps((oppsRes.value as any).data || []);
      if (postsRes.status === "fulfilled") setPosts((postsRes.value as any).data || []);

      if (user) {
        const [adminRes, trackRes] = await Promise.allSettled([
          supabase.from("page_admins").select("id").eq("page_id", data.id).eq("user_id", user.id).maybeSingle(),
          supabase.from("page_trackers").select("id").eq("page_id", data.id).eq("user_id", user.id).maybeSingle(),
        ]);
        if (adminRes.status === "fulfilled") setIsAdmin(!!(adminRes.value as any).data || data.created_by === user.id);
        if (trackRes.status === "fulfilled") setTracking(!!(trackRes.value as any).data);
      }
      setLoading(false);
    };
    load();
  }, [slug, user]);

  const handleTrack = async () => {
    if (!user || !page) { toast.error("Sign in to track"); return; }
    setTracking(true);
    await supabase.from("page_trackers").insert({ page_id: page.id, user_id: user.id });
    toast.success(`Tracking ${page.name}`);
  };
  const handleUntrack = async () => {
    if (!user || !page) return;
    setTracking(false);
    await supabase.from("page_trackers").delete().eq("page_id", page.id).eq("user_id", user.id);
    toast.success("Stopped tracking");
  };

  const awards = useMemo(() => (page?.awards as any[]) || [], [page]);
  const customLinks = useMemo(() => (page?.custom_links as any[]) || [], [page]);
  const photos = useMemo(() => (page?.activity_photos as string[]) || [], [page]);
  const departments = useMemo(() => {
    const d = new Set(members.map(m => m.department).filter(Boolean));
    return Array.from(d);
  }, [members]);
  const filteredMembers = useMemo(() =>
    deptFilter === "all" ? members : members.filter(m => m.department === deptFilter),
    [members, deptFilter]
  );
  const filteredOpps = useMemo(() => {
    if (oppFilter === "active") return opps.filter(o => o.is_open);
    if (oppFilter === "closed") return opps.filter(o => !o.is_open);
    return opps;
  }, [opps, oppFilter]);

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-52 rounded-2xl" style={{ background: "var(--glass-bg)" }} />
        <div className="h-8 w-1/3 rounded-xl" style={{ background: "var(--glass-bg)" }} />
      </div>
    </div>
  );

  if (!page) return (
    <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
      <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
      <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--color-text)" }}>Page not found</h1>
      <Link to="/app/explore" className="text-[13px]" style={{ color: "var(--color-accent)" }}>← Explore</Link>
    </div>
  );

  const logoLetters = initials(page.name);
  const isVerified = (page.trust_score || 0) > 0;

  return (
    <div className="max-w-[960px] mx-auto px-0 md:px-4 pb-8">
      {/* ── COVER ── */}
      <div className="w-full h-[200px] md:h-[240px] relative overflow-hidden" style={{
        borderRadius: "0 0 20px 20px",
        background: page.cover_url
          ? `url(${page.cover_url}) center/cover`
          : "linear-gradient(135deg, var(--color-accent), #8B5CF6)",
      }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,30,0.6) 0%, transparent 60%)" }} />
        {!page.cover_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <Building2 className="w-24 h-24 text-white" />
          </div>
        )}
      </div>

      {/* ── LOGO + IDENTITY ── */}
      <div className="relative px-4 md:px-6 -mt-12 mb-4">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[22px] font-bold shrink-0 overflow-hidden"
            style={{
              background: page.logo_url ? "var(--glass-bg)" : hashColor(page.id),
              color: "white",
              border: "3px solid var(--glass-border-color, rgba(255,255,255,0.2))",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}>
            {page.logo_url
              ? <img src={storageImageUrl(page.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : logoLetters}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-extrabold truncate" style={{ color: "var(--color-text)" }}>{page.name}</h1>
              {isVerified && <Shield className="w-5 h-5 shrink-0" style={{ color: "#FFB800" }} />}
            </div>
            {page.also_known_as && <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>Also: {page.also_known_as}</p>}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,115,58,0.12)", color: "var(--color-accent)" }}>{page.page_type}{page.sub_type ? ` · ${page.sub_type}` : ""}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            {page.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{page.city}{page.state ? `, ${page.state}` : ""}</span>}
            <span>{page.member_count || members.length} members</span>
            <span>{page.tracker_count || 0} tracking</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>Admin</span>}
            {tracking ? (
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={handleUntrack}>Tracking ✓</Button>
            ) : (
              <button className="btn-liquid-primary text-[12px] px-4 py-1.5 rounded-xl font-bold" onClick={handleTrack}>
                <Heart className="w-3.5 h-3.5 mr-1 inline" /> Follow
              </button>
            )}
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div className="mx-4 md:mx-6 mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-3 overflow-x-auto scrollbar-hide text-[12px]"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color, rgba(255,255,255,0.12))", backdropFilter: "blur(20px)" }}>
        {page.industry && <span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><Briefcase className="w-3.5 h-3.5" /> {page.industry}</span>}
        {page.team_size && <><span style={{ color: "var(--glass-border-color)" }}>|</span><span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><Users className="w-3.5 h-3.5" /> {page.team_size}</span></>}
        {page.founded_year && <><span style={{ color: "var(--glass-border-color)" }}>|</span><span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><Calendar className="w-3.5 h-3.5" /> Est. {page.founded_year}</span></>}
        {(page.city || page.state) && <><span style={{ color: "var(--glass-border-color)" }}>|</span><span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><MapPin className="w-3.5 h-3.5" /> {[page.city, page.state].filter(Boolean).join(", ")}</span></>}
        {page.official_website && <><span style={{ color: "var(--glass-border-color)" }}>|</span><a href={page.official_website.startsWith("http") ? page.official_website : `https://${page.official_website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 shrink-0 hover:underline" style={{ color: "var(--color-accent)" }}><Globe className="w-3.5 h-3.5" /> Website</a></>}
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="mx-4 md:mx-6 mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {pageTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-[13px] font-semibold rounded-xl shrink-0 transition-all cursor-pointer"
            style={{
              background: activeTab === tab ? "linear-gradient(135deg, var(--color-accent), #FF6B9D)" : "var(--glass-bg)",
              color: activeTab === tab ? "white" : "var(--color-text-secondary)",
              border: activeTab === tab ? "none" : "1px solid var(--glass-border-color, rgba(255,255,255,0.12))",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="px-4 md:px-6">

        {/* ABOUT */}
        {activeTab === "About" && (
          <div className="space-y-4">
            {/* About text */}
            <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
              <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>About</h3>
              {page.about
                ? <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{page.about}</p>
                : <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No description added yet.</p>}
            </div>

            {/* Why Work With Us */}
            {page.why_work_with_us && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>Why Work With Us</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{page.why_work_with_us}</p>
              </div>
            )}

            {/* Work Culture Tags */}
            {(page.work_culture_tags as string[] || []).length > 0 && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>Work Culture</h3>
                <div className="flex flex-wrap gap-2">
                  {(page.work_culture_tags as string[]).map((tag, i) => (
                    <span key={i} className="text-[12px] px-3 py-1 rounded-xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color, rgba(255,255,255,0.12))", color: "var(--color-text-secondary)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {customLinks.length > 0 && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>Links</h3>
                <div className="flex flex-wrap gap-2">
                  {customLinks.map((link: any, i: number) => {
                    const p = detectPlatform(link.url || "");
                    return (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:-translate-y-0.5"
                        style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color, rgba(255,255,255,0.12))", color: p?.color || "var(--color-accent)" }}>
                        <ExternalLink className="w-3 h-3" />
                        {link.label || p?.icon || "Link"}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* College-specific */}
            {page.page_type === "college" && (page.affiliation || page.naac_grade || page.nirf_ranking || page.student_count) && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4" style={{ color: "#34C759" }} />
                  <h3 className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>Academic Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {page.affiliation && <InfoCell label="Affiliation" value={page.affiliation} />}
                  {page.naac_grade && <InfoCell label="NAAC Grade" value={page.naac_grade} />}
                  {page.nirf_ranking && <InfoCell label="NIRF Ranking" value={`#${page.nirf_ranking}`} />}
                  {page.student_count && <InfoCell label="Students" value={page.student_count.toLocaleString()} />}
                </div>
              </div>
            )}

            {/* Hospital-specific */}
            {page.page_type === "hospital" && (page.bed_count || page.nabh_accredited || (page.specialisations as string[] || []).length > 0) && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4" style={{ color: "#FF6B9D" }} />
                  <h3 className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>Hospital Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {page.bed_count && <InfoCell label="Beds" value={page.bed_count.toString()} />}
                  <InfoCell label="NABH" value={page.nabh_accredited ? "Accredited ✓" : "Not accredited"} />
                </div>
                {(page.specialisations as string[] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(page.specialisations as string[]).map((s, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: "rgba(255,107,157,0.1)", color: "#FF6B9D" }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Government-specific */}
            {page.page_type === "government" && (page.govt_level || page.jurisdiction || page.service_hours) && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Landmark className="w-4 h-4" style={{ color: "#4A90D9" }} />
                  <h3 className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>Government Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {page.govt_level && <InfoCell label="Level" value={page.govt_level} />}
                  {page.jurisdiction && <InfoCell label="Jurisdiction" value={page.jurisdiction} />}
                  {page.service_hours && <InfoCell label="Service Hours" value={page.service_hours} />}
                  {page.emergency_contact && <InfoCell label="Emergency" value={page.emergency_contact} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS */}
        {activeTab === "Members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => setDeptFilter("all")}
                  className="text-[12px] px-3 py-1.5 rounded-xl shrink-0 font-semibold cursor-pointer transition-all"
                  style={{ background: deptFilter === "all" ? "var(--color-accent)" : "var(--glass-bg)", color: deptFilter === "all" ? "white" : "var(--color-text-secondary)", border: deptFilter !== "all" ? "1px solid var(--glass-border-color)" : "none" }}>
                  All ({members.length})
                </button>
                {departments.map(d => (
                  <button key={d} onClick={() => setDeptFilter(d)}
                    className="text-[12px] px-3 py-1.5 rounded-xl shrink-0 font-semibold cursor-pointer transition-all"
                    style={{ background: deptFilter === d ? "var(--color-accent)" : "var(--glass-bg)", color: deptFilter === d ? "white" : "var(--color-text-secondary)", border: deptFilter !== d ? "1px solid var(--glass-border-color)" : "none" }}>
                    {d}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="shrink-0 rounded-xl gap-1 text-[12px]">
                  <Plus className="w-3.5 h-3.5" /> Invite
                </Button>
              )}
            </div>
            {filteredMembers.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMembers.map(m => (
                  <Link key={m.id} to={`/app/profile/${m.user_id}`}
                    className="glass-light rounded-2xl p-3 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                    style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: hashColor(m.user_id) }}>
                      {m.profile?.avatar_url
                        ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : initials(m.profile?.full_name || "")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{m.profile?.full_name || "Member"}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>{m.title || m.role}{m.department ? ` · ${m.department}` : ""}</p>
                    </div>
                    {m.is_verified && <Shield className="w-4 h-4 shrink-0" style={{ color: "#FFB800" }} />}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AWARDS */}
        {activeTab === "Awards" && (
          <div className="space-y-3">
            {isAdmin && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-[12px]"><Plus className="w-3.5 h-3.5" /> Add Award</Button>
              </div>
            )}
            {awards.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No awards added yet</p>
              </div>
            ) : (
              awards.map((a: any, i: number) => (
                <div key={i} className="glass-light rounded-2xl p-4 flex items-start gap-3" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,184,0,0.12)" }}>
                    <Trophy className="w-5 h-5" style={{ color: "#FFB800" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>{a.name || a.title}</p>
                    {a.issued_by && <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>by {a.issued_by}</p>}
                    {a.year && <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{a.year}</p>}
                    {a.description && <p className="text-[12px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{a.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MEDIA */}
        {activeTab === "Media" && (
          <div className="space-y-3">
            {isAdmin && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-[12px]"><Plus className="w-3.5 h-3.5" /> Add Photos</Button>
              </div>
            )}
            {photos.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <ImageIcon className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No photos uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: "var(--glass-bg)" }}
                    onClick={() => setLightboxUrl(p)}>
                    <img src={p} alt="" className="w-full h-40 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OPPORTUNITIES */}
        {activeTab === "Opportunities" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {(["all", "active", "closed"] as const).map(f => (
                <button key={f} onClick={() => setOppFilter(f)}
                  className="text-[12px] px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-all capitalize"
                  style={{ background: oppFilter === f ? "var(--color-accent)" : "var(--glass-bg)", color: oppFilter === f ? "white" : "var(--color-text-secondary)", border: oppFilter !== f ? "1px solid var(--glass-border-color)" : "none" }}>
                  {f} ({f === "all" ? opps.length : f === "active" ? opps.filter(o => o.is_open).length : opps.filter(o => !o.is_open).length})
                </button>
              ))}
            </div>
            {filteredOpps.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>No opportunities</p>
                <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Jobs and opportunities will appear here</p>
              </div>
            ) : (
              filteredOpps.map(o => (
                <div key={o.id} onClick={() => navigate("/app/opportunities")}
                  className="glass-light rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>{o.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(74,144,217,0.1)", color: "#4A90D9" }}>{(o.type || "job").replace(/[-_]/g, " ")}</span>
                        {o.location && <span className="text-[11px] flex items-center gap-0.5" style={{ color: "var(--color-text-muted)" }}><MapPin className="w-3 h-3" />{o.location}</span>}
                        {o.is_remote && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(52,199,89,0.1)", color: "#34C759" }}>Remote</span>}
                      </div>
                      {o.compensation && <p className="text-[12px] mt-1 font-semibold" style={{ color: "var(--color-accent)" }}>{o.compensation}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${o.is_open ? "" : ""}`}
                      style={{ background: o.is_open ? "rgba(52,199,89,0.1)" : "rgba(156,163,175,0.1)", color: o.is_open ? "#34C759" : "var(--color-text-muted)" }}>
                      {o.is_open ? "Active" : "Closed"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* POSTS */}
        {activeTab === "Posts" && (
          <div className="space-y-3">
            {isAdmin && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>Post as {page.name}...</p>
                <Button size="sm" className="mt-2 rounded-xl" onClick={async () => {
                  if (!user) { toast.error("Sign in to post"); return; }
                  const content = window.prompt("Write your update:");
                  if (!content?.trim()) return;
                  const { error } = await supabase.from("posts").insert({
                    author_id: user.id,
                    content,
                    post_type: "post",
                    visibility: "everyone",
                    posted_by_org: page.institution_id || undefined,
                  });
                  if (error) { toast.error("Failed to post"); return; }
                  toast.success("Posted!");
                }}>Create Post</Button>
              </div>
            )}
            {posts.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No posts yet</p>
              </div>
            ) : (
              posts.map(p => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="glass-light rounded-2xl p-4 block transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <p className="text-[13px] line-clamp-3" style={{ color: "var(--color-text)" }}>{p.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {p.author?.full_name && <span>by {p.author.full_name}</span>}
                    <span>{daysAgo(p.created_at)}</span>
                    {(p.comment_count || 0) > 0 && <span>{p.comment_count} comments</span>}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setLightboxUrl(null)}
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <button className="absolute top-4 right-4 text-white cursor-pointer" onClick={() => setLightboxUrl(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxUrl} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl" />
        </div>
      )}
    </div>
  );
};

/* ── small info cell ── */
const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2.5 rounded-xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color, rgba(255,255,255,0.12))" }}>
    <p className="text-[10px] font-bold" style={{ color: "var(--color-text-muted)" }}>{label}</p>
    <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>{value}</p>
  </div>
);

export default PageProfile;
