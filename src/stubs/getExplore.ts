// Explore + Organization stub data.
// 15 organizations across different industries.
// People: minimal text (name + small role). Orgs: logo + small type + open roles.

const AV = (n: number) => `https://i.pravatar.cc/120?img=${n}`

export interface ExplorePerson {
  id: string
  name: string
  handle: string
  avatar: string
  role: string
  company: string
  companyColor: string
  mutuals: string[]
  mutualCount: number
  following?: boolean
}

export interface ExploreOrg {
  slug: string
  name: string
  logoColor: string
  type: string
  location: string
  openRoles: number
  members: string[]
  memberCount: number
  verified?: boolean
  following?: boolean
  industry?: string   // maps to ORG_INDUSTRIES in OrgsBrowseView
  tagline?: string
  follower_count?: number
}

export function getExplorePeople(): ExplorePerson[] {
  return [
    { id:'p1', name:'Aarav Sharma',   handle:'aarav-sharma',  avatar:AV(11), role:'Full-Stack Engineer', company:'ByteCloud',    companyColor:'#6D4BD8', mutuals:[AV(5),AV(12),AV(14)], mutualCount:3 },
    { id:'p2', name:'Priya Nair',     handle:'priya-nair',    avatar:AV(5),  role:'Product Designer',   company:'FreshRoute',   companyColor:'#2BB3A3', mutuals:[AV(11),AV(33),AV(60)], mutualCount:3, following:true },
    { id:'p3', name:'Rohan Gupta',    handle:'rohan-gupta',   avatar:AV(14), role:'Data Scientist',      company:'CipherNet',    companyColor:'#1E293B', mutuals:[AV(48)], mutualCount:1 },
    { id:'p4', name:'Kavya Menon',    handle:'kavya-menon',   avatar:AV(60), role:'Brand Designer',      company:'ChicStyles',   companyColor:'#FF4D4D', mutuals:[AV(5),AV(9)], mutualCount:2 },
    { id:'p5', name:'Karthik Reddy',  handle:'karthik-reddy', avatar:AV(12), role:'DevOps Architect',    company:'SpaceWork',    companyColor:'#F5A524', mutuals:[AV(11),AV(15)], mutualCount:2, following:true },
    { id:'p6', name:'Meera Singh',    handle:'meera-singh',   avatar:AV(48), role:'ML Engineer',         company:'MediSense',    companyColor:'#2FB866', mutuals:[AV(14),AV(44)], mutualCount:2 },
    { id:'p7', name:'Arjun Patel',    handle:'arjun-patel',   avatar:AV(20), role:'Senior PM',           company:'Cleartrip',    companyColor:'#FF5C28', mutuals:[AV(4),AV(6)], mutualCount:2 },
    { id:'p8', name:'Ananya Desai',   handle:'ananya-desai',  avatar:AV(8),  role:'Content Strategist',  company:'LearnLoop',    companyColor:'#A435F0', mutuals:[AV(33)], mutualCount:1 },
  ]
}

