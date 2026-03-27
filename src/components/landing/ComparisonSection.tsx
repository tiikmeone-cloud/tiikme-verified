import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Verified identity (OTP + docs)", tiikme: true, linkedin: false },
  { feature: "Project-first profiles", tiikme: true, linkedin: false },
  { feature: "Faculty-approved completions", tiikme: true, linkedin: false },
  { feature: "All professions (plumbers to doctors)", tiikme: true, linkedin: false },
  { feature: "Anti-spam (no cold DMs)", tiikme: true, linkedin: false },
  { feature: "Activity Score (not endorsements)", tiikme: true, linkedin: false },
  { feature: "Open challenges & bounties", tiikme: true, linkedin: false },
  { feature: "India-first (DPDP compliant)", tiikme: true, linkedin: false },
];

const ComparisonSection = () => {
  return (
    <section className="relative py-32 px-4" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Not another LinkedIn
          </h2>
          <p className="text-lg text-muted-foreground">
            Tiikme is built differently. Here's why.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-border">
            <div className="text-muted-foreground font-medium text-sm">Feature</div>
            <div className="text-center font-display font-bold text-electric">Tiikme</div>
            <div className="text-center font-display font-bold text-muted-foreground">LinkedIn</div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 gap-4 p-6 ${i < rows.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="text-sm text-foreground/80">{row.feature}</div>
              <div className="flex justify-center">
                <div className="w-7 h-7 rounded-full bg-neon/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-neon" />
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-destructive" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
