import LegalPageLayout, { LegalSection, Callout, Warning, type TocItem } from "@/components/legal/LegalPageLayout";
import { PageSEO } from "@/hooks/usePageSEO";

const toc: TocItem[] = [
  { id: "section-1", label: "1. Who We Are" },
  { id: "section-2", label: "2. Eligibility" },
  { id: "section-3", label: "3. What Tiikme Will Never Do" },
  { id: "section-4", label: "4. No Outcome Guarantee" },
  { id: "section-5", label: "5. Your Account" },
  { id: "section-6", label: "6. Account Deletion" },
  { id: "section-7", label: "7. Content You Create" },
  { id: "section-8", label: "8. What You Must Not Do" },
  { id: "section-9", label: "9. Enforcement" },
  { id: "section-10", label: "10. Confidentiality" },
  { id: "section-11", label: "11. Circles" },
  { id: "section-12", label: "12. Organisations" },
  { id: "section-13", label: "13. Intermediary Status" },
  { id: "section-14", label: "14. Disclaimers" },
  { id: "section-15", label: "15. Liability" },
  { id: "section-16", label: "16. Indemnification" },
  { id: "section-17", label: "17. Governing Law" },
  { id: "section-18", label: "18. Changes" },
  { id: "section-19", label: "19. Contact" },
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

export default function Terms() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="April 20, 2025"
      jurisdictionLine="Governed by Laws of India | Jurisdiction: Hyderabad, Telangana"
      toc={toc}
    >
      <PageSEO
        title="Terms of Service — Tiikme"
        description="The legal terms governing your use of Tiikme, India's professional network for students, freelancers, founders, and creators."
        ogTitle="Terms of Service — Tiikme"
        ogDescription="Built for the ones who build. Students, freelancers, founders, creators."
        ogImage="https://tiikme.com/og-image.png"
        twitterCard="summary_large_image"
        canonical="https://tiikme.com/terms"
      />
      <Callout>
        These Terms of Service ("Terms") govern your use of Tiikme, a professional social networking platform operated from India. By signing up or continuing to use Tiikme, you enter into a binding legal agreement with us under the Indian Contract Act, 1872. Please read every section carefully. If you disagree with any part, do not use the Platform.
      </Callout>

      <LegalSection id="section-1" num="1" title="Who We Are and What Tiikme Is">
        <P>Tiikme is a professional social networking platform for students, working professionals, creators, freelancers, and organisations across India. It provides tools for networking, knowledge sharing, community discussions through Circles, and professional opportunity discovery.</P>
        <Sub>Tiikme is NOT:</Sub>
        <List items={[
          "A recruitment agency, staffing firm, or employment exchange",
          "A labour consultant or placement bureau under any Indian law",
          "A party to any employment, internship, freelance, or business agreement between users",
          "A background-check service or credential-verification authority",
          "A guarantor of any professional, financial, or career outcome",
        ]} />
        <Callout>Tiikme provides the platform. Your professional success depends entirely on you — the effort you put in, how honestly you represent yourself, and how you engage with others.</Callout>
      </LegalSection>

      <LegalSection id="section-2" num="2" title="Eligibility">
        <P>You may use Tiikme if:</P>
        <List items={[
          "You are at least 18 years of age (users between 13–17 may use the Platform only with verified parental consent and restricted access)",
          "You have the legal capacity to enter into binding contracts under Indian law",
          "You are not subject to a court order prohibiting you from using social networking platforms",
          "You have not been permanently banned from Tiikme in the past",
        ]} />
        <P>Organisation accounts additionally require the person creating the account to be authorised to legally represent the organisation.</P>
      </LegalSection>

      <LegalSection id="section-3" num="3" title="What Tiikme Will Never Do">
        <Callout>
          <p className="font-bold text-[16px] mb-2">TIIKME WILL NEVER ASK YOU FOR MONEY.</p>
          <p className="mb-2">Creating an account, joining Circles, browsing the Feed, connecting with professionals, and applying to Opportunities are all free. We will not charge you to use any core feature of the Platform now or in the future without advance notice and your explicit consent.</p>
          <p className="mb-2">If you receive any communication — email, WhatsApp, phone call, SMS, or any other channel — claiming to be from Tiikme and asking you for:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Registration or account activation fees</li>
            <li>Profile verification charges</li>
            <li>Application processing fees</li>
            <li>"Premium access" without you initiating a subscription</li>
            <li>Any advance payment of any kind</li>
          </ul>
          <p className="mb-2">That communication is FRAUDULENT. Tiikme did not send it. We are not responsible for it.</p>
          <p>Report all such incidents immediately to: <a href="mailto:contact@tiikme.com" className="underline text-orange-600">contact@tiikme.com</a> or <a href="mailto:contact@veenavarse.com" className="underline text-orange-600">contact@veenavarse.com</a></p>
        </Callout>
        <P>This policy extends to every organisation and recruiter on Tiikme. Organisations are strictly prohibited from requesting any payment from applicants at any stage of the application, interview, or hiring process conducted through this Platform.</P>
      </LegalSection>

      <LegalSection id="section-4" num="4" title="No Guarantee of Professional Outcomes">
        <Callout>
          <p className="mb-2">Tiikme makes no guarantee, express or implied, that:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>You will receive a job offer, internship, project, or any other opportunity</li>
            <li>Any application you submit will receive a response</li>
            <li>Any connection you make will lead to a professional relationship</li>
            <li>Any Circle you join will advance your career or income</li>
            <li>Any verification badge on your profile will be accepted by any employer or institution</li>
            <li>The Feed, Explore, or Opportunity algorithms will surface your profile to the right people</li>
          </ul>
          <p className="font-bold">YOUR ABILITY, YOUR RESULTS. Tiikme is a tool. What you build with it is entirely up to you.</p>
        </Callout>
      </LegalSection>

      <LegalSection id="section-5" num="5" title="Your Account">
        <Sub>5.1 Accurate Information</Sub>
        <P>You must provide truthful, accurate, and current information when registering and maintaining your profile. Impersonation, false credentials, fake work history, and misleading profile content are strictly prohibited.</P>
        <Sub>5.2 One Account</Sub>
        <P>Each individual may hold only one personal Tiikme account. Creating multiple accounts to circumvent a ban or exploit the platform is prohibited and will result in permanent termination of all associated accounts.</P>
        <Sub>5.3 Account Security</Sub>
        <P>You are solely responsible for keeping your login credentials confidential. You must notify Tiikme immediately at contact@tiikme.com upon suspecting unauthorised access. Tiikme will not be liable for any loss arising from your failure to secure your credentials.</P>
        <Sub>5.4 Tiikme's Right to Suspend</Sub>
        <P>We may suspend or restrict your account, with or without prior notice, if we reasonably believe you have violated these Terms, engaged in fraud or impersonation, or posed a risk to other users' safety.</P>
      </LegalSection>

      <LegalSection id="section-6" num="6" title="Account Deletion">
        <P>You may delete your account at any time through: Profile → Settings → Legal → Delete My Account.</P>
        <P>The deletion process works as follows:</P>
        <Sub>Step 1 — Grace Period (Days 1–30)</Sub>
        <P>After you request deletion, your account enters a 30-day grace period. During this time, your profile is hidden from other users but your data is preserved. You may reactivate your account at any time within these 30 days by logging in.</P>
        <Sub>Step 2 — Permanent Deletion (Days 31–90)</Sub>
        <P>After 30 days with no reactivation, permanent deletion begins. This cannot be undone. Within 90 days of this point, the following data is permanently removed:</P>
        <List items={[
          "Your profile, photo, bio, and all personal details",
          "All posts you created (Feed and Circles)",
          "All direct messages (Pings) you sent",
          "Your connection history",
          "All verification documents you submitted",
          "Your notification history",
        ]} />
        <Sub>Step 3 — What Remains After Deletion</Sub>
        <List items={[
          "Comments you left on others' posts may remain as \"[Deleted User] said:\" without identifying you",
          "Anonymised, aggregated analytics data (cannot identify you individually)",
          "Data required to be retained by Indian law (e.g., court orders, tax records if applicable)",
          "Verification records required for legal compliance (retained for 12 months in anonymised form)",
        ]} />
        <Sub>Step 4 — Confirmation</Sub>
        <P>You will receive an email confirmation when permanent deletion is complete.</P>
        <Warning>Deletion is permanent and irreversible after the 30-day grace period. Download a copy of your data before deleting. Go to Settings → Download My Data.</Warning>
      </LegalSection>

      <LegalSection id="section-7" num="7" title="Content You Create">
        <Sub>7.1 You Own Your Content</Sub>
        <P>Everything you post on Tiikme — posts, comments, Circle discussions, profile information — remains your intellectual property.</P>
        <Sub>7.2 Licence to Tiikme</Sub>
        <P>By posting, you grant Tiikme a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote your content within the Platform for the purpose of providing the service. This licence ends when you delete the content or your account. Tiikme will not modify your content or use it for advertising without your separate explicit consent.</P>
        <Sub>7.3 Deleted Content</Sub>
        <P>If you delete a post, it will be removed from public view within 24 hours. Reactions and comments made by other users on your post may remain in their own activity history in anonymised form.</P>
      </LegalSection>

      <LegalSection id="section-8" num="8" title="What You Must Not Do (Professional Conduct Standards)">
        <P>The following conduct is strictly prohibited on Tiikme. Violations result in the enforcement actions described in Section 9.</P>
        <Sub>8.1 Identity and Misrepresentation</Sub>
        <List items={[
          "Creating a false identity or impersonating another person, professional, or organisation",
          "Misrepresenting your qualifications, work experience, education, or professional credentials",
          "Claiming endorsement or affiliation with Tiikme, its founders, or its partners",
          "Using fake profile photos, AI-generated faces, or stolen images as your avatar",
          "Creating or operating bot accounts for automated engagement (likes, follows, posts)",
        ]} />
        <Sub>8.2 Scraping and Technical Abuse</Sub>
        <List items={[
          "Scraping, crawling, or bulk-downloading user profiles, posts, or contact information using automated tools",
          "Reverse-engineering the Platform's algorithms, APIs, or security systems",
          "Uploading malware, viruses, or harmful code",
          "Attempting to gain unauthorised access to other users' accounts or Tiikme's systems",
          "Using the Platform to send unsolicited bulk messages (spam) to other users",
        ]} />
        <Sub>8.3 Harmful Content</Sub>
        <List items={[
          "Posting false, defamatory, or misleading information about any person or organisation",
          "Publishing content that harasses, threatens, intimidates, or bullies any individual",
          "Sharing content that discriminates against any person based on caste, religion, gender, sexual orientation, race, nationality, disability, or socioeconomic status",
          "Uploading sexually explicit, obscene, or pornographic material",
          "Revealing private information about another person without their consent (doxxing)",
          "Publishing non-consensual intimate images (NCII) of any person",
          "Creating or sharing content that incites violence, communal hatred, or illegal activity",
          "Reproducing, distributing, or plagiarising another person's copyrighted work without permission",
          "Posting AI-generated, synthetic, or deepfake content without clearly labelling it as such",
        ]} />
        <Sub>8.4 Financial Misconduct</Sub>
        <List items={[
          "Promoting pyramid schemes, Ponzi schemes, multi-level marketing, or fraudulent investment opportunities",
          "Requesting money from other users under any pretext",
          "Impersonating a recruiter or employer to extract payment from job-seekers",
          "Posting fake job opportunities designed to collect personal information or payments",
        ]} />
        <Sub>8.5 Regulatory Violations</Sub>
        <List items={[
          "Posting content that violates any applicable Indian law, including the Indian Penal Code, Information Technology Act 2000, SEBI regulations, RBI guidelines, or any sector-specific regulation",
          "Sharing material that is the subject of an active court injunction",
          "Posting content that prejudices ongoing court proceedings (contempt of court)",
        ]} />
      </LegalSection>

      <LegalSection id="section-9" num="9" title="Enforcement">
        <P>Tiikme enforces these Terms through a graduated system:</P>
        <P><strong>First Violation — Warning:</strong> Content removed. User notified with specific reason and corrective guidance.</P>
        <P><strong>Second Violation — 7-Day Suspension:</strong> Account suspended. User notified by email. Appeal available.</P>
        <P><strong>Third Violation — 30-Day Suspension:</strong> Account suspended. User notified by email with final warning. Appeal available within 7 days.</P>
        <P><strong>Fourth Violation or Serious Single Violation — Permanent Termination:</strong> Account permanently closed. Data deletion process begins. No appeal for the following: NCII posting, doxxing, child exploitation content, impersonation for financial fraud, or creation of bot networks.</P>
        <P>Tiikme reserves the right to skip earlier tiers for serious violations and move directly to permanent termination.</P>
        <P><strong>Appeal Process:</strong> Email appeals@tiikme.com within 7 days of suspension. We respond within 5 business days.</P>
      </LegalSection>

      <LegalSection id="section-10" num="10" title="Confidential Information and Workplace Discussions">
        <Warning>
          <p className="mb-2">If you post about your workplace, employer, clients, or colleagues in Circles or the Feed, you are solely responsible for ensuring that your posts do not violate:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your employment agreement's confidentiality and NDA clauses</li>
            <li>Trade secret protections applicable to your industry</li>
            <li>Regulatory restrictions on information disclosure (banking, healthcare, defence, telecom)</li>
            <li>Any court order or settlement agreement binding you to silence</li>
            <li>The privacy rights of colleagues, clients, or business partners you may identify</li>
          </ul>
        </Warning>
        <P>Tiikme does not pre-screen posts for confidentiality violations. We provide the platform; we do not know the terms of your employment contract.</P>
        <Sub>10.1 What Constitutes Confidential Information</Sub>
        <List items={[
          "Unpublished financial data (revenues, projections, losses, valuations)",
          "Business strategy, product roadmaps, or expansion plans before public announcement",
          "Client lists, customer contracts, or pricing arrangements",
          "Internal HR matters including colleague salaries (unless you are legally permitted to share)",
          "Merger and acquisition plans, fundraising details, or board decisions",
          "Proprietary technology, algorithms, formulas, or processes",
          "Information explicitly marked \"Confidential\" or \"Proprietary\" by your employer",
          "Internal communications (emails, Slack messages, meeting minutes) without consent",
        ]} />
        <Sub>10.2 Tiikme Is Not Responsible</Sub>
        <P>If your posts breach your employment contract, NDA, or any legal obligation, all legal and financial consequences are yours alone. Tiikme will NOT:</P>
        <List items={[
          "Delete posts to help you avoid consequences after you are caught",
          "Claim your post was anonymous to protect you from your employer",
          "Defend you in legal proceedings brought by your employer or third parties",
          "Pay damages or compensation arising from your disclosure",
        ]} />
        <Sub>10.3 Anonymity Is Not Guaranteed</Sub>
        <P>Even in semi-anonymous Circles, your company, role, city, tenure, or writing style may allow you or your employer to be identified. Do not assume anonymity protects you legally. A court order can compel Tiikme to disclose identifying information about accounts.</P>
      </LegalSection>

      <LegalSection id="section-11" num="11" title="Circles — Community Standards">
        <P>Circles are professional discussion communities on Tiikme. They are not anonymous forums and are not protected by any legal privilege.</P>
        <P>Content in Circles reflects individual user views, not Tiikme's. Tiikme does not endorse, verify, or vouch for any advice, opinion, or claim shared in any Circle.</P>
        <P>Do not treat Circle posts as professional, legal, medical, or financial advice. Consult qualified professionals for decisions affecting your health, finances, career, or legal rights.</P>
        <P><strong>Circle Moderation:</strong> Circle moderators may remove off-topic, harmful, or violating content. If you believe content was wrongly removed, email circles@tiikme.com within 7 days.</P>
      </LegalSection>

      <LegalSection id="section-12" num="12" title="Terms for Organisations">
        <P>These additional terms apply specifically to Organisation accounts on Tiikme.</P>
        <Sub>12.1 Eligibility</Sub>
        <P>Organisation accounts may only be created by legally registered entities — companies registered under the Companies Act 2013, LLPs, partnerships, educational institutions, NGOs, trusts, and startups with valid CIN/registration. The creating person must be authorised to represent the organisation.</P>
        <Sub>12.2 Accurate Representation</Sub>
        <P>Organisations must accurately state their legal name, registration number, sector, employee count range, and registered address. Tiikme may request verification documents at any time.</P>
        <Sub>12.3 Opportunity Posting Rules — Non-Negotiable</Sub>
        <List items={[
          "All posted opportunities must be genuine, active, and accurately described",
          "Compensation, role scope, location, and eligibility must be truthfully stated",
          "Expired or filled positions must be removed promptly or marked closed",
          "Applications must receive a response or formal rejection within 30 days where practically possible",
        ]} />
        <Sub>12.4 Absolute Prohibition on Fees from Applicants</Sub>
        <P>Organisations categorically agree they will NOT, directly or indirectly, request, suggest, or accept any payment from any applicant for any purpose at any stage — including registration, application, training, equipment, background checks, or onboarding. Any organisation found violating this rule will be immediately and permanently banned from Tiikme and may be reported to the Ministry of Labour and Employment.</P>
        <Sub>12.5 Verified Badge</Sub>
        <P>The Verified badge confirms Tiikme reviewed submitted documents. It does NOT guarantee the organisation's financial stability, operational status, legal compliance, or quality of employment. Verification can be revoked at any time if information is found to be false or outdated.</P>
        <Sub>12.6 Admin Responsibility</Sub>
        <P>The organisation is jointly liable for all content posted by any of its admins or team members under the organisation account.</P>
        <Sub>12.7 Circle Creation</Sub>
        <P>Verified organisations may create community Circles linked to their organisation. These Circles must remain professionally relevant. Circles used for spam, promotion outside Tiikme's guidelines, or misleading recruitment will be permanently removed.</P>
        <Sub>12.8 Organisation Termination</Sub>
        <P>Tiikme may terminate an organisation's account if it: posts fraudulent opportunities, requests money from applicants, repeatedly violates Terms, misrepresents its registration status, or receives sustained user complaints.</P>
      </LegalSection>

      <LegalSection id="section-13" num="13" title="Tiikme's Intermediary Status — Section 79, IT Act 2000">
        <P>Tiikme is an intermediary within the meaning of Section 79 of the Information Technology Act, 2000 and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</P>
        <P>This means:</P>
        <List items={[
          "Tiikme hosts and transmits user-generated content but does NOT create, initiate, or modify it",
          "Tiikme does NOT control what individual users post",
          "Tiikme's liability for user-generated content is limited by law",
        ]} />
        <P>Therefore: Any claim arising from a user's post — whether for defamation, privacy violation, IP infringement, breach of confidentiality, or harassment — must be directed at the user who created the content, NOT at Tiikme.</P>
        <P>Tiikme's responsibility is limited to: removing content upon receiving a valid legal notice within 36 hours; suspending repeat offenders; and cooperating with law enforcement as required by Indian law.</P>
        <Sub>Content Removal Process</Sub>
        <P>To report content that violates Indian law or these Terms, email: reports@tiikme.com with: your name and contact information, the exact URL or post ID, the specific law or clause violated, and a description of how it harms you. We review within 12 hours and act within 36 hours of receiving a valid notice. False or malicious reports may result in action against the reporter.</P>
      </LegalSection>

      <LegalSection id="section-14" num="14" title="Multi-Level Disclaimers">
        <Sub>14.1 Verification Badges</Sub>
        <P>A Verified badge does NOT mean Tiikme endorses the person or organisation; that qualifications are accurate; that employment history is confirmed; that the person's professional conduct is endorsed; or that the badge will be recognised by third parties.</P>
        <Sub>14.2 Opportunity Listings</Sub>
        <P>Tiikme does NOT verify company legitimacy, financial stability, job authenticity, compensation accuracy, legal compliance with labour laws, or that applications will receive responses.</P>
        <Sub>14.3 Circle Content</Sub>
        <P>Tiikme does NOT verify the accuracy of advice or information shared in Circles; the professional qualifications of those posting; factual claims about companies, industries, or individuals.</P>
        <Sub>14.4 User Connections</Sub>
        <P>Tiikme does NOT verify user identities in real time; conduct background checks; or assume liability for misuse of personal information shared in private messages or connections.</P>
      </LegalSection>

      <LegalSection id="section-15" num="15" title="Limitation of Liability">
        <P>To the maximum extent permitted by applicable Indian law, Tiikme is not liable for: loss of income, employment, business, or professional opportunity; fraud, scams, or misconduct by other users; accuracy of user-generated content; defamatory statements made by users; breach of confidentiality by users; interruption or unavailability of the Platform; data loss due to technical failure despite reasonable security measures; or any indirect, incidental, special, or consequential damages of any kind.</P>
        <P>Tiikme's maximum total liability to any user in any circumstance shall not exceed the greater of: fees paid by that user to Tiikme in the 12 months before the claim, or ₹5,000.</P>
      </LegalSection>

      <LegalSection id="section-16" num="16" title="Indemnification">
        <P>You agree to indemnify and hold harmless Tiikme, its founders, officers, employees, and advisors from any third-party claim, loss, damage, or expense (including legal fees) arising from: your content; your violation of these Terms; your violation of Indian law; your breach of any employment agreement, NDA, or confidentiality obligation; your impersonation or fraud; or your misuse of another person's data or identity on this Platform.</P>
        <P>This indemnification does not apply if Tiikme directly caused or contributed to the violation.</P>
      </LegalSection>

      <LegalSection id="section-17" num="17" title="Governing Law and Dispute Resolution">
        <P>These Terms are governed exclusively by the laws of India. All disputes arising from use of this Platform shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana, India.</P>
        <P>Before initiating any legal proceedings, parties agree to attempt good-faith resolution by writing to contact@tiikme.com. If unresolved within 30 days, either party may proceed with formal legal remedies.</P>
      </LegalSection>

      <LegalSection id="section-18" num="18" title="Changes to These Terms">
        <P>Tiikme may update these Terms. For material changes, we will notify you via email and in-app notification at least 15 days before they take effect. Continued use after that date constitutes acceptance. For minor clarifications, we will update the "Last Updated" date without separate notice.</P>
      </LegalSection>

      <LegalSection id="section-19" num="19" title="Contact">
        <div className="space-y-1.5 text-[14.5px]">
          <P>General queries: <a href="mailto:contact@tiikme.com" className="text-orange-600 underline">contact@tiikme.com</a></P>
          <P>Alternate contact: <a href="mailto:contact@veenavarse.com" className="text-orange-600 underline">contact@veenavarse.com</a></P>
          <P>Content reports: <a href="mailto:reports@tiikme.com" className="text-orange-600 underline">reports@tiikme.com</a></P>
          <P>Circle appeals: <a href="mailto:circles@tiikme.com" className="text-orange-600 underline">circles@tiikme.com</a></P>
          <P>Enforcement appeals: <a href="mailto:appeals@tiikme.com" className="text-orange-600 underline">appeals@tiikme.com</a></P>
          <P>Data rights: <a href="mailto:contact@tiikme.com" className="text-orange-600 underline">contact@tiikme.com</a> (Subject: "Data Rights Request")</P>
          <P>Response time: 3 business days for general queries</P>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
