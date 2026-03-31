import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  // Landing page always dark — override any saved theme
  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      // Restore theme when leaving landing
      const userTheme = localStorage.getItem("tiikme-theme") || "dark";
      const resolved = userTheme === "system"
        ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
        : userTheme;
      document.documentElement.setAttribute("data-theme", resolved);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden">
      {/* Animated gradient orbs — pure CSS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-[rgba(91,79,255,0.12)] blur-[120px]" style={{ animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-[rgba(16,185,129,0.06)] blur-[100px]" style={{ animation: "float 11s ease-in-out infinite reverse" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[rgba(91,79,255,0.05)] blur-[140px]" style={{ animation: "glowPulse 6s ease-in-out infinite" }} />
      </div>
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <ComparisonSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
