import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid, Compass, User, Layers, AlertCircle,
  Share2, Bell, Settings, PenSquare, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NewPostModal from "@/components/NewPostModal";

const mainNav = [
  { label: "Feed", icon: LayoutGrid, path: "/app/feed" },
  { label: "Nexus", icon: Compass, path: "/app/nexus" },
  { label: "My Profile", icon: User, path: "/app/profile" },
];

const buildNav = [
  { label: "Build Log", icon: Layers, path: "/app/build-log" },
  { label: "Challenges", icon: AlertCircle, path: "/app/challenges", badge: 3 },
];

const connectNav = [
  { label: "My Strands", icon: Share2, path: "/app/strands" },
  { label: "Alerts", icon: Bell, path: "/app/alerts", badge: 5 },
  { label: "Settings", icon: Settings, path: "/app/settings" },
];

const mobileNav: { label: string; icon: React.ElementType; path: string; badge?: number }[] = [
  { label: "Feed", icon: LayoutGrid, path: "/app/feed" },
  { label: "Nexus", icon: Compass, path: "/app/nexus" },
  { label: "Build", icon: Layers, path: "/app/build-log" },
  { label: "Alerts", icon: Bell, path: "/app/alerts", badge: 5 },
  { label: "Profile", icon: User, path: "/app/profile" },
];

interface NavItemProps {
  item: { label: string; icon: React.ElementType; path: string; badge?: number };
  active: boolean;
}

const NavItem = ({ item, active }: NavItemProps) => (
  <Link to={item.path} className="relative block">
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
        active
          ? "bg-[rgba(124,111,255,0.15)] text-foreground font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.06)]"
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-electric"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <item.icon className="w-5 h-5 shrink-0" />
      <span className="text-sm">{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] bg-[rgba(124,111,255,0.2)] text-electric px-2 py-0.5 rounded-full font-bold">
          {item.badge}
        </span>
      )}
    </div>
  </Link>
);

const NavSection = ({ label, items, pathname }: { label: string; items: typeof mainNav; pathname: string }) => (
  <div className="mb-2">
    {label && (
      <p className="px-3 py-2 micro-label text-muted-foreground/50">
        {label}
      </p>
    )}
    <div className="space-y-0.5">
      {items.map((item) => (
        <NavItem key={item.path} item={item} active={pathname === item.path} />
      ))}
    </div>
  </div>
);

const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [postModalOpen, setPostModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col w-[232px] border-r border-border bg-[rgba(5,5,16,0.9)] backdrop-blur-xl fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link to="/app/feed" className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight">
            <Zap className="w-5 h-5 text-electric" />
            Tiikme
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavSection label="MAIN" items={mainNav} pathname={pathname} />
          <NavSection label="BUILD" items={buildNav} pathname={pathname} />
          <NavSection label="CONNECT" items={connectNav} pathname={pathname} />
        </nav>

        <div className="px-3 pb-3">
          <Button variant="default" className="w-full gap-2" onClick={() => setPostModalOpen(true)}>
            <PenSquare className="w-4 h-4" />
            New Post
          </Button>
        </div>

        <div className="px-3 pb-4 border-t border-border pt-3">
          <Link to="/app/profile" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#7C6FFF] flex items-center justify-center text-xs font-bold text-white">
              AK
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">Arjun Kumar</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Score: 72</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(124,111,255,0.2)] text-electric">Student</span>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[232px] pb-20 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-[rgba(5,5,16,0.9)] backdrop-blur-xl">
          <span className="flex items-center gap-1.5 text-lg font-extrabold">
            <Zap className="w-4 h-4 text-electric" />
            Tiikme
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPostModalOpen(true)} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
              <PenSquare className="w-5 h-5 text-electric" />
            </button>
            <Link to="/app/alerts" className="relative p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-electric rounded-full" />
            </Link>
          </div>
        </header>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[rgba(5,5,16,0.95)] backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNav.map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center gap-1 py-1">
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${active ? "text-electric" : "text-muted-foreground"}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-electric text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-electric" : "text-muted-foreground"}`}>
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
