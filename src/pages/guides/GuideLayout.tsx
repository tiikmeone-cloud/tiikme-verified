import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { PageSEO } from "@/hooks/usePageSEO";

export interface GuideMeta {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keyword: string;
  readTime: string;
  category: string;
}

interface Props {
  meta: GuideMeta;
  children: ReactNode;
  related?: { slug: string; title: string }[];
}

const BASE_URL = "https://tiikme.com";

const GuideLayout = ({ meta, children, related = [] }: Props) => {
  const canonical = `${BASE_URL}/guides/${meta.slug}`;
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
      <PageSEO
        title={`${meta.title} | Tiikme Guides`}
        description={meta.description}
        canonical={canonical}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: meta.h1,
          description: meta.description,
          author: { "@type": "Organization", name: "Tiikme" },
          publisher: { "@type": "Organization", name: "Tiikme", logo: { "@type": "ImageObject", url: `${BASE_URL}/og-image.png` } },
          mainEntityOfPage: canonical,
          keywords: meta.keyword,
        }}
      />
      <Navbar />
      <main className="px-5 md:px-8 py-10 md:py-16">
        <div className="max-w-[720px] mx-auto">
          <Link to="/guides" className="inline-flex items-center gap-2 text-[14px] font-medium mb-8" style={{ color: "#B8460C" }}>
            <ArrowLeft className="w-4 h-4" /> All guides
          </Link>
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#B8460C" }}>
            {meta.category} · {meta.readTime}
          </p>
          <h1 className="font-extrabold text-[32px] md:text-[48px] leading-[1.1] mb-5" style={{ color: "#04061A" }}>
            {meta.h1}
          </h1>
          <p className="text-[18px] md:text-[20px] leading-[1.6] mb-10" style={{ color: "#374151" }}>
            {meta.description}
          </p>
          <div className="mx-auto mb-10" style={{ width: 60, height: 3, backgroundColor: "#FF5A1F", borderRadius: 2 }} />

          <article className="prose-tiik">{children}</article>

          {/* CTA */}
          <div className="mt-14 p-7 md:p-10 rounded-2xl" style={{ backgroundColor: "#FEF3E8" }}>
            <h2 className="font-extrabold text-[22px] md:text-[28px] mb-3" style={{ color: "#04061A" }}>
              Build a profile that actually proves what you did.
            </h2>
            <p className="text-[15px] md:text-[16px] mb-6" style={{ color: "#374151" }}>
              Tiikme is India's verified professional identity platform. Free forever for individuals.
            </p>
            <Link to="/signup">
              <button
                type="button"
                className="h-[52px] px-7 rounded-xl font-bold text-[16px] text-white cursor-pointer transition-colors"
                style={{ backgroundColor: "#B8460C" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#9C3A0A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B8460C")}
              >
                Create My Profile — Free
              </button>
            </Link>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="font-extrabold text-[22px] md:text-[24px] mb-5" style={{ color: "#04061A" }}>
                Related guides
              </h2>
              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={`/guides/${r.slug}`}
                      className="flex items-center justify-between gap-3 p-4 rounded-xl transition-colors"
                      style={{ border: "1px solid #E5E7EB" }}
                    >
                      <span className="text-[15px] md:text-[16px] font-semibold" style={{ color: "#04061A" }}>
                        {r.title}
                      </span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "#B8460C" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />

      <style>{`
        .prose-tiik h2 { font-size: 24px; font-weight: 800; color: #04061A; margin-top: 40px; margin-bottom: 14px; line-height: 1.25; }
        @media (min-width: 768px) { .prose-tiik h2 { font-size: 28px; } }
        .prose-tiik h3 { font-size: 18px; font-weight: 700; color: #04061A; margin-top: 28px; margin-bottom: 10px; }
        .prose-tiik p { font-size: 16px; line-height: 1.75; color: #374151; margin-bottom: 16px; }
        .prose-tiik ul, .prose-tiik ol { margin-bottom: 18px; padding-left: 22px; }
        .prose-tiik li { font-size: 16px; line-height: 1.7; color: #374151; margin-bottom: 8px; }
        .prose-tiik strong { color: #04061A; font-weight: 700; }
        .prose-tiik blockquote {
          border-left: 3px solid #FF5A1F;
          padding: 12px 18px;
          margin: 20px 0;
          background: #FEF3E8;
          border-radius: 8px;
          color: #04061A;
          font-style: italic;
        }
        .prose-tiik .example {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 18px 20px;
          margin: 14px 0;
        }
        .prose-tiik .example .label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
          display: block;
        }
        .prose-tiik .example.good .label { color: #16A34A; }
        .prose-tiik .example.bad .label { color: #DC2626; }
        .prose-tiik .example p { margin: 0; color: #04061A; }
      `}</style>
    </div>
  );
};

export default GuideLayout;
