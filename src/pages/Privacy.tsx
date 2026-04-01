import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen" style={{ background: "var(--bg)" }}>
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-8" style={{ color: "var(--brand)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>
      <h1 className="text-[32px] font-extrabold mb-2" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Privacy Policy</h1>
      <p className="text-[14px] mb-8" style={{ color: "var(--text-3)" }}>Last updated: 1 April 2026</p>

      <div className="prose-sm space-y-6" style={{ color: "var(--text-2)" }}>
        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>1. Data We Collect</h2>
          <p className="text-[14px] leading-[1.75]">We collect information you provide directly: name, email, phone number, institution, work history, and profile details. We also collect usage data such as pages visited, interactions, and device information to improve our platform.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>2. How We Use Your Data</h2>
          <p className="text-[14px] leading-[1.75]">Your data is used to provide platform services, verify your identity and work, connect you with relevant opportunities, and improve the Tiikme experience. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>3. Data Protection (DPDP Act 2023)</h2>
          <p className="text-[14px] leading-[1.75]">In compliance with India's Digital Personal Data Protection Act 2023, we process personal data only for lawful purposes with your consent. You have the right to access, correct, and erase your data. Data fiduciaries are responsible for maintaining data accuracy and security.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>4. Data Storage & Security</h2>
          <p className="text-[14px] leading-[1.75]">All data is stored on secure, encrypted servers. We use industry-standard encryption for data in transit and at rest. Access to personal data is restricted to authorised personnel only.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>5. Your Rights</h2>
          <p className="text-[14px] leading-[1.75]">You may request access to, correction of, or deletion of your personal data at any time through Settings → Account → Download my data, or by contacting privacy@tiikme.in. Account deletion requests are processed within 30 days.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>6. Cookies & Analytics</h2>
          <p className="text-[14px] leading-[1.75]">We use essential cookies for authentication and session management. Analytics cookies help us understand platform usage. You can manage cookie preferences in your browser settings.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>7. Contact</h2>
          <p className="text-[14px] leading-[1.75]">For privacy-related queries, contact our Data Protection Officer at privacy@tiikme.in.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
