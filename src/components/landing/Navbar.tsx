import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 h-16 flex items-center justify-between px-6"
      style={{
        background: scrolled ? "rgba(4,6,26,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(238,240,255,0.06)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AF1, #5B73F5)" }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-[19px] font-extrabold text-[#EEF0FF]">Tiikme</span>
      </Link>
      <div className="hidden md:flex items-center gap-6">
        {["Features", "How it works", "For Institutions"].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s/g, "-")}`} className="text-[14px] font-medium text-[rgba(238,240,255,0.6)] hover:text-[#EEF0FF] transition-colors">{l}</a>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link to="/signin"><Button variant="ghost" className="text-[rgba(238,240,255,0.6)] hover:text-[#EEF0FF]">Sign in</Button></Link>
        <Link to="/signup"><Button className="gap-1.5"><Zap className="w-3.5 h-3.5" />Get Tiiked</Button></Link>
      </div>
    </nav>
  );
};

export default Navbar;
