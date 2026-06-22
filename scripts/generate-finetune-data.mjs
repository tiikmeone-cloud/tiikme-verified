/**
 * Synthetic fine-tuning data generator for Tiik Coach.
 *
 * Produces a JSONL file ready to upload to OpenAI fine-tuning.
 * Uses GPT-4o as the "teacher" to generate ideal responses following
 * the Tiik system prompt — so the student (gpt-4o-mini) learns from
 * a stronger model's outputs.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-finetune-data.mjs
 *
 * Output: scripts/tiik-finetune-data.jsonl  (~50 examples, ~$0.50 in API cost)
 *
 * After generation:
 *   1. Upload: openai api fine_tuning.jobs.create -t scripts/tiik-finetune-data.jsonl -m gpt-4o-mini-2024-07-18
 *   2. Replace model ID in src/app/api/twin/route.ts once the job completes
 */

import OpenAI from 'openai'
import { writeFileSync, appendFileSync } from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// The exact same system prompt used in production
const SYSTEM = `You are Tiik, an elite AI Career Coach on the tiikme platform.

tiikme verified career graph:
- Flex: digital career profile where every skill is peer-attested, not self-claimed
- Squad: bilateral peer confirmation — both people confirm the relationship publicly
- Vouch: insider referral staked to a specific role — the voucher's reputation is on the line
- Trust Score: 0–100 computed from Identity(20) + Experience(20) + Squads(25) + Vouches(20) + Certs(15) + Endorsements(10)
- Level Up: courses, certs, hackathons on tiikme mapped to live job requirements

CRITICAL CONSTRAINTS:
CONSTRAINT 1 — CHECK FLEX FIRST: If FLEX:EMPTY in context, halt and say: "I want to help but your Flex profile is empty. What's your current role or last job held?"
CONSTRAINT 2 — NO HALLUCINATION: Only reference facts in context. If not in context: "I don't have live data for that, but here's the framework..."
CONSTRAINT 3 — ALWAYS QUOTE HIRING CHANCE AS %: State **Hiring Chance: X%** on every role analysis.
CONSTRAINT 4 — INTEGRATE SQUAD & LEVEL UP: Every skill gap → specific cert. Every squad gap → name who to ask.
CONSTRAINT 5 — NEVER SKIP AUDIT SECTIONS: Audits cover all 6 sections: Headline → About → Experience → Skills → Trust Score → Squad+Vouches.

RESPONSE FORMAT: Bold key metrics. Numbered lists for actions. Bullet lists for options. Lead with impact. End with 2 concrete next actions. Never say "Great question!" or filler openers.`

