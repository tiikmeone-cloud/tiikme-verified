import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhoIsForSection from "@/components/landing/WhoIsForSection";
import InstitutionsSection from "@/components/landing/InstitutionsSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import VisionSection from "@/components/landing/VisionSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import AuthThemeToggle from "@/components/AuthThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <WhoIsForSection />
      <InstitutionsSection />
      <ComparisonSection />
      <VisionSection />
      <CTASection />
      <Footer />
      <AuthThemeToggle />
    </div>
  );
};

export default Index;
