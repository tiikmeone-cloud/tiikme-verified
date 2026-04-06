import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="px-6 pb-20">
    <div className="max-w-4xl mx-auto rounded-3xl p-14 text-center" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-glow)" }}>
      <h2 className="text-[32px] font-extrabold mb-3" style={{ color: "var(--text-1)" }}>Ready to get Tiiked?</h2>
      <p className="text-[16px] mb-8" style={{ color: "var(--text-2)" }}>Join 12,400+ professionals building verified identities.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/signup">
          <Button size="xl" className="gap-2"><Zap className="w-4 h-4" />Create your free profile<ArrowRight className="w-4 h-4" /></Button>
        </Link>
        <a href="#features">
          <Button size="xl" variant="outline" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--text-1)" }}>Learn more</Button>
        </a>
      </div>
    </div>
  </section>
);

export default CTASection;
