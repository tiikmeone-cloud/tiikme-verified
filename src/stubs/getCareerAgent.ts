// AI Career Agent — the new Home.
// Persona-aware (professional / student / org). Everything keys off the user's headline.
// All suggestions connect to existing surfaces: Jobs, Level Up, Profile, Network.

export type Persona = 'professional' | 'student' | 'org'

export interface AgentGreeting {
  headline: string
  oneLiner: string             // the agent's read of the situation
  topMove: string              // the single best move right now
  ctaLabel: string
  ctaHref: string
}

/* The actionable "career moves" the agent surfaces on Home. */
export interface CareerMove {
  id: string
  category: 'next-role' | 'salary' | 'skill' | 'cert' | 'project' | 'internship' | 'intro' | 'hire' | 'shortlist'
  icon: string
  hook: string                  // headline-personalised opener, e.g. "Hey, you're a Social Media Executive..."
  body: string
  href: string                  // where the user goes when they tap
  cta: string
  badge?: string                // e.g. "+ ₹4-6 LPA", "Team Lead", "9 days"
  badgeColor?: string
  meta?: string                 // small footer info
}

const AV = (n: number) => `https://i.pravatar.cc/120?img=${n}`

/* ─── Professional (e.g. Social Media Executive) ──────── */
export function professionalGreeting(name: string): AgentGreeting {
  return {
    headline: 'Social Media Executive',
    oneLiner: `Hey ${name.split(' ')[0]} — based on your Flex, you're ready for a Team Lead jump. I found 3 roles that fit, and 1 skill that would push your salary band up.`,
    topMove: '🎯 1 perfect-fit role just opened',
    ctaLabel: 'Show me',
    ctaHref: '/opportunities',
  }
}

export function professionalMoves(): CareerMove[] {
  return [
    { id:'m1', category:'next-role', icon:'🚀',
      hook:`Hey — if you apply to this role, you become a Team Lead.`,
      body:`Innovate Tech is hiring a Social Media Team Lead. Your 3 yrs at scale + verified campaign work matches 9/10 must-haves. Salary band: +₹4–6 LPA over your current.`,
      href:'/opportunities', cta:'See the role', badge:'Team Lead', badgeColor:'#FF5C28', meta:'Posted 2h ago · 4 applicants so far' },
    { id:'m2', category:'skill', icon:'🧠',
      hook:'Adding this one skill unlocks ~12 more senior roles for you.',
      body:'Recruiters hiring Social Media Leads are filtering on "Marketing Analytics". You don\'t have it yet. There\'s a free 14-day path in Level Up.',
      href:'/opportunities', cta:'Add it via Level Up', badge:'14 days', badgeColor:'#F5A524', meta:'+12 roles unlocked' },
    { id:'m3', category:'salary', icon:'💸',
      hook:'You\'re ~₹3 LPA below market for your headline. Here\'s why.',
      body:'Comparable Social Media Executives with squad-verified work earn ₹11–14 LPA in Bangalore. Verify 2 more campaigns on your Flex to push your match score above the band cutoff.',
      href:'/profile/me', cta:'Verify on Flex', badge:'+₹3 LPA', badgeColor:'#2FB866', meta:'Based on 218 verified profiles' },
    { id:'m4', category:'intro', icon:'🤝',
      hook:'A recruiter from DigitalDreams just viewed your Flex.',
      body:'They\'re hiring Social Media Leads. Drop a verified case study to the top of your Flex — I drafted one from your campaign data.',
      href:'/profile/me', cta:'Review & publish', meta:'Profile views ↑ 12% this week' },
    { id:'m5', category:'project', icon:'📌',
      hook:'2 people from your squad just joined Creative Labs.',
      body:'Warm intro path. Reach-out via tiikme (no email shared) — your match score for their open Social Media role is 86%.',
      href:'/opportunities', cta:'Open Creative Labs', meta:'Squad path · George Mills + 1' },
  ]
}

/* ─── Student / Fresher ──────────────────────────────── */
export function studentGreeting(name: string): AgentGreeting {
  return {
    headline: 'Final-year CS · UI/UX',
    oneLiner: `Hey ${name.split(' ')[0]} — you don't need experience to win interviews. I found 2 paid internships you'd match, 1 cert that ${0.85 * 100}% of hiring orgs want, and a hackathon team forming this weekend.`,
    topMove: '🎓 You\'re 1 cert away from your dream internship',
    ctaLabel: 'Show me the path',
    ctaHref: '/opportunities',
  }
}

