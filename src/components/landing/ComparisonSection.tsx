import { Check, X } from "lucide-react";

const rows = [
  { feature: "Profile without work history", trad: "Invisible", tiik: "Project-first identity" },
  { feature: "Student verification", trad: "None", tiik: "Faculty Tiik Approval" },
  { feature: "Skilled trade workers", trad: "Not supported", tiik: "First-class portfolios" },
  { feature: "Regional languages", trad: "English only", tiik: "Telugu, Tamil, Hindi, Kannada, Marathi" },
  { feature: "Government employees", trad: "Not suitable", tiik: "Department-aware workflows" },
  { feature: "Verification depth", trad: "Self-declared only", tiik: "4-level verified identity" },
];

const ComparisonSection = () => (
  <section id="how-it-works" className="px-4 py-24 max-w-5xl mx-auto">
    <h2 className="text-center font-extrabold text-[32px] mb-12 tracking-tight" style={{ color: "var(--text-1)" }}>Built differently.</h2>
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
      <div className="grid grid-cols-3 text-[13px] font-bold border-b" style={{ borderColor: "var(--border)" }}>
        <div className="px-5 py-4" style={{ color: "var(--text-2)" }}>Feature</div>
        <div className="px-5 py-4" style={{ color: "var(--text-2)" }}>Traditional Platforms</div>
        <div className="px-5 py-4" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>Tiikme</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.feature} className="grid grid-cols-3 text-[13px]" style={{ background: i % 2 ? "var(--surface-2)" : "transparent", borderBottom: "1px solid var(--border)" }}>
          <div className="px-5 py-3.5" style={{ color: "var(--text-2)" }}>{r.feature}</div>
          <div className="px-5 py-3.5 flex items-center gap-2" style={{ color: "var(--text-3)" }}>
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} /> {r.trad}
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2" style={{ color: "var(--open-green)", background: "var(--brand-dim)" }}>
            <Check className="w-3.5 h-3.5" /> {r.tiik}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default ComparisonSection;
