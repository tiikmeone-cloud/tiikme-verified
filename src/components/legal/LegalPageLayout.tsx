import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export interface TocItem {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  jurisdictionLine?: string;
  toc: TocItem[];
  children: ReactNode;
}

const LegalPageLayout = ({ title, lastUpdated, jurisdictionLine, toc, children }: LegalPageLayoutProps) => {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 relative">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-8 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tiikme
        </Link>

        <h1 className="text-3xl md:text-[34px] font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-[13px] text-gray-500 mt-2 mb-10">
          Last Updated: {lastUpdated}
          {jurisdictionLine ? ` | ${jurisdictionLine}` : ""}
        </p>

        {/* TOC — sticky sidebar on lg+ */}
        <aside
          className="hidden lg:block fixed top-24"
          style={{ left: "calc(50% - 600px)", width: 220, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Contents</p>
          <ul className="space-y-1.5">
            {toc.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="block text-[12.5px] leading-snug py-1 transition-colors"
                  style={{
                    color: activeId === t.id ? "#FF5A1F" : "#6B7280",
                    fontWeight: activeId === t.id ? 700 : 500,
                  }}
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="text-gray-700 text-[15px] leading-relaxed">{children}</div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-[13px] text-gray-500 flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/terms" className="hover:text-gray-900">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
          <a href="mailto:contact@tiikme.com" className="hover:text-gray-900">Contact</a>
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;

/* Reusable section + callout helpers */
export const LegalSection = ({ id, num, title, children }: { id: string; num: string; title: string; children: ReactNode }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-xl md:text-[22px] font-semibold text-gray-900 mt-12 mb-4">
      <span className="text-brand font-bold mr-2">{num}.</span>
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </section>
);

export const Callout = ({ children }: { children: ReactNode }) => (
  <div className="bg-orange-50 border-l-4 border-brand px-5 py-4 rounded-r-xl my-6 text-gray-900 text-[14.5px] leading-relaxed">
    {children}
  </div>
);

export const Warning = ({ children }: { children: ReactNode }) => (
  <div className="bg-red-50 border-l-4 border-red-500 px-5 py-4 rounded-r-xl my-6 text-gray-900 text-[14.5px] leading-relaxed">
    {children}
  </div>
);
