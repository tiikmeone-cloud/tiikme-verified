// Demo universe: 20 profiles -- 10 professionals (3-25 yrs) + 10 students.
// All connected through IIT Bombay cohort / early startup ecosystem.
// Used by: FlexPublicPage, TalentPoolView, SquadsView, feed stubs.

import type { Profile } from '@/lib/types'

export type DemoProfile = Profile

export interface FlexExp {
  id: string; company: string; role: string; location: string | null
  emp_type: string | null; start_year: number; start_month: number
  end_year: number | null; end_month: number | null
  currently_working: boolean; description: string | null; skills_used: string[] | null
}
export interface FlexEdu {
  id: string; institution: string; degree: string | null
  field: string | null; start_year: number | null; end_year: number | null; grade: string | null
}
export interface FlexCert {
  id: string; name: string; issuer: string; issued_year: number | null; url: string | null
}
export interface FlexAchievement {
  id: string; title: string; description: string | null; display_order: number
}
export interface FullDemoProfile {
  profile: DemoProfile
  total_years_exp: number
  experience: FlexExp[]
  education: FlexEdu[]
  certs: FlexCert[]
  achievements: FlexAchievement[]
  squadMates: string[]   // usernames of close squad members
}

const AV = (n: number) => `https://i.pravatar.cc/120?img=${n}`

