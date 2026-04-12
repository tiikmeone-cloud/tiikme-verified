import { ReactNode, useEffect, useState } from "react";
import { storageImageUrl } from "@/lib/imageTransform";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Compass, Users, Target, User,
  Link2, MessageCircle, Bell, SlidersHorizontal, PencilLine, Plus, LogOut, Home,
} from "lucide-react";
import ThemeLogo from "@/components/ThemeLogo";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navGroups = [
  {
    label: "MAIN",
    items: [
      { label: "Home", icon: LayoutGrid, path: "/app/feed" },
      { label: "Explore", icon: Compass, path: "/app/explore" },
    ],
  },
  {
    label: "WORK",
    items: [
      { label: "Workspace", icon: Users, path: "/app/workspace" },
      { label: "Opportunities", icon: Target, path: "/app/opportunities" },
    ],
  },
  {
    label: "CONNECT",
    items: [
      { label: "Connections", icon: Link2, path: "/app/strands" },
      { label: "Pings", icon: MessageCircle, path: "/app/pings" },
      { label: "Alerts", icon: Bell, path: "/app/alerts" },
    ],
  },
  {
    label: "MORE",
    items: [
      { label: "Settings", icon: SlidersHorizontal, path: "/app/settings" },
    ],
  },
];

const mobileNav = [
  { label: "Home", icon: Home, path: "/app/feed" },
  { label: "Explore", icon: Compass, path: "/app/explore" },
  { label: "Post", icon: Plus, path: "__post__" },
  { label: "Pings", icon: MessageCircle, path: "/app/pings" },
  { label: "Profile", icon: User, path: "/app/profile" },
];

