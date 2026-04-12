import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";
import OrgHero from "@/components/org/OrgHero";
import OrgTabs from "@/components/org/OrgTabs";
import HomeTab from "@/components/org/tabs/HomeTab";
import AboutTab from "@/components/org/tabs/AboutTab";
import TeamTab from "@/components/org/tabs/TeamTab";
import OpportunitiesTab from "@/components/org/tabs/OpportunitiesTab";
import VerifiedMembersTab from "@/components/org/tabs/VerifiedMembersTab";

const TABS = ["Home", "About", "Team", "Opportunities", "Posts", "Verified Members"];

export default function OrganizationPage() {
  const { slug, tab: urlTab } = useParams<{ slug: string; tab?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Force light mode
  useEffect(() => {
    const html = document.documentElement;
    const prevTheme = html.getAttribute("data-theme");
    const prevClass = html.className;
    html.setAttribute("data-theme", "light");
    html.classList.remove("dark");
    html.classList.add("light");
    return () => {
      if (prevTheme) html.setAttribute("data-theme", prevTheme);
      else html.removeAttribute("data-theme");
      html.className = prevClass;
    };
  }, []);

  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [metadata, setMeta] = useState<Record<string, string>>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");

  // Map URL tab to display tab
  useEffect(() => {
    if (urlTab) {
      const map: Record<string, string> = { about: "About", team: "Team", opportunities: "Opportunities", posts: "Posts", members: "Verified Members" };
      if (map[urlTab]) setActiveTab(map[urlTab]);
    }
  }, [urlTab]);

  const fetchOrg = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: orgData, error } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (error) { console.warn("[OrgPage] fetch failed:", error.message); setLoading(false); return; }
      if (!orgData) { setLoading(false); return; }
      setOrg(orgData);
      setFollowerCount(orgData.followers_count || 0);

      const [membersRes, metaRes, postsRes] = await Promise.allSettled([
        supabase.from("org_members").select("*, profile:profiles!user_id(id, full_name, avatar_url, role, headline, username)").eq("org_id", orgData.id),
        supabase.from("org_metadata").select("*").eq("org_id", orgData.id),
        supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").eq("workspace_name", `org:${orgData.id}`).order("created_at", { ascending: false }).limit(50),
      ]);

      setMembers(membersRes.status === "fulfilled" ? (membersRes.value as any).data || [] : []);
      const metaData = metaRes.status === "fulfilled" ? (metaRes.value as any).data || [] : [];
      const metaMap: Record<string, string> = {};
      metaData.forEach((m: any) => { metaMap[m.key] = m.value; });
      setMeta(metaMap);
      setPosts(postsRes.status === "fulfilled" ? (postsRes.value as any).data || [] : []);

      if (user) {
        const myMember = (membersRes.status === "fulfilled" ? (membersRes.value as any).data || [] : []).find((m: any) => m.user_id === user.id);
        setIsAdmin(myMember?.role === "owner" || myMember?.role === "admin" || orgData.created_by === user.id);
        const { data: followData } = await supabase.from("org_followers").select("id").eq("org_id", orgData.id).eq("user_id", user.id).maybeSingle();
        setIsFollowing(!!followData);
      }
    } catch (e) { console.warn("[OrgPage] exception:", e); }
    setLoading(false);
  }, [slug, user]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  const handleFollow = async () => {
    if (!user || !org) return;
    if (isFollowing) {
      await supabase.from("org_followers").delete().eq("org_id", org.id).eq("user_id", user.id);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  };

  if (loading) return <PageLoader />;
  if (!org) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F2", color: "#1A1A1A" }}>
      <div className="text-center">
        <p className="text-[16px] font-bold">Organisation not found</p>
        <button type="button" onClick={() => navigate("/app/explore")} className="text-[13px] mt-2" style={{ color: "#E8580A" }}>← Explore</button>
      </div>
    </div>
  );

  const verifiedMembers = members.filter(m => m.is_verified);

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F2", colorScheme: "light" }}>
      <OrgHero
        org={org}
        isAdmin={isAdmin}
        isFollowing={isFollowing}
        followerCount={followerCount}
        memberCount={verifiedMembers.length}
        onFollow={handleFollow}
        onNavigateSettings={() => navigate(`/org/${slug}/settings`)}
      />

      <OrgTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-5">
        {activeTab === "Home" && <HomeTab org={org} posts={posts} isAdmin={isAdmin} onPostCreated={post => setPosts(prev => [post, ...prev])} />}
        {activeTab === "About" && <AboutTab org={org} metadata={metadata} />}
        {activeTab === "Team" && <TeamTab org={org} members={members} isAdmin={isAdmin} />}
        {activeTab === "Opportunities" && <OpportunitiesTab org={org} isAdmin={isAdmin} />}
        {activeTab === "Posts" && <HomeTab org={org} posts={posts} isAdmin={isAdmin} onPostCreated={post => setPosts(prev => [post, ...prev])} />}
        {activeTab === "Verified Members" && <VerifiedMembersTab members={members} />}
      </div>
    </div>
  );
}
