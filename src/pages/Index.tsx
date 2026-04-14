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
import { PageSEO } from "@/hooks/usePageSEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <PageSEO
        title="Tiikme — Verified Professional Identity Platform for India"
        description="Build your verified professional identity. Connect with verified professionals, organizations, and opportunities across India."
        canonical="https://tiikme.in/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Tiikme",
          url: "https://tiikme.in",
          description: "Verified Professional Identity Platform for India",
          potentialAction: { "@type": "SearchAction", target: "https://tiikme.in/app/explore?q={search_term_string}", "query-input": "required name=search_term_string" },
        }}
      />
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
