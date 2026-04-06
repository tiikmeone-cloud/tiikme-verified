import { Link } from "react-router-dom";
import ThemeLogo from "@/components/ThemeLogo";

const Footer = () => (
  <footer className="border-t px-6 py-12" style={{ borderColor: "var(--border)" }}>
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <ThemeLogo className="h-8 w-auto" />
        <span className="text-[13px] font-['Silkscreen']" style={{ color: "var(--text-3)" }}>Get Tiiked. ✓</span>
      </div>
      <div className="flex items-center gap-6 text-[13px]" style={{ color: "var(--text-2)" }}>
        <Link to="/privacy" className="hover:opacity-80 transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:opacity-80 transition-colors">Terms</Link>
        <Link to="/grievance" className="hover:opacity-80 transition-colors">Grievance Officer</Link>
      </div>
      <span className="text-[12px]" style={{ color: "var(--text-3)" }}>© 2025 Tiikme · tiikme.in</span>
    </div>
  </footer>
);

export default Footer;
