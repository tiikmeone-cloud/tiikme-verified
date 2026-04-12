import { useState, useEffect } from "react";
import { MapPin, Globe, Calendar, Users, MessageCircle, ExternalLink, Trophy, Share2, Shield, Briefcase, ArrowLeft, Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ActivityScoreRing from "@/components/ActivityScoreRing";

const pageTabs = ["About", "Updates", "Jobs & Opportunities", "Team", "Gallery"] as const;

const PageProfile = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof pageTabs[number]>("About");
  const [tracking, setTracking] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
        if (error) { console.warn("[PageProfile] page fetch failed:", error.message); setLoading(false); return; }
        if (data) {
          setPage(data);
          if (user) {
            const { data: admin } = await supabase.from("page_admins").select("id").eq("page_id", data.id).eq("user_id", user.id).maybeSingle();
            setIsAdmin(!!admin || data.created_by === user.id);
            const { data: tracker } = await supabase.from("page_trackers").select("id").eq("page_id", data.id).eq("user_id", user.id).maybeSingle();
            setTracking(!!tracker);
          }
        }
      } catch (e) { console.warn("[PageProfile] exception:", e); }
      setLoading(false);
    };
    load();
  }, [slug, user]);

  const handleTrack = async () => {
    if (!user || !page) { toast.error("Sign in to track"); return; }
    setTracking(true);
    await supabase.from("page_trackers").insert({ page_id: page.id, user_id: user.id });
    toast.success(`Tracking ${page.name} · You'll see their opportunities first`);
  };

  const handleUntrack = async () => {
    if (!user || !page) return;
    setTracking(false);
    await supabase.from("page_trackers").delete().eq("page_id", page.id).eq("user_id", user.id);
    toast.success("Stopped tracking");
  };

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-12 text-center">
      <div className="w-12 h-12 rounded-full mx-auto mb-4 animate-pulse" style={{ background: "var(--surface-2)" }} />
      <p style={{ color: "var(--text-3)" }}>Loading...</p>
    </div>
  );

  if (!page) return (
    <div className="max-w-[960px] mx-auto px-4 py-12 text-center">
      <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Page not found</p>
      <Link to="/app/explore" className="text-[13px] mt-2 inline-block" style={{ color: "var(--brand)" }}>← Explore</Link>
    </div>
  );

  const awards = (page.awards as any[]) || [];
  const customLinks = (page.custom_links as any[]) || [];
  const logoInitials = page.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "P";

  return (
    <div className="max-w-[960px] mx-auto px-0 md:px-4 py-0 md:py-6">
      {/* COVER */}
      <div className="w-full h-[220px] relative overflow-hidden" style={{
        borderRadius: "0 0 16px 16px",
        background: page.cover_url ? `url(${page.cover_url}) center/cover` : `linear-gradient(135deg, var(--brand-dim), var(--surface-2))`,
      }}>
        <span className="absolute inset-0 flex items-center justify-center text-[60px] font-extrabold" style={{ color: "var(--brand)", opacity: page.cover_url ? 0 : 0.15 }}>{logoInitials}</span>
      </div>

      {/* HEADER */}
      <div className="px-4 md:px-6 -mt-10 relative z-10">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-[22px] font-bold shrink-0 overflow-hidden"
            style={{ background: page.logo_url ? "white" : "var(--brand-dim)", color: "var(--brand)", border: "4px solid var(--surface)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            {page.logo_url ? <img src={page.logo_url} alt="" className="w-full h-full object-cover" /> : logoInitials}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{page.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{page.page_type}</span>
              {page.sub_type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{page.sub_type}</span>}
              {page.city && <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-3)" }}><MapPin className="w-3 h-3" /> {page.city}{page.state ? `, ${page.state}` : ""}</span>}
              {page.founded_year && <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-3)" }}><Calendar className="w-3 h-3" /> Est. {page.founded_year}</span>}
              {page.official_website && <a href={page.official_website.startsWith("http") ? page.official_website : `https://${page.official_website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px]" style={{ color: "var(--brand)" }}><Globe className="w-3 h-3" /> Website</a>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {isAdmin && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>Admin</span>}
            {tracking ? (
              <Button variant="secondary" size="sm" onClick={handleUntrack}>Tracking ✓</Button>
            ) : (
              <Button size="sm" onClick={handleTrack}>Track +</Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1"><MessageCircle className="w-3.5 h-3.5" /> Message</Button>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}><Share2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex items-center gap-3 mt-3 px-1">
          {(page.trust_score || 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#F59E0B" }}><Shield className="w-3.5 h-3.5" /> Verified Institution</span>
          )}
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{page.member_count || 0} members</span>
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{page.tracker_count || 0} tracking</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto scrollbar-hide mt-4 px-4 md:px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {pageTabs.map(tab => (
          <button type="button" key={tab} onClick={() => setActiveTab(tab)}
            className="py-3 px-4 text-[13px] font-semibold cursor-pointer shrink-0"
            style={{ color: activeTab === tab ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === tab ? "2px solid var(--brand)" : "2px solid transparent" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="px-4 md:px-6 py-5">
        {activeTab === "About" && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-[300px] shrink-0 space-y-4">
              {page.about && (
                <div className="t-card p-4">
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{page.about}</p>
                </div>
              )}
              <div className="t-card p-4 space-y-2.5">
                {page.founded_year && <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}><Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> Established {page.founded_year}</div>}
                {page.team_size && <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}><Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> {page.team_size} employees</div>}
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}><Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> {page.page_type}{page.sub_type ? ` · ${page.sub_type}` : ""}</div>
                {page.city && <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}><MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> {page.city}{page.state ? `, ${page.state}` : ""}{page.pincode ? ` ${page.pincode}` : ""}</div>}
                {page.official_website && <a href={page.official_website.startsWith("http") ? page.official_website : `https://${page.official_website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] hover:underline" style={{ color: "var(--brand)" }}><Globe className="w-3.5 h-3.5 shrink-0" /> {page.official_website}</a>}
              </div>
              {customLinks.length > 0 && (
                <div className="t-card p-4">
                  <p className="micro-label mb-2">LINKS</p>
                  <div className="space-y-1.5">
                    {customLinks.map((link: any, i: number) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-semibold hover:underline" style={{ color: "var(--brand)" }}>
                        {link.label || link.url} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {awards.length > 0 && (
                <div className="t-card p-4">
                  <p className="micro-label mb-2">AWARDS</p>
                  {awards.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 text-[12px]" style={{ color: "var(--text-1)" }}>
                      <Trophy className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                      {a.name} {a.year ? `· ${a.year}` : ""}
                    </div>
                  ))}
                </div>
              )}
              {(page.trust_score || 0) > 0 && (
                <div className="t-card p-4 text-center">
                  <ActivityScoreRing score={page.trust_score} size={56} strokeWidth={4} />
                  <p className="text-[11px] font-bold mt-1" style={{ color: "var(--text-2)" }}>Tiikme Trust: {page.trust_score}</p>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {(page.activity_photos as string[] || []).length > 0 ? (
                <div>
                  <p className="micro-label mb-2">PHOTOS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(page.activity_photos as string[]).slice(0, 6).map((p: string, i: number) => (
                      <img key={i} src={p} alt="" className="w-full h-40 object-cover rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="t-card p-8 text-center">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
                  <p className="text-[13px]" style={{ color: "var(--text-3)" }}>No photos yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Updates" && (
          <div>
            {isAdmin && (
              <div className="t-card p-4 mb-4">
                <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Post as {page.name}...</p>
                <Button size="sm" className="mt-2" onClick={() => toast.info("Institution post composer coming soon")}>Create Post</Button>
              </div>
            )}
            <div className="t-card p-8 text-center">
              <p className="text-[14px]" style={{ color: "var(--text-3)" }}>No updates posted yet</p>
            </div>
          </div>
        )}

        {activeTab === "Jobs & Opportunities" && (
          <div>
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <Button size="sm" className="gap-1" onClick={() => toast.info("Job posting form coming soon")}><Plus className="w-3.5 h-3.5" /> Post a Job</Button>
              </div>
            )}
            <div className="t-card p-8 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No active opportunities</p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Jobs and opportunities will appear here</p>
            </div>
          </div>
        )}

        {activeTab === "Team" && (
          <div>
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <Button variant="secondary" size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> Invite members</Button>
              </div>
            )}
            <div className="t-card p-8 text-center">
              <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Team members</p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Verified team members will appear here</p>
            </div>
          </div>
        )}

        {activeTab === "Gallery" && (
          <div>
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <Button variant="secondary" size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> Add photos</Button>
              </div>
            )}
            {(page.activity_photos as string[] || []).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {(page.activity_photos as string[]).map((p: string, i: number) => (
                  <img key={i} src={p} alt="" className="w-full h-48 object-cover rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ))}
              </div>
            ) : (
              <div className="t-card p-8 text-center">
                <ImageIcon className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
                <p className="text-[14px]" style={{ color: "var(--text-3)" }}>No photos uploaded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageProfile;
