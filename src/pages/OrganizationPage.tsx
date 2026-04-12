import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Building2, MapPin, Globe, Users, Heart, Briefcase, Shield, Calendar,
  Share2, MessageCircle, Settings, ChevronRight, Image as ImageIcon, Award, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ───── Tab Components ───── */
const PostsTab = ({ orgId }: { orgId: string }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(full_name, avatar_url, role)")
      .eq("posted_by_org", orgId).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, [orgId]);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-24 rounded-xl" style={{ background: "var(--surface)" }} />)}</div>;
  if (!posts.length) return (
    <div className="text-center py-12">
      <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No posts yet</p>
      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Posts from this organisation will appear here</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {posts.map(p => (
        <Link key={p.id} to={`/post/${p.id}`} className="block p-4 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-[14px] line-clamp-3" style={{ color: "var(--text-1)" }}>{p.content}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--text-3)" }}>
            {p.author?.full_name && <span>via {p.author.full_name}</span>}
            <span>{new Date(p.created_at).toLocaleDateString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

const AboutTab = ({ org }: { org: any }) => (
  <div className="space-y-5">
    {org.description && (
      <div>
        <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--text-1)" }}>About</h3>
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{org.description}</p>
      </div>
    )}
    <div className="grid grid-cols-2 gap-3">
      {org.founded_year && (
        <div className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--text-3)" }}>Founded</p>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{org.founded_year}</p>
        </div>
      )}
      {org.employee_count && (
        <div className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--text-3)" }}>Employees</p>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{org.employee_count}</p>
        </div>
      )}
      {org.website_url && (
        <div className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--text-3)" }}>Website</p>
          <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold truncate block" style={{ color: "var(--brand)" }}>{org.website_url.replace(/https?:\/\//, "")}</a>
        </div>
      )}
      {(org.city || org.state) && (
        <div className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--text-3)" }}>Location</p>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{[org.city, org.state].filter(Boolean).join(", ")}</p>
        </div>
      )}
    </div>
  </div>
);

const TeamTab = ({ orgId }: { orgId: string }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(full_name, avatar_url, role, headline)")
      .eq("org_id", orgId).eq("is_current", true).order("joined_at", { ascending: true })
      .then(({ data }) => { setMembers(data || []); setLoading(false); });
  }, [orgId]);

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: "var(--surface)" }} />;
  if (!members.length) return (
    <div className="text-center py-12">
      <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No team members yet</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {members.map(m => (
        <Link key={m.id} to={`/app/profile/${m.user_id}`}
          className="flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: "var(--brand)" }}>
            {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{m.profile?.full_name || "Member"}</p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{m.title || m.role}</p>
          </div>
          {m.is_verified && <Shield className="w-4 h-4" style={{ color: "var(--tiik-gold)" }} />}
        </Link>
      ))}
    </div>
  );
};

const OpportunitiesTab = ({ orgId }: { orgId: string }) => {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("opportunities").select("*").eq("org_id", orgId).eq("is_open", true).order("created_at", { ascending: false })
      .then(({ data }) => { setOpps(data || []); setLoading(false); });
  }, [orgId]);

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: "var(--surface)" }} />;
  if (!opps.length) return (
    <div className="text-center py-12">
      <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No open opportunities</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {opps.map(o => (
        <div key={o.id} onClick={() => navigate("/app/opportunities")} className="p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{o.title}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{(o.type || "job").replace(/[-_]/g, " ")}</span>
            {o.location && <span className="text-[11px] flex items-center gap-0.5" style={{ color: "var(--text-3)" }}><MapPin className="w-3 h-3" />{o.location}</span>}
            {o.compensation && <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{o.compensation}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

const VerifiedMembersTab = ({ orgId }: { orgId: string }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(full_name, avatar_url, role)")
      .eq("org_id", orgId).eq("is_verified", true).order("verified_at", { ascending: false })
      .then(({ data }) => { setMembers(data || []); setLoading(false); });
  }, [orgId]);

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: "var(--surface)" }} />;
  if (!members.length) return (
    <div className="text-center py-12">
      <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No verified members yet</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {members.map(m => (
        <Link key={m.id} to={`/app/profile/${m.user_id}`}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: "var(--brand)" }}>
            {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{m.profile?.full_name}</p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{m.title || m.role} {!m.is_current && "· Alumni"}</p>
          </div>
          <Shield className="w-4 h-4" style={{ color: "var(--tiik-gold)" }} />
        </Link>
      ))}
    </div>
  );
};