export function studentMoves(): CareerMove[] {
  return [
    { id:'s1', category:'internship', icon:'🎯',
      hook:'Hey — this paid internship is open to freshers, and you fit.',
      body:'Creative Labs is hiring a UX Intern (₹25k/mo). They\'re asking for Figma + 1 project. You have both via your college work — I drafted the application.',
      href:'/opportunities', cta:'Review my draft', badge:'Paid · ₹25k/mo', badgeColor:'#FF5C28', meta:'Bangalore · Hybrid' },
    { id:'s2', category:'cert', icon:'🎖️',
      hook:'85% of orgs hiring UX interns want this cert. It\'s free.',
      body:'Google UX Design (Coursera). 6-month path, free for students. Finishes → lands as a verified cert on your Flex → your match scores jump.',
      href:'/opportunities', cta:'Start it in Level Up', badge:'Free', badgeColor:'#2FB866', meta:'1.2M enrolled · earns Flex credential' },
    { id:'s3', category:'project', icon:'🛠️',
      hook:'Turn your college project into recruiter-ready proof.',
      body:'You built a library-management app. I rewrote it as: "Designed and built a library app used by 200+ students, reducing search time 70%." Tag 2 classmates → it becomes squad-verified proof.',
      href:'/profile/me', cta:'Polish + verify', meta:'Squad-verified projects = job experience' },
    { id:'s4', category:'project', icon:'⚡',
      hook:'A hackathon team is forming at MLH this weekend.',
      body:'Smart India Hackathon registration is open. Winning a hackathon = portfolio gold for freshers. You match the build skills 3 teammates are looking for.',
      href:'/opportunities', cta:'Join in Level Up', badge:'9 days', badgeColor:'#6D4BD8', meta:'Free · team of 6' },
    { id:'s5', category:'intro', icon:'🧑‍🤝‍🧑',
      hook:'3 alumni from your college work at Innovate Tech.',
      body:'They\'re hiring interns. Warm intro via tiikme. Get a verified referral → recruiters see your application differently.',
      href:'/opportunities', cta:'See alumni path', meta:'Same college · same skills' },
  ]
}

/* ─── Organization ───────────────────────────────────── */
export function orgGreeting(orgName: string): AgentGreeting {
  return {
    headline: 'Hiring 3 roles · Bangalore',
    oneLiner: `Hey ${orgName} — I found 4 pre-vetted Senior Product Designers in your network (squad-verified work, open to talk). 2 of your 3 roles are stuck — I can fix the friction.`,
    topMove: '⚡ 4 vetted candidates ready to reach out',
    ctaLabel: 'See them',
    ctaHref: '/recruiter/search',
  }
}

export function orgMoves(): CareerMove[] {
  return [
    { id:'o1', category:'shortlist', icon:'🎯',
      hook:'4 candidates match your Senior Product Designer role 85%+.',
      body:'All open-to-work in Bangalore, all squad-verified Figma + Design Systems. I can send the role-tied reach-out for you — contact reveals on their accept.',
      href:'/recruiter/search', cta:'Review the 4', badge:'85%+ match', badgeColor:'#2FB866', meta:'AI ranked · no resumes lied to' },
    { id:'o2', category:'hire', icon:'🚪',
      hook:'Your UX/UI role is losing candidates at screening.',
      body:'68% drop after Q2 ("years of experience"). Your must-have is 5+ but the market median for this title is 3 yrs. Loosen → 3× your applicant pool.',
      href:'/org/tech-genius/talent', cta:'Tune the screener', badge:'-68% drop', badgeColor:'#FF5C28', meta:'Funnel analytics' },
    { id:'o3', category:'intro', icon:'⭐',
      hook:'Alex S. just got verified by 3 of your current team.',
      body:'Their Flex now has 4 squad-verified peers from companies you trust. AI fit: 91%. Likely to convert.',
      href:'/org/tech-genius/talent', cta:'Open Alex', badge:'TOP TALENT', badgeColor:'#2FB866', meta:'Squad signal · verified by your team' },
    { id:'o4', category:'skill', icon:'📊',
      hook:'Your competitor just posted the same role at +₹3 LPA.',
      body:'DigitalDreams listed Senior Product Designer at ₹18–22 LPA. Your band is ₹15–18. Below the market = stuck pipeline. Suggested update: ₹17–20 LPA + remote option.',
      href:'/org/tech-genius', cta:'Update role', badge:'Comp gap', badgeColor:'#F5A524', meta:'Market scan · daily' },
    { id:'o5', category:'next-role', icon:'🎯',
      hook:'You don\'t need to post for this — I can source it.',
      body:'You mentioned hiring a Brand Designer in your last team update. I can run a Maya-style sourcing job: 4 vetted intros in <2h, success-based.',
      href:'/recruiter/search', cta:'Start sourcing', meta:'No job post needed' },
  ]
}