const PROFILES: FullDemoProfile[] = [

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 1 -- Full-Stack Engineer, 8 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p1', username: 'aarav-sharma',
      full_name: 'Aarav Sharma', headline: 'Full-Stack Engineer · Building dev tools at ByteCloud',
      about: 'I build products end-to-end -- from DB schema to production React. 8 years across fintech, foodtech and now developer tooling. IIT Bombay alumni. Love open-source, coffee, and shipping things that last.',
      avatar_url: AV(11), open_to_work: false, is_public: true,
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker', 'GraphQL'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user', primary_org_slug: 'bytecloud',
    },
    total_years_exp: 8,
    experience: [
      { id:'e1a', company:'ByteCloud', role:'Senior Full-Stack Engineer', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2022, start_month:3, end_year:null, end_month:null,
        currently_working:true, description:'Leading the developer portal product -- authentication, billing, and real-time SDK integrations.',
        skills_used:['React','Node.js','TypeScript','AWS','PostgreSQL'] },
      { id:'e1b', company:'Razorpay', role:'Software Engineer -- Payments Core', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2019, start_month:6, end_year:2022, end_month:2,
        currently_working:false, description:'Built the Settlements microservice handling ₹12B+ annual flow. Designed idempotency layer for payment retries.',
        skills_used:['Golang','PostgreSQL','Kafka','AWS'] },
      { id:'e1c', company:'Swiggy', role:'Frontend Engineer', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2016, start_month:8, end_year:2019, end_month:5,
        currently_working:false, description:'Built consumer-facing cart and checkout flows. Reduced time-to-order by 18% with a progressive web app rewrite.',
        skills_used:['React','Redux','JavaScript'] },
    ],
    education: [
      { id:'edu1a', institution:'IIT Bombay', degree:'B.Tech', field:'Computer Science', start_year:2012, end_year:2016, grade:'8.9 CGPA' },
    ],
    certs: [
      { id:'c1a', name:'AWS Solutions Architect -- Associate', issuer:'Amazon Web Services', issued_year:2021, url:null },
      { id:'c1b', name:'Full-Stack Web Development', issuer:'Coursera / Meta', issued_year:2020, url:null },
    ],
    achievements: [
      { id:'ach1a', title:'Built tiikme-verified from scratch in 2 weeks', description:'Shipped the developer preview of a verified career platform solo using Next.js + Supabase.', display_order:1 },
      { id:'ach1b', title:'Top 50 -- Google Summer of Code 2015', description:'Open-source contributions to Django REST Framework accepted upstream.', display_order:2 },
    ],
    squadMates: ['karthik-reddy', 'dev-shah', 'priya-nair'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 2 -- Product Designer, 6 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p2', username: 'priya-nair',
      full_name: 'Priya Nair', headline: 'Product Designer · Design Systems @ FreshRoute',
      about: 'Product designer obsessed with reducing cognitive load. 6 years in consumer apps -- from Zomato\'s cart redesign to building FreshRoute\'s entire design system from scratch. Figma nerd, design-to-dev advocate.',
      avatar_url: AV(5), open_to_work: false, is_public: true,
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Framer', 'Accessibility'],
      location_city: 'Mumbai', location_state: 'Maharashtra', country: 'India',
      account_type: 'user', primary_org_slug: 'freshroute',
    },
    total_years_exp: 6,
    experience: [
      { id:'e2a', company:'FreshRoute', role:'Lead Product Designer', location:'Mumbai, IN',
        emp_type:'Full-time', start_year:2021, start_month:4, end_year:null, end_month:null,
        currently_working:true, description:'Own the end-to-end design system used by 12 product squads. Reduced design-to-dev handoff time by 40%.',
        skills_used:['Figma','Design Systems','Tokens','Prototyping'] },
      { id:'e2b', company:'PhonePe', role:'Product Designer', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2019, start_month:2, end_year:2021, end_month:3,
        currently_working:false, description:'Redesigned the UPI payment confirmation flow -- increased success rate from 74% to 91%. Shipped dark mode.',
        skills_used:['Figma','User Research','Android','iOS'] },
      { id:'e2c', company:'Zomato', role:'UI/UX Designer', location:'Gurugram, IN',
        emp_type:'Full-time', start_year:2018, start_month:7, end_year:2019, end_month:1,
        currently_working:false, description:'Cart and checkout redesign for the Zomato Gold programme -- 23% uplift in conversions.',
        skills_used:['Sketch','Principle','Zeplin'] },
    ],
    education: [
      { id:'edu2a', institution:'IIT Bombay', degree:'B.Tech', field:'Industrial Design', start_year:2014, end_year:2018, grade:'9.1 CGPA' },
    ],
    certs: [
      { id:'c2a', name:'Google UX Design Professional Certificate', issuer:'Coursera / Google', issued_year:2020, url:null },
      { id:'c2b', name:'Certified Nielsen Norman UX', issuer:'NN/g', issued_year:2022, url:null },
    ],
    achievements: [
      { id:'ach2a', title:'Design System adopted by 12 squads at FreshRoute', description:'Built and shipped FreshRoute\'s first design system, cutting design inconsistencies by 60%.', display_order:1 },
      { id:'ach2b', title:'Featured in Figma Community -- Top 10 Design Systems 2023', description:'FreshRoute DS was showcased by Figma team at Config 2023.', display_order:2 },
    ],
    squadMates: ['aarav-sharma', 'kavya-menon', 'sneha-kapoor', 'tanvi-bhatt', 'ishika-verma'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 3 -- Data Scientist, 5 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p3', username: 'rohan-gupta',
      full_name: 'Rohan Gupta', headline: 'Data Scientist · Threat Intelligence @ CipherNet',
      about: 'Building ML models that detect cyberattacks before they happen. 5 years in data -- from Amazon recommendations to anomaly detection at CipherNet. BITS Pilani, ex-Mu Sigma. Python + SQL are my home.',
      avatar_url: AV(14), open_to_work: false, is_public: true,
      skills: ['Python', 'TensorFlow', 'SQL', 'Spark', 'Scikit-learn', 'MLflow', 'AWS SageMaker'],
      location_city: 'Hyderabad', location_state: 'Telangana', country: 'India',
      account_type: 'user', primary_org_slug: 'ciphernet',
    },
    total_years_exp: 5,
    experience: [
      { id:'e3a', company:'CipherNet', role:'Senior Data Scientist -- Threat Intelligence', location:'Hyderabad, IN',
        emp_type:'Full-time', start_year:2022, start_month:1, end_year:null, end_month:null,
        currently_working:true, description:'Built LSTM-based anomaly detection models on network telemetry data. Reduced false positive alert rate by 55%.',
        skills_used:['Python','TensorFlow','Spark','MLflow','AWS'] },
      { id:'e3b', company:'Amazon', role:'Data Scientist -- Retail Recommendations', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2020, start_month:7, end_year:2021, end_month:12,
        currently_working:false, description:'A/B tested and shipped collaborative filtering model improvements for the "Customers also viewed" panel.',
        skills_used:['Python','Scikit-learn','SQL','Spark'] },
      { id:'e3c', company:'Mu Sigma', role:'Decision Scientist', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2019, start_month:7, end_year:2020, end_month:6,
        currently_working:false, description:'Built churn prediction models for FMCG clients. Delivered 12% improvement in retention campaigns.',
        skills_used:['R','Python','SQL'] },
    ],
    education: [
      { id:'edu3a', institution:'BITS Pilani', degree:'B.E.', field:'Computer Science', start_year:2015, end_year:2019, grade:'8.2 CGPA' },
    ],
    certs: [
      { id:'c3a', name:'Deep Learning Specialization', issuer:'Coursera / DeepLearning.AI', issued_year:2021, url:null },
      { id:'c3b', name:'AWS Certified Machine Learning', issuer:'Amazon Web Services', issued_year:2022, url:null },
    ],
    achievements: [
      { id:'ach3a', title:'Reduced threat detection false positives by 55% at CipherNet', description:'LSTM anomaly model in production, processing 4M events/day.', display_order:1 },
    ],
    squadMates: ['meera-singh', 'riya-agarwal'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 4 -- Marketing Lead, 7 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p4', username: 'sneha-kapoor',
      full_name: 'Sneha Kapoor', headline: 'Marketing Lead · Growth & Brand @ Atomberg',
      about: '7 years making brands grow -- from Ogilvy pitches to D2C performance marketing at Atomberg. Fanatic about brand storytelling and conversion metrics in equal measure. MICA Ahmedabad.',
      avatar_url: AV(33), open_to_work: false, is_public: true,
      skills: ['Growth Marketing', 'SEO', 'Brand Strategy', 'Performance Marketing', 'Content', 'Analytics', 'D2C'],
      location_city: 'Pune', location_state: 'Maharashtra', country: 'India',
      account_type: 'user', primary_org_slug: 'atomberg',
    },
    total_years_exp: 7,
    experience: [
      { id:'e4a', company:'Atomberg', role:'Marketing Lead', location:'Pune, IN',
        emp_type:'Full-time', start_year:2021, start_month:6, end_year:null, end_month:null,
        currently_working:true, description:'Own brand + performance marketing for India\'s fastest-growing D2C hardware brand. 3× ROAS on paid campaigns.',
        skills_used:['D2C Marketing','Meta Ads','Google Ads','Brand','Analytics'] },
      { id:'e4b', company:'Swiggy', role:'Senior Growth Marketer', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2018, start_month:3, end_year:2021, end_month:5,
        currently_working:false, description:'Led influencer + content strategy for Swiggy Pop, growing 0→2M MAUs in 18 months.',
        skills_used:['Content Strategy','Influencer Marketing','SEO'] },
      { id:'e4c', company:'Ogilvy India', role:'Account Manager', location:'Mumbai, IN',
        emp_type:'Full-time', start_year:2017, start_month:7, end_year:2018, end_month:2,
        currently_working:false, description:'Managed FMCG accounts, developed integrated campaigns across TV, digital, and OOH.',
        skills_used:['Campaign Management','Brand Strategy'] },
    ],
    education: [
      { id:'edu4a', institution:'MICA Ahmedabad', degree:'PGDM', field:'Strategic Marketing', start_year:2015, end_year:2017, grade:'7.9 CGPA' },
      { id:'edu4b', institution:'Delhi University', degree:'B.A.', field:'Economics', start_year:2012, end_year:2015, grade:'8.1 CGPA' },
    ],
    certs: [
      { id:'c4a', name:'Google Ads Certification', issuer:'Google', issued_year:2020, url:null },
      { id:'c4b', name:'HubSpot Content Marketing', issuer:'HubSpot', issued_year:2021, url:null },
    ],
    achievements: [
      { id:'ach4a', title:'3× ROAS on Atomberg paid campaigns', description:'Restructured media mix, drove ₹40Cr revenue attributable to digital.', display_order:1 },
      { id:'ach4b', title:'Swiggy Pop: 0 → 2M MAUs in 18 months', description:'Content + influencer strategy that made Swiggy Pop the fastest new vertical launch.', display_order:2 },
    ],
    squadMates: ['priya-nair', 'ananya-desai'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 5 -- Principal DevOps, 12 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p5', username: 'karthik-reddy',
      full_name: 'Karthik Reddy', headline: 'Principal DevOps Architect · Platform Engineering @ SpaceWork',
      about: '12 years building infrastructure for distributed systems at scale -- ThoughtWorks, GitLab, and now SpaceWork\'s global remote platform. IIT Madras. Speaker at KubeCon 2023. Obsessed with platform engineering and zero-trust security.',
      avatar_url: AV(12), open_to_work: false, is_public: true,
      skills: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'CI/CD', 'Platform Engineering', 'Zero-Trust', 'Golang'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user', primary_org_slug: 'spacework',
    },
    total_years_exp: 12,
    experience: [
      { id:'e5a', company:'SpaceWork', role:'Principal DevOps Architect', location:'Remote',
        emp_type:'Full-time', start_year:2020, start_month:5, end_year:null, end_month:null,
        currently_working:true, description:'Architected SpaceWork\'s multi-cloud Kubernetes platform serving 200k+ remote workers. 99.99% uptime SLA.',
        skills_used:['Kubernetes','AWS','GCP','Terraform','ArgoCD','Golang'] },
      { id:'e5b', company:'GitLab', role:'Senior DevOps Engineer', location:'Remote',
        emp_type:'Full-time', start_year:2017, start_month:9, end_year:2020, end_month:4,
        currently_working:false, description:'Contributed to GitLab Runner and CI/CD infrastructure. Shipped auto-deploy features for GitLab.com SaaS.',
        skills_used:['Docker','Kubernetes','Ruby','AWS'] },
      { id:'e5c', company:'ThoughtWorks', role:'Infrastructure Consultant', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2012, start_month:7, end_year:2017, end_month:8,
        currently_working:false, description:'Platform engineering for banking and retail clients. Led teams of 5-12 across 3 countries.',
        skills_used:['AWS','Chef','Jenkins','Java'] },
    ],
    education: [
      { id:'edu5a', institution:'IIT Madras', degree:'B.Tech', field:'Electrical Engineering', start_year:2008, end_year:2012, grade:'8.5 CGPA' },
    ],
    certs: [
      { id:'c5a', name:'Certified Kubernetes Administrator (CKA)', issuer:'CNCF', issued_year:2019, url:null },
      { id:'c5b', name:'AWS Solutions Architect Professional', issuer:'Amazon Web Services', issued_year:2021, url:null },
      { id:'c5c', name:'HashiCorp Terraform Associate', issuer:'HashiCorp', issued_year:2022, url:null },
    ],
    achievements: [
      { id:'ach5a', title:'Speaker at KubeCon NA 2023 -- "Platform Engineering at Global Scale"', description:'Talk on SpaceWork\'s multi-region K8s architecture viewed 14k times.', display_order:1 },
      { id:'ach5b', title:'99.99% uptime SLA for SpaceWork platform', description:'Zero downtime deployments for 200k+ active users.', display_order:2 },
    ],
    squadMates: ['aarav-sharma', 'rahul-joshi'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 6 -- ML Engineer, 4 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p6', username: 'meera-singh',
      full_name: 'Meera Singh', headline: 'ML Engineer · Medical AI @ MediSense',
      about: 'Building AI models that help doctors diagnose faster and better. 4 years in ML -- from Flipkart supply chain forecasting to medical imaging at MediSense. BITS Pilani alumna. Open to research collaborations.',
      avatar_url: AV(48), open_to_work: true, is_public: true,
      skills: ['PyTorch', 'MLOps', 'Python', 'Computer Vision', 'DICOM', 'FastAPI', 'AWS SageMaker'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user', primary_org_slug: 'medisense',
    },
    total_years_exp: 4,
    experience: [
      { id:'e6a', company:'MediSense', role:'ML Engineer -- Medical Imaging', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2021, start_month:9, end_year:null, end_month:null,
        currently_working:true, description:'Built chest X-ray AI that achieves 93% sensitivity on pneumonia detection. Deployed to 40 hospitals.',
        skills_used:['PyTorch','Computer Vision','DICOM','FastAPI','AWS SageMaker'] },
      { id:'e6b', company:'Flipkart', role:'Data Scientist -- Supply Chain', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2019, start_month:8, end_year:2021, end_month:8,
        currently_working:false, description:'Demand forecasting for Big Billion Days. Reduced stockouts by 30% with ensemble time-series models.',
        skills_used:['Python','Scikit-learn','SQL','Spark'] },
    ],
    education: [
      { id:'edu6a', institution:'BITS Pilani', degree:'B.E.', field:'Electronics & Instrumentation', start_year:2015, end_year:2019, grade:'8.6 CGPA' },
    ],
    certs: [
      { id:'c6a', name:'Deep Learning Specialization', issuer:'Coursera / deeplearning.ai', issued_year:2020, url:null },
      { id:'c6b', name:'PyTorch for Deep Learning', issuer:'Udemy', issued_year:2021, url:null },
    ],
    achievements: [
      { id:'ach6a', title:'AI model deployed to 40 hospitals -- 93% sensitivity on pneumonia detection', description:'Shipped production-grade chest X-ray classification model used in clinical settings.', display_order:1 },
    ],
    squadMates: ['rohan-gupta', 'riya-agarwal'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 7 -- Senior Product Manager, 9 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p7', username: 'arjun-patel',
      full_name: 'Arjun Patel', headline: 'Senior Product Manager · Search & Discovery @ Cleartrip',
      about: '9 years in product -- OYO pricing, MakeMyTrip hotels, and now Cleartrip Search. I obsess over activation funnels and user jobs-to-be-done. IIM Bangalore MBA. Love building 0→1 alongside scrappy teams.',
      avatar_url: AV(20), open_to_work: false, is_public: true,
      skills: ['Product Strategy', 'Analytics', 'OKRs', 'Agile', 'SQL', 'A/B Testing', 'Roadmapping', 'User Research'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user', primary_org_slug: 'cleartrip',
    },
    total_years_exp: 9,
    experience: [
      { id:'e7a', company:'Cleartrip', role:'Senior Product Manager -- Search & Discovery', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2020, start_month:8, end_year:null, end_month:null,
        currently_working:true, description:'Own the flights search ranking and personalisation product. 14% improvement in search-to-book CVR.',
        skills_used:['Product Strategy','Analytics','A/B Testing','SQL'] },
      { id:'e7b', company:'MakeMyTrip', role:'Product Manager -- Hotels', location:'Gurugram, IN',
        emp_type:'Full-time', start_year:2018, start_month:1, end_year:2020, end_month:7,
        currently_working:false, description:'Launched MMT\'s "Smart Hotel" recommendation engine -- 22% increase in hotel booking revenue.',
        skills_used:['Product','Analytics','SQL'] },
      { id:'e7c', company:'OYO', role:'Associate Product Manager', location:'Gurugram, IN',
        emp_type:'Full-time', start_year:2015, start_month:9, end_year:2018, end_month:1,
        currently_working:false, description:'Built OYO\'s dynamic pricing engine for Tier 3 markets -- first PM role, end-to-end ownership.',
        skills_used:['SQL','Pricing','Agile'] },
    ],
    education: [
      { id:'edu7a', institution:'IIM Bangalore', degree:'MBA', field:'Strategy & Product', start_year:2013, end_year:2015, grade:'3.8/4.0 GPA' },
      { id:'edu7b', institution:'NIT Surat', degree:'B.Tech', field:'Mechanical Engineering', start_year:2009, end_year:2013, grade:'8.1 CGPA' },
    ],
    certs: [
      { id:'c7a', name:'Certified Product Manager', issuer:'Product School', issued_year:2018, url:null },
      { id:'c7b', name:'SQL for Product Managers', issuer:'Mode Analytics', issued_year:2019, url:null },
    ],
    achievements: [
      { id:'ach7a', title:'14% improvement in search-to-book CVR at Cleartrip', description:'Shipped personalised ranking model, biggest quarterly metric gain in 3 years.', display_order:1 },
      { id:'ach7b', title:'MMT Smart Hotel: 22% revenue uplift', description:'Led cross-functional squad from 0 to launch in 6 months.', display_order:2 },
    ],
    squadMates: ['vedant-jain', 'sai-krishnan'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 8 -- Brand Designer, 3 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p8', username: 'kavya-menon',
      full_name: 'Kavya Menon', headline: 'Brand Designer · Visual Identity @ ChicStyles',
      about: 'Designing brands that people remember and buy from. 3 years building visual identities -- from Zomato campaigns to ChicStyles\' seasonal fashion lookbooks. NID Ahmedabad alumna. Illustration + type is my love language.',
      avatar_url: AV(60), open_to_work: false, is_public: true,
      skills: ['Branding', 'Illustration', 'Adobe Illustrator', 'Figma', 'Typography', 'Photoshop', 'Social Media Design'],
      location_city: 'Mumbai', location_state: 'Maharashtra', country: 'India',
      account_type: 'user', primary_org_slug: 'chicstyles',
    },
    total_years_exp: 3,
    experience: [
      { id:'e8a', company:'ChicStyles', role:'Brand Designer', location:'Mumbai, IN',
        emp_type:'Full-time', start_year:2022, start_month:2, end_year:null, end_month:null,
        currently_working:true, description:'Own seasonal campaign visuals and brand book. Redesigned packaging identity, 28% improvement in unboxing NPS.',
        skills_used:['Adobe Illustrator','Figma','Typography','Photography'] },
      { id:'e8b', company:'Zomato', role:'Visual Designer', location:'Gurugram, IN',
        emp_type:'Full-time', start_year:2021, start_month:7, end_year:2022, end_month:1,
        currently_working:false, description:'Designed social media campaigns for Zomato Premier League -- 14 million organic impressions.',
        skills_used:['Photoshop','After Effects','Illustration'] },
    ],
    education: [
      { id:'edu8a', institution:'NID Ahmedabad', degree:'B.Des', field:'Visual Communication', start_year:2017, end_year:2021, grade:'3.9/4.0 GPA' },
    ],
    certs: [
      { id:'c8a', name:'Adobe Certified Professional -- Illustrator', issuer:'Adobe', issued_year:2022, url:null },
    ],
    achievements: [
      { id:'ach8a', title:'28% NPS improvement on packaging redesign at ChicStyles', description:'Led full packaging identity overhaul, from ideation to print.', display_order:1 },
    ],
    squadMates: ['priya-nair', 'ishika-verma'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 9 -- Principal Backend Engineer, 15 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p9', username: 'rahul-joshi',
      full_name: 'Rahul Joshi', headline: 'Principal Backend Engineer · Core Infra @ NovaPay',
      about: '15 years of distributed systems -- Microsoft Excel rendering, Adobe Lightroom sync engine, and now building NovaPay\'s real-time payment rails. IIT Delhi. I care about correctness, latency, and systems that don\'t page you at 3am.',
      avatar_url: AV(15), open_to_work: false, is_public: true,
      skills: ['Golang', 'Distributed Systems', 'PostgreSQL', 'Kafka', 'gRPC', 'C++', 'Redis', 'System Design'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user', primary_org_slug: 'novapay',
    },
    total_years_exp: 15,
    experience: [
      { id:'e9a', company:'NovaPay', role:'Principal Backend Engineer', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2019, start_month:11, end_year:null, end_month:null,
        currently_working:true, description:'Architected real-time payment rails processing ₹500Cr/day. Led DB sharding migration with zero downtime.',
        skills_used:['Golang','PostgreSQL','Kafka','Redis','gRPC'] },
      { id:'e9b', company:'Adobe', role:'Senior Software Engineer -- Creative Cloud Sync', location:'Noida, IN',
        emp_type:'Full-time', start_year:2014, start_month:6, end_year:2019, end_month:10,
        currently_working:false, description:'Built delta-sync protocol for Lightroom CC, reducing average sync time from 8s to 1.2s.',
        skills_used:['C++','Golang','AWS','gRPC'] },
      { id:'e9c', company:'Microsoft India', role:'Software Engineer II', location:'Hyderabad, IN',
        emp_type:'Full-time', start_year:2009, start_month:7, end_year:2014, end_month:5,
        currently_working:false, description:'Excel Online rendering engine -- shipped collaborative editing (now 50M daily users).',
        skills_used:['C#','TypeScript','ASP.NET'] },
    ],
    education: [
      { id:'edu9a', institution:'IIT Delhi', degree:'B.Tech', field:'Computer Science', start_year:2005, end_year:2009, grade:'9.2 CGPA' },
    ],
    certs: [
      { id:'c9a', name:'Distributed Systems -- MIT 6.824', issuer:'MIT OpenCourseWare', issued_year:2018, url:null },
    ],
    achievements: [
      { id:'ach9a', title:'Payment rail: ₹500Cr/day, zero downtime migration', description:'Led DB sharding and Kafka migration without a single minute of customer-facing downtime.', display_order:1 },
      { id:'ach9b', title:'Excel Online collaborative editing -- 50M daily users', description:'Co-authored the operational transform protocol powering co-editing.', display_order:2 },
    ],
    squadMates: ['karthik-reddy', 'arnav-khanna'],
  },

  // ─────────────────────────────────────────────────
  // PROFESSIONAL 10 -- Content Strategist, 5 yrs
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-p10', username: 'ananya-desai',
      full_name: 'Ananya Desai', headline: 'Content Strategist · Curriculum & Growth @ LearnLoop',
      about: '5 years turning complex topics into content people actually finish. Built BYJU\'s JEE prep video library (12M+ views), grew Unacademy\'s free tier by 3× with SEO, and now leading LearnLoop\'s curriculum team. NIFT Delhi.',
      avatar_url: AV(8), open_to_work: false, is_public: true,
      skills: ['Content Strategy', 'SEO', 'Curriculum Design', 'Video Production', 'Copywriting', 'LMS', 'Analytics'],
      location_city: 'Delhi', location_state: 'Delhi', country: 'India',
      account_type: 'user', primary_org_slug: 'learnloop',
    },
    total_years_exp: 5,
    experience: [
      { id:'e10a', company:"LearnLoop", role:'Head of Curriculum & Content', location:'Delhi, IN',
        emp_type:'Full-time', start_year:2022, start_month:3, end_year:null, end_month:null,
        currently_working:true, description:'Leading a 15-person team creating bootcamp curriculum. NPS moved from 52 to 74 in 18 months.',
        skills_used:['Curriculum Design','Content Strategy','LMS','Analytics'] },
      { id:'e10b', company:'Unacademy', role:'Senior Content Strategist', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2020, start_month:4, end_year:2022, end_month:2,
        currently_working:false, description:'SEO strategy for Unacademy\'s free tier -- 3× organic traffic growth, 2M new monthly users.',
        skills_used:['SEO','Content Strategy','Analytics'] },
      { id:'e10c', company:"BYJU's", role:'Content Writer -- JEE Prep', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2019, start_month:7, end_year:2020, end_month:3,
        currently_working:false, description:'Wrote and scripted JEE Mathematics video lessons -- 12M+ cumulative views.',
        skills_used:['Technical Writing','Video Scripting','Curriculum'] },
    ],
    education: [
      { id:'edu10a', institution:'NIFT Delhi', degree:'B.Des', field:'Fashion Communication', start_year:2015, end_year:2019, grade:'8.3 CGPA' },
    ],
    certs: [
      { id:'c10a', name:'Content Marketing Certification', issuer:'HubSpot', issued_year:2020, url:null },
      { id:'c10b', name:'Google Analytics Certified', issuer:'Google', issued_year:2021, url:null },
    ],
    achievements: [
      { id:'ach10a', title:'LearnLoop curriculum NPS: 52 → 74 in 18 months', description:'Rebuilt the bootcamp curriculum with job-outcome-focused modules.', display_order:1 },
    ],
    squadMates: ['sneha-kapoor', 'vedant-jain'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 11 -- CS, IIT Bombay
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s1', username: 'dev-shah',
      full_name: 'Dev Shah', headline: 'CS Student @ IIT Bombay · ML & Systems',
      about: '2nd year CS at IIT Bombay. Building AI tools and contributing to open-source in my free time. Interned at ByteCloud (Summer \'25) under Aarav\'s team. Looking for SWE or ML intern roles for next summer.',
      avatar_url: AV(3), open_to_work: true, is_public: true,
      skills: ['Python', 'C++', 'Machine Learning', 'React', 'Git', 'NumPy', 'Linux'],
      location_city: 'Mumbai', location_state: 'Maharashtra', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es1a', company:'ByteCloud', role:'Software Engineering Intern', location:'Bangalore, IN',
        emp_type:'Internship', start_year:2025, start_month:5, end_year:2025, end_month:7,
        currently_working:false, description:'Built developer onboarding CLI tool in Node.js. Reduced time-to-first-API-call from 25 min to 8 min.',
        skills_used:['Node.js','TypeScript','CLI','AWS'] },
    ],
    education: [
      { id:'edus1a', institution:'IIT Bombay', degree:'B.Tech', field:'Computer Science', start_year:2024, end_year:2028, grade:'9.0 CGPA (1st yr)' },
    ],
    certs: [
      { id:'cs1a', name:'Machine Learning -- Stanford Online', issuer:'Coursera / Stanford', issued_year:2025, url:null },
    ],
    achievements: [
      { id:'achs1a', title:'ICPC Regional 2024 -- Top 20', description:'Ranked 17th in ICPC Asia West Regional, IIT Bombay.', display_order:1 },
    ],
    squadMates: ['aarav-sharma', 'nikhil-rao', 'arnav-khanna'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 12 -- Design, NID Ahmedabad
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s2', username: 'ishika-verma',
      full_name: 'Ishika Verma', headline: 'Design Student @ NID Ahmedabad · Illustration & UX',
      about: '3rd year Visual Communication at NID Ahmedabad. Freelance illustrator and UX enthusiast. Obsessed with editorial design and accessible interfaces. Seeking summer design internships.',
      avatar_url: AV(9), open_to_work: true, is_public: true,
      skills: ['Figma', 'Illustration', 'Adobe Illustrator', 'Typography', 'User Research', 'Procreate'],
      location_city: 'Ahmedabad', location_state: 'Gujarat', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es2a', company:'Freelance', role:'Brand & Illustration Designer', location:'Remote',
        emp_type:'Freelance', start_year:2023, start_month:6, end_year:null, end_month:null,
        currently_working:true, description:'Designed brand identities and illustrated merchandise for 5 student-run D2C brands.',
        skills_used:['Adobe Illustrator','Figma','Branding'] },
    ],
    education: [
      { id:'edus2a', institution:'NID Ahmedabad', degree:'B.Des', field:'Visual Communication', start_year:2022, end_year:2026, grade:'3.8/4.0 GPA' },
    ],
    certs: [
      { id:'cs2a', name:'UI Design Fundamentals', issuer:'Skillshare', issued_year:2024, url:null },
    ],
    achievements: [
      { id:'achs2a', title:'NID Annual Show -- Best Illustration Award 2024', description:'Editorial illustration series "Climate in Color" selected for national showcase.', display_order:1 },
    ],
    squadMates: ['kavya-menon', 'priya-nair', 'tanvi-bhatt'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 13 -- MBA, IIM Bangalore (ex-TCS 3 yrs)
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s3', username: 'sai-krishnan',
      full_name: 'Sai Krishnan', headline: 'MBA Student @ IIM Bangalore · Product & Strategy (ex-TCS 3 yrs)',
      about: '1st year MBA at IIM Bangalore, specialising in product strategy and tech consulting. 3 years at TCS before MBA -- deployed SAP for Fortune 500 clients. Looking for PM internships with early-stage or product-first companies.',
      avatar_url: AV(6), open_to_work: true, is_public: true,
      skills: ['Product Strategy', 'Excel', 'SQL', 'Business Analysis', 'Consulting', 'SAP', 'Agile'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 3,
    experience: [
      { id:'es3a', company:'TCS', role:'IT Analyst -- SAP Consulting', location:'Chennai, IN',
        emp_type:'Full-time', start_year:2021, start_month:8, end_year:2024, end_month:6,
        currently_working:false, description:'Led SAP S/4HANA migration for a US retail client. Managed 8-member delivery team, on-time and under budget.',
        skills_used:['SAP','Business Analysis','Agile','Project Management'] },
    ],
    education: [
      { id:'edus3a', institution:'IIM Bangalore', degree:'MBA', field:'Product & Strategy', start_year:2024, end_year:2026, grade:'--' },
      { id:'edus3b', institution:'PSG College of Technology', degree:'B.E.', field:'Information Technology', start_year:2017, end_year:2021, grade:'8.4 CGPA' },
    ],
    certs: [
      { id:'cs3a', name:'SAP Certified Associate -- S/4HANA', issuer:'SAP', issued_year:2022, url:null },
    ],
    achievements: [
      { id:'achs3a', title:'IIM Bangalore -- CAT 99.2 percentile', description:'Top 0.8% nationally in CAT 2024 entrance exam.', display_order:1 },
    ],
    squadMates: ['arjun-patel', 'vedant-jain', 'pooja-menon'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 14 -- Data Science, BITS Pilani
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s4', username: 'riya-agarwal',
      full_name: 'Riya Agarwal', headline: 'Data Science Student @ BITS Pilani · Healthcare AI',
      about: '1st year M.Sc Data Science at BITS Pilani. Interned at MediSense under Meera\'s team and now obsessed with healthcare AI. Built a skin disease detection model for my thesis. Seeking ML engineering roles.',
      avatar_url: AV(44), open_to_work: true, is_public: true,
      skills: ['Python', 'PyTorch', 'Pandas', 'Tableau', 'SQL', 'Scikit-learn', 'Computer Vision'],
      location_city: 'Pilani', location_state: 'Rajasthan', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es4a', company:'MediSense', role:'Data Science Intern', location:'Bangalore, IN',
        emp_type:'Internship', start_year:2025, start_month:1, end_year:2025, end_month:5,
        currently_working:false, description:'Built a CNN-based skin lesion classifier using ISIC dataset -- 87% accuracy on dermoscopy images.',
        skills_used:['PyTorch','Computer Vision','Python'] },
    ],
    education: [
      { id:'edus4a', institution:'BITS Pilani', degree:'M.Sc', field:'Data Science', start_year:2024, end_year:2026, grade:'8.9 CGPA' },
      { id:'edus4b', institution:'Sri Venkateswara College, Delhi', degree:'B.Sc', field:'Mathematics', start_year:2021, end_year:2024, grade:'9.0 CGPA' },
    ],
    certs: [
      { id:'cs4a', name:'Applied Data Science with Python', issuer:'Coursera / University of Michigan', issued_year:2024, url:null },
    ],
    achievements: [
      { id:'achs4a', title:'BITS Pilani Data Science Hackathon -- 1st place', description:'Built real-time hospital occupancy predictor using public HMIS data.', display_order:1 },
    ],
    squadMates: ['meera-singh', 'rohan-gupta'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 15 -- ECE, IIT Delhi
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s5', username: 'arnav-khanna',
      full_name: 'Arnav Khanna', headline: 'ECE Student @ IIT Delhi · Embedded Systems & IoT',
      about: '3rd year ECE at IIT Delhi. Passionate about embedded systems and edge AI. Built a smart irrigation system for my village using Raspberry Pi. Contributed to Rahul\'s team on a distributed sensor project. Looking for embedded/IoT internships.',
      avatar_url: AV(16), open_to_work: true, is_public: true,
      skills: ['C', 'Embedded Systems', 'IoT', 'RTOS', 'Raspberry Pi', 'Arduino', 'Python', 'PCB Design'],
      location_city: 'Delhi', location_state: 'Delhi', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es5a', company:'IIT Delhi -- Research Lab', role:'Undergraduate Research Assistant', location:'Delhi, IN',
        emp_type:'Internship', start_year:2025, start_month:1, end_year:null, end_month:null,
        currently_working:true, description:'Distributed sensor network for environmental monitoring. Working on low-power MQTT protocol over LoRa.',
        skills_used:['C','RTOS','LoRa','Embedded Systems'] },
    ],
    education: [
      { id:'edus5a', institution:'IIT Delhi', degree:'B.Tech', field:'Electrical & Electronics Engineering', start_year:2023, end_year:2027, grade:'8.7 CGPA' },
    ],
    certs: [
      { id:'cs5a', name:'Embedded Systems Design', issuer:'NPTEL', issued_year:2025, url:null },
    ],
    achievements: [
      { id:'achs5a', title:'Smart Irrigation System -- IITD Student Innovation Award', description:'Built IoT irrigation controller reducing water usage by 35% in pilot village.', display_order:1 },
    ],
    squadMates: ['rahul-joshi', 'dev-shah'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 16 -- UX Design, Symbiosis
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s6', username: 'tanvi-bhatt',
      full_name: 'Tanvi Bhatt', headline: 'UX Design Student @ Symbiosis · Mentored by Priya Nair',
      about: '2nd year B.Des at Symbiosis Institute of Design. Being mentored by Priya Nair at FreshRoute. Currently building a case study on food delivery checkout flows. Open to UX internships for Summer \'26.',
      avatar_url: AV(47), open_to_work: true, is_public: true,
      skills: ['Figma', 'Prototyping', 'User Research', 'Wireframing', 'Usability Testing', 'Adobe XD'],
      location_city: 'Pune', location_state: 'Maharashtra', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es6a', company:'Freelance', role:'UX Design Intern', location:'Remote',
        emp_type:'Freelance', start_year:2025, start_month:3, end_year:null, end_month:null,
        currently_working:true, description:'Redesigned mobile UX for a local grocery app -- 5 user interviews, 3 prototype iterations.',
        skills_used:['Figma','User Research','Prototyping'] },
    ],
    education: [
      { id:'edus6a', institution:'Symbiosis Institute of Design', degree:'B.Des', field:'UX Design', start_year:2024, end_year:2028, grade:'--' },
    ],
    certs: [
      { id:'cs6a', name:'Foundations of UX Design', issuer:'Coursera / Google', issued_year:2025, url:null },
    ],
    achievements: [
      { id:'achs6a', title:'SID Design Fest 2025 -- Best Student Project', description:'Accessibility redesign of a rural banking app, selected for national showcase.', display_order:1 },
    ],
    squadMates: ['priya-nair', 'ishika-verma'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 17 -- CS, VIT Vellore
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s7', username: 'nikhil-rao',
      full_name: 'Nikhil Rao', headline: 'CS Student @ VIT Vellore · Full-Stack & Open Source',
      about: '3rd year CS at VIT Vellore. Love building side projects -- my Chrome extension for focus mode has 4k users. Active open-source contributor. Friends with Dev Shah from ICPC competitions.',
      avatar_url: AV(7), open_to_work: true, is_public: true,
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python', 'Git', 'Next.js'],
      location_city: 'Vellore', location_state: 'Tamil Nadu', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es7a', company:'Self', role:'Open Source Developer', location:'Remote',
        emp_type:'Freelance', start_year:2023, start_month:9, end_year:null, end_month:null,
        currently_working:true, description:'Maintain 3 open-source repos -- focus Chrome extension (4k users), React component library, and a CLI for local LLMs.',
        skills_used:['JavaScript','React','Chrome APIs','Node.js'] },
    ],
    education: [
      { id:'edus7a', institution:'VIT Vellore', degree:'B.Tech', field:'Computer Science', start_year:2023, end_year:2027, grade:'8.6 CGPA' },
    ],
    certs: [
      { id:'cs7a', name:'The Web Developer Bootcamp', issuer:'Udemy / Colt Steele', issued_year:2024, url:null },
    ],
    achievements: [
      { id:'achs7a', title:'Chrome Extension -- 4k active users', description:'Focus mode extension with Pomodoro + site blocker, built in 2 weekends.', display_order:1 },
    ],
    squadMates: ['dev-shah', 'arnav-khanna'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 18 -- Finance, NMIMS
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s8', username: 'pooja-menon',
      full_name: 'Pooja Menon', headline: 'Finance Student @ NMIMS Mumbai · FinTech Intern @ NovaPay',
      about: '3rd year BBA Finance at NMIMS Mumbai. Currently interning at NovaPay in the compliance team. Obsessed with FinTech regulation and digital payments infrastructure. CFA Level 1 cleared.',
      avatar_url: AV(26), open_to_work: true, is_public: true,
      skills: ['Financial Modelling', 'Excel', 'Accounting', 'Banking', 'CFA L1', 'Power BI', 'Python basics'],
      location_city: 'Mumbai', location_state: 'Maharashtra', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es8a', company:'NovaPay', role:'Compliance & Risk Intern', location:'Mumbai, IN',
        emp_type:'Internship', start_year:2025, start_month:3, end_year:null, end_month:null,
        currently_working:true, description:'Assisting the compliance team with RBI PPI (Prepaid Payment Instrument) policy implementation.',
        skills_used:['Compliance','Excel','Banking Regulation'] },
    ],
    education: [
      { id:'edus8a', institution:'NMIMS Mumbai', degree:'BBA', field:'Finance', start_year:2023, end_year:2026, grade:'3.7/4.0 GPA' },
    ],
    certs: [
      { id:'cs8a', name:'CFA Level 1', issuer:'CFA Institute', issued_year:2025, url:null },
    ],
    achievements: [
      { id:'achs8a', title:'NMIMS Finance Fest -- Best Research Paper', description:'Paper on UPI\'s impact on financial inclusion in Tier 3 India, top 3 nationally.', display_order:1 },
    ],
    squadMates: ['sai-krishnan', 'aisha-khan'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 19 -- Product Management, Great Learning (ex-Wipro 2 yrs)
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s9', username: 'vedant-jain',
      full_name: 'Vedant Jain', headline: 'PM Trainee @ Great Learning · ex-Wipro 2 yrs · Open to PM Roles',
      about: 'Transitioning from IT consulting to product management. 2 years at Wipro as a BA before joining Great Learning\'s PM programme. Mentored by Arjun Patel. Building a side project for student freelancers.',
      avatar_url: AV(4), open_to_work: true, is_public: true,
      skills: ['Product Thinking', 'Agile', 'Figma (basic)', 'SQL', 'JIRA', 'User Stories', 'Business Analysis'],
      location_city: 'Bangalore', location_state: 'Karnataka', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 2,
    experience: [
      { id:'es9a', company:'Wipro', role:'Business Analyst -- Digital Transformation', location:'Bangalore, IN',
        emp_type:'Full-time', start_year:2022, start_month:7, end_year:2024, end_month:6,
        currently_working:false, description:'Gathered requirements for a healthcare client\'s patient portal -- 4 sprints, shipped on time.',
        skills_used:['Business Analysis','JIRA','SQL','Agile'] },
    ],
    education: [
      { id:'edus9a', institution:'Great Learning', degree:'Post Graduate Programme', field:'Product Management', start_year:2024, end_year:2025, grade:'--' },
      { id:'edus9b', institution:'VIT Chennai', degree:'B.Tech', field:'Information Technology', start_year:2018, end_year:2022, grade:'8.0 CGPA' },
    ],
    certs: [
      { id:'cs9a', name:'Certified Scrum Product Owner (CSPO)', issuer:'Scrum Alliance', issued_year:2025, url:null },
    ],
    achievements: [
      { id:'achs9a', title:'Side project: StudentGig -- platform for student freelancers', description:'130 monthly active students, ₹4L in transactions facilitated.', display_order:1 },
    ],
    squadMates: ['arjun-patel', 'ananya-desai', 'sai-krishnan'],
  },

  // ─────────────────────────────────────────────────
  // STUDENT 20 -- Marketing, Manipal
  // ─────────────────────────────────────────────────
  {
    profile: {
      id: 'demo-s10', username: 'aisha-khan',
      full_name: 'Aisha Khan', headline: 'Marketing Student @ Manipal · Running a Student Brand',
      about: '2nd year BBA Marketing at Manipal. Running "Desi Grind" -- a student creator collective with 40k Instagram followers. Learning growth marketing from first principles. Open to marketing internships and brand collabs.',
      avatar_url: AV(21), open_to_work: true, is_public: true,
      skills: ['Social Media Marketing', 'Canva', 'Content Creation', 'Instagram Growth', 'Brand Marketing', 'Email Marketing'],
      location_city: 'Manipal', location_state: 'Karnataka', country: 'India',
      account_type: 'user',
    },
    total_years_exp: 0,
    experience: [
      { id:'es10a', company:'Desi Grind', role:'Founder & Marketing Lead', location:'Remote',
        emp_type:'Self-employed', start_year:2024, start_month:1, end_year:null, end_month:null,
        currently_working:true, description:'Built student creator community to 40k followers. Partnered with 12 D2C brands for sponsored content.',
        skills_used:['Content Creation','Instagram','Brand Partnerships','Canva'] },
    ],
    education: [
      { id:'edus10a', institution:'Manipal Institute of Technology', degree:'BBA', field:'Marketing', start_year:2024, end_year:2027, grade:'--' },
    ],
    certs: [
      { id:'cs10a', name:'Meta Social Media Marketing Professional', issuer:'Coursera / Meta', issued_year:2025, url:null },
    ],
    achievements: [
      { id:'achs10a', title:'Desi Grind -- 40k Instagram followers, 12 brand deals', description:'Bootstrapped student brand collective to a monetised community.', display_order:1 },
    ],
    squadMates: ['sneha-kapoor', 'pooja-menon'],
  },
]

// ── Public API ──────────────────────────────────────────────────────────────

export function getDemoProfiles(): FullDemoProfile[] { return PROFILES }

export function getDemoProfile(username: string): FullDemoProfile | null {
  return PROFILES.find(p => p.profile.username === username) ?? null
}

/** Flat list of Profile-compatible objects for TalentPoolView / CandidateCard */
export function getDemoCandidates(): (DemoProfile & { total_years_exp: number; about: string }) [] {
  return PROFILES.map(p => ({
    ...p.profile,
    total_years_exp: p.total_years_exp,
    about: p.profile.about ?? '',
  }))
}

/** Profiles who are open_to_work (for talent pool discover) */
export function getOpenTalent() {
  return getDemoCandidates().filter(p => p.open_to_work)
}