/* ───── Main Page ───── */
const TABS = ["Posts", "About", "Team", "Opportunities", "Verified Members"] as const;

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setOrg(data);
      setFollowerCount(data.followers_count || 0);

      // Get member count
      const { count } = await supabase.from("org_members").select("*", { count: "exact", head: true }).eq("org_id", data.id).eq("is_current", true);
      setMemberCount(count || 0);

      // Check if user is admin
      if (user) {
        const { data: mem } = await supabase.from("org_members").select("role").eq("org_id", data.id).eq("user_id", user.id).maybeSingle();
        setIsAdmin(mem?.role === "owner" || mem?.role === "admin");

        // Check if following
        const { data: fol } = await supabase.from("org_followers").select("id").eq("org_id", data.id).eq("user_id", user.id).maybeSingle();
        setIsFollowing(!!fol);
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const toggleFollow = async () => {
    if (!user || !org) return;
    if (isFollowing) {
      await supabase.from("org_followers").delete().eq("org_id", org.id).eq("user_id", user.id);
      setIsFollowing(false);
      setFollowerCount(p => Math.max(0, p - 1));
    } else {
      await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
      setIsFollowing(true);
      setFollowerCount(p => p + 1);
    }
  };

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-48 rounded-2xl" style={{ background: "var(--surface)" }} />
        <div className="h-8 w-1/3 rounded" style={{ background: "var(--surface)" }} />
      </div>
    </div>
  );

  if (!org) return (
    <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
      <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Organisation not found</h1>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>No organisation matches "{slug}"</p>
      <Button onClick={() => navigate(-1)} variant="secondary">Go back</Button>
    </div>
  );

  const typeLabel = org.type?.charAt(0).toUpperCase() + org.type?.slice(1).replace(/_/g, " ");

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-6 pb-8">
      {/* Cover */}
      <div className="h-[200px] rounded-2xl mt-4 relative overflow-hidden" style={{ background: org.cover_url ? `url(${org.cover_url}) center/cover` : "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
        {!org.cover_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Building2 className="w-24 h-24 text-white" />
          </div>
        )}
      </div>

      {/* Logo + Info */}
      <div className="relative px-4 -mt-12">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: "#fff", border: "4px solid var(--bg)", boxShadow: "var(--shadow-md)" }}>
            {org.logo_url ? (
              <img src={storageImageUrl(org.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-10 h-10" style={{ color: "var(--brand)" }} />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-extrabold truncate" style={{ color: "var(--text-1)" }}>{org.name}</h1>
              {org.is_verified && <Shield className="w-5 h-5 shrink-0" style={{ color: "var(--tiik-gold)" }} />}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{typeLabel}</span>
              {org.tagline && <span className="text-[13px]" style={{ color: "var(--text-3)" }}>{org.tagline}</span>}
            </div>
          </div>
        </div>

        {/* Stats + Actions */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>{followerCount}</p>
              <p className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>Followers</p>
            </div>
            <div className="w-px h-8" style={{ background: "var(--border)" }} />
            <div className="text-center">
              <p className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>{memberCount}</p>
              <p className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>Members</p>
            </div>
            {(org.city || org.state) && (
              <>
                <div className="w-px h-8" style={{ background: "var(--border)" }} />
                <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-3)" }}>
                  <MapPin className="w-3.5 h-3.5" />
                  {[org.city, org.state].filter(Boolean).join(", ")}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/app/settings`)}>
                <Settings className="w-3.5 h-3.5 mr-1" /> Manage
              </Button>
            )}
            <Button variant={isFollowing ? "secondary" : "default"} size="sm" onClick={toggleFollow}>
              <Heart className="w-3.5 h-3.5 mr-1" style={{ fill: isFollowing ? "currentColor" : "none" }} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mt-6 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-4 py-2.5 text-[13px] font-bold whitespace-nowrap cursor-pointer relative"
            style={{ color: tab === t ? "var(--brand)" : "var(--text-3)", transition: "all 0.15s" }}>
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" style={{ background: "var(--brand)" }} />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-5">
        {tab === "Posts" && <PostsTab orgId={org.id} />}
        {tab === "About" && <AboutTab org={org} />}
        {tab === "Team" && <TeamTab orgId={org.id} />}
        {tab === "Opportunities" && <OpportunitiesTab orgId={org.id} />}
        {tab === "Verified Members" && <VerifiedMembersTab orgId={org.id} />}
      </div>
    </div>
  );
}
