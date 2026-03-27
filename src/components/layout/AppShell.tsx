import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid, Compass, User, Layers, AlertCircle,
  Link2, Bell, Settings, PenSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { label: "My Strands", icon: Link2, path: "/app/strands" },
  { label: "Alerts", icon: Bell, path: "/app/alerts", badge: 5 },
  { label: "Settings", icon: Settings, path: "/app/settings" },
];

const mobileNav = [
  { label: "Feed", icon: LayoutGrid, path: "/app/feed" },
  { label: "Nexus", icon: Compass, path: "/app/nexus" },
  { label: "Build", icon: Layers, path: "/app/build-log" },
  { label: "Alerts", icon: Bell, path: "/app/alerts" },
  { label: "Profile", icon: User, path: "/app/profile" },
];

interface NavItemProps {
  item: { label: string; icon: React.ElementType; path: string; badge?: number };
  active: boolean;
  collapsed?: boolean;
}

const NavItem = ({ item, active, collapsed }: NavItemProps) => (
  <Link to={item.path} className="relative block">
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <item.icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      {item.badge && !collapsed && (
        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
          {item.badge}
        </span>
      )}
    </div>
  </Link>
);

const NavSection = ({ label, items, pathname, collapsed }: { label: string; items: typeof mainNav; pathname: string; collapsed?: boolean }) => (
  <div className="mb-2">
    {!collapsed && (
      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
    )}
    <div className="space-y-0.5">
      {items.map((item) => (
        <NavItem key={item.path} item={item} active={pathname === item.path} collapsed={collapsed} />
      ))}
    </div>
  </div>
);

const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[232px] border-r border-border bg-background/80 backdrop-blur-xl fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link to="/app/feed" className="font-display text-xl font-bold tracking-tight">
            Tiikme
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavSection label="" items={mainNav} pathname={pathname} />
          <NavSection label="Build" items={buildNav} pathname={pathname} />
          <NavSection label="Connect" items={connectNav} pathname={pathname} />
        </nav>

        {/* New Post */}
        <div className="px-3 pb-3">
          <Link to="/app/feed">
            <Button variant="default" className="w-full">
              <PenSquare className="w-4 h-4" />
              New Post
            </Button>
          </Link>
        </div>

        {/* User card */}
        <div className="px-3 pb-4 border-t border-border pt-3">
          <Link to="/app/profile" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors">
            <div className="w-9 h-9 rounded-full bg-electric/30 flex items-center justify-center text-xs font-bold text-electric">
              AK
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Arjun Kumar</p>
              <p className="text-xs text-muted-foreground">Score: 72</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-[232px] pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-xl">
          <span className="font-display text-lg font-bold">Tiikme</span>
          <div className="flex items-center gap-2">
            <Link to="/app/alerts" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
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

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNav.map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center gap-1 py-1">
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
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
