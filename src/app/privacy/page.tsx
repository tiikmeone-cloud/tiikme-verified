import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — tiikme',
  description: 'How tiikme collects, uses, and protects your personal data.',
}

const EFFECTIVE = 'June 22, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[16px] font-black text-orange-500 tracking-tight">tiikme</Link>
          <div className="flex items-center gap-4 text-[13px] text-gray-500">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-3">Legal</p>
        <h1 className="text-[36px] font-black text-gray-900 leading-tight mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-gray-500 mb-10">Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}</p>

        <div className="space-y-10 text-[14.5px] leading-relaxed text-gray-700">

          <Section title="1. Introduction">
            <p>
              tiikme Technologies Private Limited (&quot;tiikme&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is
              committed to protecting your personal data. This Privacy Policy explains how we collect,
              use, disclose, retain, and safeguard your personal information when you use the tiikme
              platform (&quot;Platform&quot;), including our website, mobile applications, and all associated
              services.
            </p>
            <p>
              This Policy is compliant with the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>
              of India and, where applicable, the EU General Data Protection Regulation (GDPR) and other
              relevant data protection laws.
            </p>
            <p>
              By using the Platform, you consent to the practices described in this Policy. If you do not
              agree, you must not access or use the Platform.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>

            <SubSection title="2.1 Information You Provide Directly">
              <ul>
                <li><strong>Account information:</strong> Full name, email address, mobile number, and password.</li>
                <li><strong>Flex Profile data:</strong> Work experience, job titles, employers, dates of employment, educational qualifications, skills, certifications, achievements, profile photo, and headline.</li>
                <li><strong>Identity verification:</strong> Government-issued ID information (if required for verification purposes), collected with explicit consent.</li>
                <li><strong>Squad endorsements:</strong> Names and contact information of colleagues you invite to verify your experience.</li>
                <li><strong>Communications:</strong> Messages sent through our support channels, feedback forms, or in-app messaging.</li>
                <li><strong>Preferences:</strong> Career goals, location preferences, salary expectations, open-to-work status, and job type preferences.</li>
                <li><strong>Organisation data:</strong> Company name, registration details, logo, team size, and authorised representative information.</li>
              </ul>
            </SubSection>

            <SubSection title="2.2 Information Collected Automatically">
              <ul>
                <li><strong>Usage data:</strong> Pages visited, features used, time spent, search queries, and click patterns.</li>
                <li><strong>Device information:</strong> IP address, browser type and version, operating system, device identifiers, and screen resolution.</li>
                <li><strong>Location data:</strong> City-level location inferred from IP address. Precise GPS location is collected only with explicit opt-in.</li>
                <li><strong>Cookies and tracking:</strong> Session cookies, persistent cookies, and similar technologies (see Section 9).</li>
                <li><strong>Log data:</strong> Server access logs, error logs, and performance metrics.</li>
              </ul>
            </SubSection>

            <SubSection title="2.3 Information From Third Parties">
              <ul>
                <li><strong>OAuth sign-in providers:</strong> If you sign in with Google or LinkedIn, we receive your name, email, and profile picture as permitted by your settings on those platforms.</li>
                <li><strong>Squad endorsers:</strong> Limited professional information about endorsers who verify your experience.</li>
                <li><strong>Course and certification providers:</strong> Completion status and credential information from Level Up partners who have integrated with tiikme, with your consent.</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We process your personal data for the following purposes and legal bases:</p>
            <table>
              <thead>
                <tr>
                  <th>Purpose</th>
                  <th>Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Creating and managing your account</td><td>Contractual necessity</td></tr>
                <tr><td>Operating the Flex profile and squad verification system</td><td>Contractual necessity</td></tr>
                <tr><td>Providing Tiik AI recommendations and job matching</td><td>Contractual necessity / Legitimate interests</td></tr>
                <tr><td>Processing Flex access requests from Organisations</td><td>Consent (explicit, per request)</td></tr>
                <tr><td>Sending service notifications and important updates</td><td>Contractual necessity</td></tr>
                <tr><td>Sending marketing communications (opt-in only)</td><td>Consent</td></tr>
                <tr><td>Improving AI models and Platform features</td><td>Legitimate interests (anonymised/aggregated)</td></tr>
                <tr><td>Security, fraud prevention, and abuse detection</td><td>Legitimate interests / Legal obligation</td></tr>
                <tr><td>Complying with legal and regulatory requirements</td><td>Legal obligation</td></tr>
                <tr><td>Analytics and product improvement</td><td>Legitimate interests</td></tr>
              </tbody>
            </table>
            <p className="mt-3">
              We will not use your personal data for any purpose incompatible with those listed above
              without obtaining your prior consent.
            </p>
          </Section>

          <Section title="4. Sharing Your Data">
            <p>We share your personal data only as described below:</p>
            <ul>
              <li>
                <strong>With Organisations (employers):</strong> Your anonymised profile card may be visible to
                Organisations searching for talent. Your full Flex (including name and contact details) is
                shared ONLY after you explicitly approve an access request from that Organisation.
              </li>
              <li>
                <strong>With Squad members:</strong> When you invite colleagues to verify your experience, their
                name and professional details are associated with your Flex entry. They can see that you
                invited them.
              </li>
              <li>
                <strong>With service providers:</strong> We engage trusted third-party processors including cloud
                hosting (Supabase / AWS), payment processors (Razorpay), email service providers
                (Resend), and analytics tools — all bound by data processing agreements.
              </li>
              <li>
                <strong>With Level Up partners:</strong> If you enrol in a course or hackathon and consent to
                sharing, we provide your name and email to the course provider to facilitate enrolment.
              </li>
              <li>
                <strong>For legal reasons:</strong> We may disclose data to comply with a court order,
                governmental request, or applicable law; to enforce our Terms; or to protect the rights,
                property, or safety of tiikme, our users, or the public.
              </li>
              <li>
                <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets,
                your data may be transferred as part of that transaction, subject to applicable law and
                notification to affected users.
              </li>
            </ul>
            <p>
              <strong>We do not sell, rent, or trade your personal data to third parties for their own marketing purposes.</strong>
            </p>
          </Section>

          <Section title="5. Candidate Data and Flex Privacy Controls">
            <p>
              You have fine-grained control over your Flex profile visibility:
            </p>
            <ul>
              <li><strong>Public Flex:</strong> A shareable link version of your profile, visible to anyone with the link. You can disable this at any time.</li>
              <li><strong>Open to Work:</strong> Enabling this flag makes your anonymised profile card discoverable to Organisations in the talent pool. Disabling it removes you from discovery.</li>
              <li><strong>Flex Access Requests:</strong> Organisations must request access. You approve or decline each request. You can see a full log of all access approvals in your account settings.</li>
              <li><strong>Data export:</strong> You may download all your Flex data at any time from Settings → Privacy → Export My Data.</li>
              <li><strong>Account deletion:</strong> You may delete your account from Settings → Account. Upon deletion, your personal data will be permanently removed within 30 days, except where retention is required by law.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as needed to provide
              services. Specific retention periods:
            </p>
            <ul>
              <li><strong>Account and Flex data:</strong> Retained for the duration of your account, plus 90 days post-deletion to allow recovery if requested.</li>
              <li><strong>Usage logs:</strong> 12 months from collection, then anonymised.</li>
              <li><strong>Communication records:</strong> 3 years, or as required by law.</li>
              <li><strong>Payment records:</strong> 7 years as required by Indian tax and accounting law.</li>
              <li><strong>Security logs:</strong> 24 months for fraud and security investigations.</li>
            </ul>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement industry-standard security measures to protect your personal data, including:
            </p>
            <ul>
              <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256);</li>
              <li>Row-level security (RLS) enforced at the database level;</li>
              <li>Supabase Auth with secure JWT tokens and refresh token rotation;</li>
              <li>Regular security audits and penetration testing;</li>
              <li>Access controls limiting employee access to production data on a need-to-know basis;</li>
              <li>Multi-factor authentication for internal administrative systems.</li>
            </ul>
            <p>
              Despite these measures, no system is completely secure. In the event of a data breach that
              is likely to result in a high risk to your rights and freedoms, we will notify affected
              users and the relevant data protection authority within the timelines required by law.
            </p>
          </Section>

          <Section title="8. International Data Transfers">
            <p>
              Your data is primarily processed and stored within India. Where data is transferred to
              servers or processors outside India (e.g., US-based cloud services), we ensure appropriate
              safeguards are in place through standard contractual clauses or equivalent mechanisms as
              required under the DPDPA.
            </p>
          </Section>

          <Section title="9. Cookies and Tracking Technologies">
            <p>We use the following types of cookies:</p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for authentication, session management, and security. Cannot be disabled.</li>
              <li><strong>Functional cookies:</strong> Remember your preferences (e.g., theme, language). Enabled by default; you can disable in browser settings.</li>
              <li><strong>Analytics cookies:</strong> Collect anonymised usage data to help us improve the Platform (e.g., page views, feature adoption). Opt-out available via our cookie banner.</li>
              <li><strong>Marketing cookies:</strong> Used only with your explicit consent to personalise ads on third-party platforms. We do not deploy these by default.</li>
            </ul>
            <p>
              You can manage cookie preferences via your browser settings or the cookie preference centre
              accessible from the footer. Disabling essential cookies may impair Platform functionality.
            </p>
          </Section>

          <Section title="10. Your Rights">
            <p>
              Subject to applicable law, you have the following rights regarding your personal data:
            </p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal retention obligations).</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Restriction:</strong> Request that we restrict processing of your data in certain circumstances.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests, including for direct marketing.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent, without affecting the lawfulness of prior processing.</li>
              <li><strong>Grievance:</strong> Lodge a complaint with our Data Protection Officer or the relevant data protection authority.</li>
            </ul>
            <p>
              To exercise any of these rights, contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@tiikme.com" className="text-orange-500 hover:underline">privacy@tiikme.com</a>.
              We will respond within 30 days. We may ask you to verify your identity before processing
              your request.
            </p>
          </Section>

          <Section title="11. Tiik AI and Data Processing">
            <p>
              Tiik AI processes your Flex profile data, usage history, and job preferences to generate
              personalised recommendations. Specific practices:
            </p>
            <ul>
              <li>AI inference runs on your data to generate match scores, skill-gap recommendations, and career suggestions.</li>
              <li>Chat conversations with Tiik are stored to maintain session context and improve service quality. You can delete your chat history at any time from the Tiik interface.</li>
              <li>We may use anonymised and aggregated chat data to improve AI model performance. We do not use identifiable personal data to train external models without explicit consent.</li>
              <li>tiikme does not use your Flex data to train or fine-tune large language models for third-party commercial purposes.</li>
            </ul>
          </Section>

          <Section title="12. Children's Privacy">
            <p>
              The Platform is not directed at children under the age of 18. We do not knowingly collect
              personal data from minors. If you believe a child has provided us with personal data,
              please contact us at <a href="mailto:privacy@tiikme.com" className="text-orange-500 hover:underline">privacy@tiikme.com</a> and
              we will delete it promptly.
            </p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, or legal requirements. We will notify you of material changes via email or
              in-app notification at least 14 days before they take effect. The &quot;Last updated&quot; date at
              the top of this page indicates when the latest revision was made.
            </p>
          </Section>

          <Section title="14. Contact and Grievance Officer">
            <p>
              For privacy-related questions, concerns, or requests, contact our Data Protection / Grievance Officer:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-[14px] p-5 mt-3 not-prose">
              <p className="font-semibold text-gray-900 text-[14px]">Data Protection Officer</p>
              <p className="text-[13px] text-gray-600 mt-1">tiikme Technologies Private Limited</p>
              <p className="text-[13px] text-gray-600">Email: <a href="mailto:privacy@tiikme.com" className="text-orange-500 hover:underline">privacy@tiikme.com</a></p>
              <p className="text-[13px] text-gray-600">Grievances: <a href="mailto:grievance@tiikme.com" className="text-orange-500 hover:underline">grievance@tiikme.com</a></p>
              <p className="text-[13px] text-gray-600 mt-1">Response time: Within 30 days of receipt</p>
              <p className="text-[13px] text-gray-600">Bengaluru, Karnataka, India</p>
            </div>
            <p className="mt-3">
              If you are not satisfied with our response, you may lodge a complaint with the Data
              Protection Board of India (once operational) or the relevant supervisory authority in your
              jurisdiction.
            </p>
          </Section>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-gray-400">
          <Link href="/" className="text-[14px] font-black text-orange-500 tracking-tight">tiikme</Link>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-gray-900 font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          </div>
          <p>© {new Date().getFullYear()} tiikme · made in India</p>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-gray-800 mb-2">{title}</h3>
      {children}
    </div>
  )
}
