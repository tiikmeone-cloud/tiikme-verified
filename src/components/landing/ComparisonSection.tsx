import { Check, X } from "lucide-react";

const rows = [
  { feature: "Verified credentials", trad: "Self-declared only", tiik: "Verified by your institution" },
  { feature: "Works for non-corporate India", trad: "No", tiik: "Yes — built for it" },
  { feature: "Institutional routing", trad: "Not possible", tiik: "Department-level control" },
  { feature: "Certificate issuance", trad: "Not available", tiik: "Organisations issue directly" },
  { feature: "Free for individuals", trad: "Limited", tiik: "Always free" },
];

const ComparisonSection = () => (
  <section className="bg-white px-5 md:px-8 py-16 md:py-[100px]">
    <div className="max-w-[1000px] mx-auto">
      <h2
        className="text-center font-extrabold text-[28px] md:text-[48px] mb-12 md:mb-16"
        style={{ color: "#04061A" }}
      >
        The honest comparison.
      </h2>

      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0" style={{ scrollbarWidth: "none" }}>
        <table className="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th className="py-4 pr-4 text-[13px] font-bold" style={{ color: "#6B7280" }}>
                Feature
              </th>
              <th className="py-4 pr-4 text-[13px] font-bold" style={{ color: "#6B7280" }}>
                Traditional Platforms
              </th>
              <th className="py-4 text-[13px] font-bold" style={{ color: "#B8460C" }}>
                Tiikme
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feature} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td className="py-3.5 pr-4 text-[14px] font-medium" style={{ color: "#374151" }}>
                  {r.feature}
                </td>
                <td className="py-3.5 pr-4 text-[14px]" style={{ color: "#6B7280" }}>
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4 flex-shrink-0" style={{ color: "#EF4444" }} />
                    {r.trad}
                  </span>
                </td>
                <td className="py-3.5 text-[14px] font-medium" style={{ color: "#04061A" }}>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
                    {r.tiik}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default ComparisonSection;
