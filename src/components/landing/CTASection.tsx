import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="relative py-32 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden bg-[#0D0D1A] border border-[rgba(255,255,255,0.08)]"
        style={{ borderRadius: 24 }}>
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[rgba(91,79,255,0.2)] blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#F0F0FF]">
            Ready to get <span className="text-[#5B4FFF]">Tiiked</span>?
          </h2>
          <p className="text-[18px] text-[rgba(240,240,255,0.6)] mb-8 max-w-xl mx-auto">
            Join thousands of verified professionals across India. Your work deserves to be seen.
          </p>
          <Link to="/signup">
            <Button size="xl">
              Create your free profile
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
