// Chat data + a mock "AI" responder that pulls from the user's Flex,
// live Jobs, Level Up courses, and the network — so it feels real.
// Real LLM swap-in is a single function (`generate`) when Phase 0 lands.

import { getOpenings } from '@/stubs/getJobs'
import { getLearn } from '@/stubs/getLearn'
import { getExplorePeople } from '@/stubs/getExplore'
import type { Profile } from '@/lib/types'

export type Role = 'user' | 'assistant'
export type Persona = 'professional'|'student'|'org'

/* Auto-detect what kind of user this is from their profile.
   No toggles — the AI reads the Flex and acts accordingly. */
export function detectPersona(profile: Profile | null): Persona {
  if (profile?.account_type === 'org') return 'org'
  const txt = `${profile?.headline ?? ''} ${profile?.about ?? ''}`.toLowerCase()
  if (/student|fresher|college|university|undergraduate|final.?year|btech|\bintern\b/.test(txt)) return 'student'
  if (/recruiter|hiring|talent acquisition|head of people|head of hr|founder|ceo at /.test(txt)) return 'org'
  return 'professional'
}

export function personaLabel(p: Persona): string {
  return p === 'student' ? 'Student mode' : p === 'org' ? 'Recruiter mode' : 'Career mode'
}

export interface ChatMessage {
  id: string
  role: Role
  content: string                // markdown-lite, parsed in the renderer
  citations?: Citation[]         // structured "cards" rendered under the bubble
  followups?: string[]           // suggested next prompts
  trace?: string[]               // "what AI is doing" lines (Perplexity-style)
  thinking?: boolean             // shows the typing indicator
  streaming?: boolean            // text is being streamed word-by-word
  rating?: 1 | -1               // 👍/👎 — saved to ai_messages for fine-tuning
  at: string
}

export interface Citation {
  kind: 'job' | 'course' | 'person' | 'profile' | 'org' | 'gap'
  title: string
  sub?: string
  meta?: string
  href: string
  color?: string                 // accent for the icon dot
}

export interface ChatSession {
  id: string
  title: string                  // first user message, trimmed
  updatedAt: string
  messages: ChatMessage[]
  pinned?: boolean
}

const now = () => 'now'

/* ───── Default chat history (sample saved chats) ───── */
export function defaultSessions(): ChatSession[] {
  return [
    { id: 'c1', title: 'Help me find a Team Lead role', updatedAt: '2h ago', messages: [] },
    { id: 'c2', title: 'How do I get a UX internship?', updatedAt: 'Yesterday', messages: [] },
    { id: 'c3', title: 'What cert should I take next?', updatedAt: '3d ago', messages: [] },
    { id: 'c4', title: 'Find 3 designers for Creative Labs', updatedAt: '1w ago', messages: [] },
  ]
}

/* ───── Suggested starter prompts (persona-tinted) ───── */
export interface Suggestion { label: string; icon: string }

export function suggestions(persona: 'professional'|'student'|'org'): Suggestion[] {
  if (persona === 'student') return [
    { icon:'🎯', label:'Find me a paid internship in Bangalore' },
    { icon:'🎖️', label:'Which free cert helps me most right now?' },
    { icon:'🛠️', label:'Turn my college project into recruiter-ready proof' },
    { icon:'⚡', label:'Join a hackathon team this weekend' },
  ]
  if (persona === 'org') return [
    { icon:'🔍', label:'Find 4 vetted Senior Product Designers in Bangalore' },
    { icon:'⚙️', label:'Why is my UX/UI role losing candidates?' },
    { icon:'💸', label:'Is my salary band competitive vs the market?' },
    { icon:'🚀', label:'Source a Brand Designer without posting a job' },
  ]
  return [
    { icon:'🎯', label:'Show me roles where I\'d be a Team Lead' },
    { icon:'💸', label:'How do I push my salary band up?' },
    { icon:'🧠', label:'Which skill unlocks the most senior roles for me?' },
    { icon:'🤝', label:'Who in my network can warm-intro me?' },
  ]
}

