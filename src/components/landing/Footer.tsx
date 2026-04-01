import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import tiikLogo from "@/assets/tiikme-logo.png";

const Footer = () => (
  <footer className="border-t px-6 py-12" style={{ borderColor: "rgba(238,240,255,0.06)" }}>
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <img src={tiikLogo} alt="Tiikme" className="w-7 h-7 rounded-lg" />
        <span className="text-[16px] font-extrabold text-[#EEF0FF]">Tiikme</span>
        <span className="text-[13px] ml-2" style={{ color: "rgba(238,240,255,0.4)" }}>Get Tiiked.</span>
      </div>
      <div className="flex items-center gap-6 text-[13px]" style={{ color: "rgba(238,240,255,0.5)" }}>
        <Link to="/privacy" className="hover:text-[#EEF0FF] transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-[#EEF0FF] transition-colors">Terms</Link>
        <Link to="/grievance" className="hover:text-[#EEF0FF] transition-colors">Grievance Officer</Link>
      </div>
      <span className="text-[12px]" style={{ color: "rgba(238,240,255,0.35)" }}>© 2025 Tiikme · tiikme.in</span>
    </div>
  </footer>
);

export default Footer;
