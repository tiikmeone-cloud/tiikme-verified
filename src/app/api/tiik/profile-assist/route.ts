/**
 * POST /api/tiik/profile-assist
 *
 * AI-powered profile field suggestions. Covers:
 *   type: 'headline'      → generate a strong headline from role + skills
 *   type: 'about'         → write a first-person about section
 *   type: 'skills'        → suggest relevant skills from a job title
 *   type: 'normalize_role'→ standardize a free-text role title to clean format
 *
 * All responses are strict JSON — no streaming, fast (<1s typical).
 * Used in EditProfilePanel and MyFlexView experience form.
 */

import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { checkInput } from '@/lib/guardrails'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type AssistType = 'headline' | 'about' | 'skills' | 'normalize_role'

interface AssistRequest {
  type: AssistType
  role?: string
  company?: string
  skills?: string[]
  experience?: string[]   // array of "Role at Company" strings
  education?: string
  location?: string
  name?: string
}

// Strict JSON schemas for each assist type — prevents hallucination
const SCHEMAS: Record<AssistType, object> = {
  headline: {
    name: 'headline_suggestion',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        headline: { type: 'string', description: 'A punchy 1-line professional headline under 80 chars' },
        alternatives: { type: 'array', items: { type: 'string' }, description: '2 alternative headline options' },
      },
      required: ['headline', 'alternatives'],
      additionalProperties: false,
    },
  },
  about: {
    name: 'about_suggestion',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        about: { type: 'string', description: 'A 2-3 sentence first-person professional summary, no buzzwords' },
      },
      required: ['about'],
      additionalProperties: false,
    },
  },
  skills: {
    name: 'skills_suggestion',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: '8-12 specific, verified, industry-standard skill names for this role. No vague terms like "communication" or "leadership".',
        },
      },
      required: ['skills'],
      additionalProperties: false,
    },
  },
  normalize_role: {
    name: 'role_normalization',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        normalized: { type: 'string', description: 'Standardized job title using global industry conventions' },
        level: { type: 'string', enum: ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Staff', 'Principal', 'Director', 'VP', 'C-Level', 'Founder'], description: 'Seniority level inferred from the title' },
        category: { type: 'string', enum: ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'Operations', 'Finance', 'HR', 'Legal', 'Healthcare', 'Education', 'Research', 'Creative', 'Other'], description: 'Broad function category' },
      },
      required: ['normalized', 'level', 'category'],
      additionalProperties: false,
    },
  },
}

const PROMPTS: Record<AssistType, (r: AssistRequest) => string> = {
  headline: (r) => `Generate a professional headline for this person.
Role: ${r.role ?? 'not provided'}
Company: ${r.company ?? 'not provided'}
Skills: ${(r.skills ?? []).join(', ') || 'not provided'}
Past experience: ${(r.experience ?? []).join(', ') || 'none'}
Location: ${r.location ?? 'not provided'}

Rules:
- Under 80 characters
- No generic words like "passionate", "dynamic", "results-driven"
- Include role title + 2-3 top skills + optionally company/location
- Example good format: "Senior Backend Engineer · Go · gRPC · ex-Razorpay"`,

  about: (r) => `Write a concise professional about section for this person.
Role: ${r.role ?? 'not provided'}
Company: ${r.company ?? 'not provided'}
Skills: ${(r.skills ?? []).join(', ') || 'not provided'}
Past experience: ${(r.experience ?? []).join(', ') || 'none'}
Education: ${r.education ?? 'not provided'}

Rules:
- 2-3 sentences only
- First person ("I build..." not "She builds...")
- No clichés ("passionate", "hardworking", "team player")
- Include at least one specific outcome or number if possible
- End with current focus or what they're open to`,

  skills: (r) => `List 8-12 specific technical/professional skills for this job title.
Job title: ${r.role ?? 'not provided'}
Company context: ${r.company ?? 'not provided'}

Rules:
- Only SPECIFIC, verifiable skills (tools, languages, frameworks, methodologies)
- No soft skills ("communication", "leadership", "teamwork")
- No generic terms ("Microsoft Office", "Computer skills")
- Use industry-standard names exactly as they appear on job descriptions
- Include both technical hard skills and role-specific domain skills`,

  normalize_role: (r) => `Normalize this job title to a clean, globally-standard format.
Raw input: "${r.role ?? ''}"

Rules:
- Fix abbreviations (e.g. "SWE" → "Software Engineer", "PM" → "Product Manager")
- Standardize casing (Title Case)
- Remove company-specific internal titles
- Infer seniority level from the title
- Assign the best-fit broad category`,
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 503 })
  }

  const body = await req.json() as AssistRequest

  // Guard free-text inputs
  const textToCheck = [body.role, body.company, ...(body.skills ?? [])].filter(Boolean).join(' ')
  if (checkInput(textToCheck)) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { type } = body
  if (!type || !(type in SCHEMAS)) {
    return Response.json({ error: 'Invalid type. Use: headline | about | skills | normalize_role' }, { status: 400 })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional career profile writer for tiikme. You help users write strong, specific, honest profile content. Never hallucinate facts. Never use clichés. Be concise and direct.',
        },
        { role: 'user', content: PROMPTS[type](body) },
      ],
      response_format: { type: 'json_schema', json_schema: SCHEMAS[type] as never },
      max_tokens: 300,
      temperature: 0.4,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return Response.json({ error: 'No response' }, { status: 500 })

    return Response.json(JSON.parse(content))
  } catch (err) {
    return Response.json(
      { error: 'Profile assist failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
