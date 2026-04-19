import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Search, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CIRCLE_TYPE_CONFIG, POST_TYPE_CONFIG, SIGNTYPE_CONFIG } from "@/lib/circlesMeta";
import AvatarSquare from "@/components/ui/AvatarSquare";

// -------- DISCOVERY SCREEN --------
function CirclesDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [joined, setJoined] = useState<string[]>([]);
  const [allCircles, setAllCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [circlesRes, memRes] = await Promise.all([
        supabase.from("circles").select("*").eq("visibility", "public").order("member_count", { ascending: false }).limit(100),
        user ? supabase.from("circle_members").select("circle_id").eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
      ]);
      setAllCircles(circlesRes.data || []);
      setJoined((memRes.data || []).map((m: any) => m.circle_id));
      setLoading(false);
    })();
  }, [user]);

  const filter = (t: string) => allCircles
    .filter(c => c.type === t)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const join = async (circleId: string) => {
    if (!user) { toast.error("Sign in to join"); return; }
    const { error } = await supabase.from("circle_members").insert({ circle_id: circleId, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    setJoined(prev => [...prev, circleId]);
    toast.success("Joined");
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Circles</h1>
        <button type="button" onClick={() => navigate("/app/circles/create")}
          className="flex items-center gap-1.5 cursor-pointer"
          style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "#F97316", color: "#fff", border: "none" }}>
          <Plus style={{ width: 14, height: 14 }} /> Create
        </button>
      </div>

      <div className="relative" style={{ marginBottom: 18 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#6B7094" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search circles..."
          className="w-full outline-none"
          style={{ height: 40, borderRadius: 12, paddingLeft: 36, paddingRight: 12, fontSize: 13, background: "rgba(255,255,255,0.20)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.30)" }} />
      </div>

      {joined.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6B7094", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Your circles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {allCircles.filter(c => joined.includes(c.id)).map(c => (
              <CircleRow key={c.id} c={c} joined onClick={() => navigate(`/app/circles/${c.slug}`)} onJoin={() => {}} />
            ))}
          </div>
        </section>
      )}

      {Object.entries(CIRCLE_TYPE_CONFIG).map(([key, conf]) => {
        const list = filter(key);
        if (!list.length) return null;
        const Icon = conf.icon;
        return (
          <section key={key} style={{ marginBottom: 24 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: conf.bg }}>
                <Icon style={{ width: 14, height: 14, color: conf.color }} />
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6B7094", textTransform: "uppercase", letterSpacing: 0.5 }}>{conf.label}s</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {list.slice(0, 6).map(c => (
                <CircleRow key={c.id} c={c} joined={joined.includes(c.id)} onClick={() => navigate(`/app/circles/${c.slug}`)} onJoin={() => join(c.id)} />
              ))}
            </div>
          </section>
        );
      })}

      {loading && <p style={{ textAlign: "center", color: "#6B7094", fontSize: 13, padding: 24 }}>Loading...</p>}
    </div>
  );
}

