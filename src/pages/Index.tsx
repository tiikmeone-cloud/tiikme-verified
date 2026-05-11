import { lazy, Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { PageSEO, absoluteUrl, SITE_URL } from "@/hooks/usePageSEO";

// Defer below-the-fold sections to reduce initial JS payload
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const WhoIsForSection = lazy(() => import("@/components/landing/WhoIsForSection"));
const CirclesSection = lazy(() => import("@/components/landing/CirclesSection"));
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
        description="Tiikme is a professional social network built in India for students, freelancers, founders, and creators. Join Circles, find opportunities, build your professional identity. No fees. Ever."
        ogTitle="Tiikme — A Professional Network for India"
        ogDescription="Built for the ones who build. Students, freelancers, founders, creators. Circles, opportunities, verified communities. No fees."
        ogImage={absoluteUrl("/og-image.png")}
        twitterCard="summary_large_image"
        canonical={absoluteUrl("/")}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Tiikme",
          alternateName: "Tiikme — Professional Network for India",
          url: SITE_URL,
          logo: absoluteUrl("/og-image.png"),
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
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
};

export default Index;
