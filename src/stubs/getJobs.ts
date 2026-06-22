// Jobs / Hiring domain.
// PRODUCT MODEL (decisions encoded here):
//  • An "Opening" can be a full role, a gig, or a skill/cert-gated task -- type drives UI.
//  • Job posts are social objects: like, refer, comment, save (Stash).
//  • Applying is either IN-platform (auto pipeline tracking) or OUT-platform (self-tracked, "External").
//  • No DMs: communication is structured (status updates, interview invites, contact reveal on mutual interest).
//  • Candidate's Flex (resume = skills, certs, experience, squad-verified) is attached on apply.

const AV = (n: number) => `https://i.pravatar.cc/120?img=${n}`

export type JobType = 'Full-time' | 'Part-time' | 'Freelance' | 'Contract' | 'Internship' | 'Gig'
export type WorkMode = 'Remote' | 'On-site' | 'Hybrid'

export interface NetworkProof {
  name: string
  avatar: string
  relation: 'squad' | 'following'
}

export interface Opening {
  id: string
  title: string
  org: string
  orgSlug: string
  orgColor: string
  verified?: boolean
  location: string
  mode: WorkMode
  type: JobType
  salary: string
  postedAt: string
  applicants: number
  // social (NO comments on jobs by design -- like + refer + save only)
  likes: number
  refers: number
  liked?: boolean
  saved?: boolean
  urgent?: boolean
  // requirements
  mustHaveSkills: string[]
  niceToHave: string[]
  certsRequired: string[]
  experience: string
  // social proof: people from your network who work here
  networkAtCompany: NetworkProof[]
  summary: string
  // how to apply
  applyMode: 'in-platform' | 'external'
  externalUrl?: string
  // screening -- answers gate the pipeline (auto-shortlist on must-haves)
  screening: ScreeningQuestion[]
  // Otta / Welcome-to-the-Jungle content structure
  fn: string                  // Function / department, e.g. "Product Design"
  experienceLevel: string     // "Mid & Senior level"
  officeReq: string           // "Hybrid · 2 days a week"
  whatJobInvolves: string[]
  whoYouAre: string[]
  ourTake: string             // editorial company blurb
  companyBenefits: string[]
  salaryBenchmark: string
}

export interface ScreeningQuestion {
  id: string
  q: string
  kind: 'yesno' | 'choice' | 'experience'
  options?: string[]          // for choice
  mustHave?: string           // expected answer to auto-shortlist (e.g. 'Yes', '3+')
}

export type Stage = 'applied' | 'shortlisted' | 'invited' | 'interviewed' | 'hired' | 'rejected'

export interface Applicant {
  id: string
  name: string
  avatar: string
  age: number
  gender: 'Male' | 'Female'
  expectedSalary: string
  experience: string
  rating: number
  matchPct: number        // AI fit vs the role
  stage: Stage
  badge?: 'TOP TALENT' | 'SUPER CANDIDATE'
  // gated contact -- only revealed on mutual interest
  email: string
  phone: string
  skills: string[]
  verifiedSkills: number  // squad/cert-verified count
  certs: { name: string; issuer: string }[]
  testimonial?: { quote: string; by: string; role: string }
  referredBy?: string
  source: 'tiikme' | 'external'
}

const P = (n: number) => `https://i.pravatar.cc/120?img=${n}`

const DEFAULT_SCREENING: ScreeningQuestion[] = [
  { id:'s1', q:'Are you authorized to work in this location?', kind:'yesno', mustHave:'Yes' },
  { id:'s2', q:'Years of relevant experience?', kind:'experience', mustHave:'3+' },
  { id:'s3', q:'Preferred work mode?', kind:'choice', options:['Remote','Hybrid','On-site'] },
]

type RawOpening = Omit<Opening, 'applyMode' | 'externalUrl' | 'screening' | 'experienceLevel' | 'officeReq' | 'whatJobInvolves' | 'whoYouAre' | 'ourTake' | 'companyBenefits' | 'salaryBenchmark'>

function elaborateJob(j: RawOpening, idx: number): Opening {
  const expLevel = j.experience.includes('5+') || j.experience.includes('10+') || j.experience.includes('12+') ? 'Senior level'
    : j.experience.includes('0') || j.experience.includes('1') ? 'Junior & Mid level' : 'Mid & Senior level'
  return {
    ...j,
    applyMode: idx % 5 === 1 ? 'external' : 'in-platform',
    screening: DEFAULT_SCREENING,
    experienceLevel: expLevel,
    officeReq: j.mode === 'Remote' ? 'Fully remote' : j.mode === 'Hybrid' ? 'Hybrid · 2-3 days/week' : 'In office full-time',
    whatJobInvolves: [
      j.summary,
      'Own work end-to-end -- from initial brief to shipped, polished output',
      `Partner closely with ${j.fn} peers and cross-functional stakeholders`,
      `Raise the bar using ${j.mustHaveSkills.slice(0, 2).join(' and ')}`,
      'Share WIP early, iterate fast, and contribute to team culture',
    ],
    whoYouAre: [
      `${j.experience} of hands-on experience in ${j.fn}`,
      ...j.mustHaveSkills.map(s => `Demonstrable skill in ${s}`),
      'Comfortable with ambiguity and fast feedback loops',
      'Portfolio or proof of work that shows the process, not just the output',
    ],
    ourTake: `${j.org} is hiring for ${j.title} in ${j.location.split(',')[0]}. They value craft and autonomy -- you\'ll own outcomes, not tasks.`,
    companyBenefits: ['Health insurance', 'Flexible / remote-friendly', 'Learning & conference budget', 'Equity for full-timers', 'Top-tier hardware'],
    salaryBenchmark: `${j.salary} is competitive for ${j.experience} ${j.title.toLowerCase()}s in ${j.location.split(',')[0]}.`,
  }
}