export function getExploreOrgs(): ExploreOrg[] {
  return [
    // ── Indian tech ecosystem ──
    { slug:'bytecloud',     name:'ByteCloud',     logoColor:'#6D4BD8', type:'Tech / SaaS',   location:'Bangalore, IN', openRoles:6,  members:[AV(11),AV(12),AV(3)],    memberCount:110, verified:true, industry:'Tech / SaaS',  tagline:'Developer-first cloud tools for modern teams.', follower_count:8200 },
    { slug:'freshroute',    name:'FreshRoute',    logoColor:'#2BB3A3', type:'FoodTech',       location:'Mumbai, IN',    openRoles:5,  members:[AV(5),AV(33)],           memberCount:380, verified:true, industry:'FoodTech',     tagline:'Connecting India\'s farmers to your doorstep.', follower_count:14600 },
    { slug:'ciphernet',     name:'CipherNet',     logoColor:'#1E293B', type:'CyberSec',       location:'Hyderabad, IN', openRoles:4,  members:[AV(14),AV(15)],          memberCount:62,  verified:true, industry:'CyberSec',     tagline:'Zero-trust security for cloud-native companies.', follower_count:5400 },
    { slug:'atomberg',      name:'Atomberg',      logoColor:'#F59E0B', type:'D2C',            location:'Pune, IN',      openRoles:3,  members:[AV(33)],                  memberCount:240, verified:true, industry:'D2C',          tagline:'Smart home appliances that save energy and time.', follower_count:19800 },
    { slug:'medisense',     name:'MediSense',     logoColor:'#2FB866', type:'HealthTech',     location:'Bangalore, IN', openRoles:5,  members:[AV(48),AV(44)],          memberCount:88,  verified:true, industry:'HealthTech',   tagline:'AI diagnostics that reach every clinic in India.', follower_count:7100 },
    { slug:'cleartrip',     name:'Cleartrip',     logoColor:'#FF5C28', type:'Tech / SaaS',    location:'Bangalore, IN', openRoles:7,  members:[AV(20),AV(6)],           memberCount:520, verified:true, industry:'Tech / SaaS',  tagline:'Travel made simple, personalised, and instant.', follower_count:22000 },
    { slug:'learnloop',     name:'LearnLoop',     logoColor:'#A435F0', type:'EdTech',         location:'Delhi, IN',     openRoles:4,  members:[AV(8)],                   memberCount:145, verified:true, industry:'EdTech',       tagline:'Bootcamps that get you hired, not just certified.', follower_count:11300 },
    { slug:'novapay',       name:'NovaPay',       logoColor:'#059669', type:'FinTech',        location:'Bangalore, IN', openRoles:5,  members:[AV(15),AV(26)],          memberCount:200, verified:true, industry:'FinTech',      tagline:'Real-time payment rails for the next billion.', follower_count:16700 },
    { slug:'spacework',     name:'SpaceWork',     logoColor:'#F5A524', type:'Tech / SaaS',    location:'Remote / Global',openRoles:8, members:[AV(12),AV(7)],           memberCount:290, verified:true, industry:'Tech / SaaS',  tagline:'Infrastructure for the world\'s remote teams.', follower_count:9500 },
    // ── Global creative / tech ──
    { slug:'creative-labs', name:'Creative Labs', logoColor:'#FF5C28', type:'Design',         location:'New York, USA',  openRoles:4, members:[AV(13),AV(5),AV(8)],    memberCount:23,  verified:true, industry:'Design',       tagline:'Designing digital products people love, since 2016.', follower_count:12400 },
    { slug:'tech-genius',   name:'Tech Genius',   logoColor:'#6D4BD8', type:'Tech / SaaS',    location:'San Francisco, USA', openRoles:7, members:[AV(11),AV(15),AV(48),AV(20)], memberCount:48, verified:true, industry:'Tech / SaaS', tagline:'AI-powered tools for engineering teams.', follower_count:31200 },
    { slug:'trendsetters',  name:'TrendSetters',  logoColor:'#2BB3A3', type:'Media',          location:'London, UK',     openRoles:2, members:[AV(45),AV(60)],          memberCount:12,  verified:true, industry:'Media',        tagline:'The magazine redefining culture for the internet era.', follower_count:8800 },
    { slug:'digitaldreams', name:'DigitalDreams', logoColor:'#F5A524', type:'Design',         location:'Los Angeles, USA', openRoles:3, members:[AV(5),AV(33)],         memberCount:18,  verified:true, industry:'Design',       tagline:'Motion, 3D, and visual storytelling at scale.', follower_count:6300 },
    { slug:'innovate-tech', name:'Innovate Tech', logoColor:'#2FB866', type:'Tech / SaaS',    location:'Tokyo, Japan',   openRoles:5, members:[AV(13),AV(11),AV(20)],  memberCount:34,  verified:true, industry:'Tech / SaaS',  tagline:'Building app-layer infrastructure for Asia.', follower_count:4900 },
    { slug:'chicstyles',    name:'ChicStyles',    logoColor:'#FF4D4D', type:'D2C',            location:'Mumbai, IN',     openRoles:2, members:[AV(60),AV(9)],           memberCount:55,  verified:true, industry:'D2C',          tagline:'Fashion for the bold, designed in India.', follower_count:28500 },
  ]
}

