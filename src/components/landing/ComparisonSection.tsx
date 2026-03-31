import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Profile without work history", others: "Invisible", tiikme: "Project-first identity" },
  { feature: "Student verification", others: "None", tiikme: "Faculty Tiik Approval" },
  { feature: "Skilled trade workers", others: "Not supported", tiikme: "First-class portfolios" },
  { feature: "Regional languages", others: "English only", tiikme: "Telugu, Tamil, Hindi, Kannada, Marathi" },
  { feature: "Government employees", others: "Not suitable", tiikme: "Department-aware workflows" },
  { feature: "Verification depth", others: "Self-declared only", tiikme: "4-level verified identity" },
];

const ComparisonSection = () => {
  return (
    <section className="relative py-32 px-4" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#F0F0FF]">Built differently.</h2>
          <p className="text-[18px] text-[rgba(240,240,255,0.6)]">How Tiikme compares to traditional platforms.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden bg-[#0D0D1A] border border-[rgba(255,255,255,0.08)]" style={{ borderRadius: 16 }}>
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-[rgba(255,255,255,0.08)]">
            <div className="text-[rgba(240,240,255,0.6)] font-medium text-[13px]">Feature</div>
            <div className="text-center font-bold text-[rgba(240,240,255,0.4)] text-[13px]">Traditional Platforms</div>
            <div className="text-center font-extrabold text-[#5B4FFF] text-[13px]">Tiikme</div>
          </div>
          {rows.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 gap-4 p-6 ${i < rows.length - 1 ? "border-b border-[rgba(255,255,255,0.08)]" : ""}`}>
              <div className="text-[14px] text-[#F0F0FF]/80">{row.feature}</div>
              <div className="text-center text-[13px] text-[rgba(240,240,255,0.4)]">{row.others}</div>
              <div className="text-center text-[13px] text-[#5B4FFF] font-bold">{row.tiikme}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
