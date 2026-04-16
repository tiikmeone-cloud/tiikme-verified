import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Compass, Users, Target, User,
  Link2, MessageCircle, Bell, SlidersHorizontal, PencilLine, Plus, LogOut, Home,
  X as XIcon,
} from "lucide-react";
import ThemeLogo from "@/components/ThemeLogo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

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
      { label: "Profile", icon: User, path: "/app/profile" },
      { label: "Workspace", icon: Users, path: "/app/workspace" },
      { label: "Opportunities", icon: Target, path: "/app/opportunities" },
    ],
  },
  {
    label: "CONNECT",
    items: [
      { label: "My Connections", icon: Link2, path: "/app/connections" },
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
  const queryClient = useQueryClient();
  const openPostCreate = () => navigate("/post/create");
  const { profile, initials, displayName, user } = useAuth();
  const [orgData, setOrgData] = useState<{ name: string; logo_url: string | null; type: string; slug: string } | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const isInstitution = profile?.account_type === "institution" && !!profile?.org_id;

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

  const isActive = (path: string) => {
    if (path === "/app/profile") return pathname === profilePath || pathname.startsWith(profilePath + "/") || pathname === "/app/profile";
    return pathname === path || pathname.startsWith(path + "/");
  };

  const fetchUnreadPings = async () => {
    if (!user?.id) return;
    const { data: convos } = await supabase.from("conversations").select("id")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
    if (!convos?.length) { setUnreadPings(0); return; }
    const convIds = convos.map(c => c.id);
    const { data: unreadRows } = await supabase.from("pings")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user.id)
      .or("is_deleted.is.null,is_deleted.eq.false");
    const distinctConvos = new Set((unreadRows || []).map((r: any) => r.conversation_id));
    setUnreadPings(distinctConvos.size);
  };

  useEffect(() => {
    if (!user?.id) return;
    // Count unread from BOTH alerts and notifications tables
    Promise.allSettled([
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    ]).then(([alertsRes, notifsRes]) => {
      const alertCount = alertsRes.status === "fulfilled" ? ((alertsRes.value as any).count || 0) : 0;
      const notifCount = notifsRes.status === "fulfilled" ? ((notifsRes.value as any).count || 0) : 0;
      setUnreadAlerts(alertCount + notifCount);
    });
    fetchUnreadPings();

    // Listen for manual mark-read events from Pings page
    const onPingsRead = () => fetchUnreadPings();
    window.addEventListener("pings-read", onPingsRead);

    let alertsCh: ReturnType<typeof supabase.channel> | null = null;
    let notifsCh: ReturnType<typeof supabase.channel> | null = null;
    let pingsCh: ReturnType<typeof supabase.channel> | null = null;
    try {
      alertsCh = supabase.channel("unread-alerts-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` }, (payload) => {
          setUnreadAlerts(p => p + 1);
          const title = (payload.new as any)?.title;
          if (title) toast.info(title, { duration: 4000 });
        })
        .subscribe();
      notifsCh = supabase.channel("unread-notifs-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
          setUnreadAlerts(p => p + 1);
          const title = (payload.new as any)?.title;
          if (title) toast.info(title, { duration: 4000 });
        })
        .subscribe();
      pingsCh = supabase.channel("unread-pings-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "pings" }, payload => {
          if ((payload.new as any).sender_id !== user.id) fetchUnreadPings();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pings" }, () => {
          fetchUnreadPings();
        })
        .subscribe();
    } catch {}
    return () => {
      window.removeEventListener("pings-read", onPingsRead);
      if (alertsCh) supabase.removeChannel(alertsCh);
      if (notifsCh) supabase.removeChannel(notifsCh);
      if (pingsCh) supabase.removeChannel(pingsCh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isActive("/app/alerts")) setUnreadAlerts(0);
  }, [pathname]);

  const getBadge = (path: string) => {
    if (path === "/app/alerts") return unreadAlerts || undefined;
    if (path === "/app/pings") return unreadPings || undefined;
    return undefined;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Signed out");
    navigate("/signin");
  };

  const resolvePath = (path: string) => path === "/app/profile" ? profilePath : path;

  return (
    <div className="min-h-screen">
      {/* ═══ DESKTOP SIDEBAR (≥768px) ═══ */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40"
        style={{
          width: 220,
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          padding: "16px 12px",
          justifyContent: "space-between",
        }}
      >
        {/* Top: logo + nav */}
        <div>
          {/* Logo */}
          <div style={{ paddingBottom: 20 }}>
            <Link to="/app/feed" style={{ filter: "drop-shadow(0 0 10px rgba(232,115,58,0.15))" }}>
              <ThemeLogo className="h-7 w-auto" />
            </Link>
          </div>

          {/* Nav groups */}
          <nav>
            {navGroups.map((group) => (
              <div key={group.label}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "16px 0 6px 12px",
                }}>{group.label}</p>
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  const badge = getBadge(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={resolvePath(item.path)}
                      className="flex items-center relative"
                      style={{
                        height: 38,
                        padding: "0 12px",
                        borderRadius: 10,
                        gap: 10,
                        marginBottom: 2,
                        background: active ? "rgba(255,255,255,0.28)" : "transparent",
                        color: active ? "#E8733A" : "var(--text-primary)",
                        fontWeight: active ? 600 : 500,
                        fontSize: 13,
                        boxShadow: active ? "-3px 0 10px rgba(232,115,58,0.20)" : "none",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(255,255,255,0.28)" : "transparent"; }}
                    >
                      <item.icon style={{ width: 18, height: 18, flexShrink: 0, color: active ? "#E8733A" : "var(--text-secondary)" }} strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {badge && badge > 0 && (
                        <span
                          className="absolute flex items-center justify-center"
                          style={{
                            right: 12,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            background: "#E8733A",
                            color: "white",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "0 4px",
                          }}
                        >{badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* New Post button */}
          <button
            type="button"
            onClick={openPostCreate}
            className="flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{
              width: "100%",
              height: 40,
              margin: "12px 0",
              background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
              border: "1px solid var(--border-glass)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "white",
              boxShadow: "0 4px 16px rgba(232,115,58,0.30)",
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            <PencilLine style={{ width: 14, height: 14 }} /> New Post
          </button>
        </div>

        {/* Bottom: user section */}
        <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          <Link to={profilePath} className="flex items-center" style={{ gap: 10 }}>
            <AvatarSquare src={identityAvatar} name={identityName || "You"} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{identityName || "Your Name"}</p>
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "0 6px",
                borderRadius: 4,
                background: "rgba(232,115,58,0.12)",
                color: "#E8733A",
                lineHeight: "14px",
                display: "inline-block",
              }}>{roleLabel}</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center cursor-pointer active:scale-[0.97]"
            style={{
              gap: 10,
              marginTop: 8,
              fontSize: 12,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              transition: "color 150ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <LogOut style={{ width: 14, height: 14 }} /> Sign out
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="min-h-screen md:ml-[220px] pb-[72px] md:pb-0">
        {/* Mobile top header */}
        <header
          className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4"
          style={{
            height: 52,
            background: "rgba(255,255,255,0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.30)",
          }}
        >
          <Link to="/app/feed">
            <ThemeLogo className="h-7 w-auto" />
          </Link>
          <Link to="/app/alerts" className="relative w-10 h-10 flex items-center justify-center active:scale-95">
            <Bell style={{ width: 20, height: 20, color: "var(--text-secondary)" }} strokeWidth={1.8} />
            {unreadAlerts > 0 && (
              <span className="absolute" style={{
                top: 6, right: 6, width: 8, height: 8, borderRadius: 4,
                background: "#EF4444", border: "2px solid #F0F2F7",
              }} />
            )}
          </Link>
        </header>

        <div className="page-enter">{children}</div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: "calc(56px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.30)",
        }}
      >
        <div className="flex items-center justify-around w-full" style={{ height: 56 }}>
          {mobileNav.map((item) => {
            if (item.path === "__post__") {
              return (
                <button
                  type="button"
                  key="post"
                  onClick={() => setShowActionSheet(true)}
                  className="shrink-0 flex items-center justify-center active:scale-[0.92]"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: showActionSheet
                      ? "rgba(232,115,58,0.15)"
                      : "linear-gradient(135deg, #E8733A, #FF6B9D)",
                    boxShadow: showActionSheet ? "none" : "0 4px 16px rgba(232,115,58,0.30)",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  }}
                >
                  {showActionSheet
                    ? <XIcon style={{ width: 20, height: 20, color: "#E8733A" }} strokeWidth={2.5} />
                    : <Plus style={{ width: 20, height: 20, color: "white" }} strokeWidth={2.5} />
                  }
                </button>
              );
            }

            const active = isActive(item.path);
            const badge = item.path === "/app/pings" ? unreadPings : undefined;

            if (item.path === "/app/profile") {
              return (
                <Link key={item.path} to={profilePath} className="flex flex-col items-center justify-center" style={{ flex: 1, gap: 2 }}>
                  <AvatarSquare src={identityAvatar} name={identityName || "You"} size={22} />
                  <span style={{ fontSize: 10, fontWeight: 500, color: active ? "#E8733A" : "var(--text-muted)" }}>Profile</span>
                </Link>
              );
            }

            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center" style={{ flex: 1, gap: 2 }}>
                <div className="relative">
                  <item.icon style={{ width: 22, height: 22, color: active ? "#E8733A" : "var(--text-muted)" }} strokeWidth={active ? 2.2 : 1.8} />
                  {badge && badge > 0 && (
                    <span className="absolute flex items-center justify-center" style={{
                      top: -4, right: -6, minWidth: 14, height: 14, borderRadius: 7,
                      background: "#E8733A", color: "white", fontSize: 9, fontWeight: 700, padding: "0 3px",
                    }}>{badge}</span>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, color: active ? "#E8733A" : "var(--text-muted)" }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═══ MOBILE ACTION SHEET ═══ */}
      {showActionSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] md:hidden"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowActionSheet(false)}
          />
          {/* Sheet */}
          <div
            className="fixed left-0 right-0 z-[61] md:hidden"
            style={{
              bottom: "calc(56px + env(safe-area-inset-bottom))",
              padding: "8px 16px 12px",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderTop: "1px solid rgba(255,255,255,0.40)",
              borderRadius: "20px 20px 0 0",
              animation: "actionSheetUp 200ms ease-out",
            }}
          >
            {[
              { label: "New Post", icon: PencilLine, action: () => { setShowActionSheet(false); openPostCreate(); } },
              { label: "Workspace", icon: Users, action: () => { setShowActionSheet(false); navigate("/app/workspace"); } },
              { label: "Opportunities", icon: Target, action: () => { setShowActionSheet(false); navigate("/app/opportunities"); } },
              { label: "Connections", icon: Link2, action: () => { setShowActionSheet(false); navigate("/app/connections"); } },
              { label: "Settings", icon: SlidersHorizontal, action: () => { setShowActionSheet(false); navigate("/app/settings"); } },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center active:scale-[0.98]"
                style={{
                  gap: 14,
                  height: 52,
                  padding: "0 12px",
                  borderRadius: 14,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 100ms",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,115,58,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(232,115,58,0.10)",
                }}>
                  <item.icon style={{ width: 20, height: 20, color: "#E8733A" }} strokeWidth={1.8} />
                </div>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AppShell;
