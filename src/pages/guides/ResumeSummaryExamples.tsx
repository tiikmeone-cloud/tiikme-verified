import GuideLayout from "./GuideLayout";
import { GUIDES, getRelated } from "./registry";

const meta = GUIDES.find((g) => g.slug === "resume-summary-examples")!;

const ResumeSummaryExamples = () => (
  <GuideLayout meta={meta} related={getRelated(meta.slug)}>
    <p>
      Below are twelve resume summary examples written for real Indian
      professionals. Copy the one closest to your situation, swap in your own
      numbers, and you are done.
    </p>

    <h2>1. Fresher — engineering graduate</h2>
    <div className="example good">
      <p>
        Final-year B.Tech (Computer Science) student at NIT Warangal with
        coursework in distributed systems and ML. Built and shipped a campus
        bus-tracking app used by 1,200+ students. Comfortable in Python, Go and
        React. Looking for SDE-1 roles starting June 2026.
      </p>
    </div>

    <h2>2. Software engineer — 3 years</h2>
    <div className="example good">
      <p>
        Backend engineer with 3 years of experience building payments
        infrastructure at a Series B fintech in Bengaluru. Owned the UPI
        reconciliation service handling 4M transactions a day. Strong in Java,
        Kafka, PostgreSQL and AWS. Open to senior engineer roles.
      </p>
    </div>

    <h2>3. School teacher — 7 years</h2>
    <div className="example good">
      <p>
        Secondary-school mathematics teacher with 7 years of experience across
        CBSE and ICSE schools in Pune. Class average in Class 10 board
        improved from 72 to 84 over three years. Trained in CCE assessment and
        co-led the inter-school math olympiad. Looking for HOD or PGT roles.
      </p>
    </div>

    <h2>4. Staff nurse — 5 years</h2>
    <div className="example good">
      <p>
        ICU staff nurse with 5 years of experience in tertiary care hospitals
        in Hyderabad. Handled 14-bed ICU during COVID second wave. BLS, ACLS
        and ventilator-management certified. Looking for senior ICU or
        critical-care nurse-educator roles.
      </p>
    </div>

    <h2>5. Graphic designer — 4 years</h2>
    <div className="example good">
      <p>
        Brand designer with 4 years of experience working with D2C startups.
        Redesigned the packaging system for a Mumbai-based personal-care brand
        that grew DTC revenue 2.3x in the year after launch. Fluent in Figma,
        Illustrator and motion in After Effects. Open to senior designer or
        design lead roles.</p>
    </div>

    <h2>6. Chartered Accountant — 6 years</h2>
    <div className="example good">
      <p>
        Chartered Accountant with 6 years of post-qualification experience in
        direct tax and GST advisory at a Big 4 firm in Gurugram. Led tax due
        diligence on three cross-border M&amp;A transactions worth ₹1,400 Cr
        combined. Looking for manager-level roles in corporate tax.
      </p>
    </div>

    <h2>7. Marketing manager — 8 years</h2>
    <div className="example good">
      <p>
        Performance-marketing manager with 8 years across e-commerce and SaaS.
        Scaled a D2C apparel brand from ₹2 Cr to ₹38 Cr annual revenue in 24
        months, primarily through Meta and Google ads. Strong in CAC modelling
        and lifecycle marketing. Open to head-of-growth roles.
      </p>
    </div>

    <h2>8. ITI welder — 10 years</h2>
    <div className="example good">
      <p>
        ITI-certified welder with 10 years of experience in heavy fabrication
        for the automotive sector in Pune. Specialist in MIG and TIG welding
        for stainless steel and aluminium. Trained 12 junior welders on the
        shop floor. Looking for senior welder or shift-in-charge roles.
      </p>
    </div>

    <h2>9. Civil servant — 12 years</h2>
    <div className="example good">
      <p>
        Sub-Divisional Magistrate with 12 years in the Telangana state
        administrative service. Oversaw land-records digitisation in a
        4-mandal sub-division covering 86,000 records. Trained at LBSNAA.
        Looking for deputation roles in urban policy or rural development.
      </p>
    </div>

    <h2>10. Freelance consultant</h2>
    <div className="example good">
      <p>
        Independent product consultant working with early-stage Indian SaaS
        founders on positioning and pricing. Past clients include four
        YC-backed teams. Wrote pricing pages that improved free-to-paid
        conversion by 30 to 60 percent. Open to part-time roles as well.
      </p>
    </div>

    <h2>11. Career-change candidate</h2>
    <div className="example good">
      <p>
        Eight years in retail-banking sales, transitioning into product
        management. Completed Reforge's PMM programme and built two side
        products that crossed 5,000 users each. Looking for associate PM roles
        at fintechs where banking domain knowledge is useful.
      </p>
    </div>

    <h2>12. Returning after a career break</h2>
    <div className="example good">
      <p>
        HR business partner with 9 years of experience at IT services firms,
        returning to full-time work after a 3-year break for family caregiving.
        Stayed current through SHRM-SCP certification in 2025 and consulting
        engagements with two early-stage startups. Open to HRBP roles.
      </p>
    </div>

    <h2>What these examples have in common</h2>
    <ul>
      <li>Every one names the actual role and field.</li>
      <li>Every one has a number — years, revenue, students, transactions.</li>
      <li>None of them say "hardworking", "passionate" or "team player".</li>
      <li>Every one ends with what they want next.</li>
    </ul>

    <blockquote>
      Pick the example closest to you. Replace the numbers. Read it aloud. If
      it does not sound like you would actually say it, simplify.
    </blockquote>
  </GuideLayout>
);

export default ResumeSummaryExamples;
