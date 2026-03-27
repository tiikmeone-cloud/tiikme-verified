import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Briefcase, UserCheck, BookOpen, Stethoscope, Building2, Wrench, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const roles = [
  { id: "student", label: "Student", icon: GraduationCap, color: "bg-electric/20 text-electric border-electric/30" },
  { id: "professional", label: "Professional", icon: Briefcase, color: "bg-liquid-blue/20 text-liquid-blue border-liquid-blue/30" },
  { id: "hr", label: "HR / Recruiter", icon: UserCheck, color: "bg-coral/20 text-coral border-coral/30" },
  { id: "faculty", label: "Faculty", icon: BookOpen, color: "bg-amber/20 text-amber border-amber/30" },
  { id: "doctor", label: "Doctor", icon: Stethoscope, color: "bg-teal/20 text-teal border-teal/30" },
  { id: "government", label: "Government", icon: Building2, color: "bg-royal-green/20 text-royal-green border-royal-green/30" },
  { id: "skilled_trade", label: "Skilled Trade", icon: Wrench, color: "bg-warm-orange/20 text-warm-orange border-warm-orange/30" },
  { id: "mentor", label: "Mentor", icon: Heart, color: "bg-electric/20 text-electric border-electric/30" },
];

const SignUp = () => {
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: "", institution: "", city: "", state: "" });

  return (
    <div className="min-h-screen liquid-gradient-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Link to="/" className="font-display text-2xl font-bold mb-8 block text-center">Tiikme</Link>

        {/* Progress bar */}
        <div className="flex gap-2 mb-10 max-w-xs mx-auto">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? "bg-electric glow-primary" : "bg-muted"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-display text-3xl font-bold text-center mb-2">What describes you best?</h2>
              <p className="text-muted-foreground text-center mb-8">Pick your role — you can change it later.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`glass-card p-5 rounded-2xl text-center transition-all duration-200 border hover:scale-[1.03] active:scale-[0.97] ${
                      selectedRole === role.id
                        ? `${role.color} border-current shadow-lg`
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <role.icon className={`w-8 h-8 mx-auto mb-2 ${selectedRole === role.id ? "" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${selectedRole === role.id ? "" : "text-muted-foreground"}`}>
                      {role.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button variant="hero" size="lg" onClick={() => selectedRole && setStep(1)} disabled={!selectedRole}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-display text-3xl font-bold text-center mb-2">Tell us about yourself</h2>
              <p className="text-muted-foreground text-center mb-8">This helps others find and verify you.</p>

              <div className="max-w-md mx-auto space-y-4 mb-8">
                <Input
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-12 bg-muted border-border"
                />
                <Input
                  placeholder="College / Company / Hospital"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="h-12 bg-muted border-border"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 bg-muted border-border"
                  />
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="h-12 bg-muted border-border"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button variant="hero" size="lg" onClick={() => setStep(2)}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-display text-3xl font-bold text-center mb-2">Add your first project</h2>
              <p className="text-muted-foreground text-center mb-8">Show the world what you've built or done.</p>

              <div className="max-w-md mx-auto space-y-4 mb-8">
                <Input placeholder="Project title" className="h-12 bg-muted border-border" />
                <Input placeholder="Short description" className="h-12 bg-muted border-border" />
                <Input placeholder="Domain (e.g. Web Dev, Healthcare, Plumbing)" className="h-12 bg-muted border-border" />
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button variant="hero" size="lg">
                  Complete setup
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                You can skip this and add projects later.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Already have an account?{" "}
          <Link to="/signin" className="text-electric hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