function CircleRow({ c, joined, onClick, onJoin }: any) {
  const conf = (CIRCLE_TYPE_CONFIG as any)[c.type] || CIRCLE_TYPE_CONFIG.topic;
  const Icon = conf.icon;
  return (
    <div onClick={onClick} className="glass-card flex items-center cursor-pointer"
      style={{ padding: 12, borderRadius: 12, gap: 10, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.30)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: conf.bg, flexShrink: 0 }}>
        <Icon style={{ width: 20, height: 20, color: conf.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{c.name}</p>
        <p style={{ fontSize: 11, color: "#6B7094", marginTop: 2 }}>{c.member_count || 0} members</p>
      </div>
      {!joined && (
        <button type="button" onClick={e => { e.stopPropagation(); onJoin(); }}
          style={{ height: 28, padding: "0 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: conf.color, color: "#fff", border: "none", cursor: "pointer" }}>
          Join
        </button>
      )}
    </div>
  );
}

// -------- CREATE CIRCLE --------
function CreateCircle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("topic");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Sign in first"); return; }
    if (!name.trim()) { toast.error("Name required"); return; }
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setSaving(true);
    const { data, error } = await supabase.from("circles").insert({
      name: name.trim(), slug, type, description: description.trim() || null, created_by: user.id,
    }).select().single();
    if (error) { setSaving(false); toast.error(error.message); return; }
    // Auto-join creator
    await supabase.from("circle_members").insert({ circle_id: data.id, user_id: user.id });
    toast.success("Circle created");
    navigate(`/app/circles/${data.slug}`);
  };

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 18 }}>Create a circle</h1>

      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bengaluru Founders"
        className="w-full outline-none"
        style={{ height: 38, borderRadius: 10, padding: "0 12px", fontSize: 13, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.3)", marginBottom: 14 }} />

      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Description</label>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this circle about?" rows={3}
        className="w-full outline-none"
        style={{ borderRadius: 10, padding: 12, fontSize: 13, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.3)", marginBottom: 14, resize: "vertical" }} />

      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Type</label>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 18 }}>
        {Object.entries(CIRCLE_TYPE_CONFIG).map(([key, conf]) => {
          const Icon = conf.icon;
          const active = type === key;
          return (
            <button key={key} type="button" onClick={() => setType(key)}
              className="flex items-center gap-1.5 cursor-pointer"
              style={{
                height: 32, padding: "0 12px", borderRadius: 999,
                fontSize: 12, fontWeight: 600,
                background: active ? conf.color : conf.bg,
                color: active ? "#fff" : conf.color,
                border: "none",
              }}>
              <Icon style={{ width: 13, height: 13 }} /> {conf.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={() => navigate("/app/circles")} type="button"
          style={{ flex: 1, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.3)", color: "#1A1A2E", border: "none", cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={submit} disabled={saving || !name.trim()} type="button"
          style={{ flex: 2, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, background: saving || !name.trim() ? "#9CA3AF" : "#F97316", color: "#fff", border: "none", cursor: saving ? "default" : "pointer" }}>
          {saving ? "Creating..." : "Create circle"}
        </button>
      </div>
    </div>
  );
}

// -------- DETAIL SCREEN --------
function CircleDetail({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [circle, setCircle] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: c } = await supabase.from("circles").select("*").eq("slug", slug).maybeSingle();
      if (!c) return;
      setCircle(c);
      const [postsRes, memRes] = await Promise.all([
        supabase.from("circle_posts").select("*, author:profiles!circle_posts_author_id_fkey(id, full_name, avatar_url, role)")
          .eq("circle_id", c.id).eq("is_flagged", false)
          .order(sort === "hot" ? "hot_score" : "created_at", { ascending: false }).limit(50),
        user ? supabase.from("circle_members").select("id").eq("circle_id", c.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setPosts(postsRes.data || []);
      setIsMember(!!memRes.data);
    })();
  }, [slug, sort, user]);

  const join = async () => {
    if (!user || !circle) return;
    const { error } = await supabase.from("circle_members").insert({ circle_id: circle.id, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    setIsMember(true);
    toast.success("Joined " + circle.name);
  };

  if (!circle) return <p style={{ textAlign: "center", color: "#6B7094", fontSize: 13, padding: 32 }}>Loading circle...</p>;

  const conf = (CIRCLE_TYPE_CONFIG as any)[circle.type] || CIRCLE_TYPE_CONFIG.topic;
  const Icon = conf.icon;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.30)", marginBottom: 14 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: conf.bg, flexShrink: 0 }}>
            <Icon style={{ width: 24, height: 24, color: conf.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>{circle.name}</h1>
            <p style={{ fontSize: 12, color: "#6B7094", marginTop: 2 }}>{circle.member_count || 0} members · {circle.post_count || 0} posts</p>
          </div>
          {!isMember ? (
            <button onClick={join} type="button" style={{ height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: conf.color, color: "#fff", border: "none", cursor: "pointer" }}>
              Join
            </button>
          ) : (
            <button onClick={() => setShowComposer(true)} type="button" style={{ height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "#F97316", color: "#fff", border: "none", cursor: "pointer" }}>
              + Post
            </button>
          )}
        </div>
        {circle.description && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{circle.description}</p>}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2" style={{ marginBottom: 12 }}>
        <button onClick={() => setSort("new")} type="button" className="flex items-center gap-1.5"
          style={{ height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: sort === "new" ? "#1A1A2E" : "rgba(255,255,255,0.2)", color: sort === "new" ? "#fff" : "#1A1A2E", border: "none", cursor: "pointer" }}>
          <Clock style={{ width: 12, height: 12 }} /> New
        </button>
        <button onClick={() => setSort("hot")} type="button" className="flex items-center gap-1.5"
          style={{ height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: sort === "hot" ? "#1A1A2E" : "rgba(255,255,255,0.2)", color: sort === "hot" ? "#fff" : "#1A1A2E", border: "none", cursor: "pointer" }}>
          <TrendingUp style={{ width: 12, height: 12 }} /> Hot
        </button>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-10" style={{ gap: 10 }}>
        {posts.length === 0 ? (
          <div className="glass-card" style={{ padding: 24, borderRadius: 12, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.30)", textAlign: "center", fontSize: 13, color: "#6B7094" }}>
            No posts yet. {isMember ? "Be the first to post." : "Join to see the conversation."}
          </div>
        ) : posts.map(p => <CirclePostCard key={p.id} post={p} />)}
      </div>

      {showComposer && isMember && (
        <CircleComposer circle={circle} onClose={() => setShowComposer(false)} onPosted={(newPost: any) => { setPosts(prev => [newPost, ...prev]); setShowComposer(false); }} />
      )}
    </div>
  );
}

function CirclePostCard({ post }: { post: any }) {
  const author = post.author;
  const showName = post.signtype === "full_profile";
  const label = (SIGNTYPE_CONFIG as any)[post.signtype]?.label || "User";
  const typeConf = (POST_TYPE_CONFIG as any)[post.post_type] || POST_TYPE_CONFIG.discussion;

  return (
    <article className="glass-card" style={{ padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.30)" }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        {showName && author ? (
          <AvatarSquare src={author.avatar_url} name={author.full_name || "?"} size={32} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(107,112,148,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6B7094" }}>?</div>
        )}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
            {showName ? author?.full_name : label}
          </p>
          <p style={{ fontSize: 11, color: "#6B7094" }}>
            {typeConf.icon} {typeConf.label} · {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      {post.title && <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>{post.title}</h3>}
      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{post.body || post.content}</p>
      <div className="flex items-center gap-4" style={{ marginTop: 10, fontSize: 12, color: "#6B7094" }}>
        <span>▲ {post.upvote_count || 0}</span>
        <span>💬 {post.comment_count || post.reply_count || 0}</span>
      </div>
    </article>
  );
}

// -------- COMPOSER --------
function CircleComposer({ circle, onClose, onPosted }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState<"type" | "form">("type");
  const [postType, setPostType] = useState("discussion");
  const [signtype, setSigntype] = useState("full_profile");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || !body.trim()) { toast.error("Add a message"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("circle_posts").insert({
      circle_id: circle.id, author_id: user.id,
      signtype, post_type: postType,
      title: title.trim() || null, body: body.trim(),
      content: body.trim(),
    }).select("*, author:profiles!circle_posts_author_id_fkey(id, full_name, avatar_url, role)").single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted");
    onPosted(data);
  };

  const showRisk = (signtype === "verified_employee" || signtype === "verified_role") && (circle.member_count || 0) < 50;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div onClick={e => e.stopPropagation()} className="glass-card w-full max-w-lg" style={{ padding: 18, borderRadius: "16px 16px 0 0", background: "rgba(255,255,255,0.95)", maxHeight: "90vh", overflow: "auto" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Post in {circle.name}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#6B7094", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {step === "type" ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7094", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>What kind of post?</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(POST_TYPE_CONFIG).map(([key, conf]) => (
                <button key={key} type="button" onClick={() => { setPostType(key); setStep("form"); }}
                  className="glass-card text-left cursor-pointer"
                  style={{ padding: 10, borderRadius: 10, border: postType === key ? "2px solid #F97316" : "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.6)" }}>
                  <p style={{ fontSize: 16, marginBottom: 4 }}>{conf.icon}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{conf.label}</p>
                  <p style={{ fontSize: 10, color: "#6B7094", marginTop: 2 }}>{conf.hint}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
              className="w-full outline-none mb-2" style={{ height: 36, borderRadius: 10, padding: "0 12px", fontSize: 13, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.3)" }} />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="What's on your mind?" rows={5}
              className="w-full outline-none mb-3" style={{ borderRadius: 10, padding: 12, fontSize: 13, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.3)", resize: "vertical" }} />

            <p style={{ fontSize: 11, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Post as</p>
            <select value={signtype} onChange={e => setSigntype(e.target.value)}
              className="w-full outline-none mb-3" style={{ height: 36, borderRadius: 10, padding: "0 12px", fontSize: 12, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.3)" }}>
              {Object.entries(SIGNTYPE_CONFIG).map(([key, conf]) => (
                <option key={key} value={key}>{conf.label} — {conf.hint}</option>
              ))}
            </select>

            {showRisk && (
              <div style={{ padding: 10, borderRadius: 10, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", fontSize: 11, color: "#78350F", marginBottom: 12 }}>
                ⚠ This circle has fewer than 50 members. Posting with a verified identity may make you identifiable. Consider "Anonymous" for sensitive content.
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("type")} style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.3)", color: "#1A1A2E", border: "none", cursor: "pointer" }}>
                Back
              </button>
              <button type="button" onClick={submit} disabled={saving || !body.trim()} style={{ flex: 2, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, background: saving || !body.trim() ? "#9CA3AF" : "#F97316", color: "#fff", border: "none", cursor: saving ? "default" : "pointer" }}>
                {saving ? "Posting..." : "Post"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// -------- ROUTER --------
export default function Circles() {
  const { circleSlug } = useParams<{ circleSlug?: string }>();
  if (circleSlug === "create") return <CreateCircle />;
  return circleSlug ? <CircleDetail slug={circleSlug} /> : <CirclesDiscovery />;
}
