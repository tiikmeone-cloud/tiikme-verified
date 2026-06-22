// Level Up -- learning that feeds your Flex.
// All items are EXTERNAL (you enrol/compete on the provider's site).
// On completion, the credential lands in your Flex → boosts job matching.

export type LearnKind = 'course' | 'certificate' | 'hackathon'

const A = (n: number) => `https://i.pravatar.cc/120?img=${n}`

export interface LearnItem {
  id: string
  kind: LearnKind
  title: string
  provider: string
  providerColor: string
  duration: string        // "6 months" / "12 hrs" / "48-hour sprint"
  effort: string          // "self-paced" / "5 hrs/week"
  why: string             // why you should learn this
  tags: string[]
  external: string        // external enrol/apply link
  enrolled: string        // "1.2M enrolled"
  // network social proof -- who from your world earned it
  earnedAvatars: string[]
  squadEarned: number
  networkEarned: number
  deadline?: string
  free?: boolean
  // deep detail (right pane)
  outcomes: string[]      // what you'll learn / walk away with
  syllabus: string[]      // modules / agenda
  level: string           // Beginner / Intermediate
  flexCredential: string  // what lands in your Flex on completion
}

type LearnRaw = Omit<LearnItem, 'outcomes' | 'syllabus' | 'level' | 'flexCredential'>

