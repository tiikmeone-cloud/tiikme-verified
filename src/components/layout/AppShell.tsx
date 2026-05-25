import { ReactNode, useEffect, useState, useCallback } from "react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Compass, Users, Target, User,
  Link2, Bell, SlidersHorizontal, PencilLine, LogOut, Home,
  Plus, Search, ClipboardList, Bot, ShieldCheck, Building2,
} from "lucide-react";
import ThemeLogo from "@/components/ThemeLogo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchRoute, prefetchAdjacent } from "@/lib/prefetchRoutes";
import { prefetchOnHover, prefetchAdjacentData } from "@/lib/prefetchData";
import { getProfileSubtitle } from "@/lib/profileUtils";

const BASE_NAV_GROUPS = [
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
      { label: "Circles", icon: Users, path: "/app/circles" },
      { label: "Opportunities", icon: Target, path: "/app/opportunities" },
    ],
  },
  {
    label: "CONNECT",
    items: [
      { label: "My Connections", icon: Link2, path: "/app/connections" },
      { label: "Alerts", icon: Bell, path: "/app/alerts" },
    ],
  },
  {
    label: "MORE",
    items: [
      { label: "Pilot AI", icon: Bot, path: "/app/pilot" },
      { label: "Settings", icon: SlidersHorizontal, path: "/app/settings" },
    ],
  },
];

