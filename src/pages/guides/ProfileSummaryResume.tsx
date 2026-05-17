import GuideLayout from "./GuideLayout";
import { GUIDES, getRelated } from "./registry";

const meta = GUIDES.find((g) => g.slug === "profile-summary-for-resume")!;

const ProfileSummaryResume = () => (
  <GuideLayout meta={meta} related={getRelated(meta.slug)}>
    <p>
      A profile summary is the three or four lines at the top of your resume.
      Recruiters spend about <strong>six seconds</strong> on a resume before
      deciding to keep reading. Those six seconds are spent here.
    </p>

    <h2>What a profile summary is for</h2>
    <p>
      It is not a mini biography. It is a pitch. The job of the summary is to
      answer three questions before the reader scrolls:
    </p>
    <ul>
      <li><strong>Who are you</strong> — the role and the field.</li>
      <li><strong>What you have done</strong> — one or two real proofs.</li>
      <li><strong>What you want next</strong> — the role you are applying for.</li>
    </ul>

    <h2>The 4-line formula that always works</h2>
    <ol>
      <li><strong>Line 1.</strong> Your professional identity in one sentence.</li>
      <li><strong>Line 2.</strong> One concrete achievement with a number in it.</li>
      <li><strong>Line 3.</strong> Your key skills, named honestly.</li>
      <li><strong>Line 4.</strong> The role or kind of work you are looking for.</li>
    </ol>

    <h2>Example, before and after</h2>
    <div className="example bad">
      <span className="label">Before</span>
      <p>
        Hardworking and passionate professional with strong communication
        skills, seeking a challenging position in a reputed organisation where
        I can utilise my skills and grow.
      </p>
    </div>
    <div className="example good">
      <span className="label">After</span>
      <p>
        Mechanical engineer with 4 years of experience in HVAC design for
        commercial buildings in Bengaluru. Cut energy consumption by 18 percent
        on a 9-floor IT park project through a redesigned chiller layout.
        Strong in AutoCAD, Revit MEP and load calculations. Looking for senior
        design roles with a contractor or consultancy.
      </p>
    </div>

    <h2>Words to remove</h2>
    <p>
      These add nothing and cost you the recruiter's attention. Cut them on
      sight:
    </p>
    <ul>
      <li>Hardworking, passionate, dynamic, dedicated, results-driven.</li>
      <li>"Seeking a challenging position in a reputed organisation."</li>
      <li>"Utilise my skills and contribute to the growth of the company."</li>
    </ul>

    <h2>Words to keep</h2>
    <ul>
      <li>The actual name of your discipline (mechanical, paediatric, GST compliance).</li>
      <li>Years of experience, if you have more than two.</li>
      <li>Numbers — revenue, students taught, patients seen, projects shipped.</li>
      <li>Tools and frameworks by their real names.</li>
    </ul>

    <h2>How long should it be</h2>
    <p>
      Three to four lines. Fifty to ninety words. If it is longer than that, it
      is not a summary, it is a paragraph. Cut.
    </p>

    <h2>A quick checklist before you submit</h2>
    <ul>
      <li>Does it mention the role you are applying for?</li>
      <li>Does it contain at least one number?</li>
      <li>Have you removed every adjective that describes your personality?</li>
      <li>Could a stranger tell what you do, just from the summary?</li>
    </ul>

    <blockquote>
      A resume gets you the interview. A profile summary gets the resume
      opened. Spend a disproportionate amount of time on these four lines.
    </blockquote>
  </GuideLayout>
);

export default ProfileSummaryResume;
