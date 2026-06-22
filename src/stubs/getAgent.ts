// Sample data for the AI/agentic mockups. In-session only.
// TODO: replace with real agent runs (embeddings match + LLM drafts) after Phase 0 (auth + edge functions).

const AV = (n: number) => `https://i.pravatar.cc/120?img=${n}`

/* ─── Candidate Agent feed ─────────────────────────── */
export interface AgentEvent {
  id: string
  kind: 'match' | 'drafted' | 'gap' | 'reach'
  at: string
  title: string
  body: string
  matchPct?: number
  org?: string
  orgColor?: string
  role?: string
  status: 'new' | 'approved' | 'dismissed'
}

export function getAgentFeed(): AgentEvent[] {
  return [
    { id:'e1', kind:'match', at:'2m ago', title:'Found a strong match', org:'Innovate Tech', orgColor:'#2FB866', role:'Founding Designer',
      body:'You match 9/10 must-haves. Remote · $130k + equity.', matchPct:89, status:'new' },
    { id:'e2', kind:'drafted', at:'12m ago', title:'Drafted your application', org:'Creative Labs', orgColor:'#FF5C28', role:'Senior Product Designer',
      body:'Tailored to their design-system focus + answered 3 screening questions from your Flex.', matchPct:85, status:'new' },
    { id:'e3', kind:'gap', at:'1h ago', title:'You’re 1 cert away', org:'Tech Genius', orgColor:'#6D4BD8', role:'UX/UI Designer',
      body:'This role wants “Google UX Design”. There’s a free one in Level Up — finish it to hit 92%.', matchPct:78, status:'new' },
    { id:'e4', kind:'reach', at:'3h ago', title:'A recruiter wants to reach you', org:'DigitalDreams', orgColor:'#F5A524', role:'Motion Designer',
      body:'They saw your verified motion work. Accept to share contact and open a chat.', status:'new' },
    { id:'e5', kind:'drafted', at:'Yesterday', title:'Applied on your behalf', org:'ChicStyles', orgColor:'#FF4D4D', role:'Part-time Graphic Designer',
      body:'You approved this — it’s now in The Grind, status: Applied.', matchPct:81, status:'approved' },
  ]
}

/* ─── WhatsApp-style notifications ─────────────────── */
export interface WaMessage {
  id: string
  to: 'candidate' | 'org'
  avatar: string
  name: string
  time: string
  lines: string[]
  buttons: string[]
}

export function getWhatsAppSamples(): WaMessage[] {
  return [
    { id:'w1', to:'candidate', avatar:AV(60), name:'tiikme', time:'now',
      lines:['🎯 *Found a job for you!*', '*Senior Product Designer · Creative Labs*', 'You’re an *85% match*. I drafted your application.'],
      buttons:['Send it','View','Not now'] },
    { id:'w2', to:'org', avatar:AV(13), name:'tiikme · Hiring', time:'now',
      lines:['👀 *New top applicant*', '*Senior Product Designer*', '*Alex S.* · 88% match · 4/4 must-haves · squad-verified'],
      buttons:['Shortlist','View profile','Pass'] },
    { id:'w3', to:'candidate', avatar:AV(45), name:'tiikme', time:'2h',
      lines:['📨 *Acme wants to reach you*', 'About a *CTO* role — your verified work fits.', 'Accept to share contact & open a chat.'],
      buttons:['Accept','View role','Pass'] },
  ]
}

/* ─── Recruiter talent search results ──────────────── */
export interface TalentResult {
  id: string
  name: string
  handle: string
  avatar: string
  role: string
  location: string
  openToWork: boolean
  matchPct: number
  verifiedSkills: string[]
  squadProof: number      // # of peers who attested
  topProof: string        // headline proof line
}

export function searchTalent(): TalentResult[] {
  return [
    { id:'t1', name:'Alex Somchai', handle:'alexsom', avatar:AV(15), role:'Senior Product Designer', location:'Bangalore', openToWork:true, matchPct:91,
      verifiedSkills:['Figma','Design Systems','Prototyping'], squadProof:4, topProof:'Shipped a design system used across 6 products' },
    { id:'t2', name:'Meera Iyer', handle:'meera', avatar:AV(20), role:'Staff Designer', location:'Bangalore', openToWork:true, matchPct:86,
      verifiedSkills:['Figma','Research','Leadership'], squadProof:3, topProof:'Led design at a Series-B fintech' },
    { id:'t3', name:'Karan Patel', handle:'karan', avatar:AV(13), role:'Product Designer', location:'Bangalore', openToWork:true, matchPct:79,
      verifiedSkills:['Figma','Webflow'], squadProof:2, topProof:'2 hackathon wins, strong portfolio' },
    { id:'t4', name:'Sophia Lin', handle:'sophia', avatar:AV(5), role:'UX Researcher', location:'Bangalore', openToWork:false, matchPct:74,
      verifiedSkills:['Research','Figma'], squadProof:5, topProof:'Published UX research, ex-Innovate Tech' },
  ]
}