/* ─── Personalised feed: jobs filtered by headline ─── */
export interface FeedMatch {
  id: string
  role: string
  org: string
  orgColor: string
  matchPct: number
  why: string                  // why it's a match for this headline
  href: string
  type: string
  location: string
  salary: string
}

export function feedByHeadline(persona: Persona): FeedMatch[] {
  if (persona === 'student') return [
    { id:'f1', role:'UX Design Intern', org:'Creative Labs', orgColor:'#FF5C28', matchPct:88, why:'Figma + 1 verified college project ✓', href:'/opportunities', type:'Internship', location:'Bangalore', salary:'₹25k/mo' },
    { id:'f2', role:'Product Design Intern', org:'Innovate Tech', orgColor:'#2FB866', matchPct:81, why:'You match their must-haves; cert in progress', href:'/opportunities', type:'Internship', location:'Remote', salary:'₹30k/mo' },
    { id:'f3', role:'UI Design Trainee', org:'ChicStyles', orgColor:'#FF4D4D', matchPct:73, why:'Open to freshers · 1 squad alum works here', href:'/opportunities', type:'Full-time', location:'Mumbai', salary:'₹4 LPA' },
  ]
  if (persona === 'org') return [
    { id:'f1', role:'Alex Somchai', org:'Senior Product Designer · Bangalore', orgColor:'#FF5C28', matchPct:91, why:'4/4 must-haves · squad-verified Figma', href:'/recruiter/search', type:'Open to work', location:'Bangalore', salary:'Expects ₹22 LPA' },
    { id:'f2', role:'Meera Iyer', org:'Staff Designer · Bangalore', orgColor:'#6D4BD8', matchPct:86, why:'Ex-Innovate Tech · 3 peer verifications', href:'/recruiter/search', type:'Open to work', location:'Bangalore', salary:'Expects ₹28 LPA' },
    { id:'f3', role:'Karan Patel', org:'Product Designer · Bangalore', orgColor:'#2BB3A3', matchPct:79, why:'2 hackathon wins · strong portfolio', href:'/recruiter/search', type:'Open to work', location:'Bangalore', salary:'Expects ₹14 LPA' },
  ]
  return [
    { id:'f1', role:'Social Media Team Lead', org:'Innovate Tech', orgColor:'#2FB866', matchPct:91, why:'+1 level above your current title · 9/10 skills', href:'/opportunities', type:'Full-time', location:'Bangalore', salary:'₹14–18 LPA' },
    { id:'f2', role:'Senior Social Media Manager', org:'DigitalDreams', orgColor:'#F5A524', matchPct:85, why:'Headline-aligned · 1 squad mate works here', href:'/opportunities', type:'Full-time', location:'Remote', salary:'₹16–20 LPA' },
    { id:'f3', role:'Brand & Social Lead', org:'TrendSetters', orgColor:'#2BB3A3', matchPct:78, why:'Adjacent step · cert would push to 90%', href:'/opportunities', type:'Contract', location:'London', salary:'£60k' },
  ]
}

/* ─── People to know (network) ──────────────────────── */
export interface PersonHint {
  id: string
  name: string
  avatar: string
  why: string
}

export function peopleByPersona(persona: Persona): PersonHint[] {
  if (persona === 'student') return [
    { id:'p1', name:'Arjun Mehta', avatar:AV(11), why:'Alumni · works at your target org' },
    { id:'p2', name:'Priya Sharma', avatar:AV(45), why:'Hackathon co-builder · forming SIH team' },
    { id:'p3', name:'Karan Patel', avatar:AV(13), why:'Same college · UX intern at Innovate' },
  ]
  if (persona === 'org') return [
    { id:'p1', name:'Alex Somchai', avatar:AV(15), why:'91% match · squad-verified' },
    { id:'p2', name:'Meera Iyer', avatar:AV(20), why:'Ex-Innovate · open to chat' },
    { id:'p3', name:'Sophia Lin', avatar:AV(5), why:'Followed your org last week' },
  ]
  return [
    { id:'p1', name:'George Mills', avatar:AV(13), why:'Works at your target org' },
    { id:'p2', name:'Nettie Schuster', avatar:AV(45), why:'Same headline · hired at Lead level recently' },
    { id:'p3', name:'Brandi Padberg', avatar:AV(60), why:'Mentor signal · open to advise' },
  ]
}
