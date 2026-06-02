import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Plus, Home, Images, Target, MessageSquare, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RAIL_ITEMS = [
  { icon: User,          path: "/app/profile",       label: "Profile" },
  { icon: Plus,          path: "/post/create",        label: "Create" },
  { icon: Home,          path: "/app/feed",           label: "Home" },
  { icon: Images,        path: "/app/flicks",         label: "Flicks" },
  { icon: Target,        path: "/app/opportunities",  label: "Opportunities" },
  { icon: MessageSquare, path: "/app/pings",          label: "Messages" },
];

export default function ProfileRail() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === "/app/profile"
      ? pathname === "/app/profile" || pathname.startsWith("/app/profile/")
      : pathname.startsWith(path);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Signed out");
    navigate("/signin");
  };

  return (
    <nav
      aria-label="Profile rail"
      style={{
        width: 64,
        background: "#16152B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 0 14px",
        position: "sticky",
        top: 0,
        height: "100vh",
        gap: 2,
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        zIndex: 10,
      }}
    >
      {/* Logo dot */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, marginBottom: 12,
        background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 16px rgba(255,90,31,0.40)",
      }}>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>T</span>
      </div>

      {RAIL_ITEMS.map(({ icon: Icon, path, label }) => {
        const active = isActive(path);
        return (
          <Link
            key={path}
            to={path}
            title={label}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: active ? "#FF5A1F" : "rgba(255,255,255,0.38)",
              background: active ? "rgba(255,90,31,0.14)" : "transparent",
              textDecoration: "none",
              transition: "background 120ms, color 120ms",
              flexShrink: 0,
            }}
          >
            <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={handleSignOut}
        title="Sign out"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.28)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "color 120ms",
        }}
      >
        <LogOut size={16} strokeWidth={1.7} />
      </button>
    </nav>
  );
}