const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openPostCreate = () => navigate("/post/create");
  const { profile, displayName, user } = useAuth();
  const [orgData, setOrgData] = useState<{ name: string; logo_url: string | null; type: string; slug: string } | null>(null);

  const isInstitution = profile?.account_type === "institution" && !!profile?.org_id;

  // Non-institution users may be org admins (verifier/hiring_manager/admin role)
  const [orgAdminRole, setOrgAdminRole] = useState<string | null>(null);
  useEffect(() => {
    if (isInstitution || !user?.id) { setOrgAdminRole(null); return; }
    supabase.from("org_admins").select("role").eq("user_id", user.id).limit(1).maybeSingle()
      .then(({ data }) => setOrgAdminRole(data?.role || null));
  }, [isInstitution, user?.id]);

  const navGroups = BASE_NAV_GROUPS.map(group => {
    if (group.label !== "WORK") return group;
    const workItems = [...group.items];
    if (isInstitution || orgAdminRole === "owner" || orgAdminRole === "admin") {
      if (isInstitution && orgData?.slug) {
        workItems.splice(0, 0, { label: "Org Page", icon: Building2, path: `/org/${orgData.slug}` });
      }
      workItems.push({ label: "Applicants", icon: ClipboardList, path: "/app/opportunities" });
      workItems.push({ label: "Verification Inbox", icon: ShieldCheck, path: "/app/verification-inbox" });
    } else if (orgAdminRole === "hiring_manager") {
      workItems.push({ label: "Applicants", icon: ClipboardList, path: "/app/opportunities" });
    } else if (orgAdminRole === "verifier") {
      workItems.push({ label: "Verification Inbox", icon: ShieldCheck, path: "/app/verification-inbox" });
    } else {
      workItems.push({ label: "Applications", icon: ClipboardList, path: "/app/applications" });
    }
    return { ...group, items: workItems };
  });

  useEffect(() => {
    if (!isInstitution || !profile?.org_id) { setOrgData(null); return; }
    supabase.from("organizations").select("name, logo_url, type, slug").eq("id", profile.org_id).maybeSingle()
      .then(({ data }) => setOrgData(data || null));
  }, [isInstitution, profile?.org_id]);

  // Institution accounts go to their org page; personal accounts go to /app/profile
  const profilePath = isInstitution && orgData?.slug ? `/org/${orgData.slug}` : "/app/profile";
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const roleLabel = isInstitution && orgData?.type
    ? orgData.type.charAt(0).toUpperCase() + orgData.type.slice(1).replace(/_/g, " ")
    : getProfileSubtitle(profile) || "Member";
  const identityName = isInstitution && orgData?.name ? orgData.name : displayName;
  const identityAvatar = isInstitution && orgData?.logo_url ? orgData.logo_url : (profile?.avatar_url || null);

  const isActive = (path: string) => {
    if (path === "/app/profile" || (isInstitution && path === profilePath))
      return pathname === profilePath || pathname.startsWith(profilePath + "/") || pathname === "/app/profile";
    return pathname === path || pathname.startsWith(path + "/");
  };

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    ]).then(([alertsRes, notifsRes]) => {
      const alertCount = alertsRes.status === "fulfilled" ? ((alertsRes.value as any).count || 0) : 0;
      const notifCount = notifsRes.status === "fulfilled" ? ((notifsRes.value as any).count || 0) : 0;
      setUnreadAlerts(alertCount + notifCount);
    });

    let alertsCh: ReturnType<typeof supabase.channel> | null = null;
    let notifsCh: ReturnType<typeof supabase.channel> | null = null;
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
    } catch {}
    return () => {
      if (alertsCh) supabase.removeChannel(alertsCh);
      if (notifsCh) supabase.removeChannel(notifsCh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isActive("/app/alerts")) setUnreadAlerts(0);
    prefetchAdjacent(pathname);
    prefetchAdjacentData(queryClient, pathname, user?.id);
  }, [pathname, user?.id]);

  const getBadge = (path: string) => {
    if (path === "/app/alerts") return unreadAlerts || undefined;
    return undefined;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Signed out");
    navigate("/signin");
  };

  const resolvePath = (path: string) => path === "/app/profile" ? profilePath : path;

  // Format alert count badge: 1-9 exact, 10-99 exact, 100+ shows "99+"
  const alertCountLabel = unreadAlerts > 99 ? "99+" : String(unreadAlerts);

  // Mobile bottom nav items (left-of-center and right-of-center)
  const mobileLeftItems = [
    { label: "Feed", icon: Home, path: "/app/feed" },
    { label: "Explore", icon: Compass, path: "/app/explore" },
  ];
  const mobileRightItems = [
    { label: "Alerts", icon: Bell, path: "/app/alerts" },
    { label: isInstitution ? "Org" : "Profile", icon: User, path: profilePath, isProfile: true },
  ];

  return (
    <div className="min-h-screen">
      {/* ═══ DESKTOP SIDEBAR (≥768px) ═══ */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40"
        style={{
          width: 220,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(0,0,0,0.06)",
          padding: "16px 12px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ paddingBottom: 20 }}>
            <Link to="/app/feed" style={{ filter: "drop-shadow(0 0 10px rgba(232,115,58,0.15))" }}>
              <ThemeLogo className="h-11 w-auto" />
            </Link>
          </div>

          <nav>
            {navGroups.map((group) => (
              <div key={group.label}>
                <p style={{
                  fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
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
                        height: 38, padding: "0 12px", borderRadius: 10, gap: 10, marginBottom: 2,
                        background: active ? "rgba(232,115,58,0.08)" : "transparent",
                        color: active ? "#E8733A" : "var(--text-primary)",
                        fontWeight: active ? 600 : 500, fontSize: 13,
                        borderLeft: active ? "3px solid #E8733A" : "3px solid transparent",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={e => { prefetchRoute(item.path); prefetchOnHover(queryClient, item.path, user?.id); if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                      onFocus={() => { prefetchRoute(item.path); prefetchOnHover(queryClient, item.path, user?.id); }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(232,115,58,0.08)" : "transparent"; }}
                    >
                      <div className="relative" style={{ display: "flex", alignItems: "center" }}>
                        <item.icon style={{ width: 18, height: 18, flexShrink: 0, color: active ? "#E8733A" : "var(--text-secondary)" }} strokeWidth={1.8} />
                        {badge && badge > 0 && (
                          <span style={{
                            position: "absolute", top: -1, right: -3,
                            width: 8, height: 8, borderRadius: "50%",
                            background: "#E8733A", border: "1.5px solid rgba(255,255,255,0.95)",
                          }} />
                        )}
                      </div>
                      <span>{item.path === "/app/profile" && isInstitution ? "Organisation" : item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={openPostCreate}
            className="flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{
              width: "100%", height: 40, margin: "12px 0",
              background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
              border: "1px solid var(--border-glass)", borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: "white",
              boxShadow: "0 4px 16px rgba(232,115,58,0.30)",
              cursor: "pointer", transition: "all 200ms ease",
            }}
          >
            <PencilLine style={{ width: 14, height: 14 }} /> New Post
          </button>
        </div>

        <div style={{ paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <Link to={profilePath} className="flex items-center" style={{ gap: 10 }}>
            <AvatarSquare src={identityAvatar} name={identityName || "You"} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{identityName || "Your Name"}</p>
              {roleLabel && !['professional','working','student','founder','doctor','healthcare','faculty','researcher','educator','creator','gig_worker','freelancer','investor','government','member'].includes(roleLabel.toLowerCase()) && (
                <span className="truncate block" style={{
                  fontSize: 11, fontWeight: 500, padding: "0 6px", borderRadius: 4,
                  background: "rgba(232,115,58,0.12)", color: "#E8733A",
                  lineHeight: "14px", display: "inline-block", maxWidth: "100%",
                }}>{roleLabel}</span>
              )}
            </div>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center cursor-pointer active:scale-[0.97]"
            style={{
              gap: 10, marginTop: 8, fontSize: 12, color: "var(--text-muted)",
              background: "none", border: "none", transition: "color 150ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <LogOut style={{ width: 14, height: 14 }} /> Sign out
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className={`min-h-screen md:ml-[220px] pb-[88px] md:pb-0`}>
        {/* Mobile top header — Logo + Search + Bell */}
        <header
          className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4"
          style={{
            height: 52,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Link to="/app/feed" aria-label="Tiikme home">
            <ThemeLogo className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            {/* Search → Explore */}
            <Link
              to="/app/explore"
              aria-label="Search and explore"
              className="relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95"
            >
              <Search style={{ width: 22, height: 22, color: "#374151" }} strokeWidth={1.8} />
            </Link>
            {/* Alerts bell with number count */}
            <Link
              to="/app/alerts"
              aria-label="Alerts"
              className="relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95"
            >
              <Bell style={{ width: 22, height: 22, color: "#374151" }} strokeWidth={1.8} />
              {unreadAlerts > 0 && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    top: 4, right: 2,
                    minWidth: 16, height: 16, padding: "0 4px",
                    borderRadius: 8,
                    background: "#EF4444", color: "white",
                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                    border: "2px solid rgba(255,255,255,0.95)",
                  }}
                >
                  {alertCountLabel}
                </span>
              )}
            </Link>
          </div>
        </header>

        <div key={pathname} className="page-enter">{children}</div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV — 5 items (Feed · Explore · Create · Alerts · Profile) ═══ */}
      <nav
        className="md:hidden fixed left-0 right-0 z-50"
        style={{
          bottom: 0,
          height: "calc(64px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
        }}
        aria-label="Primary"
      >
        <div className="relative h-16 grid grid-cols-5">
          {/* Tab 1 — Feed */}
          {mobileLeftItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 active:scale-95"
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onTouchStart={() => prefetchOnHover(queryClient, item.path, user?.id)}
                style={{ transition: "transform 120ms ease" }}
              >
                {/* Active pill indicator */}
                <span
                  style={{
                    width: 24, height: 4, borderRadius: 999,
                    background: active ? "#FF5A1F" : "transparent",
                    marginBottom: 2,
                  }}
                />
                <item.icon
                  style={{ width: 24, height: 24, color: active ? "#FF5A1F" : "#9CA3AF" }}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? "#FF5A1F" : "#9CA3AF",
                  marginTop: 1, maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Tab 3 — CREATE (raised center button) */}
          <button
            type="button"
            onClick={openPostCreate}
            aria-label="Create new post"
            className="flex flex-col items-center justify-end active:scale-95"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              transition: "transform 120ms ease",
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{
                position: "absolute",
                top: -16,
                left: "50%",
                transform: "translateX(-50%)",
                width: 52, height: 52, borderRadius: "50%",
                background: "#FF5A1F",
                boxShadow: "0 8px 20px rgba(249,115,22,0.35), 0 2px 6px rgba(0,0,0,0.10)",
                border: "3px solid #FFFFFF",
              }}
            >
              <Plus style={{ width: 26, height: 26, color: "white" }} strokeWidth={2.6} />
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#9CA3AF",
              marginBottom: 8,
            }}>
              Create
            </span>
          </button>

          {/* Tab 4 — Alerts (with badge), Tab 5 — Profile */}
          {mobileRightItems.map((item) => {
            const active = isActive(item.path);
            const isProfile = (item as any).isProfile;
            const badge = getBadge(item.path) || 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 active:scale-95"
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onTouchStart={() => prefetchOnHover(queryClient, item.path, user?.id)}
                style={{ transition: "transform 120ms ease" }}
              >
                <span
                  style={{
                    width: 24, height: 4, borderRadius: 999,
                    background: active ? "#FF5A1F" : "transparent",
                    marginBottom: 2,
                  }}
                />
                {isProfile ? (
                  identityAvatar ? (
                    <span
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        overflow: "hidden",
                        border: active ? "2px solid #FF5A1F" : "2px solid transparent",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <img
                        src={identityAvatar}
                        alt={identityName || "Profile"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </span>
                  ) : (
                    <User
                      style={{ width: 24, height: 24, color: active ? "#FF5A1F" : "#9CA3AF" }}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                  )
                ) : (
                  <span className="relative">
                    <item.icon
                      style={{ width: 24, height: 24, color: active ? "#FF5A1F" : "#9CA3AF" }}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {badge > 0 && (
                      <span style={{
                        position: "absolute", top: -4, right: -6,
                        minWidth: 16, height: 16, borderRadius: 999,
                        background: "#FF5A1F", color: "#fff",
                        fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 3px", lineHeight: 1,
                        border: "1.5px solid #fff",
                      }}>
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                )}
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? "#FF5A1F" : "#9CA3AF",
                  marginTop: 1, maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
