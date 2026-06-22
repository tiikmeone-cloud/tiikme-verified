/**
 * Flex persistence — experiences, education, certificates, achievements.
 * Wires the MyFlex add-forms (previously stubs) to Supabase.
 */

import { createClient } from '@/lib/supabase/client'
import type {
  ExperienceEntry, EducationEntry, CertEntry, AchievementEntry,
} from '@/lib/profileTypes'
import { enqueueEmbedding, triggerUserEmbed } from '@/lib/embeddings'

import { getDemoUserId } from '@/lib/applications'

async function uid(): Promise<string | null> {
  return getDemoUserId()
}

/* ─── EXPERIENCE ─────────────────────────────── */

export async function listExperiences(userId: string): Promise<ExperienceEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('flex_experience')
    .select('id, role, company, emp_type, start_month, start_year, end_month, end_year, currently_working, location, location_type, description, skills_used, squad, display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id,
    role: r.role,
    company: r.company,
    empType: r.emp_type ?? '',
    startMonth: r.start_month ?? '',
    startYear: r.start_year ?? '',
    endMonth: r.end_month ?? '',
    endYear: r.end_year ?? '',
    currentlyWorking: !!r.currently_working,
    location: r.location ?? '',
    locationType: (r.location_type ?? 'onsite') as ExperienceEntry['locationType'],
    description: r.description ?? '',
    aiPoints: [],
    skillsUsed: r.skills_used ?? [],
    squad: (r.squad as ExperienceEntry['squad']) ?? { foundOnPlatform: 0, members: [] },
  }))
}

export async function addExperience(d: ExperienceEntry): Promise<string | null> {
  const userId = await uid(); if (!userId) return null
  const supabase = createClient()
  const { data, error } = await supabase.from('flex_experience').insert({
    user_id: userId,
    role: d.role, company: d.company, emp_type: d.empType,
    start_month: d.startMonth, start_year: d.startYear,
    end_month: d.endMonth, end_year: d.endYear,
    currently_working: d.currentlyWorking,
    location: d.location, location_type: d.locationType,
    description: d.description, skills_used: d.skillsUsed,
  }).select('id').single()
  if (error) { console.error(error); return null }
  if (data?.id) {
    const text = [d.role, d.company, d.description, (d.skillsUsed ?? []).join(', ')].filter(Boolean).join(' · ')
    enqueueEmbedding('flex_experience', data.id, text, userId)
    triggerUserEmbed(userId)
    // Fire proactive career coach (Experience_Updated event) — fire-and-forget
    fetch('/api/tiik/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {})
  }
  return data?.id ?? null
}

export async function deleteExperience(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('flex_experience').delete().eq('id', id)
  return !error
}

/* ─── EDUCATION ─────────────────────────────── */

export async function listEducation(userId: string): Promise<EducationEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('flex_education')
    .select('id, institution, degree, field, start_year, end_year, grade, squad, display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id,
    institution: r.institution,
    degree: r.degree ?? '',
    field: r.field ?? '',
    startYear: r.start_year ?? '',
    endYear: r.end_year ?? '',
    grade: r.grade ?? '',
    squad: (r.squad as EducationEntry['squad']) ?? { foundOnPlatform: 0, members: [] },
  }))
}

export async function addEducation(d: EducationEntry): Promise<string | null> {
  const userId = await uid(); if (!userId) return null
  const supabase = createClient()
  const { data, error } = await supabase.from('flex_education').insert({
    user_id: userId,
    institution: d.institution, degree: d.degree, field: d.field,
    start_year: d.startYear, end_year: d.endYear, grade: d.grade,
  }).select('id').single()
  if (error) { console.error(error); return null }
  if (data?.id) {
    const text = [d.institution, d.degree, d.field].filter(Boolean).join(' · ')
    enqueueEmbedding('flex_education', data.id, text, userId)
  }
  return data?.id ?? null
}

export async function deleteEducation(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('flex_education').delete().eq('id', id)
  return !error
}

/* ─── CERTIFICATES ─────────────────────────────
   Existing table — flex_certs (already in schema). */

export async function listCerts(userId: string): Promise<CertEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('flex_certs')
    .select('id, name, issuer, issued_on, source_url, squad')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id, name: r.name, issuer: r.issuer,
    year: r.issued_on ? new Date(r.issued_on).getFullYear().toString() : '',
    squad: (r.squad as CertEntry['squad']) ?? { foundOnPlatform: 0, members: [] },
  }))
}

export async function addCert(d: CertEntry): Promise<string | null> {
  const userId = await uid(); if (!userId) return null
  const supabase = createClient()
  const issuedOn = d.year ? `${d.year}-01-01` : null
  const { data, error } = await supabase.from('flex_certs').insert({
    user_id: userId, name: d.name, issuer: d.issuer, issued_on: issuedOn, source: 'manual',
  }).select('id').single()
  if (error) { console.error(error); return null }
  if (data?.id) {
    const text = [d.name, d.issuer].filter(Boolean).join(' · ')
    enqueueEmbedding('flex_certificate', data.id, text, userId)
    triggerUserEmbed(userId)
  }
  return data?.id ?? null
}

export async function deleteCert(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('flex_certs').delete().eq('id', id)
  return !error
}

/* ─── ACHIEVEMENTS ─────────────────────────────── */

export async function listAchievements(userId: string): Promise<AchievementEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('flex_achievements')
    .select('id, title, description, squad, display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id, title: r.title, description: r.description ?? '',
    squad: (r.squad as AchievementEntry['squad']) ?? { foundOnPlatform: 0, members: [] },
  }))
}

export async function addAchievement(d: AchievementEntry): Promise<string | null> {
  const userId = await uid(); if (!userId) return null
  const supabase = createClient()
  const { data, error } = await supabase.from('flex_achievements').insert({
    user_id: userId, title: d.title, description: d.description,
  }).select('id').single()
  if (error) { console.error(error); return null }
  if (data?.id) {
    const text = [d.title, d.description].filter(Boolean).join(' · ')
    enqueueEmbedding('flex_achievement', data.id, text, userId)
  }
  return data?.id ?? null
}

export async function deleteAchievement(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('flex_achievements').delete().eq('id', id)
  return !error
}
