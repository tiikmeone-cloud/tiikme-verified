import { motion } from "framer-motion";
import { Layers, Shield, Users, Compass, Award, Briefcase } from "lucide-react";

const features = [
  { icon: Shield, title: "Verified Identity", description: "Phone OTP, email domain, and document verification. No fake profiles." },
  { icon: Layers, title: "Project-First Profiles", description: "Your work speaks. Every project is a proof of skill — not endorsements." },
  { icon: Users, title: "Strands, Not Followers", description: "Mutual connections only. No cold DMs. Professional networking done right." },
  { icon: Compass, title: "Explore Discovery", description: "Find collaborators, projects, and challenges across every profession." },
  { icon: Award, title: "Faculty Verification", description: "Projects verified by faculty. Completion approved, not self-claimed." },
  { icon: Briefcase, title: "HR-Ready Profiles", description: "Recruiters see verified signals. Activity scores. Real project history." },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FeaturesSection = () => {
  return (
    <section className="relative py-32 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#F0F0FF]">
            Built for <span className="text-[#5B4FFF]">every</span> working person
          </h2>
          <p className="text-[18px] text-[rgba(240,240,255,0.6)] max-w-2xl mx-auto">
            Whether you write code or fix pipes — your work deserves to be verified and visible.
          </p>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}
              className="p-8 rounded-2xl bg-[#0D0D1A] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] transition-colors"
              style={{ borderRadius: 16 }}>
              <feature.icon className="w-10 h-10 text-[#5B4FFF] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#F0F0FF]">{feature.title}</h3>
              <p className="text-[rgba(240,240,255,0.6)] text-[14px] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
