import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions — tiikme',
  description: 'Terms and Conditions governing the use of the tiikme platform.',
}

const EFFECTIVE = 'June 22, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[16px] font-black text-orange-500 tracking-tight">tiikme</Link>
          <div className="flex items-center gap-4 text-[13px] text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-3">Legal</p>
        <h1 className="text-[36px] font-black text-gray-900 leading-tight mb-2">Terms &amp; Conditions</h1>
        <p className="text-[13px] text-gray-500 mb-10">Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}</p>

        <div className="prose prose-gray max-w-none space-y-10 text-[14.5px] leading-relaxed text-gray-700">

          <Section title="1. Introduction and Acceptance">
            <p>
              These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you
              (&quot;User&quot;, &quot;Talent&quot;, &quot;Organisation&quot;, or &quot;you&quot;) and <strong>Veenavarse</strong>
              (&quot;tiikme&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), incorporated under the laws of India, with respect
              to your use of the tiikme platform, website, mobile applications, and all related services
              (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              By registering, accessing, or using the Platform in any manner, you confirm that you have
              read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not
              agree to these Terms, you must not access or use the Platform.
            </p>
            <p>
              We may update these Terms from time to time. Material changes will be notified via email or
              an in-app notification at least 14 days before they take effect. Continued use after the
              effective date constitutes acceptance.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>You may use the Platform only if you:</p>
            <ul>
              <li>Are at least 18 years of age (or the age of majority in your jurisdiction, whichever is higher);</li>
              <li>Have the legal capacity to enter into a binding contract;</li>
              <li>Are not barred from using the Platform under applicable law; and</li>
              <li>For Organisations: are an authorised representative with the authority to bind your organisation.</li>
            </ul>
            <p>
              tiikme reserves the right to refuse service, terminate accounts, or remove content at its
              sole discretion, including where a user provides false eligibility information.
            </p>
          </Section>

          <Section title="3. Description of Services">
            <p>tiikme is a career intelligence and verified talent-matching platform that provides:</p>
            <ul>
              <li><strong>Flex Profiles:</strong> Structured, squad-verified career profiles for job-seekers and professionals.</li>
              <li><strong>Squad Verification:</strong> A peer-endorsement system where colleagues co-sign experience and skills.</li>
              <li><strong>Tiik AI:</strong> An AI-powered career assistant that provides personalised job matching, skill-gap analysis, and career guidance.</li>
              <li><strong>Level Up:</strong> A marketplace for courses, certifications, and hackathons that can be added to a user&apos;s Flex profile.</li>
              <li><strong>Talent Discovery:</strong> Tools for Organisations to discover and request introductions to verified candidates.</li>
              <li><strong>Application Management:</strong> Infrastructure for managing job applications, Flex access requests, and interview workflows.</li>
            </ul>
            <p>
              tiikme continually evolves its features. We may add, modify, or discontinue features at any
              time with reasonable notice.
            </p>
          </Section>

          <Section title="4. Accounts and Registration">
            <p>
              When you create an account, you agree to provide accurate, current, and complete information.
              You are responsible for maintaining the confidentiality of your login credentials and for all
              activities that occur under your account.
            </p>
            <p>
              You must notify us immediately at <a href="mailto:security@tiikme.com" className="text-orange-500 hover:underline">security@tiikme.com</a> of
              any unauthorised use or breach of your account. tiikme shall not be liable for any loss or
              damage arising from your failure to safeguard your credentials.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in
              fraudulent activity, or are inactive for an extended period, subject to applicable law.
            </p>
          </Section>

          <Section title="5. User-Generated Content and Flex Profiles">
            <p>
              Users retain ownership of the content they upload to the Platform, including profile
              information, work history, documents, and media (&quot;User Content&quot;). By submitting User
              Content, you grant tiikme a worldwide, non-exclusive, royalty-free, sublicensable, and
              transferable licence to use, reproduce, distribute, display, and process that content solely
              for the purpose of operating, improving, and promoting the Platform.
            </p>
            <p>You represent and warrant that:</p>
            <ul>
              <li>All information on your Flex profile is truthful, accurate, and not misleading;</li>
              <li>You have the right to post any content you upload, including images and documents;</li>
              <li>Your content does not infringe any third party&apos;s intellectual property, privacy, or other rights; and</li>
              <li>Your content complies with all applicable laws.</li>
            </ul>
            <p>
              <strong>Squad Verification is a social endorsement system.</strong> While tiikme facilitates
              peer co-signing, it does not independently verify the accuracy of any experience, credential,
              or skill listed on a Flex profile. Endorsements reflect the subjective views of the
              endorsers. tiikme expressly disclaims any warranty regarding the accuracy or completeness of
              squad-verified content.
            </p>
          </Section>

          <Section title="6. Tiik AI — Disclaimers and Limitations">
            <p>
              Tiik is an AI-powered assistant designed to provide career guidance, job matching suggestions,
              skill-gap analysis, and course recommendations. You acknowledge and agree that:
            </p>
            <ul>
              <li>
                <strong>Tiik&apos;s outputs are informational only</strong> and do not constitute professional career
                counselling, legal, financial, or employment advice.
              </li>
              <li>
                AI-generated suggestions may be inaccurate, incomplete, or not suitable for your specific
                circumstances. You should exercise independent judgement before acting on any AI output.
              </li>
              <li>
                tiikme does not guarantee that following Tiik&apos;s recommendations will result in job offers,
                interview invitations, salary increases, or any other career outcome.
              </li>
              <li>
                Tiik&apos;s job-match scores, skill-gap assessments, and Trust Score calculations are
                algorithmic estimates and may not reflect actual employer requirements or preferences.
              </li>
              <li>
                You must not use Tiik to generate, submit, or publish content that is deceptive, defamatory,
                or in violation of any applicable law.
              </li>
            </ul>
          </Section>

          <Section title="7. Employment and Hiring — Critical Disclaimers">
            <p>
              <strong>tiikme is a technology platform that facilitates connections between job-seekers and
              organisations. tiikme is NOT an employer, staffing agency, recruitment consultancy, or
              employment intermediary.</strong>
            </p>
            <p>tiikme expressly disclaims all liability for:</p>
            <ul>
              <li>
                <strong>Hiring decisions:</strong> All recruitment, selection, and hiring decisions are made
                solely by the Organisation. tiikme has no control over and bears no responsibility for any
                employer&apos;s decision to hire, reject, or fail to respond to any candidate.
              </li>
              <li>
                <strong>Job offer accuracy:</strong> tiikme does not verify the accuracy of job postings,
                salary ranges, benefits, or descriptions provided by Organisations. Users apply at their
                own risk.
              </li>
              <li>
                <strong>Employment outcomes:</strong> tiikme does not guarantee that using the Platform will
                result in employment, interviews, salary negotiations, promotions, or any specific career
                outcomes.
              </li>
              <li>
                <strong>Employer conduct:</strong> tiikme is not responsible for any employer&apos;s conduct
                during or after the recruitment process, including discrimination, harassment, or failure
                to honour offers.
              </li>
              <li>
                <strong>Third-party courses and certifications:</strong> Level Up content is provided by
                third-party organisations. tiikme does not guarantee the quality, accuracy, or outcomes of
                any course, certification, or hackathon listed on the Platform. Enrolment, fees, and
                completion are governed by the respective provider&apos;s terms.
              </li>
              <li>
                <strong>Salary and compensation:</strong> Any salary data, market benchmarks, or
                compensation estimates shown on the Platform are indicative only and should not be relied
                upon in negotiations or financial planning.
              </li>
              <li>
                <strong>Reference and background checks:</strong> Squad verifications on tiikme are peer
                endorsements and do not constitute formal employment references or background checks for
                legal, regulatory, or compliance purposes.
              </li>
            </ul>
            <p>
              Users and Organisations agree that tiikme bears no liability whatsoever for the outcome of
              any recruitment process, employment relationship, or commercial engagement initiated through
              the Platform.
            </p>
          </Section>

          <Section title="8. Organisation Accounts and Responsibilities">
            <p>
              Organisations using the Platform to discover talent, post roles, or request Flex access
              agree to:
            </p>
            <ul>
              <li>Use the Platform solely for legitimate recruiting and talent-discovery purposes;</li>
              <li>Not contact candidates outside the Platform&apos;s consent-based introduction system;</li>
              <li>Comply with all applicable employment, anti-discrimination, and data protection laws (including but not limited to the Indian Discrimination (Employment and Occupation) Act and IT Act, 2000);</li>
              <li>Not misrepresent job descriptions, compensation, or company details;</li>
              <li>Obtain proper internal authorisation before using the Platform to access candidate data;</li>
              <li>Not share, sell, or transfer any candidate data obtained via the Platform to third parties without explicit consent; and</li>
              <li>Ensure all personnel accessing the Platform on the organisation&apos;s behalf are bound by these Terms.</li>
            </ul>
            <p>
              tiikme reserves the right to suspend or terminate any Organisation account that engages in
              spamming candidates, posting fraudulent roles, or any conduct that harms the tiikme
              community.
            </p>
          </Section>

          <Section title="9. Candidate Privacy and Consent">
            <p>
              Candidates retain full control over who can view their Flex profile. Organisations may only
              view a candidate&apos;s full Flex (including contact information) after the candidate explicitly
              approves an access request. tiikme will not circumvent this consent mechanism.
            </p>
            <p>
              Candidates may withdraw their consent and remove their Flex profile from active talent pools
              at any time through the Platform settings. Withdrawal does not retroactively revoke access
              already granted to Organisations prior to withdrawal.
            </p>
          </Section>

          <Section title="10. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul>
              <li>Upload false, misleading, defamatory, obscene, or harmful content;</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with any organisation;</li>
              <li>Scrape, crawl, or harvest data from the Platform by automated means without our written consent;</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or another user&apos;s account;</li>
              <li>Use the Platform to distribute spam, malware, or unsolicited communications;</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform;</li>
              <li>Use the Platform in any manner that could disable, overburden, or impair the infrastructure;</li>
              <li>Engage in any activity that violates applicable law, including anti-bribery, anti-corruption, or export control laws;</li>
              <li>Use AI-generated content to fabricate or misrepresent work experience or skills on a Flex profile; or</li>
              <li>Use another person&apos;s identity, credentials, or squad verifications without their knowledge and consent.</li>
            </ul>
          </Section>

          <Section title="11. Intellectual Property">
            <p>
              The Platform, its design, software, trademarks, trade names, logos, and all content
              produced by tiikme are the exclusive property of Veenavarse and are
              protected by applicable intellectual property laws. You are granted a limited,
              non-exclusive, non-transferable, revocable licence to access and use the Platform for its
              intended purposes. No other rights are granted.
            </p>
            <p>
              You may not reproduce, distribute, modify, create derivative works from, publicly display,
              or exploit any part of the Platform or tiikme&apos;s proprietary content without express
              written permission.
            </p>
          </Section>

          <Section title="12. Payments and Subscriptions">
            <p>
              Certain features of the Platform (&quot;Premium Features&quot;) may require payment. By subscribing
              to or purchasing Premium Features, you agree to pay all applicable fees as described at the
              time of purchase. All fees are in Indian Rupees (INR) unless stated otherwise and are
              exclusive of applicable taxes (including GST).
            </p>
            <p>
              Payments are processed by third-party payment processors. tiikme does not store your full
              payment card details. Subscriptions automatically renew unless cancelled before the renewal
              date. Refunds are governed by the refund policy displayed at the time of purchase.
            </p>
          </Section>

          <Section title="13. Disclaimers of Warranties">
            <p>
              THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY
              KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.
            </p>
            <p>
              tiikme does not warrant that: (a) the Platform will be uninterrupted, error-free, or secure;
              (b) any data or content on the Platform is accurate, complete, or up-to-date; or (c) any
              defects will be corrected. You use the Platform at your sole risk.
            </p>
          </Section>

          <Section title="14. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TIIKME, ITS DIRECTORS, EMPLOYEES,
              AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
              PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR IN
              CONNECTION WITH THESE TERMS OR YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              IN NO EVENT SHALL TIIKME&apos;S AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE PLATFORM
              EXCEED THE GREATER OF: (A) THE TOTAL FEES YOU PAID TO TIIKME IN THE 12 MONTHS PRECEDING
              THE CLAIM, OR (B) INR 5,000 (FIVE THOUSAND RUPEES).
            </p>
            <p>
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR THE LIMITATION OF
              LIABILITY, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU IN FULL.
            </p>
          </Section>

          <Section title="15. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless tiikme and its officers, directors,
              employees, agents, licensors, and service providers from and against any claims, liabilities,
              damages, judgements, awards, losses, costs, expenses, or fees (including reasonable legal
              fees) arising out of or relating to: (a) your violation of these Terms; (b) your User
              Content; (c) your use of the Platform; or (d) your violation of any applicable law or the
              rights of any third party.
            </p>
          </Section>

          <Section title="16. Termination">
            <p>
              Either party may terminate these Terms at any time. You may close your account through
              Platform settings. tiikme may suspend or terminate your access immediately, without notice,
              for material breach of these Terms, illegal conduct, or actions that harm the Platform or
              its users.
            </p>
            <p>
              Upon termination, your licence to use the Platform immediately ceases. Sections that by their
              nature survive termination (including Intellectual Property, Limitation of Liability,
              Indemnification, Disclaimers, and Governing Law) shall continue to apply.
            </p>
            <p>
              You may request deletion of your account data in accordance with our Privacy Policy. Certain
              data may be retained as required by law or for legitimate business purposes.
            </p>
          </Section>

          <Section title="17. Third-Party Links and Services">
            <p>
              The Platform may contain links to third-party websites or services, including course
              providers, payment processors, and social platforms. These links are provided for convenience
              only. tiikme has no control over and accepts no responsibility for the content, privacy
              practices, or terms of any third-party site or service. Accessing third-party services is at
              your own risk.
            </p>
          </Section>

          <Section title="18. Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws of India, without
              regard to its conflict of law provisions. Any dispute arising out of or in connection with
              these Terms shall be subject to the exclusive jurisdiction of the courts located in
              Bengaluru, Karnataka, India.
            </p>
            <p>
              Before initiating formal legal proceedings, you agree to attempt to resolve disputes
              informally by contacting us at <a href="mailto:legal@tiikme.com" className="text-orange-500 hover:underline">legal@tiikme.com</a>. We
              will make good-faith efforts to resolve the matter within 30 days.
            </p>
          </Section>

          <Section title="19. Miscellaneous">
            <ul>
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and tiikme regarding the Platform and supersede all prior agreements.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</li>
              <li><strong>Waiver:</strong> No waiver of any breach shall be deemed a waiver of any subsequent breach.</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without tiikme&apos;s prior written consent. tiikme may assign its rights without restriction.</li>
              <li><strong>Force Majeure:</strong> tiikme shall not be liable for delays or failures caused by circumstances beyond its reasonable control, including natural disasters, cyberattacks, government actions, or infrastructure failures.</li>
            </ul>
          </Section>

          <Section title="20. Contact Us">
            <p>For questions about these Terms, please contact:</p>
            <div className="bg-gray-50 border border-gray-200 rounded-[14px] p-5 mt-3 not-prose">
              <p className="font-semibold text-gray-900 text-[14px]">Veenavarse</p>
              <p className="text-[13px] text-gray-600 mt-1">Email: <a href="mailto:legal@tiikme.com" className="text-orange-500 hover:underline">legal@tiikme.com</a></p>
              <p className="text-[13px] text-gray-600">Support: <a href="mailto:hello@tiikme.com" className="text-orange-500 hover:underline">hello@tiikme.com</a></p>
              <p className="text-[13px] text-gray-600 mt-1">Bengaluru, Karnataka, India</p>
            </div>
          </Section>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-gray-400">
          <Link href="/" className="text-[14px] font-black text-orange-500 tracking-tight">tiikme</Link>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-900 font-medium">Terms</Link>
          </div>
          <p>© {new Date().getFullYear()} Veenavarse · made in India</p>
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
