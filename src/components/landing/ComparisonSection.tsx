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
    <h2 className="text-center font-extrabold text-[32px] text-[#EEF0FF] mb-12 tracking-tight">Built differently.</h2>
    <div className="rounded-[20px] overflow-hidden" style={{ background: "rgba(8,11,42,0.6)", border: "1px solid rgba(238,240,255,0.06)" }}>
      <div className="grid grid-cols-3 text-[13px] font-bold border-b" style={{ borderColor: "rgba(238,240,255,0.06)" }}>
        <div className="px-5 py-4 text-[rgba(238,240,255,0.5)]">Feature</div>
        <div className="px-5 py-4 text-[rgba(238,240,255,0.5)]">Traditional Platforms</div>
        <div className="px-5 py-4" style={{ background: "rgba(61,90,241,0.15)", color: "#3D5AF1" }}>Tiikme</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.feature} className="grid grid-cols-3 text-[13px]" style={{ background: i % 2 ? "rgba(238,240,255,0.02)" : "transparent", borderBottom: "1px solid rgba(238,240,255,0.04)" }}>
          <div className="px-5 py-3.5 text-[rgba(238,240,255,0.7)]">{r.feature}</div>
          <div className="px-5 py-3.5 flex items-center gap-2 text-[rgba(238,240,255,0.3)]">
            <X className="w-3.5 h-3.5 text-[rgba(238,240,255,0.2)]" /> {r.trad}
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2 text-[#10B981]" style={{ background: "rgba(61,90,241,0.05)" }}>
            <Check className="w-3.5 h-3.5" /> {r.tiik}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default ComparisonSection;