// 50 diverse scenarios covering every possible user type and query pattern
const SCENARIOS = [
  // ── Empty Flex — various ways users ask ──
  { ctx: 'FLEX:EMPTY', user: "What are my chances for a data science role?" },
  { ctx: 'FLEX:EMPTY', user: "I want to apply to Google. Help me." },
  { ctx: 'FLEX:EMPTY', user: "Give me career advice" },
  { ctx: 'FLEX:EMPTY', user: "How do I get a job in finance?" },
  { ctx: 'FLEX:EMPTY', user: "I just graduated. What should I do?" },

  // ── Hiring chance queries ──
  { ctx: 'n:Priya Sharma|hl:ML Engineer|sk:Python,TensorFlow,PyTorch|ts:61|sq:3|vc:1\ncur:ML Eng@Zepto|csk:Python,TensorFlow\njobs:ML Lead@Swiggy=84%|Data Sci@Meesho=79%', user: "What are my chances at Swiggy ML Lead?" },
  { ctx: 'n:Rohan Das|hl:Backend Dev|sk:Go,Postgres,Redis|ts:38|sq:1|vc:0\ncur:SWE@startup|csk:Go\njobs:Backend Lead@Razorpay=71%', user: "Should I apply to Razorpay Backend Lead?" },
  { ctx: 'n:Aisha Khan|hl:Product Designer|sk:Figma,UX Research,Prototyping|ts:55|sq:2|vc:0\ncur:Designer@CRED|csk:Figma,UX Research\njobs:Senior Designer@Dunzo=81%', user: "What are my odds at Dunzo?" },
  { ctx: 'n:Kiran Mehta|hl:DevOps Engineer|sk:Kubernetes,Terraform,AWS|ts:72|sq:4|vc:2\ncur:SRE@Flipkart|csk:Kubernetes,Terraform\njobs:Platform Lead@PhonePe=91%', user: "Am I good enough for PhonePe Platform Lead?" },
  { ctx: 'n:Dev Anand|hl:Fresher|sk:React,JavaScript|ts:18|sq:0|vc:0\nedu:CS@VIT\njobs:-', user: "I'm a fresher. Any internships I can get?" },

  // ── Location-specific queries ──
  { ctx: 'n:Sneha Rao|hl:Frontend Dev|sk:React,TypeScript|ts:49|sq:2|vc:0|loc:Mumbai\ncur:Dev@startup|csk:React\njobs:Frontend@Navi=76%|SWE@Groww=72%', user: "I only want jobs in Mumbai" },
  { ctx: 'n:Arjun Patel|hl:Data Analyst|sk:SQL,Python,Tableau|ts:44|sq:1|vc:1|loc:Hyderabad\njobs:Analyst@Delhivery=68%', user: "Are there any data roles in Hyderabad?" },
  { ctx: 'n:Maya Singh|hl:iOS Developer|sk:Swift,SwiftUI,Xcode|ts:58|sq:3|vc:0|loc:Bengaluru\njobs:iOS Lead@Ola=83%', user: "I want to stay in Bangalore only" },

  // ── Trust Score coaching ──
  { ctx: 'n:Vijay Kumar|hl:Full Stack Dev|sk:Node,React,MongoDB|ts:31|sq:0|vc:0\ncur:Dev@agency', user: "My Trust Score is 31. How do I improve it?" },
  { ctx: 'n:Pooja Iyer|hl:Marketing Manager|sk:SEO,Content,Analytics|ts:47|sq:1|vc:0', user: "What's dragging my Trust Score down?" },
  { ctx: 'n:Rahul Nair|hl:Product Manager|sk:Roadmapping,SQL,Figma|ts:62|sq:3|vc:1', user: "I'm at 62. What gets me to 80?" },
  { ctx: 'n:Aakash Gupta|hl:Data Scientist|sk:Python,ML,Statistics|ts:19|sq:0|vc:0\nedu:Stats@IIT', user: "Zero squad, zero vouches, what do I do first?" },

  // ── Full Flex audit ──
  { ctx: 'n:Neeraj Bose|hl:Software Engineer|sk:Java,Spring,MySQL|ts:44|sq:1|vc:0\ncur:SWE@TCS|csk:Java,Spring\npast:Intern@Infosys\nedu:CS@NIT\njobs:Senior SWE@Zepto=73%', user: "Audit my complete Flex" },
  { ctx: 'n:Lavanya S|hl:UX Designer|sk:Figma,Sketch,UserTesting|ts:51|sq:2|vc:1\ncur:Designer@agency|csk:Figma\nedu:Design@NID', user: "Give me a full Flex audit section by section" },
  { ctx: 'n:Prakash Reddy|hl:Cloud Architect|sk:AWS,GCP,Terraform|ts:67|sq:3|vc:2\ncur:Architect@Wipro|csk:AWS,GCP\ncert:AWS Solutions Architect', user: "Review every section of my Flex and tell me what to improve" },

  // ── Career pivot / change ──
  { ctx: 'n:Sanjay M|hl:Java Backend Dev|sk:Java,Spring,Hibernate|ts:48|sq:2|vc:0\ncur:Dev@Infosys 5yrs', user: "I've been in backend 5 years. I want to move into product management." },
  { ctx: 'n:Divya Krishnan|hl:Accountant|sk:Excel,Tally,GST|ts:22|sq:0|vc:0\ncur:Accountant@firm 7yrs', user: "I want to transition into data analytics. Is it possible?" },
  { ctx: 'n:Kartik Jain|hl:Sales Executive|sk:B2B Sales,CRM,Negotiation|ts:35|sq:1|vc:1\ncur:Sales@SaaS company', user: "Can I move into customer success or growth roles?" },

  // ── Resume and headline improvement ──
  { ctx: 'n:Ananya Verma|hl:Engineer|sk:Python,Django,REST APIs|ts:43|sq:1|vc:0', user: "Is my headline good? How do I improve it?" },
  { ctx: 'n:Suresh B|hl:-|sk:React,Node,AWS|ts:28|sq:0|vc:0\ncur:Fullstack Dev@startup', user: "I don't have a headline set. What should it say?" },
  { ctx: 'n:Meera Pillai|hl:Marketing|sk:Digital Marketing,Social Media,Email|ts:52|sq:2|vc:1', user: "My about section is blank. What should I write?" },
  { ctx: 'n:Tarun Khanna|hl:Senior Software Engineer at MNC|sk:C++,Python,Linux|ts:55|sq:2|vc:1', user: "My headline is too generic. Make it better." },

  // ── Level Up / course recommendations ──
  { ctx: 'n:Farhan Ali|hl:Backend Dev|sk:Python,FastAPI|ts:41|sq:1|vc:0\njobs:ML Eng@startup=65%|Backend Lead@fintech=71%', user: "What should I learn next to get better jobs?" },
  { ctx: 'n:Ishaan Roy|hl:Frontend Dev|sk:React,CSS,HTML|ts:36|sq:1|vc:0\njobs:Frontend Lead@product co=68%', user: "What cert should I get to improve my chances?" },
  { ctx: 'n:Nandita K|hl:Junior Data Analyst|sk:Excel,SQL|ts:25|sq:0|vc:0\nedu:Stats@college', user: "I want to get into ML. What's my Level Up path?" },

  // ── Squad coaching ──
  { ctx: 'n:Ravi Shankar|hl:Product Manager|sk:Agile,Jira,SQL|ts:40|sq:0|vc:0\ncur:PM@mid-stage startup', user: "How do I get Squad confirmations? I don't know how to ask people." },
  { ctx: 'n:Preethi N|hl:Data Engineer|sk:Spark,Airflow,SQL|ts:53|sq:1|vc:0\ncur:DE@Flipkart', user: "I only have 1 squad member. Should I add more? Who?" },

  // ── Vouch coaching ──
  { ctx: 'n:Abhishek Tiwari|hl:Marketing Lead|sk:Growth,SEO,Analytics|ts:48|sq:2|vc:0\ncur:Growth@D2C brand', user: "How do I get a Vouch? I'm nervous to ask my manager." },
  { ctx: 'n:Smitha Rao|hl:SDE-2|sk:Java,AWS,Microservices|ts:61|sq:3|vc:0\ncur:SDE@Amazon India', user: "Will a vouch really help me? My Trust Score is already 61." },

  // ── Specific job fit analysis ──
  { ctx: 'n:Vikram S|hl:iOS Developer|sk:Swift,Objective-C,CoreData|ts:58|sq:2|vc:1\ncur:iOS Dev@Ola\njobs:iOS Lead@PhonePe=79%|iOS Eng@Paytm=84%', user: "Between PhonePe and Paytm, which role is better for me?" },
  { ctx: 'n:Deepa Kumar|hl:UI/UX Designer|sk:Figma,Framer,Design Systems|ts:64|sq:4|vc:2\ncur:Lead Designer@BYJU\'s\njobs:Design Lead@Razorpay=88%|Sr Designer@Zepto=82%', user: "I have two offers worth considering. What does my Flex say?" },

  // ── Job search strategy ──
  { ctx: 'n:Manish Trivedi|hl:Business Analyst|sk:SQL,Excel,PowerBI,Requirements|ts:45|sq:1|vc:1\ncur:BA@Accenture 3yrs', user: "I've been applying for 3 months with no response. What's wrong?" },
  { ctx: 'n:Geeta Nambiar|hl:HR Manager|sk:Recruitment,HRMS,Employment Law|ts:37|sq:0|vc:0', user: "Why am I not getting calls even though I apply everywhere?" },

  // ── Salary and negotiation ──
  { ctx: 'n:Sandeep M|hl:Senior Developer|sk:React,Node,GraphQL|ts:69|sq:4|vc:2\ncur:Sr Dev@Series B startup', user: "I got an offer. How do I know if it's fair?" },

  // ── Org account mode ──
  { ctx: 'n:Creative Labs (org)|acct:org', user: "We have 20 applicants for a React developer role. How do we shortlist?" },
  { ctx: 'n:TechCorp (org)|acct:org', user: "What Trust Score should we filter on for senior roles?" },
  { ctx: 'n:StartupXYZ (org)|acct:org', user: "Our job post is getting unqualified applicants. What do we change?" },

  // ── Motivational / big picture ──
  { ctx: 'n:Ajay Sharma|hl:Fresher CS|sk:C,Python,DSA|ts:15|sq:0|vc:0\nedu:CS@tier3 college', user: "I'm from a tier 3 college. Can tiikme still help me compete?" },
  { ctx: 'n:Nisha Agarwal|hl:2yr gap|sk:Java,Spring|ts:20|sq:0|vc:0', user: "I have a 2-year career gap. Will recruiters reject me?" },
  { ctx: 'n:Rohit Verma|hl:Senior PM|sk:Strategy,SQL,OKRs|ts:73|sq:5|vc:3\ncur:PM@unicorn', user: "I have a great profile everywhere. Why do I need tiikme?" },

  // ── Comparison with manual / LinkedIn ──
  { ctx: 'n:Priya M|hl:Software Engineer|sk:Python,ML,SQL|ts:44|sq:1|vc:0', user: "Why not just use LinkedIn? It has more jobs." },
  { ctx: 'n:Arun K|hl:Product Designer|sk:Figma,Research|ts:39|sq:0|vc:0', user: "I applied manually to 50 jobs. Zero responses. Will tiikme be different?" },

  // ── Platform feature questions ──
  { ctx: 'n:Deepak N|hl:Backend Engineer|sk:Go,gRPC,Kafka|ts:55|sq:2|vc:1', user: "What exactly is a Squad and why should I care?" },
  { ctx: 'n:Lalitha P|hl:Data Scientist|sk:Python,R,Tableau|ts:48|sq:1|vc:0', user: "What's the difference between a Squad and a Vouch?" },
  { ctx: 'n:Suraj B|hl:QA Engineer|sk:Selenium,JIRA,Python|ts:33|sq:0|vc:0', user: "My Flex is filled out but Trust Score is low. Why?" },
]

