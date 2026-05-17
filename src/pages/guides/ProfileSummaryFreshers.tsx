import GuideLayout from "./GuideLayout";
import { GUIDES, getRelated } from "./registry";

const meta = GUIDES.find((g) => g.slug === "profile-summary-for-freshers")!;

const ProfileSummaryFreshers = () => (
  <GuideLayout meta={meta} related={getRelated(meta.slug)}>
    <p>
      You are a fresher. You do not have ten years of experience. That is
      fine. A fresher's summary is supposed to read like a fresher's summary —
      what matters is that it does not read like everyone else's.
    </p>

    <h2>What recruiters are actually looking for</h2>
    <p>
      For a fresher resume, recruiters scan for four things in this order:
    </p>
    <ul>
      <li>Your degree, college and year of graduation.</li>
      <li>One signal that you have built or done something outside coursework.</li>
      <li>The tools or skills you are credible in.</li>
      <li>The role you actually want.</li>
    </ul>

    <h2>The 3-line fresher formula</h2>
    <ol>
      <li><strong>Line 1.</strong> Degree, specialisation, college, expected graduation year.</li>
      <li><strong>Line 2.</strong> One real proof — project, internship, certification, club, paper, freelance work.</li>
      <li><strong>Line 3.</strong> The role you are applying for.</li>
    </ol>

    <h2>Bad fresher summary</h2>
    <div className="example bad">
      <p>
        A dedicated and enthusiastic fresher looking for an entry-level
        position in a dynamic and reputed organisation where I can utilise my
        skills and learn from experienced professionals to contribute to the
        growth of the company.
      </p>
    </div>
    <p>
      Recruiters have read this sentence ten thousand times. It says nothing.
      Compare:
    </p>

    <h2>Good fresher summaries</h2>
    <div className="example good">
      <span className="label">B.Com fresher, applying for analyst roles</span>
      <p>
        Final-year B.Com (Hons) student at Christ University Bengaluru,
        graduating May 2026. Completed a 3-month internship at a chartered
        accountancy firm working on GST returns for 18 SME clients. Comfortable
        with Tally, advanced Excel and basic SQL. Looking for analyst roles in
        audit or finance.
      </p>
    </div>

    <div className="example good">
      <span className="label">Engineering fresher, applying for SDE roles</span>
      <p>
        Final-year B.E. (Electronics &amp; Communication) student at PESIT
        Bangalore. Built a Bluetooth-based attendance system used by my
        department of 240 students for two semesters. Comfortable in C++,
        Python and embedded C. Looking for SDE-1 or embedded-software roles.
      </p>
    </div>

    <div className="example good">
      <span className="label">Nursing fresher</span>
      <p>
        B.Sc. Nursing graduate from KIMS Hyderabad, 2025. Completed clinical
        rotations across paediatrics, OB-GYN and emergency care at a 600-bed
        tertiary hospital. BLS-certified. Looking for staff-nurse roles in
        general medicine or paediatrics.
      </p>
    </div>

    <h2>If you have no internship</h2>
    <p>
      Plenty of strong freshers do not. Substitute with any of the following,
      in roughly this order of credibility:
    </p>
    <ul>
      <li>A live project you built and someone uses.</li>
      <li>A paid freelance gig, even a small one.</li>
      <li>A leadership role in a college club, with a number attached.</li>
      <li>A published research paper or technical blog post.</li>
      <li>A certification from a recognised provider (NPTEL, Coursera, AWS, etc.).</li>
    </ul>

    <h2>What to avoid as a fresher</h2>
    <ul>
      <li>Calling yourself "passionate" without naming what about.</li>
      <li>Listing skills with no context — "Java, C, C++, Python, MySQL, HTML, CSS".</li>
      <li>Saying you want to "learn and grow" — every fresher does. Say what you want to do.</li>
      <li>Mentioning your tenth-class percentage. The recruiter will see it lower down.</li>
    </ul>

    <blockquote>
      A fresher's summary cannot pretend to be experienced. It just has to
      sound like a specific person with a specific plan.
    </blockquote>
  </GuideLayout>
);

export default ProfileSummaryFreshers;
