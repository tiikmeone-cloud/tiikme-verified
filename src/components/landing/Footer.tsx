import { Link } from "react-router-dom";
import ThemeLogo from "@/components/ThemeLogo";

const Footer = () => (
  <footer className="px-5 md:px-8 py-10 md:py-14" style={{ backgroundColor: "#04061A" }}>
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <ThemeLogo className="h-8 w-auto brightness-0 invert" />
        <div className="flex flex-wrap items-center justify-center gap-6 text-[13px]">
          <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="text-white/70 hover:text-white transition-colors">Terms</Link>
          <Link to="/grievance" className="text-white/70 hover:text-white transition-colors">Grievance Officer</Link>
          <a href="mailto:hello@tiikme.in" className="text-white/70 hover:text-white transition-colors">Contact</a>
        </div>
        <span className="text-[12px] text-white/50">
          © 2026 Veenavarse Private Limited
        </span>
      </div>
      <p className="text-center text-[12px] text-white/30">
        Built in Hyderabad. For India. tiikme.in · tiikme.com
      </p>
    </div>
  </footer>
);

export default Footer;
