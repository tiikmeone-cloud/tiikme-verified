import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import ThemeLogo from "@/components/ThemeLogo";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <nav
        className="sticky top-0 z-50 h-16 flex items-center justify-between px-5 md:px-8 max-w-[1200px] mx-auto w-full"
        style={{
          background: scrolled ? "rgba(255,248,242,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid #E5E7EB" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <Link to="/" className="flex items-center">
          <ThemeLogo className="h-14 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[14px] font-medium transition-colors"
              style={{ color: "#374151" }}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/guides"
            className="text-[14px] font-medium transition-colors"
            style={{ color: "#374151" }}
          >
            Guides
          </Link>
          <Link
            to="/join-as-institution"
            className="text-[14px] font-medium transition-colors"
            style={{ color: "#374151" }}
          >
            For Institutions
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/signin" className="text-[14px] font-semibold h-[44px] px-4 flex items-center rounded-lg transition-colors hover:bg-[#FFF7ED]" style={{ color: "#374151" }}>
            Sign in
          </Link>
          <Link to="/signup">
            <button
              type="button"
              className="h-[44px] px-6 rounded-xl font-bold text-[14px] text-white transition-colors cursor-pointer"
              style={{ backgroundColor: "#FF5A1F" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C94A07")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF5A1F")}
            >
              Create profile
            </button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex md:hidden p-2 cursor-pointer"
          style={{ color: "#374151" }}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute inset-0 bg-white flex flex-col p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            <div className="flex items-center justify-between mb-10">
              <ThemeLogo className="h-14 w-auto" />
              <button type="button" onClick={() => setMenuOpen(false)} className="p-2 cursor-pointer" style={{ color: "#374151" }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how-it-works" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[18px] font-medium py-3 px-2 rounded-lg"
                  style={{ color: "#04061A" }}
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/guides"
                onClick={() => setMenuOpen(false)}
                className="text-[18px] font-medium py-3 px-2 rounded-lg"
                style={{ color: "#04061A" }}
              >
                Guides
              </Link>
              <Link
                to="/join-as-institution"
                onClick={() => setMenuOpen(false)}
                className="text-[18px] font-medium py-3 px-2 rounded-lg"
                style={{ color: "#04061A" }}
              >
                For Institutions
              </Link>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <Link to="/signin" onClick={() => setMenuOpen(false)}>
                <button
                  type="button"
                  className="w-full h-[52px] rounded-xl font-bold text-[16px] border-2 cursor-pointer"
                  style={{ borderColor: "#FF5A1F", color: "#FF5A1F", backgroundColor: "transparent" }}
                >
                  Sign in
                </button>
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                <button
                  type="button"
                  className="w-full h-[52px] rounded-xl font-bold text-[16px] text-white cursor-pointer"
                  style={{ backgroundColor: "#FF5A1F" }}
                >
                  Create profile
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
