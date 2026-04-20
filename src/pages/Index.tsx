import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhoIsForSection from "@/components/landing/WhoIsForSection";
import CirclesSection from "@/components/landing/CirclesSection";
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
        title="Tiikme — A Professional Network for India"
        description="Tiikme is a professional social network built in India for students, freelancers, founders, and creators. Join Circles, find opportunities, build your professional identity. No fees. Ever."
        ogTitle="Tiikme — A Professional Network for India"
        ogDescription="Built for the ones who build. Students, freelancers, founders, creators. Circles, opportunities, verified communities. No fees."
        ogImage="https://tiikme.com/og-image.png"
        twitterCard="summary_large_image"
        canonical="https://tiikme.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Tiikme",
          alternateName: "Tiikme — Professional Network for India",
          url: "https://tiikme.com",
          logo: "https://tiikme.com/og-image.png",
          description: "A professional social network built in India for students, freelancers, founders, and creators.",
          foundingDate: "2025",
          founders: [{ "@type": "Person", name: "Saai Nadhan" }],
          address: {
            "@type": "PostalAddress",
            addressLocality: "Hyderabad",
            addressRegion: "Telangana",
            addressCountry: "IN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            email: "contact@tiikme.com",
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: ["English", "Hindi", "Telugu"],
          },
        }}
      />
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <WhoIsForSection />
      <CirclesSection />
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
