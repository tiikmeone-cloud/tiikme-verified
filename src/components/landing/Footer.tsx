import { Link } from "react-router-dom";
import ThemeLogo from "@/components/ThemeLogo";

const Footer = () => (
  <footer style={{ backgroundColor: "#04061A" }}>
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-10 md:py-14">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
        <ThemeLogo className="h-12 w-auto" variant="dark" />
        <span className="text-[12px] text-white/50">© 2026 Veenavarse Private Limited</span>
      </div>
      <p className="text-center text-[12px] text-white/70 mb-6">A Veenavarse Private Limited product</p>

      <div className="text-sm text-white/80 flex flex-wrap gap-6 justify-center py-6 border-t border-white/10">
        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <a href="mailto:contact@tiikme.com" className="hover:text-white transition-colors">Contact</a>
      </div>
    </div>
  </footer>
);

export default Footer;
