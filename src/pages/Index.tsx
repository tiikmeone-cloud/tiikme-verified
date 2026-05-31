import { lazy, Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { PageSEO } from "@/hooks/usePageSEO";

// Defer below-the-fold sections to reduce initial JS payload
const TrustSystemsSection = lazy(() => import("@/components/landing/TrustSystemsSection"));
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const WhoIsForSection = lazy(() => import("@/components/landing/WhoIsForSection"));
const InstitutionsSection = lazy(() => import("@/components/landing/InstitutionsSection"));
const ComparisonSection = lazy(() => import("@/components/landing/ComparisonSection"));
const VisionSection = lazy(() => import("@/components/landing/VisionSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Footer = lazy(() => import("@/components/landing/Footer"));
const AuthThemeToggle = lazy(() => import("@/components/AuthThemeToggle"));

const Index = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <PageSEO
        title="Tiikme — A Professional Network for India"
        description="India's professional network for students, freelancers, founders, and creators. Find opportunities, build verified identity. No fees."
        ogTitle="Tiikme — A Professional Network for India"
        ogDescription="Built for the ones who build. Students, freelancers, founders, creators. Opportunities, verified identity, professional discovery."
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
      <main>
        <HeroSection />
        <Suspense fallback={null}>
          <TrustSystemsSection />
          <ProblemSection />
          <HowItWorksSection />
          <WhoIsForSection />
          <InstitutionsSection />
          <ComparisonSection />
          <VisionSection />
          <CTASection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
        <AuthThemeToggle />
      </Suspense>
    </div>
  );
};

export default Index;
