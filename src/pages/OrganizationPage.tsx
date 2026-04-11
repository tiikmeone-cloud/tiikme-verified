import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageLoader from "@/components/PageLoader";
import ThemeLogo from "@/components/ThemeLogo";
import { MapPin, Globe, Calendar, Users, Heart, MessageCircle, Settings, Plus, CheckCircle, Search, ArrowLeft } from "lucide-react";
import { ORG_TYPES, MEMBER_LABELS, MEMBER_TYPE_OPTIONS } from "@/lib/orgConstants";
import { formatDistanceToNow } from "date-fns";

type Org = Record<string, any>;
type Member = Record<string, any>;

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Force light mode on org pages
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

  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [metadata, setMeta] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Verification request form
  const [showVerifForm, setShowVerifForm] = useState(false);
  const [verifTitle, setVerifTitle] = useState("");
  const [verifType, setVerifType] = useState("");
  const [verifMsg, setVerifMsg] = useState("");
  const [verifSubmitting, setVerifSubmitting] = useState(false);

  // Pending requests (admin)
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);

  // Posts
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);

  const fetchOrg = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data: orgData } = await supabase.from("organizations" as any).select("*").eq("slug", slug).single();
    if (!orgData) { setLoading(false); return; }
    setOrg(orgData as any);
    setFollowerCount((orgData as any).followers_count || 0);

    const orgId = (orgData as any).id;

    // Parallel fetches
    const [membersRes, metaRes, postsRes] = await Promise.all([
      supabase.from("org_members" as any).select("*, profile:profiles!user_id(id, full_name, avatar_url, role, headline, username)").eq("org_id", orgId),
      supabase.from("org_metadata" as any).select("*").eq("org_id", orgId),
      supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").eq("workspace_name", `org:${orgId}`).order("created_at", { ascending: false }).limit(50),
    ]);

    setMembers((membersRes.data as any) || []);
    const metaMap: Record<string, string> = {};
    ((metaRes.data as any) || []).forEach((m: any) => { metaMap[m.key] = m.value; });
    setMeta(metaMap);
    setPosts((postsRes.data as any) || []);

    if (user) {
      const myMember = ((membersRes.data as any) || []).find((m: any) => m.user_id === user.id);
      setIsMember(!!myMember);
      setIsAdmin(myMember?.role === "owner" || myMember?.role === "admin");

      const { data: followData } = await supabase.from("org_followers" as any).select("id").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
      setIsFollowing(!!followData);

      // Fetch pending requests if admin
      if (myMember?.role === "owner" || myMember?.role === "admin") {
        const { data: reqs } = await supabase.from("org_verif_requests" as any)
          .select("*, profile:profiles!user_id(id, full_name, avatar_url, username, role)")
          .eq("org_id", orgId).eq("status", "pending");
        setPendingReqs((reqs as any) || []);
      }
    }
    setLoading(false);
  }, [slug, user]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  const handleFollow = async () => {
    if (!user || !org) return;
    if (isFollowing) {
      await supabase.from("org_followers" as any).delete().eq("org_id", org.id).eq("user_id", user.id);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from("org_followers" as any).insert({ org_id: org.id, user_id: user.id } as any);
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  };

  const handleVerifSubmit = async () => {
    if (!user || !org) return;
    setVerifSubmitting(true);
    const { error } = await supabase.from("org_verif_requests" as any).insert({
      org_id: org.id, user_id: user.id,
      title_at_org: verifTitle, member_type: verifType, message: verifMsg || null,
    } as any);
    if (error) toast({ title: "Request failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Verification request sent ✓" }); setShowVerifForm(false); }
    setVerifSubmitting(false);
  };

  const handleApproveRequest = async (req: any) => {
    await supabase.from("org_verif_requests" as any).update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any).eq("id", req.id);
    await supabase.from("org_members" as any).insert({
      org_id: org!.id, user_id: req.user_id, role: "member",
      title: req.title_at_org, is_verified: true, verified_at: new Date().toISOString(),
    } as any);
    toast({ title: `${req.profile?.full_name} approved ✓` });
    setPendingReqs(prev => prev.filter(r => r.id !== req.id));
    fetchOrg();
  };

  const handleDeclineRequest = async (req: any) => {
    await supabase.from("org_verif_requests" as any).update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any).eq("id", req.id);
    setPendingReqs(prev => prev.filter(r => r.id !== req.id));
    toast({ title: "Request declined" });
  };

  const handlePostAsOrg = async () => {
    if (!user || !org || !newPostContent.trim()) return;
    setPostSubmitting(true);
    const { data, error } = await supabase.from("posts").insert({
      author_id: user.id, content: newPostContent.trim(),
      post_type: "post", visibility: "everyone",
      workspace_name: `org:${org.id}`,
    }).select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").single();
    if (!error && data) { setPosts(prev => [data, ...prev]); setNewPostContent(""); }
    setPostSubmitting(false);
  };

  if (loading) return <PageLoader />;
  if (!org) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-1)" }}><p>Organization not found</p></div>;

  const typeInfo = ORG_TYPES.find(t => t.id === org.type);
  const memberLabels = MEMBER_LABELS[org.type] || ["Members"];
  const verifiedMembers = members.filter(m => m.is_verified);
  const locationParts = [org.village, org.city, org.district, org.state].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FFF8F2]" style={{ colorScheme: "light" }}>
      {/* Back button + branding header */}
      <div className="sticky top-0 z-20 bg-[#FFF8F2] border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#E8580A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">A Veenavarse Private Limited product</span>
      </div>
      {/* Cover */}
      <div className="w-full h-48 md:h-56 relative" style={{
        background: org.cover_url
          ? `url(${org.cover_url}) center/cover`
          : `linear-gradient(135deg, var(--brand) 0%, #F97316 100%)`,
      }}>
        <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.3))" }} />
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
        {/* Logo */}
        <div className="flex items-end gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-2xl font-bold overflow-hidden"
            style={{ borderColor: "#FFF8F2", background: org.logo_url ? "transparent" : "var(--brand)", color: "#fff" }}>
            {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-cover" /> : org.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{org.name}</h1>
              {org.is_verified && <Badge className="text-xs gap-1" style={{ background: "var(--tiik-gold)", color: "#fff" }}><CheckCircle className="w-3 h-3" /> Verified</Badge>}
            </div>
            {org.tagline && <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{org.tagline}</p>}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 text-sm mb-3" style={{ color: "var(--text-2)" }}>
          {typeInfo && <span className="inline-flex items-center gap-1">{typeInfo.icon} {typeInfo.label}</span>}
          {org.subtype && <span>· {org.subtype}</span>}
          {locationParts.length > 0 && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {locationParts.join(", ")}</span>}
          {org.website_url && <a href={org.website_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:underline" style={{ color: "var(--brand)" }}><Globe className="w-3.5 h-3.5" /> {org.website_url.replace(/https?:\/\//, "")}</a>}
          {org.founded_year && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Est. {org.founded_year}</span>}
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm mb-4" style={{ color: "var(--text-2)" }}>
          <span><strong style={{ color: "var(--text-1)" }}>{followerCount}</strong> Followers</span>
          <span><strong style={{ color: "var(--text-1)" }}>{verifiedMembers.length}</strong> {memberLabels[0]}</span>
          <span><strong style={{ color: "var(--text-1)" }}>{posts.length}</strong> Posts</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          {user && (
            <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}
              style={isFollowing ? {} : { background: "var(--brand)", color: "#fff" }}>
              {isFollowing ? "Following ✓" : "+ Follow"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate(`/org/${slug}/admin`)} className="gap-1">
              <Settings className="w-4 h-4" /> Manage
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full justify-start" style={{ background: "var(--surface)" }}>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4 space-y-4">
            {isAdmin && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder={`Post as ${org.name}...`} rows={3} />
                <div className="flex justify-end">
                  <Button onClick={handlePostAsOrg} disabled={!newPostContent.trim() || postSubmitting}
                    style={{ background: "var(--brand)", color: "#fff" }}>
                    {postSubmitting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            )}
            {posts.length === 0 && <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>No posts yet</p>}
            {posts.map(post => (
              <div key={post.id} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--brand)", color: "#fff" }}>
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{org.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      Posted by {post.author?.full_name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-1)" }}>{post.content}</p>
              </div>
            ))}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4 space-y-6">
            {org.description && (
              <Section title="Overview">
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-1)" }}>{org.description}</p>
              </Section>
            )}
            <Section title="Contact">
              {org.phone && <InfoRow icon="📞" label={org.phone} />}
              {org.email && <InfoRow icon="✉️" label={org.email} />}
              {org.website_url && <InfoRow icon="🌐" label={<a href={org.website_url} target="_blank" rel="noopener" className="hover:underline" style={{ color: "var(--brand)" }}>{org.website_url}</a>} />}
            </Section>
            <Section title="Location">
              {org.full_address && <p className="text-sm" style={{ color: "var(--text-1)" }}>{org.full_address}</p>}
              {locationParts.length > 0 && <p className="text-sm" style={{ color: "var(--text-2)" }}>{locationParts.join(", ")}</p>}
              {org.pincode && <p className="text-sm" style={{ color: "var(--text-2)" }}>PIN: {org.pincode}</p>}
            </Section>
            {Object.keys(metadata).length > 0 && (
              <Section title="Details">
                {Object.entries(metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1">
                    <span className="capitalize" style={{ color: "var(--text-2)" }}>{k.replace(/_/g, " ")}</span>
                    <span style={{ color: "var(--text-1)" }}>{v}</span>
                  </div>
                ))}
              </Section>
            )}
            {/* Verification request CTA */}
            {user && !isMember && org.allow_employee_requests && (
              <Section title={`Work at ${org.name}?`}>
                {!showVerifForm ? (
                  <div>
                    <p className="text-sm mb-3" style={{ color: "var(--text-2)" }}>Get your profile verified by {org.name}</p>
                    <Button onClick={() => setShowVerifForm(true)} style={{ background: "var(--brand)", color: "#fff" }}>
                      Request Verification →
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Your title/role *</label>
                      <Input value={verifTitle} onChange={e => setVerifTitle(e.target.value)} placeholder='e.g. "Software Engineer"' className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>I am a</label>
                      <select value={verifType} onChange={e => setVerifType(e.target.value)}
                        className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}>
                        <option value="">Select</option>
                        {(MEMBER_TYPE_OPTIONS[org.type] || ['Member']).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Message (optional)</label>
                      <Textarea value={verifMsg} onChange={e => setVerifMsg(e.target.value)} maxLength={200} rows={2} className="mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleVerifSubmit} disabled={!verifTitle || verifSubmitting}
                        style={{ background: "var(--brand)", color: "#fff" }}>
                        {verifSubmitting ? "Sending..." : "Submit Request"}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowVerifForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </Section>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="mt-4 space-y-4">
            <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
              {verifiedMembers.length} Verified {memberLabels[0]}
            </p>
            {/* Admin: pending requests */}
            {isAdmin && pendingReqs.length > 0 && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: "#FEF3C7", border: "1px solid #F59E0B" }}>
                <p className="text-sm font-semibold" style={{ color: "#92400E" }}>{pendingReqs.length} pending request{pendingReqs.length > 1 ? "s" : ""}</p>
                {pendingReqs.map(req => (
                  <div key={req.id} className="flex items-center gap-3 py-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={req.profile?.avatar_url} />
                      <AvatarFallback>{(req.profile?.full_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{req.profile?.full_name}</p>
                      <p className="text-xs" style={{ color: "var(--text-2)" }}>{req.title_at_org} · {req.member_type}</p>
                    </div>
                    <Button size="sm" onClick={() => handleApproveRequest(req)} style={{ background: "#10B981", color: "#fff" }}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeclineRequest(req)}>Decline</Button>
                  </div>
                ))}
              </div>
            )}
            {/* Members grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:shadow-sm transition"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onClick={() => m.profile?.username && navigate(`/${m.profile.username}`)}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={m.profile?.avatar_url} />
                    <AvatarFallback>{(m.profile?.full_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{m.profile?.full_name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{m.title || m.role}</p>
                  </div>
                  {m.is_verified && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "var(--tiik-gold)" }} />}
                </div>
              ))}
            </div>
            {members.length === 0 && <p className="text-center py-6 text-sm" style={{ color: "var(--text-3)" }}>No members yet</p>}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-4">
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>No opportunities posted yet</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-1)" }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ icon, label }: { icon: string; label: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1" style={{ color: "var(--text-1)" }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
