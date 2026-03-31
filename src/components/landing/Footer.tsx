import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-lg font-extrabold text-[#F0F0FF]">Tiikme</span>
          <p className="text-[13px] text-[rgba(240,240,255,0.6)] mt-1">Get Tiiked.</p>
        </div>
        <div className="flex items-center gap-6 text-[13px] text-[rgba(240,240,255,0.6)]">
          <Link to="/privacy" className="hover:text-[#F0F0FF] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[#F0F0FF] transition-colors">Terms</Link>
          <Link to="/grievance" className="hover:text-[#F0F0FF] transition-colors">Grievance Officer</Link>
        </div>
        <p className="text-[12px] text-[rgba(240,240,255,0.35)]">&copy; 2025 Tiikme · tiikme.in</p>
      </div>
    </footer>
  );
};

export default Footer;