/* ───── Mock "AI" — keyword routed, pulls real data ─── */
export interface GenerateResult { content: string; citations: Citation[]; followups: string[]; trace: string[] }

export function generate(prompt: string, persona: 'professional'|'student'|'org'): GenerateResult {
  const p = prompt.toLowerCase()
  const cite = (c: Citation): Citation => c

  /* Internship / fresher path */
  if (p.includes('internship') || p.includes('intern') || p.includes('fresher')) {
    const job = getOpenings().find(j => j.type === 'Part-time') ?? getOpenings()[0]
    return {
      trace: ['Reading your Flex…', 'Scanning 47 live internships…', 'Ranking you vs current applicants…'],
      content: `Got it — based on your Flex (final-year CS, Figma + 1 verified project), here's the cleanest path:\n\n• **${job.title}** at **${job.org}** is open to freshers and you'd land in the **top 12% of applicants**. I can draft the application from your Flex.\n• Pair it with a free cert (below) — finishing it pushes you to the **top 4%** on this one.\n• Tag classmates on your college project → it becomes squad-verified proof (counts as experience here).`,
      citations: [
        cite({ kind:'job', title:job.title, sub:`${job.org} · ${job.location}`, meta:`${job.salary} · open to freshers`, href:'/opportunities', color:job.orgColor }),
        cite({ kind:'course', title:'Google UX Design Certificate', sub:'Coursera · Free for students', meta:'1.2M enrolled · earns Flex credential', href:'/opportunities', color:'#2563EB' }),
        cite({ kind:'gap', title:'Polish your college project', sub:'AI-rewrite + squad-verify with classmates', meta:'Counts as experience', href:'/profile/me', color:'#FF5C28' }),
      ],
      followups: [],
    }
  }

  /* Career ladder / Team Lead jump */
  if (p.includes('team lead') || p.includes('next role') || p.includes('level') || p.includes('senior')) {
    const job = getOpenings().find(j => j.title.includes('Founding')) ?? getOpenings()[0]
    return {
      trace: ['Reading your headline & verified Flex…', 'Comparing 12 senior roles…', 'Ranking you vs current applicants…'],
      content: `Reading your headline + verified Flex, you're ready for a **level jump**. Here's my read:\n\n• **${job.title}** at **${job.org}** would make you the lead on the team — you'd land in the **top 5% of current applicants** (9/10 must-haves matched).\n• Adding **Marketing Analytics** to your Flex unlocks ~12 more senior roles AND would push you to top 2% on this one.\n• **2 people from your squad** just joined Creative Labs — warm intro path available.`,
      citations: [
        cite({ kind:'job', title:job.title, sub:`${job.org} · ${job.location}`, meta:`${job.salary} · +1 level vs current`, href:'/opportunities', color:job.orgColor }),
        cite({ kind:'course', title:'Marketing Analytics path', sub:'Coursera · 14 days', meta:'Unlocks +12 senior roles', href:'/opportunities', color:'#2563EB' }),
        cite({ kind:'org', title:'Creative Labs', sub:'2 squad mates work here', meta:'Warm intro path', href:'/org/creative-labs', color:'#FF5C28' }),
      ],
      followups: [],
    }
  }

  /* Salary */
  if (p.includes('salary') || p.includes('pay') || p.includes('compensation') || p.includes('₹') || p.includes('lpa')) {
    return {
      trace: ['Pulling 218 verified profiles in your role + city…', 'Calculating market median…', 'Finding roles above your band…'],
      content: `Based on 218 verified profiles with your headline in Bangalore:\n\n• **Market median:** ₹11–14 LPA. You're roughly **₹3 LPA below** that.\n• Three pulls that move the needle: **verify 2 more campaigns** on your Flex (squad proof = ranking signal), **add Marketing Analytics**, and apply to roles where I see comp gaps.\n• I found one role today posted ₹3 LPA above your current band.`,
      citations: [
        cite({ kind:'gap', title:'Verify 2 campaigns on your Flex', sub:'Tag teammates from the work', meta:'Lifts your match score band', href:'/profile/me', color:'#2FB866' }),
        cite({ kind:'job', title:'Senior Social Media Manager', sub:'DigitalDreams · Remote', meta:'₹16–20 LPA · +₹3 LPA vs your band', href:'/opportunities', color:'#F5A524' }),
      ],
      followups: [],
    }
  }

  /* Cert / skill / level up */
  if (p.includes('cert') || p.includes('certificate') || p.includes('skill') || p.includes('learn') || p.includes('course') || p.includes('level up')) {
    const cert = getLearn().find(l => l.kind === 'certificate') ?? getLearn()[0]
    return {
      trace: ['Diffing your Flex vs target roles…', 'Ranking certs by job uplift…', 'Checking network proof…'],
      content: `Looking at the **gap between your Flex and the roles you want**, here's what to take — and **why it pays off**:\n\n• **${cert.title}** — ${cert.duration}. ${cert.why}\n• On finish, the credential **auto-lands on your Flex** as verified. Your AI match score jumps on every role that asks for it.\n• ${cert.squadEarned + cert.networkEarned} people in your network already earned this.`,
      citations: [
        cite({ kind:'course', title:cert.title, sub:`${cert.provider} · ${cert.duration}`, meta:`${cert.enrolled} · ${cert.free?'free':'paid'}`, href:'/opportunities', color:cert.providerColor }),
      ],
      followups: [],
    }
  }

  /* Hackathon */
  if (p.includes('hackathon') || p.includes('competition') || p.includes('build') || p.includes('project')) {
    const h = getLearn().find(l => l.kind === 'hackathon') ?? getLearn()[0]
    return {
      trace: ['Scanning open hackathons…', 'Matching to your build skills…', 'Finding teammates…'],
      content: `Building publicly is the fastest way to land interviews. Here's the pick:\n\n• **${h.title}** — ${h.duration}. ${h.deadline ?? 'Open now'}.\n• Winning → instant portfolio piece + recruiters scout finalists.\n• I can match you with **3 teammates** from your squad who are building.`,
      citations: [
        cite({ kind:'course', title:h.title, sub:`${h.provider} · ${h.duration}`, meta:h.deadline ?? h.enrolled, href:'/opportunities', color:h.providerColor }),
        cite({ kind:'person', title:'3 squad members', sub:'Looking for a team this weekend', meta:'Skills match', href:'/opportunities', color:'#6D4BD8' }),
      ],
      followups: [],
    }
  }

  /* Network / intro */
  if (p.includes('intro') || p.includes('connect') || p.includes('reach') || p.includes('warm') || p.includes('referral')) {
    const ppl = getExplorePeople().slice(0,3)
    return {
      trace: ['Reading your squad + follows…', 'Cross-referencing with target roles…', 'Ranking by mutual strength…'],
      content: `Network is the shortcut. Three warm-intro paths I'd take right now:\n\n• Each of these works because they share a tie to a role I see open for you.`,
      citations: ppl.map(p => cite({ kind:'person', title:p.name, sub:`${p.role} · ${p.company}`, meta:`${p.mutualCount} mutual`, href:`/profile/${p.handle}`, color:p.companyColor })),
      followups: [],
    }
  }

  /* Org: find candidates */
  if (persona === 'org' && (p.includes('find') || p.includes('hire') || p.includes('candidate') || p.includes('source') || p.includes('designer'))) {
    return {
      trace: ['Reading your open roles…', 'Querying the verified talent graph…', 'Ranking by proof, not claims…'],
      content: `Pulled from the verified talent graph (Bangalore, open to work, squad-verified Figma + Design Systems). 4 strong fits — all ranked by proof, not resume claims.\n\nI can run the role-tied reach-out for you. Contact reveals only on their accept (no cold inbox).`,
      citations: [
        cite({ kind:'person', title:'Alex Somchai', sub:'Senior Product Designer · 91% match', meta:'4/4 must-haves · squad-verified', href:'/recruiter/search', color:'#FF5C28' }),
        cite({ kind:'person', title:'Meera Iyer', sub:'Staff Designer · 86% match', meta:'Ex-Innovate Tech · 3 peers verified', href:'/recruiter/search', color:'#6D4BD8' }),
        cite({ kind:'person', title:'Karan Patel', sub:'Product Designer · 79% match', meta:'2 hackathon wins', href:'/recruiter/search', color:'#2BB3A3' }),
      ],
      followups: [],
    }
  }

  /* Org: screener / funnel */
  if (persona === 'org' && (p.includes('screen') || p.includes('losing') || p.includes('drop') || p.includes('funnel'))) {
    return {
      trace: ['Analysing your funnel…', 'Comparing screener bars vs market…', 'Modelling pool changes…'],
      content: `68% of applicants drop at Question 2 ("5+ years"). The market median for that title is **3 years** — your screener is filtering out otherwise-strong candidates.\n\nSuggested fix: loosen Q2 to 3+ and add a project-tag question instead. You'll roughly **3× your applicant pool** without lowering bar.`,
      citations: [
        cite({ kind:'gap', title:'Tune the screener (Q2)', sub:'5+ → 3+ yrs', meta:'~3× pool · no quality drop modeled', href:'/org/tech-genius/talent', color:'#FF5C28' }),
      ],
      followups: ['Apply the fix', 'Show dropped applicants worth revisiting', 'Re-rank my current pool'],
    }
  }

  /* Org: SHORTLIST TOP N — agent task */
  if (persona === 'org' && (/shortlist/.test(p) || /top \d+/.test(p) || (p.includes('check') && p.includes('candidate')))) {
    return {
      trace: ['Reading your most-recent posted role…', 'Pulling 47 applicants from the pipeline…', 'Ranking by verified Flex + squad proof…'],
      content: `Done — here are the **top 5** for **Senior Product Designer** (your most-recent post), ranked by verified Flex + AI fit.\n\n• All five are squad-verified on Figma + Design Systems.\n• Contact reveals only on candidate accept (built-in).`,
      citations: [
        cite({ kind:'person', title:'Alex Somchai · 91%', sub:'4/4 must-haves · squad-verified', meta:'TOP TALENT · Bangalore · expects ₹22 LPA', href:'/recruiter/search', color:'#FF5C28' }),
        cite({ kind:'person', title:'Meera Iyer · 86%', sub:'Ex-Innovate Tech · 3 peer verifications', meta:'Bangalore · expects ₹28 LPA', href:'/recruiter/search', color:'#6D4BD8' }),
        cite({ kind:'person', title:'Karan Patel · 79%', sub:'2 hackathon wins · strong portfolio', meta:'Bangalore · expects ₹14 LPA', href:'/recruiter/search', color:'#2BB3A3' }),
        cite({ kind:'person', title:'Sophia Lin · 76%', sub:'Followed your org last week', meta:'Singapore · open to relocate', href:'/recruiter/search', color:'#2FB866' }),
        cite({ kind:'person', title:'Brandi Padberg · 71%', sub:'Strong systems thinking', meta:'Toronto · remote-first', href:'/recruiter/search', color:'#F5A524' }),
      ],
      followups: [],
    }
  }

  /* Audit my Flex — agent task (works for any persona) */
  if (/audit|how (is|good) my flex|is my flex (perfect|good|strong)|review my flex|flex score|rate my flex/.test(p)) {
    return {
      trace: ['Reading your Flex…', 'Comparing against 1,200 verified profiles in your role…', 'Scoring + ranking fixes by impact…'],
      content: `Your Flex is **72/100** — strong on skills, weak on outcomes.\n\n• **What's working** — Verified Figma + Design Systems (top 12% in Bangalore), 4 squad peers attest, headline clear.\n• **Top fix (biggest lift):** Headline. "Product Designer" → "Product Designer · Design Systems @ Zeta" → **+14 senior roles unlocked**.\n• **Quick win:** Quantify your 2nd bullet ("Led redesign" → "Led redesign that lifted conversion 18%") → recruiters score this 2× higher.\n• **One missing signal:** No verified portfolio link. Adding one → **+18% recruiter view-through.**`,
      citations: [
        cite({ kind:'profile', title:'Rewrite your headline', sub:'AI-drafted: "Product Designer · Design Systems @ Zeta"', meta:'+14 senior roles unlocked', href:'/profile/me', color:'#FF5C28' }),
        cite({ kind:'profile', title:'Quantify bullet 2', sub:'AI-drafted: "Led redesign that lifted conversion 18%"', meta:'2× recruiter scoring', href:'/profile/me', color:'#6D4BD8' }),
        cite({ kind:'profile', title:'Add a verified portfolio link', sub:'Connect Dribbble or paste URL', meta:'+18% view-through', href:'/profile/me', color:'#2FB866' }),
      ],
      followups: [],
    }
  }

  /* Org: comp gap */
  if (persona === 'org' && (p.includes('competitor') || p.includes('band') || p.includes('benchmark') || p.includes('compete'))) {
    return {
      trace: ['Running daily market scan…', 'Comparing role bands…', 'Surfacing competitive moves…'],
      content: `Daily market scan: a peer org just posted the same role at **+₹3 LPA over yours**. Pipeline likely slowing for that reason.\n\nSuggested update: ₹17–20 LPA + open Remote — that brings you in line with the top of the market band for this title.`,
      citations: [
        cite({ kind:'org', title:'Update Senior Product Designer role', sub:'₹15–18 → ₹17–20 LPA · open Remote', meta:'Brings band to market top', href:'/org/tech-genius', color:'#F5A524' }),
      ],
      followups: [],
    }
  }

  /* Application status / chances */
  if (p.includes('applied') || (p.includes('application') && (p.includes('where') || p.includes('status') || p.includes('my') || p.includes('chances'))) || p.includes('where is my')) {
    const companyMatch = p.match(/(?:at|in|to|for)\s+([a-z][a-z\s]{1,30}?)(?:\s+role|\s+job|\s+for|\s+company|[,.]|$)/i)
    const company = companyMatch?.[1]?.trim() ?? 'that company'
    return {
      trace: ['Checking your application pipeline…', 'Reading their hiring velocity…', 'Calculating your match rank vs other applicants…'],
      content: `Your application to **${company}** is in — here's the full picture:\n\n• **Status:** Applied ✓ — received and logged. Avg recruiter first-view is **2–5 business days**.\n• **Your match score:** **78/100** — you hit 7 of 9 must-haves. The 2 gaps: "5+ yrs exp" and "MBA preferred" (both nice-to-have, not hard knockout).\n• **Your rank:** Top **18% of applicants** — based on your verified squad proof, certs, and Flex completeness.\n• **What moves the needle:** Add one squad-verified case study + connect a colleague from a past role → you'd jump to **top 8%**.\n\nI'll alert you the moment the recruiter views your profile.`,
      citations: [
        cite({ kind:'profile', title:'Add squad-verified case study', sub:'Your biggest impact project, attested', meta:'Move from top 18% → top 8%', href:'/profile/me', color:'#FF5C28' }),
        cite({ kind:'profile', title:'Your Flex is 72% complete', sub:'2 items left — exp dates + portfolio link', meta:'Improves screener pass rate', href:'/profile/me', color:'#6D4BD8' }),
        cite({ kind:'gap', title:'2 gaps vs role requirements', sub:'"5+ yrs exp" · "MBA preferred"', meta:'Both are nice-to-have, not knockout', href:'/opportunities', color:'#2BB3A3' }),
      ],
      followups: [],
    }
  }

  /* Catch-all */
  return {
    trace: ['Reading your Flex…', 'Scanning live data…', 'Composing a plan…'],
    content: `Here's my read on your Flex + the live data:\n\n• Your strongest signal right now is **squad-verified Figma + Design Systems**.\n• I'd focus on **next-level roles** (you're ready), and **one cert** that compounds across them.\n• When you're ready, I can draft an application or set up a warm intro — just ask.`,
    citations: [
      cite({ kind:'profile', title:'Polish your Flex headline', sub:'Recruiters search on this first', meta:'2-min fix', href:'/profile/me', color:'#FF5C28' }),
      cite({ kind:'job', title:'Roles that level you up', sub:'AI-ranked by your verified Flex', meta:'See the feed', href:'/opportunities', color:'#2FB866' }),
    ],
    followups: [],
  }
}
