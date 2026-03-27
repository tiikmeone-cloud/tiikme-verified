import { motion } from "framer-motion";
import { Layers, Shield, Users, Compass, Award, Briefcase } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Identity",
    description: "Phone OTP, email domain, and document verification. No fake profiles.",
    color: "text-neon",
  },
  {
    icon: Layers,
    title: "Project-First Profiles",
    description: "Your work speaks. Every project is a proof of skill — not endorsements.",
    color: "text-electric",
  },
  {
    icon: Users,
    title: "Strands, Not Followers",
    description: "Mutual connections only. No cold DMs. Professional networking done right.",
    color: "text-liquid-blue",
  },
  {
    icon: Compass,
    title: "Nexus Discovery",
    description: "Find collaborators, projects, and challenges across every profession.",
    color: "text-amber",
  },
  {
    icon: Award,
    title: "Faculty Verification",
    description: "Projects verified by faculty. Completion approved, not self-claimed.",
    color: "text-warm-orange",
  },
  {
    icon: Briefcase,
    title: "HR-Ready Profiles",
    description: "Recruiters see verified signals. Activity scores. Real project history.",
    color: "text-coral",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section className="relative py-32 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Built for{" "}
            <span className="text-electric">every</span> working person
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you write code or fix pipes — your work deserves to be verified and visible.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="glass-card-hover p-8 rounded-2xl"
            >
              <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
