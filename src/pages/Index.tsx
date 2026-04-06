import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import AuthThemeToggle from "@/components/AuthThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <Navbar />
      <HeroSection />
      <ComparisonSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
      <AuthThemeToggle />
    </div>
  );
};

export default Index;