export interface OrgRole {
  id: string; title: string; type: string; location: string; salary?: string
}

export interface OrgFull extends ExploreOrg {
  logoUrl?: string | null
  highlights?: string[]
  tagline: string
  about: string
  roles: OrgRole[]
  followers: number
  founded: string
  size: string
  website: string
  funding: string
  mission: string
  techStack: string[]
  perks: string[]
  values: { title: string; body: string }[]
  faqs: { q: string; a: string }[]
  reviews: { rating: number; title: string; body: string; by: string }[]
  avgRating: number
  leadership: { name: string; title: string; background: string; avatar: string }[]
  fundingRounds: { date: string; amount: string; series: string }[]
  totalFunding: string
}

// Per-org overrides -- richer data for each org
const ORG_DETAILS: Record<string, Partial<OrgFull>> = {
  bytecloud: {
    tagline: 'Developer-first cloud tools for modern teams.',
    about: 'ByteCloud is a Bangalore-based SaaS company building the next generation of developer tooling. From deployment pipelines to API management, we help engineering teams ship faster without managing infrastructure.',
    founded: '2019', size: '100-150 employees', funding: 'Series B · $28M', website: 'bytecloud.dev',
    mission: 'Give every developer team the infrastructure of a Fortune 500, without the complexity.',
    techStack: ['Golang', 'React', 'PostgreSQL', 'Kubernetes', 'AWS', 'Kafka'],
    perks: ['Remote-friendly', 'Health + dental', 'Annual L&D budget ₹1L', 'Equity for all full-timers', 'Quarterly offsite'],
    values: [
      { title: 'Developer empathy', body: 'We are developers building for developers. Every design decision starts with DX.' },
      { title: 'Bias to ship', body: 'Two-week sprints. Real users. Fast feedback.' },
      { title: 'Open by default', body: 'Decisions, RFCs, and roadmaps are public internally. No hidden agendas.' },
    ],
    avgRating: 4.7,
    reviews: [
      { rating: 5, title: 'Best infra team I\'ve worked with', body: 'Zero-downtime deploys, observability built-in, and actually helpful on-call. ByteCloud infra is elite.', by: 'SWE · 2 yrs' },
      { rating: 5, title: 'Autonomous and fast', body: 'PRs merged same day, feedback loops are tight, and the team genuinely cares about developer experience.', by: 'SWE · current' },
    ],
    leadership: [
      { name: 'Aarav Sharma', title: 'VP Engineering', background: 'IIT Bombay · ex-Razorpay', avatar: AV(11) },
      { name: 'Karthik Reddy', title: 'Principal Architect', background: 'IIT Madras · ex-ThoughtWorks', avatar: AV(12) },
    ],
    fundingRounds: [
      { date: 'Jan 2025', amount: '$20M', series: 'Series B' },
      { date: 'Mar 2022', amount: '$8M', series: 'Series A' },
    ],
    totalFunding: 'Total raised: $28M across 2 rounds',
    roles: [
      { id:'r1', title:'Senior Full-Stack Engineer', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹28-40 LPA' },
      { id:'r2', title:'DevOps Engineer', type:'Full-time · Remote', location:'Remote / India', salary:'₹24-32 LPA' },
      { id:'r3', title:'Backend Engineer (Golang)', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹22-30 LPA' },
    ],
  },
  freshroute: {
    tagline: 'Connecting India\'s farmers to your doorstep.',
    about: 'FreshRoute is a Mumbai-based FoodTech platform delivering farm-fresh produce to 18 cities. We work directly with 8,000+ farmers and use ML to predict demand so nothing is wasted.',
    founded: '2018', size: '350-450 employees', funding: 'Series C · $65M', website: 'freshroute.in',
    mission: 'End food waste. Pay farmers fairly. Feed every kitchen in India.',
    techStack: ['React Native', 'Node.js', 'PostgreSQL', 'Python', 'AWS', 'Redis'],
    perks: ['Health cover (family)', 'Free daily meals', 'Quarterly village visits', 'Equity for core team', 'Flexible hours'],
    values: [
      { title: 'Farmer first', body: 'Every metric ties back to farmer income -- if they don\'t win, we haven\'t won.' },
      { title: 'Waste nothing', body: 'From code to produce, efficiency is our north star.' },
      { title: 'Move fast, safely', body: 'Food safety is non-negotiable. Speed comes second.' },
    ],
    avgRating: 4.5,
    reviews: [
      { rating: 5, title: 'Mission I actually believe in', body: 'Rare to work at a company where the social mission is baked into every product decision.', by: 'PM · 1.5 yrs' },
      { rating: 4, title: 'Fast growth, occasional chaos', body: 'High ownership, great team, processes still maturing. Not for the faint-hearted.', by: 'Backend Eng · current' },
    ],
    leadership: [
      { name: 'Priya Nair', title: 'Head of Design', background: 'IIT Bombay · ex-PhonePe', avatar: AV(5) },
      { name: 'Sneha Kapoor', title: 'VP Marketing', background: 'MICA · ex-Swiggy', avatar: AV(33) },
    ],
    fundingRounds: [
      { date: 'Oct 2024', amount: '$40M', series: 'Series C' },
      { date: 'Apr 2022', amount: '$25M', series: 'Series B' },
    ],
    totalFunding: 'Total raised: $65M across 3 rounds',
    roles: [
      { id:'r1', title:'Data Analyst -- Demand Forecasting', type:'Full-time · Hybrid', location:'Mumbai, IN', salary:'₹18-24 LPA' },
      { id:'r2', title:'Growth Product Manager', type:'Full-time · On-site', location:'Mumbai, IN', salary:'₹25-35 LPA' },
    ],
  },
  ciphernet: {
    tagline: 'Zero-trust security for cloud-native companies.',
    about: 'CipherNet is a Hyderabad-based cybersecurity startup protecting cloud infrastructure for 200+ enterprises. Our AI-powered threat intelligence platform monitors 4M+ events per day.',
    founded: '2020', size: '55-80 employees', funding: 'Series A · $12M', website: 'ciphernet.io',
    mission: 'Make enterprise-grade cybersecurity accessible to every cloud-native startup.',
    techStack: ['Python', 'Go', 'Kafka', 'ClickHouse', 'AWS', 'TensorFlow'],
    perks: ['Remote-first', 'Home office budget ₹50k', 'Conference speaking support', 'Health + term insurance', 'ESOP'],
    values: [
      { title: 'Adversarial thinking', body: 'We think like attackers to build like defenders.' },
      { title: 'Privacy by design', body: 'Customer data is never used to train our models without explicit consent.' },
    ],
    avgRating: 4.6,
    reviews: [
      { rating: 5, title: 'Cutting-edge security research', body: 'Published 3 CVEs in my first year. The research culture is exceptional.', by: 'Security Researcher · current' },
      { rating: 4, title: 'Intense but rewarding', body: 'High-stakes work. You grow fast here.', by: 'SOC Analyst · 1 yr' },
    ],
    leadership: [
      { name: 'Rohan Gupta', title: 'Head of Data Science', background: 'BITS Pilani · ex-Amazon', avatar: AV(14) },
    ],
    fundingRounds: [
      { date: 'Jun 2023', amount: '$12M', series: 'Series A' },
      { date: 'Sep 2021', amount: '$3M', series: 'Seed' },
    ],
    totalFunding: 'Total raised: $15M across 2 rounds',
    roles: [
      { id:'r1', title:'Security Engineer -- Detection', type:'Full-time · Remote', location:'Remote / Hyderabad', salary:'₹22-32 LPA' },
      { id:'r2', title:'Penetration Testing Engineer', type:'Full-time · Remote', location:'Remote', salary:'₹20-28 LPA' },
    ],
  },
  atomberg: {
    tagline: 'Smart home appliances that save energy and time.',
    about: 'Atomberg is Pune\'s fastest-growing D2C appliance brand -- best known for our BLDC motor fans that consume 65% less energy. We\'re expanding into smart kitchens and connected home.',
    founded: '2016', size: '200-280 employees', funding: 'Series B · $45M', website: 'atomberg.com',
    mission: 'Make every home in India smarter and greener -- starting with fans, ending with everything.',
    techStack: ['React', 'Node.js', 'Python', 'IoT', 'AWS', 'Shopify'],
    perks: ['Employee discount on all products', 'Health insurance', 'Performance bonus', 'ESOPs'],
    values: [
      { title: 'Sustainability first', body: 'Every product decision is stress-tested against our energy-saving mission.' },
      { title: 'Data-driven', body: 'We track everything -- from D2C conversion to manufacturing yield.' },
    ],
    avgRating: 4.3,
    reviews: [
      { rating: 4, title: 'Exciting D2C journey', body: 'Rare chance to own the full funnel from product to customer.', by: 'Growth Marketer · current' },
      { rating: 5, title: 'Great for builders', body: 'Zero bureaucracy. Real ownership. Your ideas actually ship.', by: 'PM · 2 yrs' },
    ],
    leadership: [
      { name: 'Sneha Kapoor', title: 'Marketing Lead', background: 'MICA · ex-Swiggy', avatar: AV(33) },
    ],
    fundingRounds: [
      { date: 'Feb 2024', amount: '$30M', series: 'Series B' },
      { date: 'Nov 2021', amount: '$15M', series: 'Series A' },
    ],
    totalFunding: 'Total raised: $45M across 2 rounds',
    roles: [
      { id:'r1', title:'Hardware Engineer -- IoT', type:'Full-time · On-site', location:'Pune, IN', salary:'₹18-26 LPA' },
      { id:'r2', title:'Product Manager -- Smart Home', type:'Full-time · Hybrid', location:'Pune, IN', salary:'₹22-30 LPA' },
    ],
  },
  medisense: {
    tagline: 'AI diagnostics that reach every clinic in India.',
    about: 'MediSense builds AI-powered diagnostic tools for Tier 2/3 hospitals in India. Our chest X-ray AI is now used in 40+ hospitals. Series A funded, rapidly expanding to pathology and dermatology.',
    founded: '2019', size: '80-110 employees', funding: 'Series A · $18M', website: 'medisense.health',
    mission: 'Democratise specialist-grade diagnostics for every patient, everywhere in India.',
    techStack: ['Python', 'PyTorch', 'FastAPI', 'React', 'AWS', 'PostgreSQL'],
    perks: ['Flexible WFH', 'Health + family insurance', 'Conference budget', 'ESOPs', 'Paid research leaves'],
    values: [
      { title: 'Clinical precision', body: 'Our models are validated with doctors, not just benchmarks.' },
      { title: 'Reach the last mile', body: 'If a product only works in metros, we\'ve failed.' },
    ],
    avgRating: 4.8,
    reviews: [
      { rating: 5, title: 'Most meaningful work of my career', body: 'AI deployed in hospitals that couldn\'t afford radiologists. The impact is real.', by: 'ML Engineer · current' },
      { rating: 5, title: 'Top-tier research culture', body: 'Our papers get into MICCAI. We do real science, not demo tricks.', by: 'Research Lead · 2 yrs' },
    ],
    leadership: [
      { name: 'Meera Singh', title: 'ML Engineering Lead', background: 'BITS Pilani · ex-Flipkart', avatar: AV(48) },
    ],
    fundingRounds: [
      { date: 'Mar 2024', amount: '$18M', series: 'Series A' },
      { date: 'Aug 2022', amount: '$4M', series: 'Seed' },
    ],
    totalFunding: 'Total raised: $22M across 2 rounds',
    roles: [
      { id:'r1', title:'ML Engineer -- Medical Imaging', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹24-36 LPA' },
      { id:'r2', title:'Backend Engineer -- Clinical API', type:'Full-time · Remote', location:'Remote / India', salary:'₹20-28 LPA' },
    ],
  },
  cleartrip: {
    tagline: 'Travel made simple, personalised, and instant.',
    about: 'Cleartrip is one of India\'s leading OTAs, backed by Flipkart. We\'re rebuilding travel discovery from the ground up -- using ML ranking, real-time pricing, and hyper-personal recommendations.',
    founded: '2006', size: '500-700 employees', funding: 'Backed by Flipkart', website: 'cleartrip.com',
    mission: 'Make every trip feel like it was planned by someone who knows you.',
    techStack: ['React', 'Node.js', 'Java', 'Python', 'Kafka', 'Elasticsearch', 'AWS'],
    perks: ['Flexible WFH', 'Travel perks', 'Health cover', 'Annual bonus', 'Equity for senior roles'],
    values: [
      { title: 'Customer zero', body: 'Build it for yourself first. We are our own harshest user.' },
      { title: 'Speed wins', body: '50ms or bust. Every millisecond of search latency is a customer lost.' },
    ],
    avgRating: 4.2,
    reviews: [
      { rating: 4, title: 'Excellent scale problems', body: 'Processing 1M+ searches/day. The infra and data problems are genuinely hard.', by: 'Data Scientist · current' },
      { rating: 4, title: 'Good work-life balance', body: 'Surprisingly sane working hours for a company growing this fast.', by: 'PM · 1 yr' },
    ],
    leadership: [
      { name: 'Arjun Patel', title: 'Senior Product Manager', background: 'IIM Bangalore · ex-OYO', avatar: AV(20) },
    ],
    fundingRounds: [
      { date: 'Flipkart acquisition 2021', amount: 'Undisclosed', series: 'Acquisition' },
    ],
    totalFunding: 'Flipkart-backed (subsidiary)',
    roles: [
      { id:'r1', title:'Senior Product Manager -- Search', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹35-50 LPA' },
      { id:'r2', title:'iOS Developer', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹22-32 LPA' },
      { id:'r3', title:'Data Analyst -- Growth', type:'Full-time · Remote', location:'Remote / India', salary:'₹16-22 LPA' },
    ],
  },
  learnloop: {
    tagline: 'Bootcamps that get you hired, not just certified.',
    about: 'LearnLoop runs outcome-focused coding and product bootcamps. 82% placement rate, ISA available. We measure success in jobs, not completions. Delhi-based, content led by Ananya Desai.',
    founded: '2020', size: '120-160 employees', funding: 'Series A · $9M', website: 'learnloop.in',
    mission: 'Make career transitions accessible, affordable, and actually successful.',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'LMS (custom)', 'Zoom API', 'AWS'],
    perks: ['Free access to all courses', 'Remote-friendly', 'Health insurance', 'ISA for students', 'Annual retreat'],
    values: [
      { title: 'Outcomes over output', body: 'We track job placements, not course completions.' },
      { title: 'Student first', body: 'Every curriculum decision is run past a student council.' },
    ],
    avgRating: 4.6,
    reviews: [
      { rating: 5, title: 'Actually changed my career', body: 'Got a PM role at a Series B within 3 months of graduating. ISA made it possible.', by: 'Bootcamp graduate' },
      { rating: 4, title: 'Fast-paced startup energy', body: 'Curriculum team moves quick. Great place for content people who like autonomy.', by: 'Content Strategist · current' },
    ],
    leadership: [
      { name: 'Ananya Desai', title: 'Head of Curriculum', background: 'NIFT Delhi · ex-BYJU\'s', avatar: AV(8) },
    ],
    fundingRounds: [
      { date: 'Nov 2023', amount: '$9M', series: 'Series A' },
      { date: 'May 2021', amount: '$2M', series: 'Seed' },
    ],
    totalFunding: 'Total raised: $11M across 2 rounds',
    roles: [
      { id:'r1', title:'Content Strategist -- Tech Bootcamp', type:'Full-time · Remote', location:'Remote / Delhi', salary:'₹14-20 LPA' },
      { id:'r2', title:'Curriculum Designer', type:'Full-time · Hybrid', location:'Delhi, IN', salary:'₹12-18 LPA' },
    ],
  },
  novapay: {
    tagline: 'Real-time payment rails for the next billion.',
    about: 'NovaPay builds embedded finance infrastructure for banks and fintechs -- real-time settlements, UPI stacks, and payment APIs. ₹500Cr/day processed. Backed by Peak XV (Sequoia India).',
    founded: '2018', size: '180-220 employees', funding: 'Series B · $38M', website: 'novapay.in',
    mission: 'Build the financial infrastructure India\'s next billion users deserve.',
    techStack: ['Golang', 'PostgreSQL', 'Kafka', 'Redis', 'gRPC', 'AWS', 'K8s'],
    perks: ['Competitive salary + ESOP', 'Health + critical illness cover', 'Flexible WFH', 'Annual learning budget ₹80k'],
    values: [
      { title: 'Reliability above all', body: '99.99% uptime is our floor, not our ceiling. Payments don\'t get second chances.' },
      { title: 'Security is a feature', body: 'Privacy and compliance built in from day one.' },
    ],
    avgRating: 4.5,
    reviews: [
      { rating: 5, title: 'Hard problems, great people', body: 'Distributed systems at FinTech scale. The tech challenge is real.', by: 'Backend Engineer · 2 yrs' },
      { rating: 4, title: 'High standards, low drama', body: 'Code reviews are thorough. PRs rarely merge first try. You get better fast.', by: 'SWE · current' },
    ],
    leadership: [
      { name: 'Rahul Joshi', title: 'Principal Backend Engineer', background: 'IIT Delhi · ex-Microsoft', avatar: AV(15) },
    ],
    fundingRounds: [
      { date: 'Sep 2024', amount: '$28M', series: 'Series B' },
      { date: 'Jul 2022', amount: '$10M', series: 'Series A' },
    ],
    totalFunding: 'Total raised: $38M across 2 rounds',
    roles: [
      { id:'r1', title:'Senior Backend Engineer (Golang)', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹30-45 LPA' },
      { id:'r2', title:'Compliance & Risk Analyst', type:'Full-time · On-site', location:'Mumbai, IN', salary:'₹16-22 LPA' },
      { id:'r3', title:'Product Manager -- Payments', type:'Full-time · Hybrid', location:'Bangalore, IN', salary:'₹28-40 LPA' },
    ],
  },
  spacework: {
    tagline: 'Infrastructure for the world\'s remote teams.',
    about: 'SpaceWork builds the operating system for distributed teams -- virtual offices, async video, HR automation, and global payroll. 200k+ remote workers on platform. Series C stage.',
    founded: '2017', size: '260-320 employees', funding: 'Series C · $80M', website: 'spacework.io',
    mission: 'Make location irrelevant for talent and opportunity.',
    techStack: ['React', 'Kubernetes', 'Golang', 'PostgreSQL', 'Terraform', 'Cloudflare', 'WebRTC'],
    perks: ['100% remote', 'Async-first culture', 'Annual team meetup', '$3k home office stipend', 'Global payroll'],
    values: [
      { title: 'Async by default', body: 'Meetings are a last resort. Great writing > long calls.' },
      { title: 'Globally distributed', body: 'We hire from 40 countries. Our product solves problems we feel every day.' },
    ],
    avgRating: 4.8,
    reviews: [
      { rating: 5, title: 'Best remote culture I\'ve seen', body: 'Truly async, no Zoom fatigue, great docs. The culture matches the product.', by: 'DevOps Eng · 3 yrs' },
      { rating: 5, title: 'Real ownership, real impact', body: 'Small autonomous squads. You own your product area end-to-end.', by: 'SWE · current' },
    ],
    leadership: [
      { name: 'Karthik Reddy', title: 'Principal DevOps Architect', background: 'IIT Madras · ex-GitLab', avatar: AV(12) },
    ],
    fundingRounds: [
      { date: 'Apr 2024', amount: '$50M', series: 'Series C' },
      { date: 'Jan 2022', amount: '$30M', series: 'Series B' },
    ],
    totalFunding: 'Total raised: $80M across 3 rounds',
    roles: [
      { id:'r1', title:'Full-Stack Engineer (Remote)', type:'Full-time · Remote', location:'Remote / Global', salary:'$90k-130k' },
      { id:'r2', title:'Head of Design', type:'Full-time · Remote', location:'Remote / Global', salary:'$100k-140k + equity' },
    ],
  },
}

const DEFAULT_ORG_DETAIL: Partial<OrgFull> = {
  tagline: 'Building great products with great people.',
  about: 'A team of builders shipping meaningful products. We hire for craft, curiosity, and kindness.',
  followers: 5000,
  founded: '2018', size: '20-80 employees', website: 'example.com',
  funding: 'Seed · $4M',
  mission: 'Build products people love, with a team you are proud to be part of.',
  techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  perks: ['Flexible hours', 'Remote-friendly', 'Health cover', 'Learning budget'],
  values: [
    { title: 'Craft', body: 'Quality over speed -- always.' },
    { title: 'Transparency', body: 'Default to open, not closed.' },
  ],
  faqs: [
    { q: 'What does the team work on?', a: 'Product-led digital experiences across web and mobile.' },
    { q: 'Is the role remote?', a: 'Most roles are remote-friendly with optional in-office days.' },
    { q: 'What is the interview process?', a: 'Intro call → skills review → team fit conversation. Usually 1-2 weeks.' },
  ],
  reviews: [
    { rating: 5, title: 'Real ownership', body: 'You own your work end-to-end. Great autonomy.', by: 'Employee · current' },
    { rating: 4, title: 'Collaborative team', body: 'Honest feedback, supportive culture.', by: 'Ex-employee' },
  ],
  avgRating: 4.5,
  leadership: [
    { name: 'Alex Ratner', title: 'Co-founder & CEO', background: 'Stanford PhD · ex-Google', avatar: AV(12) },
  ],
  fundingRounds: [
    { date: 'Jan 2024', amount: '$4M', series: 'Seed' },
  ],
  totalFunding: 'Total raised: $4M',
}

export function getOrg(slug: string): OrgFull | null {
  const base = getExploreOrgs().find(o => o.slug === slug)
  if (!base) return null

  const detail = ORG_DETAILS[slug] ?? {}

  const followers = base.follower_count ?? detail.followers ?? DEFAULT_ORG_DETAIL.followers ?? 5000
  const defaultRoles: OrgRole[] = [
    { id:'r1', title:'Senior Software Engineer', type:'Full-time · Hybrid', location:base.location, salary:'$90k-120k' },
    { id:'r2', title:'Product Designer', type:'Full-time · Remote', location:'Remote' },
    { id:'r3', title:'Product Manager', type:'Full-time · Hybrid', location:base.location },
  ].slice(0, Math.max(1, base.openRoles))

  const tagline = detail.tagline ?? base.tagline ?? 'Building great products with great people.'
  const about = detail.about ?? DEFAULT_ORG_DETAIL.about ?? ''
  const techStack = detail.techStack ?? DEFAULT_ORG_DETAIL.techStack ?? []

  return {
    ...base,
    ...DEFAULT_ORG_DETAIL,
    ...detail,
    tagline,
    about,
    followers,
    roles: detail.roles ?? defaultRoles,
    faqs: [
      { q: 'What does the team work on?', a: about },
      { q: 'Is the role remote?', a: base.location.includes('Remote') ? 'Fully remote.' : `Hybrid out of ${base.location.split(',')[0]}.` },
      { q: 'What is the interview process?', a: 'Intro call -> skills review -> team fit. Usually 1-2 weeks end to end.' },
      { q: 'What tech do you use?', a: techStack.join(', ') + '.' },
    ],
  } as OrgFull
}