const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const openPostCreate = () => navigate("/post/create");
  const { profile, initials, displayName, user } = useAuth();
  const [orgData, setOrgData] = useState<{ name: string; logo_url: string | null; type: string; slug: string } | null>(null);

  const isInstitution = profile?.account_type === "institution" && !!profile?.org_id;

  // Fetch org data for institution accounts
  useEffect(() => {
    if (!isInstitution || !profile?.org_id) { setOrgData(null); return; }
    supabase.from("organizations").select("name, logo_url, type, slug").eq("id", profile.org_id).maybeSingle()
      .then(({ data }) => setOrgData(data || null));
  }, [isInstitution, profile?.org_id]);

  const profilePath = isInstitution && orgData?.slug ? `/org/${orgData.slug}` : "/app/profile";
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadPings, setUnreadPings] = useState(0);
  const roleLabel = isInstitution && orgData?.type
    ? orgData.type.charAt(0).toUpperCase() + orgData.type.slice(1).replace(/_/g, " ")
    : profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace(/_/g, " ") : "Member";
  const identityName = isInstitution && orgData?.name ? orgData.name : displayName;
  const identityAvatar = isInstitution && orgData?.logo_url ? orgData.logo_url : (profile?.avatar_url || null);
  const identityInitials = isInstitution && orgData?.name
    ? orgData.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : initials;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  useEffect(() => {
    if (!user?.id) return;

    // Fetch unread alerts — silent on failure
    supabase.from("alerts").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("is_read", false)
      .then(({ count, error }) => {
        if (error) { console.warn("[AppShell] alerts count failed:", error.message); return; }
        setUnreadAlerts(count || 0);
      });

    // Fetch unread pings — silent on failure
    supabase.from("conversations").select("id")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .then(({ data: convos, error }) => {
        if (error) { console.warn("[AppShell] conversations fetch failed:", error.message); return; }
        if (!convos?.length) { setUnreadPings(0); return; }
        const convIds = convos.map(c => c.id);
        supabase.from("pings").select("*", { count: "exact", head: true })
          .in("conversation_id", convIds)
          .eq("is_read", false)
          .neq("sender_id", user.id)
          .then(({ count: c, error: e2 }) => {
            if (e2) { console.warn("[AppShell] pings count failed:", e2.message); return; }
            setUnreadPings(c || 0);
          });
      });

    let alertsCh: ReturnType<typeof supabase.channel> | null = null;
    let pingsCh: ReturnType<typeof supabase.channel> | null = null;
    try {
      alertsCh = supabase.channel("unread-alerts-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` }, () => {
          setUnreadAlerts(p => p + 1);
        }).subscribe();

      pingsCh = supabase.channel("unread-pings-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "pings" }, payload => {
          if ((payload.new as any).sender_id !== user.id) setUnreadPings(p => p + 1);
        }).subscribe();
    } catch (err) {
      console.warn("[AppShell] realtime subscribe failed:", err);
    }

    return () => {
      if (alertsCh) supabase.removeChannel(alertsCh);
      if (pingsCh) supabase.removeChannel(pingsCh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isActive("/app/pings")) setUnreadPings(0);
    if (isActive("/app/alerts")) setUnreadAlerts(0);
  }, [pathname]);

  const getBadge = (path: string) => {
    if (path === "/app/alerts") return unreadAlerts || undefined;
    if (path === "/app/pings") return unreadPings || undefined;
    return undefined;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    const savedTheme = localStorage.getItem("tiikme-theme");
    localStorage.clear();
    if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
    toast.success("Signed out");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen flex">
      {/* ═══ DESKTOP SIDEBAR (≥1024px) ═══ */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40"
        style={{ width: 248, background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderRight: "1px solid var(--glass-border)", boxShadow: "2px 0 24px rgba(4,6,26,0.2)" }}>
        <div className="h-16 flex items-center px-5"><Link to="/app/feed"><ThemeLogo className="h-10 w-auto" /></Link></div>
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="micro-label px-3 py-3">{group.label}</p>
              <div className="space-y-0.5">
                {group.label === "WORK" && (() => {
                  const active = isActive(profilePath);
                  return (
                    <Link key="profile" to={profilePath}
                      className="flex items-center gap-2.5 h-[42px] px-3 rounded-xl relative text-[14px]"
                      style={{ background: active ? "var(--brand-dim)" : "transparent", border: active ? "1px solid color-mix(in srgb, var(--brand) 25%, transparent)" : "1px solid transparent", color: active ? "var(--brand)" : "var(--text-2)", fontWeight: active ? 700 : 500, transition: "all 0.15s" }}>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px]" style={{ borderRadius: "0 3px 3px 0", background: "var(--brand)", boxShadow: "2px 0 8px var(--brand-glow)" }} />}
                      <User className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                      <span>Profile</span>
                    </Link>
                  );
                })()}
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  const badge = getBadge(item.path);
                  return (
                    <Link key={item.path} to={item.path === "/app/profile" ? profilePath : item.path}
                      className="flex items-center gap-2.5 h-[42px] px-3 rounded-xl relative text-[14px]"
                      style={{ background: active ? "var(--brand-dim)" : "transparent", border: active ? "1px solid color-mix(in srgb, var(--brand) 25%, transparent)" : "1px solid transparent", color: active ? "var(--brand)" : "var(--text-2)", fontWeight: active ? 700 : 500, transition: "all 0.15s" }}>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px]" style={{ borderRadius: "0 3px 3px 0", background: "var(--brand)", boxShadow: "2px 0 8px var(--brand-glow)" }} />}
                      <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {badge && badge > 0 && (
                        <span className="ml-auto h-[18px] min-w-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ background: "var(--brand)", boxShadow: "0 2px 6px var(--brand-glow)" }}>{badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="px-0 mt-2">
            <button type="button" onClick={openPostCreate}
              className="w-full h-[52px] rounded-[14px] flex items-center justify-center gap-2 text-[15px] font-bold text-white active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 2px 8px var(--brand-glow), inset 0 1px 0 rgba(255,255,255,0.1)", transition: "all 0.15s" }}>
              <PencilLine className="w-4 h-4" /> New Post
            </button>
          </div>
        </nav>
        <div className="px-2.5 pb-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <Link to={profilePath} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
              {identityAvatar ? <img src={storageImageUrl(identityAvatar, "avatar")} alt="" className="w-full h-full object-cover" /> : identityInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{identityName || "Your Name"}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand-dim)", color: "var(--brand)" }}>{roleLabel}</span>
            </div>
          </Link>
          <button type="button" onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-[13px] font-medium cursor-pointer active:scale-[0.97]"
            style={{ color: "var(--text-3)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ═══ TABLET SIDEBAR (md–lg) ═══ */}
      <aside className="hidden md:flex lg:hidden flex-col items-center fixed inset-y-0 left-0 z-40 py-3"
        style={{ width: 64, background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="mb-4"><Link to="/app/feed"><ThemeLogo className="h-9 w-auto" /></Link></div>
        <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto">
          {navGroups.flatMap(g => g.items).map((item) => {
            const active = isActive(item.path);
            const badge = getBadge(item.path);
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to={item.path === "/app/profile" ? profilePath : item.path} className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                    style={{ background: active ? "var(--brand-dim)" : "transparent", color: active ? "var(--brand)" : "var(--text-2)", transition: "all 0.15s" }}>
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px]" style={{ borderRadius: "0 3px 3px 0", background: "var(--brand)", boxShadow: "2px 0 8px var(--brand-glow)" }} />}
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    {badge && badge > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[8px] font-bold text-white rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>{badge}</span>}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[12px] font-semibold" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px" }}>{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <button type="button" onClick={openPostCreate} className="w-10 h-10 rounded-full flex items-center justify-center mb-2 active:scale-[0.92]"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 4px 12px var(--brand-glow)" }}>
          <PencilLine className="w-4 h-4 text-white" />
        </button>
        <Link to={profilePath}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
            {identityAvatar ? <img src={storageImageUrl(identityAvatar, "avatar")} alt="" className="w-full h-full object-cover" /> : identityInitials}
          </div>
        </Link>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 md:ml-16 lg:ml-[248px] pb-20 md:pb-0">
        {/* Mobile top header — 52px, sticky */}
        <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4"
          style={{ height: 52, background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderBottom: "1px solid var(--glass-border)" }}>
          <Link to="/app/feed" className="flex items-center">
            <ThemeLogo className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/app/alerts" className="relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95">
              <Bell className="w-5 h-5" style={{ color: "var(--text-2)" }} strokeWidth={1.8} />
              {unreadAlerts > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ background: "var(--danger)", border: "2px solid var(--bg)" }} />}
            </Link>
          </div>
        </header>
        <div className="min-h-0">{children}</div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV — fixed, 64px ═══ */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: "calc(64px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(48px) saturate(200%)",
          WebkitBackdropFilter: "blur(48px) saturate(200%)",
          borderTop: "1px solid var(--glass-border)",
        }}>
        <div className="flex items-center justify-around w-full h-16">
          {mobileNav.map((item) => {
            if (item.path === "__post__") {
              return (
                <button type="button" key="post" onClick={openPostCreate}
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center -mt-5 active:scale-[0.92] shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
                    boxShadow: "0 4px 16px var(--brand-glow), 0 0 0 4px var(--bg)",
                  }}>
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </button>
              );
            }
            const active = isActive(item.path);
            const badge = item.path === "/app/pings" ? unreadPings : undefined;

            // Profile tab shows user avatar
            if (item.path === "/app/profile") {
              return (
                <Link key={item.path} to={profilePath} className="flex flex-col items-center justify-center gap-0.5 w-14 h-14">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0"
                    style={{
                      backgroundColor: "var(--brand)",
                      border: active ? "2px solid var(--brand)" : "2px solid transparent",
                    }}>
                    {identityAvatar ? <img src={storageImageUrl(identityAvatar, "avatar")} alt="" className="w-full h-full object-cover" /> : identityInitials}
                  </div>
                </Link>
              );
            }

            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-0.5 w-14 h-14">
                <div className="relative">
                  <item.icon className="w-6 h-6" style={{ color: active ? "var(--brand)" : "var(--text-3)" }} strokeWidth={active ? 2.2 : 1.8} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                      style={{ background: "var(--danger)" }}>{badge > 9 ? "9+" : badge}</span>
                  )}
                </div>
                <span className="text-[10px]" style={{ color: active ? "var(--brand)" : "var(--text-3)", fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