async function generateResponse(systemPrompt, context, userMessage) {
  const contextMsg = context
    ? `[CTX]\n${context}\n[/CTX]`
    : 'No user context available.'

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',         // teacher model — stronger than the student (gpt-4o-mini)
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextMsg },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 700,
    temperature: 0.3,        // low temperature = more consistent, constraint-following outputs
  })

  return response.choices[0].message.content
}

async function main() {
  const outputFile = 'scripts/tiik-finetune-data.jsonl'
  writeFileSync(outputFile, '')   // clear file

  console.log(`Generating ${SCENARIOS.length} fine-tuning examples using GPT-4o as teacher...`)
  console.log('Each example costs ~$0.01. Total estimated cost: ~$0.50\n')

  let success = 0
  let failed = 0

  for (let i = 0; i < SCENARIOS.length; i++) {
    const { ctx, user } = SCENARIOS[i]
    process.stdout.write(`[${i + 1}/${SCENARIOS.length}] "${user.slice(0, 50)}..."`)

    try {
      const assistantResponse = await generateResponse(SYSTEM, ctx, user)

      // JSONL format OpenAI fine-tuning expects
      const example = {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'system', content: ctx ? `[CTX]\n${ctx}\n[/CTX]` : 'No context.' },
          { role: 'user', content: user },
          { role: 'assistant', content: assistantResponse },
        ],
      }

      appendFileSync(outputFile, JSON.stringify(example) + '\n')
      console.log(' ✓')
      success++

      // Rate limit buffer
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.log(` ✗ (${err.message})`)
      failed++
    }
  }

  console.log(`\nDone. ${success} examples written to ${outputFile}, ${failed} failed.`)
  console.log('\nTo start fine-tuning:')
  console.log('  openai api fine_tuning.jobs.create \\')
  console.log('    --training-file scripts/tiik-finetune-data.jsonl \\')
  console.log('    --model gpt-4o-mini-2024-07-18 \\')
  console.log('    --suffix "tiik-coach"')
  console.log('\nOr via Node:')
  console.log('  node scripts/start-finetune-job.mjs')
}

main().catch(console.error)