export function getOpenings(): Opening[] {
  const raw: RawOpening[] = [
    // ── ByteCloud (Tech / SaaS · Bangalore) ──────────────────────────────────
    { id:'j1', title:'Senior Full-Stack Engineer', org:'ByteCloud', orgSlug:'bytecloud', orgColor:'#6D4BD8', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹28-40 LPA', postedAt:'1h', applicants:62, fn:'Engineering',
      likes:54, refers:11, urgent:true, experience:'4-7 yrs',
      mustHaveSkills:['React','Node.js','TypeScript','PostgreSQL'], niceToHave:['Golang','Docker'], certsRequired:[],
      networkAtCompany:[{name:'Aarav Sharma',avatar:P(11),relation:'squad'}],
      summary:'Lead full-stack development on ByteCloud\'s developer portal -- auth, billing, and SDK integrations.' },

    { id:'j2', title:'DevOps Engineer', org:'ByteCloud', orgSlug:'bytecloud', orgColor:'#6D4BD8', verified:true,
      location:'Remote / India', mode:'Remote', type:'Full-time', salary:'₹24-32 LPA', postedAt:'3h', applicants:38, fn:'Engineering',
      likes:28, refers:4, experience:'3-5 yrs',
      mustHaveSkills:['Kubernetes','AWS','Terraform','CI/CD'], niceToHave:['Golang','ArgoCD'], certsRequired:['AWS Solutions Architect'],
      networkAtCompany:[{name:'Karthik Reddy',avatar:P(12),relation:'following'}],
      summary:'Build and maintain ByteCloud\'s Kubernetes-based deployment platform. Own CI/CD, observability, and security.' },

    { id:'j3', title:'Backend Engineer (Golang)', org:'ByteCloud', orgSlug:'bytecloud', orgColor:'#6D4BD8', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹22-30 LPA', postedAt:'6h', applicants:45, fn:'Engineering',
      likes:31, refers:6, experience:'2-5 yrs',
      mustHaveSkills:['Golang','PostgreSQL','gRPC','Kafka'], niceToHave:['Redis','AWS'], certsRequired:[],
      networkAtCompany:[],
      summary:'Design and ship microservices for ByteCloud\'s API management layer. High-throughput, low-latency systems.' },

    { id:'j4', title:'Cloud Solutions Architect', org:'ByteCloud', orgSlug:'bytecloud', orgColor:'#6D4BD8', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹40-60 LPA', postedAt:'1d', applicants:22, fn:'Engineering',
      likes:19, refers:3, experience:'7-12 yrs',
      mustHaveSkills:['AWS','Architecture','Multi-cloud','Security'], niceToHave:['GCP','Terraform'], certsRequired:['AWS Solutions Architect Professional'],
      networkAtCompany:[{name:'Karthik Reddy',avatar:P(12),relation:'squad'}],
      summary:'Define ByteCloud\'s multi-cloud architecture strategy. Work directly with the CTO on platform roadmap.' },

    // ── FreshRoute (FoodTech · Mumbai) ────────────────────────────────────────
    { id:'j5', title:'Data Analyst -- Demand Forecasting', org:'FreshRoute', orgSlug:'freshroute', orgColor:'#2BB3A3', verified:true,
      location:'Mumbai, IN', mode:'Hybrid', type:'Full-time', salary:'₹18-24 LPA', postedAt:'2h', applicants:73, fn:'Data',
      likes:41, refers:7, experience:'2-4 yrs',
      mustHaveSkills:['Python','SQL','Time Series','Tableau'], niceToHave:['Spark','Airflow'], certsRequired:[],
      networkAtCompany:[{name:'Priya Nair',avatar:P(5),relation:'following'}],
      summary:'Build demand forecasting models that help FreshRoute cut food waste by 35% YoY.' },

    { id:'j6', title:'Growth Product Manager', org:'FreshRoute', orgSlug:'freshroute', orgColor:'#2BB3A3', verified:true,
      location:'Mumbai, IN', mode:'On-site', type:'Full-time', salary:'₹25-35 LPA', postedAt:'5h', applicants:84, fn:'Product',
      likes:66, refers:14, urgent:true, experience:'3-6 yrs',
      mustHaveSkills:['Product Strategy','A/B Testing','Analytics','SQL'], niceToHave:['Python','Growth Loops'], certsRequired:[],
      networkAtCompany:[{name:'Priya Nair',avatar:P(5),relation:'squad'},{name:'Sneha Kapoor',avatar:P(33),relation:'following'}],
      summary:'Own FreshRoute\'s consumer acquisition and retention funnel across web and app.' },

    { id:'j7', title:'Operations Lead -- Supply Chain', org:'FreshRoute', orgSlug:'freshroute', orgColor:'#2BB3A3', verified:true,
      location:'Mumbai, IN', mode:'On-site', type:'Full-time', salary:'₹20-28 LPA', postedAt:'1d', applicants:31, fn:'Operations',
      likes:22, refers:2, experience:'3-6 yrs',
      mustHaveSkills:['Supply Chain','Logistics','Ops Strategy','Excel'], niceToHave:['ERP','Data Analysis'], certsRequired:[],
      networkAtCompany:[],
      summary:'Lead last-mile logistics operations for FreshRoute\'s 18-city network. Drive SLA from 94% to 98%.' },

    // ── CipherNet (CyberSec · Hyderabad) ─────────────────────────────────────
    { id:'j8', title:'Security Engineer -- Detection', org:'CipherNet', orgSlug:'ciphernet', orgColor:'#1E293B', verified:true,
      location:'Remote / India', mode:'Remote', type:'Full-time', salary:'₹22-32 LPA', postedAt:'4h', applicants:28, fn:'Security',
      likes:38, refers:9, urgent:true, experience:'3-6 yrs',
      mustHaveSkills:['Threat Detection','SIEM','Python','MITRE ATT&CK'], niceToHave:['Machine Learning','Kafka'], certsRequired:['CEH'],
      networkAtCompany:[{name:'Rohan Gupta',avatar:P(14),relation:'squad'}],
      summary:'Build and tune detection rules for CipherNet\'s real-time threat intelligence platform.' },

    { id:'j9', title:'Penetration Testing Engineer', org:'CipherNet', orgSlug:'ciphernet', orgColor:'#1E293B', verified:true,
      location:'Hyderabad, IN', mode:'On-site', type:'Full-time', salary:'₹20-28 LPA', postedAt:'2d', applicants:19, fn:'Security',
      likes:29, refers:5, experience:'2-5 yrs',
      mustHaveSkills:['Penetration Testing','Burp Suite','Kali Linux','Web Security'], niceToHave:['Cloud Security','OSCP'], certsRequired:['OSCP'],
      networkAtCompany:[],
      summary:'Conduct red team assessments and penetration tests for CipherNet\'s enterprise clients.' },

    { id:'j10', title:'Cloud Security Architect', org:'CipherNet', orgSlug:'ciphernet', orgColor:'#1E293B', verified:true,
      location:'Hyderabad, IN', mode:'Hybrid', type:'Full-time', salary:'₹30-45 LPA', postedAt:'3d', applicants:14, fn:'Security',
      likes:24, refers:4, experience:'6-10 yrs',
      mustHaveSkills:['AWS Security','Zero-Trust','IAM','Kubernetes Security'], niceToHave:['CSPM','Compliance'], certsRequired:['CISSP'],
      networkAtCompany:[],
      summary:'Design zero-trust cloud security architecture for CipherNet\'s SaaS platform and enterprise customers.' },

    // ── Atomberg (D2C · Pune) ─────────────────────────────────────────────────
    { id:'j11', title:'Hardware Engineer -- IoT & Embedded', org:'Atomberg', orgSlug:'atomberg', orgColor:'#F59E0B', verified:true,
      location:'Pune, IN', mode:'On-site', type:'Full-time', salary:'₹18-26 LPA', postedAt:'6h', applicants:34, fn:'Hardware',
      likes:21, refers:3, experience:'2-5 yrs',
      mustHaveSkills:['Embedded C','RTOS','PCB Design','IoT Protocols'], niceToHave:['BLE','Wi-Fi SoC','BLDC Motor Control'], certsRequired:[],
      networkAtCompany:[{name:'Arnav Khanna',avatar:P(16),relation:'following'}],
      summary:'Design and develop firmware for Atomberg\'s next-gen smart home appliances -- BLDC fans, smart switches, and more.' },

    { id:'j12', title:'Product Manager -- Smart Home', org:'Atomberg', orgSlug:'atomberg', orgColor:'#F59E0B', verified:true,
      location:'Pune, IN', mode:'Hybrid', type:'Full-time', salary:'₹22-30 LPA', postedAt:'1d', applicants:52, fn:'Product',
      likes:44, refers:8, experience:'3-6 yrs',
      mustHaveSkills:['Product Strategy','D2C','IoT','Analytics'], niceToHave:['Supply Chain','Alexa/Google Home'], certsRequired:[],
      networkAtCompany:[{name:'Sneha Kapoor',avatar:P(33),relation:'squad'}],
      summary:'Drive product vision and roadmap for Atomberg\'s connected home ecosystem -- integrations, app, and new device launches.' },

    // ── MediSense (HealthTech · Bangalore) ────────────────────────────────────
    { id:'j13', title:'ML Engineer -- Medical Imaging', org:'MediSense', orgSlug:'medisense', orgColor:'#2FB866', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹24-36 LPA', postedAt:'3h', applicants:41, fn:'AI / ML',
      likes:63, refers:12, urgent:true, experience:'3-6 yrs',
      mustHaveSkills:['PyTorch','Computer Vision','Medical Imaging','MLOps'], niceToHave:['DICOM','HL7','FastAPI'], certsRequired:[],
      networkAtCompany:[{name:'Meera Singh',avatar:P(48),relation:'squad'},{name:'Riya Agarwal',avatar:P(44),relation:'following'}],
      summary:'Build and deploy AI models for chest X-ray and pathology slide analysis used in 40+ Indian hospitals.' },

    { id:'j14', title:'Backend Engineer -- Clinical API', org:'MediSense', orgSlug:'medisense', orgColor:'#2FB866', verified:true,
      location:'Remote / India', mode:'Remote', type:'Full-time', salary:'₹20-28 LPA', postedAt:'5h', applicants:27, fn:'Engineering',
      likes:19, refers:2, experience:'2-5 yrs',
      mustHaveSkills:['Python','FastAPI','PostgreSQL','HIPAA Compliance'], niceToHave:['AWS','HL7 FHIR'], certsRequired:[],
      networkAtCompany:[{name:'Meera Singh',avatar:P(48),relation:'following'}],
      summary:'Build secure, HIPAA-compliant APIs that connect MediSense AI models to hospital information systems.' },

    { id:'j15', title:'Healthcare Data Scientist', org:'MediSense', orgSlug:'medisense', orgColor:'#2FB866', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹22-32 LPA', postedAt:'1d', applicants:36, fn:'Data / AI',
      likes:47, refers:9, experience:'3-5 yrs',
      mustHaveSkills:['Python','Clinical Data','Statistics','Scikit-learn'], niceToHave:['R','FHIR','Biostatistics'], certsRequired:[],
      networkAtCompany:[{name:'Rohan Gupta',avatar:P(14),relation:'following'}],
      summary:'Analyse clinical trial data and model patient outcomes to improve diagnostic AI accuracy.' },

    // ── Cleartrip (Travel SaaS · Bangalore) ──────────────────────────────────
    { id:'j16', title:'Senior Product Manager -- Search & Discovery', org:'Cleartrip', orgSlug:'cleartrip', orgColor:'#FF5C28', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹35-50 LPA', postedAt:'4h', applicants:91, fn:'Product',
      likes:78, refers:17, urgent:true, experience:'5-9 yrs',
      mustHaveSkills:['Product Strategy','Search & Ranking','A/B Testing','SQL'], niceToHave:['ML basics','Travel domain'], certsRequired:[],
      networkAtCompany:[{name:'Arjun Patel',avatar:P(20),relation:'squad'}],
      summary:'Own flights search personalisation at Cleartrip -- ranking, recommendations, and conversion improvement.' },

    { id:'j17', title:'iOS Developer (Swift)', org:'Cleartrip', orgSlug:'cleartrip', orgColor:'#FF5C28', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹22-32 LPA', postedAt:'1d', applicants:44, fn:'Engineering',
      likes:33, refers:5, experience:'3-6 yrs',
      mustHaveSkills:['Swift','UIKit','SwiftUI','Xcode'], niceToHave:['Combine','Push Notifications'], certsRequired:[],
      networkAtCompany:[],
      summary:'Ship new features on Cleartrip\'s iOS app used by 10M+ travellers. Own the hotel booking experience.' },

    { id:'j18', title:'Data Analyst -- Pricing & Revenue', org:'Cleartrip', orgSlug:'cleartrip', orgColor:'#FF5C28', verified:true,
      location:'Remote / India', mode:'Remote', type:'Full-time', salary:'₹16-22 LPA', postedAt:'2d', applicants:58, fn:'Data',
      likes:25, refers:4, experience:'2-4 yrs',
      mustHaveSkills:['SQL','Python','Tableau','Revenue Analytics'], niceToHave:['Pricing Models','Spark'], certsRequired:[],
      networkAtCompany:[{name:'Arjun Patel',avatar:P(20),relation:'following'}],
      summary:'Analyse pricing elasticity and build dashboards that drive Cleartrip\'s dynamic pricing strategy.' },

    // ── LearnLoop (EdTech · Delhi) ────────────────────────────────────────────
    { id:'j19', title:'Content Strategist -- Tech Bootcamp', org:'LearnLoop', orgSlug:'learnloop', orgColor:'#A435F0', verified:true,
      location:'Remote / Delhi', mode:'Remote', type:'Full-time', salary:'₹14-20 LPA', postedAt:'8h', applicants:47, fn:'Content',
      likes:34, refers:6, experience:'2-5 yrs',
      mustHaveSkills:['Content Strategy','Technical Writing','Curriculum Design','SEO'], niceToHave:['Video Scripting','LMS'], certsRequired:[],
      networkAtCompany:[{name:'Ananya Desai',avatar:P(8),relation:'squad'}],
      summary:'Build LearnLoop\'s next coding bootcamp curriculum -- from syllabus to daily learning experiences.' },

    { id:'j20', title:'Curriculum Designer -- Product Management', org:'LearnLoop', orgSlug:'learnloop', orgColor:'#A435F0', verified:true,
      location:'Delhi, IN', mode:'Hybrid', type:'Full-time', salary:'₹12-18 LPA', postedAt:'3d', applicants:34, fn:'Curriculum',
      likes:22, refers:3, experience:'2-4 yrs',
      mustHaveSkills:['Curriculum Design','PM knowledge','Learning Design','Assessment Design'], niceToHave:['Agile','Case Studies'], certsRequired:[],
      networkAtCompany:[{name:'Ananya Desai',avatar:P(8),relation:'following'}],
      summary:'Design LearnLoop\'s product management bootcamp curriculum. Partner with hiring companies to align outcomes.' },

    // ── NovaPay (FinTech · Bangalore) ─────────────────────────────────────────
    { id:'j21', title:'Senior Backend Engineer (Golang)', org:'NovaPay', orgSlug:'novapay', orgColor:'#059669', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹30-45 LPA', postedAt:'2h', applicants:53, fn:'Engineering',
      likes:61, refers:13, urgent:true, experience:'5-9 yrs',
      mustHaveSkills:['Golang','PostgreSQL','Kafka','Distributed Systems'], niceToHave:['gRPC','Redis','K8s'], certsRequired:[],
      networkAtCompany:[{name:'Rahul Joshi',avatar:P(15),relation:'squad'}],
      summary:'Build real-time payment settlement rails at NovaPay. Own core infra processing ₹500Cr/day.' },

    { id:'j22', title:'Compliance & Risk Analyst', org:'NovaPay', orgSlug:'novapay', orgColor:'#059669', verified:true,
      location:'Mumbai, IN', mode:'On-site', type:'Full-time', salary:'₹16-22 LPA', postedAt:'6h', applicants:29, fn:'Risk & Compliance',
      likes:14, refers:2, experience:'2-5 yrs',
      mustHaveSkills:['RBI Compliance','PPI Regulations','Risk Assessment','Banking'], niceToHave:['FEMA','AML','Excel'], certsRequired:[],
      networkAtCompany:[{name:'Pooja Menon',avatar:P(26),relation:'following'}],
      summary:'Ensure NovaPay stays ahead of RBI regulations. Own policy implementation for UPI and prepaid instruments.' },

    { id:'j23', title:'Product Manager -- Payments API', org:'NovaPay', orgSlug:'novapay', orgColor:'#059669', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Full-time', salary:'₹28-40 LPA', postedAt:'1d', applicants:68, fn:'Product',
      likes:52, refers:10, experience:'4-8 yrs',
      mustHaveSkills:['FinTech Product','API Products','B2B','Analytics'], niceToHave:['Payments domain','SQL'], certsRequired:[],
      networkAtCompany:[{name:'Arjun Patel',avatar:P(20),relation:'following'}],
      summary:'Define the product roadmap for NovaPay\'s B2B payments API -- onboarding, docs, and developer experience.' },

    // ── SpaceWork (Remote Work SaaS · Global) ─────────────────────────────────
    { id:'j24', title:'Full-Stack Engineer -- Remote Platform', org:'SpaceWork', orgSlug:'spacework', orgColor:'#F5A524', verified:true,
      location:'Remote / Global', mode:'Remote', type:'Full-time', salary:'$90k-130k', postedAt:'3h', applicants:112, fn:'Engineering',
      likes:94, refers:22, urgent:true, experience:'4-8 yrs',
      mustHaveSkills:['React','TypeScript','Node.js','PostgreSQL'], niceToHave:['WebRTC','K8s','Golang'], certsRequired:[],
      networkAtCompany:[{name:'Karthik Reddy',avatar:P(12),relation:'squad'}],
      summary:'Build the virtual office and async video features used by 200k+ remote workers worldwide.' },

    { id:'j25', title:'Head of Design -- Remote-First', org:'SpaceWork', orgSlug:'spacework', orgColor:'#F5A524', verified:true,
      location:'Remote / Global', mode:'Remote', type:'Full-time', salary:'$100k-140k + equity', postedAt:'1d', applicants:38, fn:'Design',
      likes:71, refers:15, experience:'8+ yrs',
      mustHaveSkills:['Product Design','Design Systems','0→1','Remote Team Leadership'], niceToHave:['Brand','Motion'], certsRequired:[],
      networkAtCompany:[{name:'Priya Nair',avatar:P(5),relation:'following'}],
      summary:'Lead SpaceWork\'s design team of 6 across 4 countries. Own product and brand design for the platform.' },

    // ── Creative Labs (Design · New York) ────────────────────────────────────
    { id:'j26', title:'Senior Product Designer', org:'Creative Labs', orgSlug:'creative-labs', orgColor:'#FF5C28', verified:true,
      location:'New York, NY', mode:'Hybrid', type:'Full-time', salary:'$120k-150k', postedAt:'2h', applicants:78, fn:'Design',
      likes:42, refers:5, urgent:true, experience:'3-5 yrs',
      mustHaveSkills:['Figma','Design Systems','Prototyping'], niceToHave:['Framer','Motion'], certsRequired:[],
      networkAtCompany:[{name:'Priya Nair',avatar:P(5),relation:'following'}],
      summary:'Lead the design process across client projects, from branding and identity to digital product.' },

    { id:'j27', title:'Junior Brand Designer', org:'Creative Labs', orgSlug:'creative-labs', orgColor:'#FF5C28', verified:true,
      location:'New York, NY', mode:'Hybrid', type:'Full-time', salary:'$70k-85k', postedAt:'5h', applicants:43, fn:'Design',
      likes:28, refers:3, experience:'1-2 yrs',
      mustHaveSkills:['Figma','Branding','Typography'], niceToHave:['Illustration','Print'], certsRequired:[],
      networkAtCompany:[],
      summary:'Support the brand design team on identity projects for tech and D2C clients. Great mentorship culture.' },

    { id:'j28', title:'Design Producer / Project Manager', org:'Creative Labs', orgSlug:'creative-labs', orgColor:'#FF5C28', verified:true,
      location:'Remote', mode:'Remote', type:'Contract', salary:'$60/hr', postedAt:'1d', applicants:21, fn:'Operations',
      likes:12, refers:1, experience:'3-5 yrs',
      mustHaveSkills:['Project Management','Design Ops','Client Communication','Notion'], niceToHave:['Figma','Scrum'], certsRequired:[],
      networkAtCompany:[],
      summary:'Keep 6-8 concurrent client projects on track -- brief intake, timelines, reviews, and final delivery.' },

    // ── Tech Genius (Tech Agency · San Francisco) ────────────────────────────
    { id:'j29', title:'UX/UI Designer', org:'Tech Genius', orgSlug:'tech-genius', orgColor:'#6D4BD8', verified:true,
      location:'San Francisco, CA', mode:'Remote', type:'Full-time', salary:'$95k-120k', postedAt:'4h', applicants:54, fn:'Design',
      likes:31, refers:8, experience:'2-4 yrs',
      mustHaveSkills:['User Research','Figma','Prototyping'], niceToHave:['Design Systems','Webflow'], certsRequired:['Google UX Design'],
      networkAtCompany:[{name:'Aarav Sharma',avatar:P(11),relation:'following'}],
      summary:'Shape user experiences across Tech Genius\'s suite of AI-powered SaaS products.' },

    { id:'j30', title:'Frontend Engineer (React/Next.js)', org:'Tech Genius', orgSlug:'tech-genius', orgColor:'#6D4BD8', verified:true,
      location:'San Francisco, CA', mode:'Remote', type:'Full-time', salary:'$110k-140k', postedAt:'6h', applicants:67, fn:'Engineering',
      likes:58, refers:12, experience:'3-6 yrs',
      mustHaveSkills:['React','Next.js','TypeScript','CSS'], niceToHave:['GraphQL','Testing','Storybook'], certsRequired:[],
      networkAtCompany:[{name:'Aarav Sharma',avatar:P(11),relation:'squad'}],
      summary:'Build performant, accessible frontend features for Tech Genius\'s AI product suite.' },

    { id:'j31', title:'Backend API Engineer (Python)', org:'Tech Genius', orgSlug:'tech-genius', orgColor:'#6D4BD8', verified:true,
      location:'Remote', mode:'Remote', type:'Full-time', salary:'$100k-130k', postedAt:'1d', applicants:49, fn:'Engineering',
      likes:39, refers:7, experience:'3-6 yrs',
      mustHaveSkills:['Python','FastAPI','PostgreSQL','REST APIs'], niceToHave:['Celery','Redis','AWS'], certsRequired:[],
      networkAtCompany:[],
      summary:'Design scalable Python APIs powering Tech Genius\'s AI features and third-party integrations.' },

    // ── TrendSetters (Media · London) ────────────────────────────────────────
    { id:'j32', title:'Brand Designer -- Editorial', org:'TrendSetters', orgSlug:'trendsetters', orgColor:'#2BB3A3', verified:true,
      location:'London, UK', mode:'On-site', type:'Contract', salary:'£55k-65k', postedAt:'8h', applicants:23, fn:'Design',
      likes:18, refers:2, experience:'2-4 yrs',
      mustHaveSkills:['Branding','Editorial Design','Illustration','InDesign'], niceToHave:['Typography','Print'], certsRequired:[],
      networkAtCompany:[{name:'Kavya Menon',avatar:P(60),relation:'following'}],
      summary:'Lead visual direction for TrendSetters magazine -- layouts, covers, campaigns, and digital editorial design.' },

    { id:'j33', title:'Content Creator & Social Lead', org:'TrendSetters', orgSlug:'trendsetters', orgColor:'#2BB3A3', verified:true,
      location:'London, UK', mode:'Hybrid', type:'Full-time', salary:'£40k-50k', postedAt:'2d', applicants:61, fn:'Content',
      likes:35, refers:9, experience:'1-3 yrs',
      mustHaveSkills:['Content Creation','Social Media','Video Editing','Copywriting'], niceToHave:['TikTok','Analytics'], certsRequired:[],
      networkAtCompany:[{name:'Aisha Khan',avatar:P(21),relation:'following'}],
      summary:'Grow TrendSetters\' digital presence to 1M followers. Own content calendar, Reels, and brand collabs.' },

    // ── DigitalDreams (Design Studio · LA) ──────────────────────────────────
    { id:'j34', title:'Motion Graphics Designer', org:'DigitalDreams', orgSlug:'digitaldreams', orgColor:'#F5A524', verified:true,
      location:'Los Angeles, CA', mode:'On-site', type:'Freelance', salary:'$80/hr', postedAt:'12h', applicants:31, fn:'Motion / Animation',
      likes:27, refers:1, experience:'2-4 yrs',
      mustHaveSkills:['After Effects','Animation','Motion Design'], niceToHave:['Cinema 4D','Lottie'], certsRequired:[],
      networkAtCompany:[],
      summary:'Create motion graphics and title sequences for DigitalDreams\' entertainment and brand clients.' },

    { id:'j35', title:'3D & Visual Effects Artist', org:'DigitalDreams', orgSlug:'digitaldreams', orgColor:'#F5A524', verified:true,
      location:'Los Angeles, CA', mode:'On-site', type:'Full-time', salary:'$85k-110k', postedAt:'3d', applicants:18, fn:'3D / VFX',
      likes:21, refers:3, experience:'3-6 yrs',
      mustHaveSkills:['Cinema 4D','Blender','VFX','Compositing'], niceToHave:['Unreal Engine','Houdini'], certsRequired:[],
      networkAtCompany:[],
      summary:'Design 3D assets, environments, and VFX for DigitalDreams\' commercial and branded content projects.' },

    { id:'j36', title:'Video Editor -- Short Form', org:'DigitalDreams', orgSlug:'digitaldreams', orgColor:'#F5A524', verified:true,
      location:'Remote', mode:'Remote', type:'Part-time', salary:'$45/hr', postedAt:'4d', applicants:27, fn:'Video',
      likes:16, refers:2, experience:'1-3 yrs',
      mustHaveSkills:['Premiere Pro','Short Form Video','Storytelling'], niceToHave:['DaVinci Resolve','Color Grading'], certsRequired:[],
      networkAtCompany:[],
      summary:'Edit Reels, TikToks, and YouTube Shorts for DigitalDreams\' brand and entertainment clients. Part-time flex.' },

    // ── Innovate Tech (Tech · Tokyo) ─────────────────────────────────────────
    { id:'j37', title:'Founding Designer', org:'Innovate Tech', orgSlug:'innovate-tech', orgColor:'#2FB866', verified:true,
      location:'Remote / Tokyo', mode:'Remote', type:'Full-time', salary:'$130k + equity', postedAt:'1d', applicants:42, fn:'Design',
      likes:64, refers:12, urgent:true, experience:'5+ yrs',
      mustHaveSkills:['Product Design','0→1','Figma','Design Systems'], niceToHave:['Frontend','Motion'], certsRequired:[],
      networkAtCompany:[{name:'Priya Nair',avatar:P(5),relation:'squad'}],
      summary:'Own all design as Innovate Tech\'s first designer. Shape product, brand, and design culture from scratch.' },

    { id:'j38', title:'Product Manager -- API Platform', org:'Innovate Tech', orgSlug:'innovate-tech', orgColor:'#2FB866', verified:true,
      location:'Remote', mode:'Remote', type:'Full-time', salary:'¥12M-18M', postedAt:'2d', applicants:29, fn:'Product',
      likes:33, refers:6, experience:'4-8 yrs',
      mustHaveSkills:['API Products','B2B SaaS','Developer Experience','Roadmapping'], niceToHave:['Technical background','Japan market'], certsRequired:[],
      networkAtCompany:[{name:'Arjun Patel',avatar:P(20),relation:'following'}],
      summary:'Define the product vision for Innovate Tech\'s developer API platform expanding across Southeast Asia.' },

    { id:'j39', title:'Frontend Engineer (React Native)', org:'Innovate Tech', orgSlug:'innovate-tech', orgColor:'#2FB866', verified:true,
      location:'Remote', mode:'Remote', type:'Full-time', salary:'$90k-120k', postedAt:'3d', applicants:35, fn:'Engineering',
      likes:28, refers:5, experience:'3-6 yrs',
      mustHaveSkills:['React Native','TypeScript','Mobile UI'], niceToHave:['Expo','Jest','CI/CD'], certsRequired:[],
      networkAtCompany:[],
      summary:'Build Innovate Tech\'s cross-platform mobile SDK used by developers across Asia.' },

    // ── ChicStyles (D2C Fashion · Mumbai) ─────────────────────────────────────
    { id:'j40', title:'Brand Designer -- Seasonal Campaigns', org:'ChicStyles', orgSlug:'chicstyles', orgColor:'#FF4D4D', verified:true,
      location:'Mumbai, IN', mode:'Hybrid', type:'Full-time', salary:'₹14-20 LPA', postedAt:'1d', applicants:44, fn:'Design',
      likes:31, refers:4, experience:'2-4 yrs',
      mustHaveSkills:['Branding','Photoshop','Illustrator','Packaging Design'], niceToHave:['Typography','Photography'], certsRequired:[],
      networkAtCompany:[{name:'Kavya Menon',avatar:P(60),relation:'squad'},{name:'Ishika Verma',avatar:P(9),relation:'following'}],
      summary:'Own ChicStyles\' seasonal visual identity -- from campaign concepts to final print and digital assets.' },

    { id:'j41', title:'Social Media & Content Designer', org:'ChicStyles', orgSlug:'chicstyles', orgColor:'#FF4D4D', verified:true,
      location:'Mumbai, IN', mode:'On-site', type:'Part-time', salary:'₹8-12 LPA', postedAt:'2d', applicants:66, fn:'Design / Social',
      likes:24, refers:2, experience:'1-2 yrs',
      mustHaveSkills:['Canva','Social Media Design','Reels','Content Calendar'], niceToHave:['Figma','Photography'], certsRequired:[],
      networkAtCompany:[{name:'Aisha Khan',avatar:P(21),relation:'following'}],
      summary:'Create weekly social assets for ChicStyles across Instagram, Pinterest, and Meesho. Flexible hours.' },

    // ── Internships (mixed orgs) ───────────────────────────────────────────────
    { id:'j42', title:'Software Engineering Intern', org:'ByteCloud', orgSlug:'bytecloud', orgColor:'#6D4BD8', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Internship', salary:'₹40k/month', postedAt:'3h', applicants:187, fn:'Engineering',
      likes:55, refers:8, experience:'0-1 yr (student)',
      mustHaveSkills:['JavaScript or Python','Git','Problem Solving'], niceToHave:['React','Node.js'], certsRequired:[],
      networkAtCompany:[{name:'Dev Shah',avatar:P(3),relation:'following'},{name:'Aarav Sharma',avatar:P(11),relation:'following'}],
      summary:'6-month engineering internship at ByteCloud. Build real features, ship to production, mentored by senior engineers.' },

    { id:'j43', title:'Design Intern -- UX', org:'MediSense', orgSlug:'medisense', orgColor:'#2FB866', verified:true,
      location:'Bangalore, IN', mode:'Hybrid', type:'Internship', salary:'₹25k/month', postedAt:'5h', applicants:94, fn:'Design',
      likes:38, refers:5, experience:'0-1 yr (student)',
      mustHaveSkills:['Figma','User Research','Wireframing'], niceToHave:['Healthcare context','Accessibility'], certsRequired:[],
      networkAtCompany:[{name:'Meera Singh',avatar:P(48),relation:'following'}],
      summary:'3-month UX internship. Design interfaces for clinical dashboards used by doctors. Real-world impact.' },

    { id:'j44', title:'Marketing Intern -- Growth', org:'Atomberg', orgSlug:'atomberg', orgColor:'#F59E0B', verified:true,
      location:'Pune, IN', mode:'On-site', type:'Internship', salary:'₹20k/month', postedAt:'1d', applicants:138, fn:'Marketing',
      likes:27, refers:3, experience:'0-1 yr (student)',
      mustHaveSkills:['Social Media','Content Creation','Excel'], niceToHave:['Canva','Performance Marketing basics'], certsRequired:[],
      networkAtCompany:[{name:'Sneha Kapoor',avatar:P(33),relation:'following'}],
      summary:'3-month marketing internship at Atomberg. Run social campaigns, analyse performance, and grow your D2C skills.' },
  ]

  return raw.map((j, i) => elaborateJob(j, i))
}

