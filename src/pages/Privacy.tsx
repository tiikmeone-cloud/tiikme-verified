import LegalPageLayout, { LegalSection, Callout, type TocItem } from "@/components/legal/LegalPageLayout";
import { PageSEO } from "@/hooks/usePageSEO";

const toc: TocItem[] = [
  { id: "section-1", label: "1. Who Is Responsible" },
  { id: "section-2", label: "2. What We Collect" },
  { id: "section-3", label: "3. Why We Use It" },
  { id: "section-4", label: "4. We Will Never Sell" },
  { id: "section-5", label: "5. Who We Share With" },
  { id: "section-6", label: "6. Your Rights (DPDP)" },
  { id: "section-7", label: "7. Data Retention" },
  { id: "section-8", label: "8. Security" },
  { id: "section-9", label: "9. Cookies" },
  { id: "section-10", label: "10. Children's Privacy" },
  { id: "section-11", label: "11. Changes" },
  { id: "section-12", label: "12. Contact" },
];

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-700 text-[15px] leading-relaxed">{children}</p>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[15.5px] font-semibold text-gray-900 mt-5 mb-2">{children}</h3>
);
const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-6 space-y-1.5 text-gray-700 text-[15px] leading-relaxed marker:text-orange-500">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto my-4 -mx-2 sm:mx-0">
    <table className="w-full text-[13.5px] border-collapse">
      <thead>
        <tr className="bg-gray-50">
          {headers.map((h, i) => (
            <th key={i} className="text-left px-3 py-2.5 font-semibold text-gray-900 border border-gray-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} className="px-3 py-2.5 text-gray-700 border border-gray-200 align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function Privacy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="April 20, 2025"
      jurisdictionLine="Applicable Law: DPDP Act 2023 | IT Act 2000 | IT (SPDI) Rules 2011"
      toc={toc}
    >
      <PageSEO
        title="Privacy Policy — Tiikme"
        description="How Tiikme collects, uses, and protects your data. DPDP Act 2023 compliant. We will never sell your data."
        ogTitle="Privacy Policy — Tiikme"
        ogDescription="Built for the ones who build. Your privacy is the foundation."
        ogImage="https://tiikme.com/og-image.png"
        twitterCard="summary_large_image"
        canonical="https://tiikme.com/privacy"
      >
      <Callout>
        Your privacy is not a feature. It is a foundation. This policy explains exactly what data we collect, why we collect it, what we will never do with it, and how you control it. We have written it in plain English because you deserve to understand it — not just agree to it.
      </Callout>

      <LegalSection id="section-1" num="1" title="Who Is Responsible for Your Data">
        <P>Tiikme acts as the Data Fiduciary for all personal data collected through the Platform, as defined under the Digital Personal Data Protection Act, 2023 (DPDP Act). This means we decide how and why your data is processed.</P>
        <P><strong>Contact for privacy matters:</strong></P>
        <P>Email: <a href="mailto:contact@tiikme.com" className="text-orange-600 underline">contact@tiikme.com</a> | <a href="mailto:contact@veenavarse.com" className="text-orange-600 underline">contact@veenavarse.com</a></P>
        <P>Response: Within 30 days for formal requests, 3 business days for general queries</P>
      </LegalSection>

      <LegalSection id="section-2" num="2" title="What Data We Collect">
        <Sub>2.1 Data You Give Us Directly</Sub>
        <List items={[
          "Name, email address, phone number",
          "Profile: role, designation, education, work history, skills, location, profile photo, cover image",
          "Content: posts, comments, Circle discussions, Pings (messages)",
          "Verification documents: offer letters, student ID, certificates (used only for verification, deleted after 12 months)",
          "Your preferences: notification settings, display preferences, privacy settings, theme",
        ]} />
        <Sub>2.2 Data Collected Automatically When You Use the Platform</Sub>
        <List items={[
          "Device information: type, operating system, browser version",
          "IP address and approximate city-level location",
          "Session data: login times, pages visited, features used, time spent",
          "Interaction data: posts liked, connections made, Circles joined, opportunities viewed",
        ]} />
        <Sub>2.3 Data from Third Parties</Sub>
        <List items={[
          "If you sign in with Google or another provider, we receive your name and email from that provider only",
          "Organisation admins may submit basic team member information for verification",
        ]} />
        <Sub>2.4 What We Do NOT Collect</Sub>
        <List items={[
          "Precise GPS location (we use IP-based approximate location only unless you explicitly share it)",
          "Financial data (no payment processing; we do not collect card or banking information)",
          "Biometric data",
          "Health or medical information (unless you choose to add it to your profile voluntarily)",
        ]} />
      </LegalSection>

      <LegalSection id="section-3" num="3" title="Why We Use Your Data">
        <Table
          headers={["Purpose", "What data", "Legal basis"]}
          rows={[
            ["Creating and maintaining your account", "Name, email, phone", "Contract performance"],
            ["Showing you relevant Feed, Circles, Opportunities", "Role, location, skills, activity", "Legitimate interest"],
            ["Enabling networking, messaging, connections", "Profile, activity", "Contract performance"],
            ["Processing verification requests", "Documents, profile data", "Consent"],
            ["Sending notifications (alerts, pings)", "Email, in-app", "Consent"],
            ["Platform safety, fraud prevention, moderation", "All data", "Legitimate interest / Legal obligation"],
            ["Legal compliance (court orders, law enforcement)", "As required", "Legal obligation"],
            ["Improving platform features (anonymised only)", "Aggregated behaviour", "Legitimate interest"],
          ]}
        />
      </LegalSection>

      <LegalSection id="section-4" num="4" title="We Will Never Sell Your Data — Ever">
        <Callout>
          <p className="mb-2">This is not a legal formality. This is a commitment we make to every user.</p>
          <p className="font-bold text-[16px] mb-2">Tiikme does not sell, rent, trade, auction, exchange, or monetise your personal data to any third party for any commercial purpose. Ever.</p>
          <p className="mb-2">Your data will not be sold if we raise funding. It will not be sold if we are acquired. It will not be sold to advertisers. It will not be sold to recruiters beyond what you explicitly make visible on your profile.</p>
          <p>Your data is not our product. You are not our product. Tiikme earns by building a platform professionals trust — not by trading their information.</p>
        </Callout>
      </LegalSection>

      <LegalSection id="section-5" num="5" title="Who We Share Your Data With (Limited, Specific Cases Only)">
        <Sub>5.1 Other Tiikme Users</Sub>
        <P>Your public profile information (name, role, location, photo) is visible to other users based on your privacy settings. You control who sees what in Settings → Privacy.</P>
        <Sub>5.2 Organisations You Engage With</Sub>
        <P>When you apply to an opportunity or connect with an organisation, the profile information you have set to "visible to recruiters" is shared with that organisation for the purpose of that specific engagement only.</P>
        <Sub>5.3 Technology Service Providers (Processors)</Sub>
        <P>We use Supabase (database and storage) and limited other providers for email delivery. These providers act under our strict instructions, are bound by data processing agreements, and are prohibited from using your data for their own purposes.</P>
        <Sub>5.4 Legal Obligations</Sub>
        <P>We may disclose data when compelled by a valid court order, subpoena, or statutory requirement under Indian law. We will notify you before such disclosure where legally permitted.</P>
        <Sub>5.5 Business Transfer</Sub>
        <P>In a merger or acquisition, user data may transfer to the successor entity. You will be notified 30 days in advance with the option to delete your account before the transfer.</P>
        <Sub>5.6 What We Will Never Share</Sub>
        <List items={[
          "Your data with advertisers for targeted advertising",
          "Your private messages (Pings) with anyone except upon a valid court order",
          "Your verification documents with your employer or any third party",
          "Your location or contact details beyond what you publicly display",
        ]} />
      </LegalSection>

      <LegalSection id="section-6" num="6" title="Your Rights Under the DPDP Act, 2023">
        <P>India's Digital Personal Data Protection Act, 2023 gives you the following rights:</P>
        <P><strong>Right to Access:</strong> Request a complete copy of all personal data Tiikme holds about you. We will provide it within 30 days.</P>
        <P><strong>Right to Correction:</strong> Request correction of any inaccurate or incomplete personal data. We will update it within 7 days.</P>
        <P><strong>Right to Erasure:</strong> Request permanent deletion of your personal data. Process described in Terms Section 6. Processed within 90 days.</P>
        <P><strong>Right to Portability:</strong> Request your data in a structured, machine-readable format (JSON/CSV) for transfer to another platform. Available via Settings → Download My Data.</P>
        <P><strong>Right to Withdraw Consent:</strong> Withdraw consent for any specific data processing at any time. Note: this may disable certain Platform features that depend on that data.</P>
        <P><strong>Right to Grievance Redressal:</strong> If you believe your data rights have been violated, you may raise a complaint. We will respond within 30 days. If unresolved, you may approach India's Data Protection Board once it is established.</P>
        <P><strong>Right to Nominate:</strong> Under the DPDP Act, you may nominate another person to exercise your data rights on your behalf in the event of your incapacity or death. Email contact@tiikme.com to register a nominee.</P>
        <Sub>How to Exercise Your Rights</Sub>
        <P>Email <a href="mailto:contact@tiikme.com" className="text-orange-600 underline">contact@tiikme.com</a> with subject: "Data Rights Request — [Your Username]"</P>
        <P>We will verify your identity before processing the request and respond within 30 days.</P>
      </LegalSection>

      <LegalSection id="section-7" num="7" title="Data Retention">
        <Table
          headers={["Data Type", "How Long We Keep It"]}
          rows={[
            ["Active account data", "Retained while your account is active"],
            ["Deleted account data", "Removed within 90 days of permanent deletion"],
            ["Verification documents", "12 months after verification, then permanently deleted"],
            ["Legal hold data", "As required by Indian law (court orders, tax)"],
            ["Private messages (Pings)", "Deleted with your account (not retained after deletion)"],
            ["Anonymised analytics", "Indefinitely (cannot identify you)"],
            ["Terms consent record", "5 years (legal requirement)"],
          ]}
        />
      </LegalSection>

      <LegalSection id="section-8" num="8" title="Security">
        <P>We protect your data with:</P>
        <List items={[
          "HTTPS/TLS encryption for all data in transit",
          "Encrypted storage for sensitive fields (passwords, verification documents)",
          "Row-Level Security (RLS) on all database tables — each user can only access their own data",
          "Role-based access controls — only authorised Tiikme team members can access user data, and only for specific operational purposes",
          "Regular security audits and vulnerability assessments",
        ]} />
        <P>In the event of a personal data breach that poses risk to your rights, we will notify affected users within 30 days of becoming aware, as required by the DPDP Act, 2023. Notification will be sent to your registered email.</P>
        <P><strong>Important:</strong> No system is completely secure. While we take every reasonable precaution, we cannot guarantee absolute security of data transmitted over the internet. You should use a strong, unique password and enable two-factor authentication where available.</P>
      </LegalSection>

      <LegalSection id="section-9" num="9" title="Cookies and Tracking">
        <Sub>Essential Cookies (always active)</Sub>
        <List items={[
          "Session management (keeps you logged in)",
          "Security tokens (prevent CSRF attacks)",
          "Your preferences (theme, language, settings)",
        ]} />
        <Sub>What We Do NOT Use</Sub>
        <List items={[
          "Third-party advertising cookies",
          "Cross-site tracking pixels",
          "Social media tracking (Facebook Pixel, Google Ads tags)",
          "Behavioural profiling for advertising",
        ]} />
        <P>You can manage cookie preferences in your browser settings. Disabling essential cookies will prevent login and basic Platform functionality.</P>
      </LegalSection>

      <LegalSection id="section-10" num="10" title="Children's Privacy">
        <P>Tiikme is not designed for users under 18. We do not knowingly collect personal data from children under 18 without verified parental or guardian consent. If we discover that a child under 18 has provided personal data without consent, we will delete it within 72 hours. If you are a parent and believe your child has created an account, contact contact@tiikme.com immediately.</P>
      </LegalSection>

      <LegalSection id="section-11" num="11" title="Changes to This Policy">
        <P>We will update this policy as needed. For material changes — meaning changes that significantly affect how we use your data — we will notify you by email and in-app notification at least 15 days before the changes take effect. The "Last Updated" date at the top of this page will always reflect the most recent revision.</P>
      </LegalSection>

      <LegalSection id="section-12" num="12" title="Contact">
        <P>All privacy-related queries, requests, and complaints:</P>
        <P>Email: <a href="mailto:contact@tiikme.com" className="text-orange-600 underline">contact@tiikme.com</a></P>
        <P>Alternate: <a href="mailto:contact@veenavarse.com" className="text-orange-600 underline">contact@veenavarse.com</a></P>
        <P>Subject line for data requests: "Data Rights Request — [Your Username]"</P>
        <P>We aim to resolve all privacy concerns promptly and transparently. If you are not satisfied with our response, you may approach India's Data Protection Board once it is constituted under the DPDP Act, 2023.</P>
      </LegalSection>
    </LegalPageLayout>
  );
}
