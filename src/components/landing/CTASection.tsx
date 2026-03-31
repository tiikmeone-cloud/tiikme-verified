import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="px-6 pb-20">
    <div className="max-w-4xl mx-auto rounded-3xl p-14 text-center" style={{ background: "linear-gradient(135deg, rgba(61,90,241,0.2) 0%, rgba(14,18,64,0.6) 100%)", border: "1px solid rgba(61,90,241,0.2)" }}>
      <h2 className="text-[32px] font-extrabold text-[#EEF0FF] mb-3">Ready to get Tiiked?</h2>
      <p className="text-[16px] mb-8" style={{ color: "rgba(238,240,255,0.55)" }}>Join 12,400+ professionals building verified identities.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/signup">
          <Button size="xl" className="gap-2"><Zap className="w-4 h-4" />Create your free profile<ArrowRight className="w-4 h-4" /></Button>
        </Link>
        <a href="#features">
          <Button size="xl" style={{ background: "rgba(238,240,255,0.06)", border: "1px solid rgba(238,240,255,0.12)", color: "#EEF0FF" }}>Learn more</Button>
        </a>
      </div>
    </div>
  </section>
);

export default CTASection;
