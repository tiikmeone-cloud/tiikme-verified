import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen" style={{ background: "var(--bg)" }}>
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-8" style={{ color: "var(--brand)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>
      <h1 className="text-[32px] font-extrabold mb-2" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Terms of Use</h1>
      <p className="text-[14px] mb-8" style={{ color: "var(--text-3)" }}>Last updated: 1 April 2026</p>

      <div className="prose-sm space-y-6" style={{ color: "var(--text-2)" }}>
        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>1. Acceptance</h2>
          <p className="text-[14px] leading-[1.75]">By creating an account on Tiikme, you agree to these Terms of Use. If you do not agree, do not use the platform. These terms constitute a legally binding agreement between you and Tiikme.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>2. Eligibility</h2>
          <p className="text-[14px] leading-[1.75]">You must be at least 16 years old to create an account. Users under 18 must have parental or guardian consent. By registering, you represent that you meet these requirements.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>3. Your Account</h2>
          <p className="text-[14px] leading-[1.75]">You are responsible for maintaining the security of your account credentials. All work, projects, and content you post must be your own or properly attributed. Misrepresentation of credentials, work, or identity will result in account suspension.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>4. Verification System</h2>
          <p className="text-[14px] leading-[1.75]">Tiikme's verification system (Tiik Approved, Institution Verification) is designed to validate the authenticity of work and credentials. Attempting to falsify verification status, impersonate verifiers, or manipulate the approval process is strictly prohibited.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>5. Content Guidelines</h2>
          <p className="text-[14px] leading-[1.75]">You retain ownership of content you post. By posting, you grant Tiikme a non-exclusive licence to display and distribute your content within the platform. Content must not be illegal, defamatory, or violate others' intellectual property rights.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>6. Prohibited Conduct</h2>
          <p className="text-[14px] leading-[1.75]">Users may not: spam or send unsolicited messages, scrape or harvest data from the platform, create fake accounts, post misleading job opportunities, or engage in harassment of any kind.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>7. Termination</h2>
          <p className="text-[14px] leading-[1.75]">We may suspend or terminate accounts that violate these terms. You may delete your account at any time through Settings → Account. Deletion takes effect after a 30-day hold period during which you can cancel by signing back in.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>8. Governing Law</h2>
          <p className="text-[14px] leading-[1.75]">These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