export function getLearn(): LearnItem[] {
  const raw: LearnRaw[] = [
    // ── Courses ───────────────────────────────────────────────────────────────
    { id:'l1', kind:'course', title:'Google UX Design Professional Certificate', provider:'Coursera', providerColor:'#2563EB',
      duration:'6 months', effort:'~10 hrs/week', why:'78% of UX job posts list this as preferred -- a fast credibility boost for career-switchers.',
      tags:['UX','Figma','Research'], external:'https://coursera.org', enrolled:'1.2M enrolled',
      earnedAvatars:[A(5),A(60),A(47)], squadEarned:2, networkEarned:3 },
    { id:'l2', kind:'course', title:'Meta Front-End Developer Professional Certificate', provider:'Coursera', providerColor:'#1877F2',
      duration:'7 months', effort:'~6 hrs/week', why:'Verifiable credential recruiters trust for junior-mid frontend roles.',
      tags:['React','JavaScript','Frontend'], external:'https://coursera.org', enrolled:'380k enrolled',
      earnedAvatars:[A(11),A(7)], squadEarned:1, networkEarned:2 },
    { id:'l3', kind:'course', title:'Deep Learning Specialization', provider:'Coursera / deeplearning.ai', providerColor:'#0099E6',
      duration:'5 months', effort:'~8 hrs/week', why:'The standard credential for ML roles. Taught by Andrew Ng -- valued by every AI team.',
      tags:['AI','Machine Learning','Deep Learning'], external:'https://coursera.org', enrolled:'900k enrolled',
      earnedAvatars:[A(48),A(14),A(44)], squadEarned:3, networkEarned:4 },
    { id:'l4', kind:'course', title:'Design Systems with Figma', provider:'Udemy', providerColor:'#A435F0',
      duration:'12 hrs', effort:'self-paced', why:'Design systems are the #1 skill gap for senior product design roles right now.',
      tags:['Figma','Design Systems','Component Library'], external:'https://udemy.com', enrolled:'52k enrolled',
      earnedAvatars:[A(5)], squadEarned:0, networkEarned:1 },
    { id:'l5', kind:'course', title:'SQL for Data Analysis', provider:'Mode Analytics', providerColor:'#1C3A5B',
      duration:'8 hrs', effort:'self-paced', why:'SQL is the most-mentioned skill across Data Analyst, PM, and Growth roles. Learn it once, use it everywhere.',
      tags:['SQL','Data Analysis','Analytics'], external:'https://mode.com', enrolled:'200k enrolled', free:true,
      earnedAvatars:[A(20),A(14),A(4)], squadEarned:2, networkEarned:5 },
    { id:'l6', kind:'course', title:'Product Management -- Zero to Product Manager', provider:'Udemy', providerColor:'#A435F0',
      duration:'16 hrs', effort:'self-paced', why:'Most PMs are self-taught. This is the fastest structured path from zero to your first PM role.',
      tags:['Product','Strategy','Roadmapping'], external:'https://udemy.com', enrolled:'78k enrolled',
      earnedAvatars:[A(4),A(6)], squadEarned:1, networkEarned:2 },
    { id:'l7', kind:'course', title:'AWS Cloud Practitioner Essentials', provider:'AWS Training', providerColor:'#FF9900',
      duration:'6 hrs', effort:'self-paced', why:'Cloud is table stakes. The AWS CP is the fastest way to get a foot in the door -- or credibly add cloud to your CV.',
      tags:['AWS','Cloud','DevOps'], external:'https://aws.amazon.com/training', enrolled:'4.5M enrolled', free:true,
      earnedAvatars:[A(11),A(12)], squadEarned:1, networkEarned:3 },
    { id:'l8', kind:'course', title:'Digital Marketing & SEO Masterclass', provider:'Google Skillshop', providerColor:'#4285F4',
      duration:'10 hrs', effort:'self-paced', why:'Every marketer and PM should understand SEO fundamentals -- it\'s the cheapest traffic you\'ll ever have.',
      tags:['SEO','Digital Marketing','Growth'], external:'https://skillshop.google.com', enrolled:'5M enrolled', free:true,
      earnedAvatars:[A(33),A(8),A(21)], squadEarned:1, networkEarned:2 },
    { id:'l9', kind:'course', title:'Kubernetes for Developers', provider:'Linux Foundation', providerColor:'#003057',
      duration:'3 months', effort:'~4 hrs/week', why:'K8s is everywhere. The LFS258 course is vendor-neutral and maps directly to CKA exam prep.',
      tags:['Kubernetes','DevOps','Platform Engineering'], external:'https://training.linuxfoundation.org', enrolled:'120k enrolled',
      earnedAvatars:[A(12)], squadEarned:0, networkEarned:1 },
    { id:'l10', kind:'course', title:'Financial Modelling & Valuation Analyst (FMVA)', provider:'CFI', providerColor:'#007BFF',
      duration:'4 months', effort:'~5 hrs/week', why:'The go-to cert for finance and FinTech roles -- more practical than CFA L1 for analysts entering banking or startup finance.',
      tags:['Finance','Financial Modelling','Valuation'], external:'https://corporatefinanceinstitute.com', enrolled:'900k enrolled',
      earnedAvatars:[A(26)], squadEarned:0, networkEarned:1 },
    // ── Certificates ──────────────────────────────────────────────────────────
    { id:'l11', kind:'certificate', title:'Certified Scrum Product Owner (CSPO)', provider:'Scrum Alliance', providerColor:'#1C9C5B',
      duration:'2-day workshop', effort:'+ exam', why:'Opens PM / PO doors globally. Most companies list it as preferred for agile product roles.',
      tags:['Agile','Product','Scrum'], external:'https://scrumalliance.org', enrolled:'95k certified',
      earnedAvatars:[A(12),A(4)], squadEarned:1, networkEarned:1 },
    { id:'l12', kind:'certificate', title:'AWS Certified Solutions Architect -- Associate', provider:'Amazon Web Services', providerColor:'#FF9900',
      duration:'80-120 hrs prep', effort:'self-paced + exam', why:'The most recognised cloud cert by hiring managers globally. Opens 4× more job opportunities in DevOps and platform engineering.',
      tags:['AWS','Cloud','Architecture'], external:'https://aws.amazon.com/certification', enrolled:'2.3M certified',
      earnedAvatars:[A(11),A(12)], squadEarned:2, networkEarned:3 },
    { id:'l13', kind:'certificate', title:'Certified Kubernetes Administrator (CKA)', provider:'CNCF', providerColor:'#326CE5',
      duration:'3 months prep', effort:'~5 hrs/week', why:'The gold standard for DevOps and SRE roles in cloud-native companies. Hands-on, performance-based -- not MCQ.',
      tags:['Kubernetes','DevOps','SRE'], external:'https://www.cncf.io/certification/cka/', enrolled:'180k certified',
      earnedAvatars:[A(12)], squadEarned:0, networkEarned:1 },
    { id:'l14', kind:'certificate', title:'Google Analytics 4 Certification', provider:'Google Skillshop', providerColor:'#4285F4',
      duration:'4 hrs', effort:'self-paced + exam', why:'GA4 replaced Universal Analytics. Every marketer, PM, and analyst who uses analytics needs this refresh -- and it\'s free.',
      tags:['Analytics','Marketing','Data'], external:'https://skillshop.google.com', enrolled:'3M+ certified', free:true,
      earnedAvatars:[A(8),A(33)], squadEarned:0, networkEarned:2 },
    { id:'l15', kind:'certificate', title:'CFA Level 1', provider:'CFA Institute', providerColor:'#003087',
      duration:'300+ hrs prep', effort:'~10 hrs/week for 6 months', why:'The benchmark for finance careers globally. Demonstrates depth in investment analysis and financial markets.',
      tags:['Finance','Investment','CFA'], external:'https://cfainstitute.org', enrolled:'300k+ sitting/yr',
      earnedAvatars:[A(26)], squadEarned:0, networkEarned:1 },
    { id:'l16', kind:'certificate', title:'Meta Social Media Marketing Professional Certificate', provider:'Coursera / Meta', providerColor:'#1877F2',
      duration:'4 months', effort:'~5 hrs/week', why:'The practical credential for social media managers and brand marketers -- covers Meta ads, analytics, and content strategy.',
      tags:['Social Media','Marketing','Meta Ads'], external:'https://coursera.org', enrolled:'300k enrolled',
      earnedAvatars:[A(21),A(33)], squadEarned:1, networkEarned:2 },
    // ── Hackathons ────────────────────────────────────────────────────────────
    { id:'l17', kind:'hackathon', title:'AI Agents Global Hackathon', provider:'Devpost', providerColor:'#003E54',
      duration:'48-hour sprint', effort:'Team or solo', why:'Ship a real AI project in a weekend -- instant portfolio piece + $50k in prizes. Recruiters scout winners here.',
      tags:['AI','Agents','Build'], external:'https://devpost.com', enrolled:'4.3k builders', deadline:'Closes in 9 days',
      earnedAvatars:[A(11),A(14),A(48),A(7)], squadEarned:3, networkEarned:5 },
    { id:'l18', kind:'hackathon', title:'Smart India Hackathon 2025', provider:'Ministry of Education, India', providerColor:'#FF671F',
      duration:'36-hour finale', effort:'Team of 6', why:'India\'s largest hackathon -- 100k+ participants. Recruiters from ByteCloud, MediSense, and others scout winners directly.',
      tags:['Open Innovation','Build','India'], external:'https://www.sih.gov.in', enrolled:'120k+ students', deadline:'Registrations open', free:true,
      earnedAvatars:[A(3),A(7)], squadEarned:0, networkEarned:2 },
    { id:'l19', kind:'hackathon', title:'FinTech Frontier Hackathon -- NovaPay × Cleartrip', provider:'NovaPay', providerColor:'#059669',
      duration:'72-hour sprint', effort:'Teams of 3-5', why:'Build payment or travel tech on NovaPay\'s live API. Winners get a fast-track interview at NovaPay and Cleartrip.',
      tags:['FinTech','Payments','Build'], external:'https://novapay.in/hack', enrolled:'1.2k builders', deadline:'Open for 14 more days',
      earnedAvatars:[A(15),A(26)], squadEarned:1, networkEarned:2 },
    { id:'l20', kind:'hackathon', title:'Design Sprint Challenge -- Creative Labs', provider:'Creative Labs', providerColor:'#FF5C28',
      duration:'2-day design sprint', effort:'Teams of 2-4', why:'A UX/product design challenge judged by Creative Labs\' senior designers. Winners get offered a freelance project.',
      tags:['Design','UX','Sprint'], external:'https://creative-labs.com/sprint', enrolled:'340 designers', deadline:'Closes in 5 days',
      earnedAvatars:[A(5),A(60)], squadEarned:2, networkEarned:3 },
    { id:'l21', kind:'hackathon', title:'HealthTech Builders -- MediSense × NASSCOM', provider:'MediSense', providerColor:'#2FB866',
      duration:'5-day challenge', effort:'Team or solo', why:'Build AI tools for India\'s healthcare system. Judged by doctors and AI researchers. ₹10L prize pool.',
      tags:['HealthTech','AI','Build'], external:'https://medisense.health/hackathon', enrolled:'890 builders', deadline:'Registrations close in 21 days', free:true,
      earnedAvatars:[A(48),A(44)], squadEarned:1, networkEarned:2 },
  ]
  const OUT: Record<LearnKind, string[]> = {
    course: ['Job-ready skills you can show in your portfolio', 'A shareable certificate of completion', 'Hands-on projects reviewed by peers'],
    certificate: ['An industry-recognised, verifiable credential', 'A badge recruiters can validate at the source', 'Proof of a specific competency'],
    hackathon: ['A real, shipped project for your portfolio', 'Experience working under real constraints', 'Exposure to judges, mentors & recruiters'],
  }
  const SYL: Record<LearnKind, string[]> = {
    course: ['Foundations & core concepts', 'Hands-on tooling & workflows', 'Real-world capstone project', 'Portfolio & presentation'],
    certificate: ['Prep materials & study path', 'Practice assessments', 'Proctored exam', 'Credential issuance & verification'],
    hackathon: ['Kickoff & team formation', 'Build sprint', 'Demo & judging', 'Awards & recruiter showcase'],
  }
  return raw.map(r => ({
    ...r,
    level: r.kind === 'hackathon' ? 'All levels' : r.duration.includes('month') ? 'Beginner → Intermediate' : 'Intermediate',
    outcomes: OUT[r.kind],
    syllabus: SYL[r.kind],
    flexCredential: r.kind === 'hackathon' ? `"${r.title}" added to your Flex achievements` : r.kind === 'certificate' ? `"${r.title}" verified certificate on your Flex` : `"${r.title}" certificate + skills on your Flex`,
  }))
}

export const LEARN_TABS: { id: LearnKind | 'all'; label: string }[] = [
  { id:'all', label:'All' },
  { id:'course', label:'Courses' },
  { id:'certificate', label:'Certificates' },
  { id:'hackathon', label:'Hackathons' },
]