export function getApplicants(): Applicant[] {
  return [
    { id:'a1', name:'Suriyan Pimwan', avatar:AV(11), age:23, gender:'Male', expectedSalary:'$300/d', experience:'4 yrs', rating:4.0, matchPct:72, stage:'applied',
      email:'suriyan@mail.com', phone:'+66 123 456', skills:['Figma','UI'], verifiedSkills:1, certs:[], source:'tiikme' },
    { id:'a2', name:'Phuvanai Suwan', avatar:AV(12), age:20, gender:'Male', expectedSalary:'$200/d', experience:'2 yrs', rating:4.4, matchPct:64, stage:'applied',
      email:'phuvanai@mail.com', phone:'+66 222 333', skills:['Sketch'], verifiedSkills:0, certs:[], source:'tiikme' },
    { id:'a3', name:'Waradet Chinawat', avatar:AV(13), age:20, gender:'Male', expectedSalary:'$450/d', experience:'2 yrs', rating:4.7, matchPct:91, stage:'shortlisted', badge:'SUPER CANDIDATE',
      email:'waradet@mail.com', phone:'+66 333 444', skills:['Figma','Design Systems','Prototyping'], verifiedSkills:3,
      certs:[{name:'Google UX Design',issuer:'Google'}], testimonial:{quote:'Ships fast, designs with rigor. A rare combination.', by:'Tony Adrian', role:'Design Lead · Zeta'}, referredBy:'Arjun Mehta', source:'tiikme' },
    { id:'a4', name:'Suwannee Wongsuwan', avatar:AV(45), age:28, gender:'Female', expectedSalary:'$600/d', experience:'11 yrs', rating:3.9, matchPct:58, stage:'applied',
      email:'suwannee@mail.com', phone:'+66 444 555', skills:['Branding'], verifiedSkills:2, certs:[], source:'tiikme' },
    { id:'a5', name:'Alex Somchai', avatar:AV(15), age:25, gender:'Male', expectedSalary:'$550/d', experience:'5 yrs', rating:4.8, matchPct:88, stage:'invited', badge:'TOP TALENT',
      email:'alexsom@gmail.com', phone:'+66 123 456 789', skills:['Figma','Design Systems','User Research','Prototyping'], verifiedSkills:4,
      certs:[{name:'Nielsen Norman UX',issuer:'NN/g'}], testimonial:{quote:'Alex is a reliable, hardworking designer who consistently exceeds expectations.', by:'Tony Adrian', role:'Operational Manager · Lotus Horizon'}, source:'tiikme' },
    { id:'a6', name:'Chompoonuch C.', avatar:AV(48), age:24, gender:'Female', expectedSalary:'$300/d', experience:'3 yrs', rating:4.6, matchPct:79, stage:'interviewed',
      email:'chomp@mail.com', phone:'+66 555 666', skills:['Figma','Webflow'], verifiedSkills:2, certs:[], source:'tiikme' },
    { id:'a7', name:'Attawut Sombun', avatar:AV(33), age:21, gender:'Male', expectedSalary:'$350/d', experience:'3 yrs', rating:3.4, matchPct:55, stage:'applied',
      email:'attawut@mail.com', phone:'+66 666 777', skills:['Illustration'], verifiedSkills:0, certs:[], source:'external' },
    { id:'a8', name:'Sombat Jansawang', avatar:AV(20), age:32, gender:'Female', expectedSalary:'$450/d', experience:'14 yrs', rating:4.2, matchPct:83, stage:'hired',
      email:'sombat@mail.com', phone:'+66 777 888', skills:['Figma','Leadership','Design Ops'], verifiedSkills:5,
      certs:[{name:'Certified Scrum',issuer:'Scrum.org'}], source:'tiikme' },
  ]
}

export const STAGE_TABS: { id: Stage | 'all'; label: string }[] = [
  { id:'all', label:'All' },
  { id:'applied', label:'Applied' },
  { id:'shortlisted', label:'Shortlisted' },
  { id:'invited', label:'Invited' },
  { id:'interviewed', label:'Interviewed' },
  { id:'hired', label:'Hired' },
]
