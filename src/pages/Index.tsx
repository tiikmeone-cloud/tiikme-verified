import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      const userTheme = localStorage.getItem("tiikme-theme") || "dark";
      const resolved = userTheme === "system"
        ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
        : userTheme;
      document.documentElement.setAttribute("data-theme", resolved);
    };
  }, []);

  return (
    <div style={{ background: "#04061A", color: "#EEF0FF", minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />
      <ComparisonSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
