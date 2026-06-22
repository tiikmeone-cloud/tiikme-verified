/**
 * extractFlex — calls the `extract-flex` Supabase Edge Function to turn a
 * resume PDF into a structured Flex via Gemini.
 *
 * Graceful by design:
 *   · No GEMINI_API_KEY configured  → { ok: false, reason: 'no_key' }
 *   · Any failure                   → { ok: false, ... }
 * The caller (onboarding) falls back to the manual build flow on any non-ok,
 * so the product never breaks. Adding the key in Supabase turns this on.
 */

import { createClient } from '@/lib/supabase/client'

export interface ExtractedFlex {
  headline?: string
  about?: string
  skills?: string[]
  experiences?: { role: string; company: string; start: string; end: string; current: boolean; location: string; bullets: string[] }[]
  education?: { institution: string; degree: string; field: string; endYear: string }[]
  certs?: { name: string; issuer: string }[]
  links?: { github?: string; website?: string; linkedin?: string }
}

type Result =
  | { ok: true; flex: ExtractedFlex }
  | { ok: false; reason: string; detail?: string }

/** Read a File as base64 (no data: prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const res = r.result as string
      resolve(res.includes(',') ? res.split(',')[1] : res)
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export async function extractFlexFromResume(file: File, persona?: string): Promise<Result> {
  try {
    const base64 = await fileToBase64(file)
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('extract-flex', {
      body: { fileBase64: base64, mimeType: file.type || 'application/pdf', persona },
    })
    if (error) return { ok: false, reason: 'invoke', detail: error.message }
    return data as Result
  } catch (e) {
    return { ok: false, reason: 'client', detail: String(e) }
  }
}

/** Map the extracted Flex into the flat draft keys the onboarding flow uses. */
export function extractedToDraft(flex: ExtractedFlex): Record<string, string> {
  const draft: Record<string, string> = {}
  if (flex.headline) draft.role = flex.headline
  if (flex.skills?.length) draft.skills = flex.skills.join(', ')
  if (flex.experiences?.length) {
    const e = flex.experiences[0]
    draft.company = e.company
    draft.role = draft.role || e.role
    draft.impact = flex.experiences.flatMap(x => x.bullets).slice(0, 4).join('\n')
  }
  if (flex.education?.length) {
    const ed = flex.education[0]
    draft.degree = ed.degree
    draft.field = ed.field
    draft.institution = ed.institution
    draft.gradYear = ed.endYear
  }
  if (flex.links?.github) draft.github = flex.links.github
  if (flex.links?.website) draft.website = flex.links.website
  return draft
}
