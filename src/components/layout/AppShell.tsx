import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid, Compass, Layers, Target,
  Link2, MessageCircle, Bell, Settings, PenSquare, Zap, User, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NewPostModal from "@/components/NewPostModal";

const ROLE_COLOR = "#4F46E5"; // student default

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
      { label: "My Work", icon: Layers, path: "/app/work" },
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
      { label: "Settings", icon: Settings, path: "/app/settings" },
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
  const [postModalOpen, setPostModalOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link to="/app/feed" className="flex items-center gap-1.5 text-xl font-extrabold text-t1">
            <Zap className="w-5 h-5 text-brand" />Tiikme
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="micro-label px-3 py-2">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all duration-200 relative text-sm ${
                        active
                          ? "bg-brand-dim text-brand font-bold"
                          : "text-t2 hover:text-t1 hover:bg-brand-dim"
                      }`}
                    >
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand" />}
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] bg-brand-dim text-brand px-2 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* New Post */}
        <div className="px-3 pb-3">
          <Button className="w-full gap-2" onClick={() => setPostModalOpen(true)}>
            <PenSquare className="w-4 h-4" />New Post
          </Button>
        </div>

        {/* User card */}
        <div className="px-3 pb-4 border-t border-border pt-3">
          <Link to="/app/profile" className="flex items-center gap-3 px-2 py-2 rounded-[10px] hover:bg-brand-dim transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ROLE_COLOR }}>AK</div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-t1 truncate">Arjun Kumar</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>Student</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 h-[52px] flex items-center justify-between px-4 border-b border-border bg-surface">
          <span className="flex items-center gap-1.5 text-lg font-extrabold text-t1">
            <Zap className="w-4 h-4 text-brand" />Tiikme
          </span>
          <div className="flex items-center gap-2">
            <Link to="/app/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: ROLE_COLOR }}>AK</Link>
          </div>
        </header>

        <div>{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-14 px-2">
          {mobileNav.map((item) => {
            if (item.path === "__post__") {
              return (
                <button key="post" onClick={() => setPostModalOpen(true)}
                  className="w-12 h-12 rounded-full bg-brand flex items-center justify-center -mt-6 shadow-lg shadow-brand/30">
                  <Plus className="w-6 h-6 text-white" />
                </button>
              );
            }
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center gap-0.5 py-1">
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${active ? "text-brand" : "text-t3"}`} />
                  {item.badge && <span className="absolute -top-1 -right-2 w-4 h-4 bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>}
                </div>
                <span className={`text-[10px] ${active ? "text-brand font-bold" : "text-t3"}`}>{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-brand" />}
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
