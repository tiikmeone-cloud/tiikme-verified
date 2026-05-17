import GuideLayout from "./GuideLayout";
import { GUIDES, getRelated } from "./registry";

const meta = GUIDES.find((g) => g.slug === "professional-headline-examples")!;

const ProfessionalHeadlineExamples = () => (
  <GuideLayout meta={meta} related={getRelated(meta.slug)}>
    <p>
      A professional headline is the one-line description that sits under your
      name on every professional profile. Most people write "Student at XYZ
      College" or "Looking for opportunities". Both are wastes of the most
      valuable line on your profile.
    </p>

    <h2>What a good headline does</h2>
    <ul>
      <li>Tells a stranger what you do in five seconds.</li>
      <li>Includes the words a recruiter would actually search for.</li>
      <li>Hints at what you want next.</li>
    </ul>

    <h2>The 3-part headline formula</h2>
    <p>
      The format that works for almost everyone:
    </p>
    <blockquote>
      <strong>[What you do]</strong> · <strong>[Where / for whom]</strong> · <strong>[A signal or what you want]</strong>
    </blockquote>

    <h2>Examples by profession</h2>

    <h3>Students and freshers</h3>
    <div className="example good">
      <p>Final-year CS student at IIT Hyderabad · Building developer tools · Looking for SDE-1 roles (2026)</p>
    </div>
    <div className="example good">
      <p>Third-year MBBS student at JIPMER · Interested in public health and rural medicine</p>
    </div>

    <h3>Software</h3>
    <div className="example good">
      <p>Backend engineer · Building payments infra at a YC fintech · Go, Kafka, distributed systems</p>
    </div>
    <div className="example good">
      <p>Senior frontend engineer · 7 years in React and design systems · Open to staff-level roles</p>
    </div>

    <h3>Design</h3>
    <div className="example good">
      <p>Brand designer for early-stage Indian D2C · Identity, packaging, websites · Currently taking 1 project / quarter</p>
    </div>

    <h3>Healthcare</h3>
    <div className="example good">
      <p>Paediatrician · 9 years in a 600-bed hospital, Hyderabad · Special interest in neonatal care</p>
    </div>

    <h3>Education</h3>
    <div className="example good">
      <p>Mathematics teacher · CBSE, classes 9–12 · 12 years · NCERT-certified assessor</p>
    </div>

    <h3>Skilled trades</h3>
    <div className="example good">
      <p>ITI-certified welder · MIG &amp; TIG, automotive fabrication · 10 years on shop floors in Pune</p>
    </div>

    <h3>Finance and law</h3>
    <div className="example good">
      <p>Chartered Accountant · 6 years in direct tax and GST advisory · Big 4 · Open to manager roles</p>
    </div>
    <div className="example good">
      <p>Corporate lawyer · 4 years at a tier-1 firm · M&amp;A and private equity · Looking for in-house roles</p>
    </div>

    <h3>Founders and freelancers</h3>
    <div className="example good">
      <p>Founder · Building a contract-management tool for Indian law firms · Hiring engineer #2</p>
    </div>
    <div className="example good">
      <p>Independent product marketer for SaaS · Pricing, positioning, launches · 4 clients · 2 spots open</p>
    </div>

    <h2>Headlines to avoid</h2>
    <ul>
      <li>"Aspiring [anything]". Either you are or you aren't.</li>
      <li>"Open to opportunities" on its own. Open to <em>what</em>?</li>
      <li>"Self-motivated, results-driven professional." Adjectives are not skills.</li>
      <li>Just your degree. "B.Tech CSE" tells a recruiter nothing.</li>
    </ul>

    <h2>The 60-second test</h2>
    <p>
      Show your headline to a friend. If they cannot tell you what you do for a
      living after reading it once, it is not done yet. Rewrite until they can.
    </p>

    <blockquote>
      A headline is not your job title. It is the first impression you
      control. Spend half an hour on it, not thirty seconds.
    </blockquote>
  </GuideLayout>
);

export default ProfessionalHeadlineExamples;
