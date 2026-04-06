import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import logoDark from "@/assets/tiikme-logo-dark.png";

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
        className="sticky top-0 z-50 h-16 flex items-center justify-between px-6"
        style={{
          background: scrolled ? "rgba(4,6,26,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(238,240,255,0.06)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <Link to="/" className="flex items-center">
          <img src={logoDark} alt="Tiikme" className="h-10 w-auto" />
        </Link>

        {/* Desktop center links */}
        <div className="hidden md:flex items-center gap-6">
          {[{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }].map(l => (
            <a key={l.label} href={l.href} className="text-[14px] font-medium text-[rgba(238,240,255,0.6)] hover:text-[#EEF0FF] transition-colors">{l.label}</a>
          ))}
          <Link to="/join-as-institution" className="text-[14px] font-medium text-[rgba(238,240,255,0.6)] hover:text-[#EEF0FF] transition-colors">For Institutions</Link>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/signin"><Button variant="ghost" className="text-[rgba(238,240,255,0.6)] hover:text-[#EEF0FF]">Sign in</Button></Link>
          <Link to="/signup"><Button className="gap-1.5 font-['Silkscreen']"><span>Get Tiiked</span> <span className="text-white/80">✓</span></Button></Link>
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/signin" className="text-[13px] font-semibold" style={{ color: "rgba(238,240,255,0.6)" }}>Sign in</Link>
          <Link to="/signup"><Button size="sm" className="gap-1 font-['Silkscreen']">Get Tiiked ✓</Button></Link>
          <button onClick={() => setMenuOpen(true)} className="p-1.5 ml-1 cursor-pointer" style={{ color: "rgba(238,240,255,0.7)" }}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile slide-out menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div
            className="absolute right-0 top-0 h-full w-[280px] p-6 flex flex-col"
            style={{
              background: "var(--surface, #080B2A)",
              borderLeft: "1px solid var(--border, rgba(238,240,255,0.08))",
              animation: "slideInRight 0.25s ease-out",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setMenuOpen(false)} className="self-end p-2 mb-6 cursor-pointer" style={{ color: "rgba(238,240,255,0.6)" }}>
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col gap-1">
              {[{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }].map(l => (
                <a key={l.label} href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[15px] font-medium py-3 px-3 rounded-xl transition-colors"
                  style={{ color: "rgba(238,240,255,0.7)" }}
                >{l.label}</a>
              ))}
              <Link to="/join-as-institution" onClick={() => setMenuOpen(false)}
                className="text-[15px] font-medium py-3 px-3 rounded-xl transition-colors"
                style={{ color: "rgba(238,240,255,0.7)" }}>For Institutions</Link>
            </div>

            <div className="h-px my-4" style={{ background: "rgba(238,240,255,0.08)" }} />

            <div className="flex flex-col gap-3">
              <Link to="/signin" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-[rgba(238,240,255,0.6)] hover:text-[#EEF0FF]">Sign in</Button>
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                <Button className="w-full gap-1.5 font-['Silkscreen']">Get Tiiked ✓</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Navbar;
