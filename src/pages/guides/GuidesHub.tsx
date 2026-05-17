import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { PageSEO } from "@/hooks/usePageSEO";
import { GUIDES } from "./registry";

const GuidesHub = () => (
  <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
    <PageSEO
      title="Professional Profile Guides | Tiikme"
      description="Free guides on writing a professional profile summary, resume headline, and profile picture — for students, freshers, and working professionals in India."
      canonical="https://tiikme.com/guides"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Tiikme Professional Profile Guides",
        url: "https://tiikme.com/guides",
        hasPart: GUIDES.map((g) => ({
          "@type": "Article",
          headline: g.h1,
          url: `https://tiikme.com/guides/${g.slug}`,
        })),
      }}
    />
    <Navbar />
    <main className="px-5 md:px-8 py-12 md:py-20">
      <div className="max-w-[900px] mx-auto">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#B8460C" }}>
          Tiikme guides
        </p>
        <h1 className="font-extrabold text-[36px] md:text-[56px] leading-[1.05] mb-5" style={{ color: "#04061A" }}>
          How to build a professional profile
          <br />
          <span style={{ color: "#FF5A1F" }}>that actually gets you hired.</span>
        </h1>
        <p className="text-[16px] md:text-[20px] leading-[1.6] max-w-[640px] mb-12 md:mb-16" style={{ color: "#374151" }}>
          Honest, practical writing guides for students, freshers, and working
          Indians who want their profile to do real work for them.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="block p-6 md:p-7 rounded-2xl transition-all hover:-translate-y-0.5"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "#B8460C" }}>
                {g.category} · {g.readTime}
              </p>
              <h2 className="text-[18px] md:text-[20px] font-bold mb-2 leading-[1.3]" style={{ color: "#04061A" }}>
                {g.h1}
              </h2>
              <p className="text-[14px] md:text-[15px] leading-[1.6] mb-4" style={{ color: "#374151" }}>
                {g.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#B8460C" }}>
                Read guide <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default GuidesHub;
