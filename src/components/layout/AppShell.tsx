import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Compass, Layers, Target,
  Link2, MessageCircle, Bell, SlidersHorizontal, PencilLine, Zap, Plus, User, LogOut,
} from "lucide-react";
import NewPostModal from "@/components/NewPostModal";
import { toast } from "sonner";

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
      { label: "Workspace", icon: Layers, path: "/app/teams" },
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

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar — no right border, uses glass */}
      <aside className="hidden md:flex flex-col w-[248px] fixed inset-y-0 left-0 z-40 glass-card" style={{ borderRadius: 0, borderRight: "1px solid var(--glass-border)" }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 4px 12px var(--brand-glow)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <Link to="/app/feed" className="text-[19px] font-extrabold" style={{ color: "var(--text-1)" }}>Tiikme</Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="micro-label px-3 py-3">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path}
                      className="flex items-center gap-2.5 h-[42px] px-3 rounded-xl transition-all duration-150 relative text-[14px]"
                      style={{
                        background: active ? "var(--brand-dim)" : "transparent",
                        color: active ? "var(--brand)" : "var(--text-2)",
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: "var(--brand)", boxShadow: "0 0 8px var(--brand-glow)" }} />}
                      <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto h-[18px] min-w-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ background: "var(--brand)", boxShadow: "0 2px 6px var(--brand-glow)" }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* New Post — brand rounded-full */}
          <div className="px-0 mt-2">
            <button onClick={() => setPostModalOpen(true)}
              className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold text-white transition-all active:scale-95 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 4px 16px var(--brand-glow)" }}>
              <PencilLine className="w-4 h-4" /> New Post
            </button>
          </div>
        </nav>

        {/* User card + Logout */}
        <div className="px-2.5 pb-3 pt-2">
          <Link to="/app/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors hover:bg-brand-dim">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#4F46E5" }}>AK</div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>Arjun Kumar</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand-dim)", color: "var(--brand)" }}>Student</span>
            </div>
          </Link>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-95"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-[248px] pb-20 md:pb-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4" style={{ background: "var(--glass-bg)", borderBottom: "1px solid var(--glass-border)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <span className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>Tiikme</span>
          </span>
          <Link to="/app/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "#4F46E5" }}>AK</Link>
        </header>

        <div>{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40" style={{ background: "var(--glass-bg)", borderTop: "1px solid var(--glass-border)", paddingBottom: "env(safe-area-inset-bottom)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-around h-14 px-2">
          {mobileNav.map((item) => {
            if (item.path === "__post__") {
              return (
                <button key="post" onClick={() => setPostModalOpen(true)}
                  className="w-12 h-12 rounded-full flex items-center justify-center -mt-4 active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", boxShadow: "0 4px 16px var(--brand-glow), 0 0 0 4px var(--bg)" }}>
                  <Plus className="w-[22px] h-[22px] text-white" />
                </button>
              );
            }
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center gap-0.5 py-1">
                <div className="relative">
                  {active && <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full" style={{ background: "var(--brand)" }} />}
                  <item.icon className="w-[22px] h-[22px]" style={{ color: active ? "var(--brand)" : "var(--text-3)" }} />
                  {item.badge && <span className="absolute -top-1 -right-2 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>{item.badge}</span>}
                </div>
                <span className="text-[9px]" style={{ color: active ? "var(--brand)" : "var(--text-3)", fontWeight: active ? 700 : 400 }}>{item.label}</span>
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
