import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Navbar = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-foreground">
          <Zap className="w-5 h-5 text-electric" />
          Tiikme
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Compare
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/signin">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
