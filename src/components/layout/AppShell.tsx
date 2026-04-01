import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Compass, Layers, Target,
  Link2, MessageCircle, Bell, SlidersHorizontal, PencilLine, Zap, Plus, User, LogOut,
} from "lucide-react";
import NewPostModal from "@/components/NewPostModal";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navGroups = [
  {
    label: "MAIN",
    items: [
      { label: "Feed", icon: LayoutGrid, path: "/app/feed" },
      { label: "Explore", icon: Compass, path: "/app/explore" },
    ],
  },
  {
    label: "WORK",
    items: [
      { label: "My Work", icon: Layers, path: "/app/teams" },
      { label: "Opportunities", icon: Target, path: "/app/opportunities", badge: 3 },
    ],
  },
  {
    label: "CONNECT",
    items: [
      { label: "My Strands", icon: Link2, path: "/app/strands" },
      { label: "Pings", icon: MessageCircle, path: "/app/pings", badge: 2 },
      { label: "Alerts", icon: Bell, path: "/app/alerts", badge: 5 },
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
  { label: "Feed", icon: LayoutGrid, path: "/app/feed" },
  { label: "Explore", icon: Compass, path: "/app/explore" },
  { label: "Post", icon: Plus, path: "__post__" },
  { label: "Pings", icon: MessageCircle, path: "/app/pings", badge: 2 },
  { label: "Profile", icon: User, path: "/app/profile" },
];

const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [postModalOpen, setPostModalOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const handleSignOut = () => {
    const savedTheme = localStorage.getItem("tiikme-theme");
    localStorage.clear();
    if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
    toast.success("Signed out");
    navigate("/signin");
  };

  // Get current page title for mobile
  const getPageTitle = () => {
    for (const g of navGroups) {
      for (const item of g.items) {
        if (isActive(item.path)) return item.label;
      }
    }
    if (isActive("/app/profile")) return "Profile";
    return "";
  };

  return (
    <div className="min-h-screen flex">
      {/* ═══ DESKTOP SIDEBAR (≥1024px) ═══ */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40"
        style={{
          width: 248,
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRight: "1px solid var(--glass-border)",
          boxShadow: "2px 0 24px rgba(4,6,26,0.2)",
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 4px 12px var(--brand-glow)" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <Link to="/app/feed" className="text-[19px] font-extrabold" style={{ color: "var(--text-1)" }}>Tiikme</Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="micro-label px-3 py-3">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-2.5 h-[42px] px-3 rounded-xl relative text-[14px]"
                      style={{
                        background: active ? "var(--brand-dim)" : "transparent",
                        border: active ? "1px solid color-mix(in srgb, var(--brand) 25%, transparent)" : "1px solid transparent",
                        color: active ? "var(--brand)" : "var(--text-2)",
                        fontWeight: active ? 700 : 500,
                        transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    >
                      {active && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px]"
                          style={{
                            borderRadius: "0 3px 3px 0",
                            background: "var(--brand)",
                            boxShadow: "2px 0 8px var(--brand-glow)",
                          }}
                        />
                      )}
                      <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className="ml-auto h-[18px] min-w-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                          style={{ background: "var(--brand)", boxShadow: "0 2px 6px var(--brand-glow)" }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* New Post */}
          <div className="px-0 mt-2">
            <button
              onClick={() => setPostModalOpen(true)}
              className="w-full h-[52px] rounded-[14px] flex items-center justify-center gap-2 text-[15px] font-bold text-white active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
                boxShadow: "0 2px 8px var(--brand-glow), inset 0 1px 0 rgba(255,255,255,0.1)",
                transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <PencilLine className="w-4 h-4" /> New Post
            </button>
          </div>
        </nav>

        {/* User card + Logout */}
        <div className="px-2.5 pb-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <Link to="/app/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ transition: "background 0.15s" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>AK</div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>Arjun Kumar</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand-dim)", color: "var(--brand)" }}>Student</span>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-[13px] font-medium cursor-pointer active:scale-[0.97]"
            style={{ color: "var(--text-3)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ═══ TABLET SIDEBAR (768–1023px) ═══ */}
      <aside
        className="hidden md:flex lg:hidden flex-col items-center fixed inset-y-0 left-0 z-40 py-3"
        style={{
          width: 64,
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRight: "1px solid var(--glass-border)",
        }}
      >
        {/* Logo mark */}
        <div className="mb-4">
          <Link to="/app/feed">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 4px 12px var(--brand-glow)" }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
          </Link>
        </div>

        {/* Icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto">
          {navGroups.flatMap(g => g.items).map((item) => {
            const active = isActive(item.path);
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                    style={{
                      background: active ? "var(--brand-dim)" : "transparent",
                      color: active ? "var(--brand)" : "var(--text-2)",
                      transition: "all 0.15s",
                    }}
                  >
                    {active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px]"
                        style={{ borderRadius: "0 3px 3px 0", background: "var(--brand)", boxShadow: "2px 0 8px var(--brand-glow)" }}
                      />
                    )}
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    {item.badge && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[8px] font-bold text-white rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[12px] font-semibold" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px" }}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Post FAB */}
        <button
          onClick={() => setPostModalOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2 active:scale-[0.92]"
          style={{
            background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
            boxShadow: "0 4px 12px var(--brand-glow)",
            transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <PencilLine className="w-4 h-4 text-white" />
        </button>

        {/* User avatar */}
        <Link to="/app/profile">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>AK</div>
        </Link>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 md:ml-16 lg:ml-[248px] pb-20 md:pb-0">
        {/* Mobile top bar (<768px) */}
        <header
          className="md:hidden sticky top-0 z-50 h-14 flex items-center justify-between px-4"
          style={{
            background: "color-mix(in srgb, var(--surface) 92%, transparent)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>Tiikme</span>
          </span>
          {/* Page title centered */}
          <span className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold" style={{ color: "var(--text-1)" }}>
            {getPageTitle()}
          </span>
          <div className="flex items-center gap-2">
            <Link to="/app/alerts" className="relative p-1.5">
              <Bell className="w-5 h-5" style={{ color: "var(--text-2)" }} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ background: "var(--danger)" }} />
            </Link>
            <Link to="/app/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>AK</Link>
          </div>
        </header>

        <div>{children}</div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV (<768px) ═══ */}
      <nav
        className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass-dock"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        <div className="flex items-center justify-around h-14 px-2">
          {mobileNav.map((item) => {
            if (item.path === "__post__") {
              return (
                <button
                  key="post"
                  onClick={() => setPostModalOpen(true)}
                  className="w-12 h-12 rounded-full flex items-center justify-center -mt-6 active:scale-[0.92]"
                  style={{
                    background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
                    boxShadow: "0 4px 16px var(--brand-glow), 0 0 0 4px var(--bg)",
                    transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                >
                  <Plus className="w-[22px] h-[22px] text-white" />
                </button>
              );
            }
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center gap-0.5 py-2">
                <div className="relative">
                  {active && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full" style={{ background: "var(--brand)" }} />
                  )}
                  <item.icon
                    className="w-[22px] h-[22px]"
                    style={{ color: active ? "var(--brand)" : "var(--text-3)" }}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px]" style={{ color: active ? "var(--brand)" : "var(--text-3)", fontWeight: active ? 700 : 600 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <NewPostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
    </div>
  );
};

export default AppShell;
