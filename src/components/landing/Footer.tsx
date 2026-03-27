import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-display text-lg font-bold">Tiikme</span>
          <p className="text-sm text-muted-foreground mt-1">Verified professional identity for India.</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/grievance" className="hover:text-foreground transition-colors">Grievance</Link>
        </div>
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Tiikme. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
