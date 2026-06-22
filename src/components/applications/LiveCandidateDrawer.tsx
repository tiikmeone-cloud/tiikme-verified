'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  type OrgApplication, type Stage,
  STAGE_LABEL, STAGE_TINT, advanceStage, relativeTime,
} from '@/lib/applications'
import { listExperiences, listEducation, listCerts, listAchievements } from '@/lib/flex'
import type { ExperienceEntry, EducationEntry, CertEntry, AchievementEntry, AttachableSquad } from '@/lib/profileTypes'
import { AvatarStack } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

interface Props { app: OrgApplication; onClose: () => void; onMoved: () => void }

interface FlexData {
  exp: ExperienceEntry[]
  edu: EducationEntry[]
  certs: CertEntry[]
  ach: AchievementEntry[]
  about: string | null
  openToWork: boolean
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const NEXT_STAGE: Partial<Record<Stage, { next: Stage; label: string }>> = {
  applied:   { next: 'screening',   label: 'Move to Reviewed' },
  screening: { next: 'shortlisted', label: 'Shortlist' },
  // shortlisted is the final recruiter action — no further stage from here
}

function printFlexPDF(flex: FlexData, app: OrgApplication, answers: Record<string, unknown>) {
  const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const fmt = (m: string, y: string) => `${m ? MO[+m-1]+' ' : ''}${y}`
  const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}` }

  const squadRow = (squad: ExperienceEntry['squad']) => {
    const v = squad?.members?.filter(m => m.status === 'verified') ?? []
    if (!v.length) return ''
    const circles = v.map(m =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${m.avatarColor};color:#fff;font-size:8px;font-weight:700;margin-right:-4px;border:2px solid #fff;flex-shrink:0">${m.initials}</span>`
    ).join('')
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:8px">${circles}<span style="margin-left:8px;font-size:10px;font-weight:600;color:#2FB866">${v.length} verified teammate${v.length>1?'s':''}</span></div>`
  }
  const chip = (t: string) =>
    `<span style="display:inline-block;font-size:9px;font-weight:600;color:#2BB3A3;background:rgba(43,179,163,.1);border:1px solid rgba(43,179,163,.2);border-radius:99px;padding:3px 9px;margin:2px 3px 2px 0">${t}</span>`
  const iconBox = (letter: string, bg: string) =>
    `<div style="width:36px;height:36px;border-radius:9px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0">${letter}</div>`
  const sec = (title: string, body: string) => `
    <div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="display:block;width:3px;height:14px;background:#FF5C28;border-radius:2px"></span>
        <p style="font-size:10px;font-weight:800;letter-spacing:.12em;color:#1B1B1D;text-transform:uppercase">${title}</p>
      </div>
      ${body}
    </div>`

  const expHTML = flex.exp.map((e, i) => `
    <div style="display:flex;gap:14px;padding:${i===0?'0':'14px'} 0 ${i<flex.exp.length-1?'14px':'0'};${i>0?'border-top:1px solid #F0EFEC':''}">
      ${iconBox(e.company.charAt(0), '#FF5C28')}
      <div style="flex:1;min-width:0">
        <p style="font-size:13px;font-weight:700;color:#1B1B1D;margin:0">${e.role}</p>
        <p style="font-size:11px;color:#6E6E73;margin:2px 0 0">${e.company}${e.empType?` <span style="color:#A1A0A4">· ${e.empType}</span>`:''}</p>
        <p style="font-size:10px;color:#A1A0A4;margin:2px 0 0">${fmt(e.startMonth,e.startYear)} – ${e.currentlyWorking?'Present':fmt(e.endMonth,e.endYear)}${e.location?` · ${e.location}`:''}</p>
        ${e.description?`<p style="font-size:11px;color:#6E6E73;line-height:1.65;margin:7px 0 0">${e.description}</p>`:''}
        ${e.skillsUsed?.length?`<div style="margin-top:7px">${e.skillsUsed.map(chip).join('')}</div>`:''}
        ${squadRow(e.squad)}
      </div>
    </div>`).join('')

  const eduHTML = flex.edu.map((e, i) => `
    <div style="display:flex;gap:14px;padding:${i===0?'0':'14px'} 0 ${i<flex.edu.length-1?'14px':'0'};${i>0?'border-top:1px solid #F0EFEC':''}">
      ${iconBox(e.institution.charAt(0), '#6D4BD8')}
      <div style="flex:1">
        <p style="font-size:13px;font-weight:700;color:#1B1B1D;margin:0">${e.institution}</p>
        <p style="font-size:11px;color:#6E6E73;margin:2px 0 0">${e.degree}${e.field?` · ${e.field}`:''}</p>
        <p style="font-size:10px;color:#A1A0A4;margin:2px 0 0">${e.startYear} – ${e.endYear}${e.grade?` · GPA ${e.grade}`:''}</p>
        ${squadRow(e.squad)}
      </div>
    </div>`).join('')

  const achHTML = flex.ach.map((a, i) => `
    <div style="display:flex;gap:10px;${i>0?'margin-top:12px;padding-top:12px;border-top:1px solid #F0EFEC':''}">
      <span style="font-size:16px;flex-shrink:0">🏆</span>
      <div>
        <p style="font-size:12px;font-weight:700;color:#1B1B1D;margin:0">${a.title}</p>
        ${a.description?`<p style="font-size:11px;color:#6E6E73;margin:3px 0 0;line-height:1.5">${a.description}</p>`:''}
      </div>
    </div>`).join('')

  const certHTML = flex.certs.map((c, i) => `
    <div style="display:flex;gap:10px;${i>0?'margin-top:12px;padding-top:12px;border-top:1px solid #F0EFEC':''}">
      <div style="width:32px;height:32px;border-radius:8px;background:rgba(245,165,36,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F5A524" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
      </div>
      <div>
        <p style="font-size:12px;font-weight:700;color:#1B1B1D;margin:0">${c.name}</p>
        <p style="font-size:10px;color:#A1A0A4;margin:3px 0 0">${c.issuer}${c.year?` · ${c.year}`:''}</p>
      </div>
    </div>`).join('')

  /* Match score brief */
  const bd = app.match_breakdown as Record<string,number> ?? {}
  const matchBrief = Object.entries(bd)
    .sort(([,a],[,b]) => b-a)
    .map(([k,v]) => `<span style="font-size:10px;color:#6E6E73">${k.charAt(0).toUpperCase()+k.slice(1)} <strong style="color:#1B1B1D">${v}pt</strong></span>`)
    .join('<span style="color:#E4E2DE;margin:0 6px">·</span>')

  /* Answer type inference */
  const answerType = (a: unknown) => {
    const s = String(a)
    if (s === 'Yes' || s === 'No') return 'Yes / No'
    if (/^\d+$/.test(s)) return 'Number'
    return 'Short answer'
  }

  const html = `<!DOCTYPE html><html><head>
  <meta charset="UTF-8"/>
  <title>${app.user_full_name ?? app.user_username}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#fff;color:#1B1B1D;font-size:12px;line-height:1.5}
    @page{margin:20mm 18mm}
    @media print{.page-break{page-break-before:always}}
  </style>
  </head><body>

  <!-- ═══ PAGE 1: RESUME ═══ -->
  <div style="max-width:680px;margin:0 auto;padding:36px 0">

    <!-- HEADER -->
    <div style="padding-bottom:20px;border-bottom:2px solid #FF5C28;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-size:9px;font-weight:800;letter-spacing:.14em;color:#FF5C28;text-transform:uppercase">tiikme.com</span>
        <span style="font-size:9px;color:#A1A0A4">Verified candidate profile</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:20px">
        ${app.user_avatar
          ? `<img src="${app.user_avatar}" style="width:80px;height:80px;border-radius:14px;object-fit:cover;flex-shrink:0"/>`
          : `<div style="width:80px;height:80px;border-radius:14px;background:#FFEDE5;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#FF5C28;flex-shrink:0">${(app.user_full_name??app.user_username).charAt(0)}</div>`}
        <div style="flex:1">
          <h1 style="font-size:24px;font-weight:800;color:#1B1B1D;line-height:1.15;margin:0">${app.user_full_name ?? app.user_username}</h1>
          ${app.user_headline?`<p style="font-size:13px;color:#6E6E73;margin-top:5px;font-weight:500">${app.user_headline}</p>`:''}
          <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px">
            ${app.user_city?`<span style="font-size:11px;color:#A1A0A4">📍 ${app.user_city}</span>`:''}
            ${app.applicant_email?`<span style="font-size:11px;color:#6E6E73">✉ ${app.applicant_email}</span>`:''}
            ${app.applicant_phone?`<span style="font-size:11px;color:#6E6E73">${app.applicant_phone}</span>`:''}
            <span style="font-size:11px;color:#A1A0A4">Applied ${fmtDate(app.applied_at)}</span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:#FFF3EE;border:2px solid #FF5C28">
            <span style="font-size:14px;font-weight:800;color:#FF5C28">${typeof app.ai_score==='number'?Math.round(app.ai_score):'–'}%</span>
          </div>
          <p style="font-size:9px;color:#A1A0A4;margin-top:4px;text-align:center">match</p>
        </div>
      </div>
    </div>

    <!-- ABOUT -->
    ${flex.about ? sec('About', `<p style="font-size:12px;color:#6E6E73;line-height:1.75">${flex.about}</p>`) : ''}

    <!-- EXPERIENCE -->
    ${flex.exp.length ? sec('Work Experience', expHTML) : ''}

    <!-- EDUCATION -->
    ${flex.edu.length ? sec('Education', eduHTML) : ''}

    <!-- SKILLS -->
    ${(app.user_skills??[]).length ? sec('Skills', `<div style="margin-top:-2px">${(app.user_skills??[]).map(chip).join('')}</div>`) : ''}

    <!-- ACHIEVEMENTS -->
    ${flex.ach.length ? sec('Achievements', achHTML) : ''}

    <!-- CERTIFICATES -->
    ${flex.certs.length ? sec('Certificates', certHTML) : ''}

  </div>

  <!-- ═══ PAGE 2: SCREENING ═══ -->
  ${Object.keys(answers).length ? `
  <div class="page-break"></div>
  <div style="max-width:680px;margin:0 auto;padding:36px 0">

    <!-- Screening header -->
    <div style="padding-bottom:20px;border-bottom:2px solid #FF5C28;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-size:9px;font-weight:800;letter-spacing:.14em;color:#FF5C28;text-transform:uppercase">tiikme.com</span>
        <span style="font-size:9px;color:#A1A0A4">Screening answers</span>
      </div>
      <h2 style="font-size:18px;font-weight:800;color:#1B1B1D">${app.user_full_name ?? app.user_username} — Screening</h2>
      <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:8px">
        <span style="font-size:11px;color:#6E6E73">Applied ${fmtDate(app.applied_at)}</span>
        ${typeof app.ai_score==='number'?`<span style="font-size:11px;font-weight:700;color:#FF5C28">${Math.round(app.ai_score)}% match</span>`:''}
        ${typeof app.knockout_passed==='boolean'?`<span style="font-size:11px;font-weight:600;color:${app.knockout_passed?'#2FB866':'#FF4D4D'}">${app.knockout_passed?'✓ Knockout passed':'✕ Knockout failed'}</span>`:''}
      </div>
      ${matchBrief ? `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-top:10px;padding:10px 14px;background:#F6F5F2;border-radius:10px">${matchBrief}</div>` : ''}
    </div>

    <!-- Q&A -->
    <div>
      ${Object.entries(answers).map(([q, a], i) => `
        <div style="padding:${i===0?'0':'18px'} 0 18px;${i>0?'border-top:1px solid #F0EFEC':''}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#FFF3EE;border:1.5px solid #FF5C28;text-align:center;line-height:18px;font-size:9px;font-weight:800;color:#FF5C28;flex-shrink:0">${i+1}</span>
            <span style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#A1A0A4">${answerType(a)}</span>
          </div>
          <p style="font-size:12px;font-weight:600;color:#1B1B1D;line-height:1.5;margin-bottom:6px">${q}</p>
          <p style="font-size:13px;font-weight:700;color:#FF5C28;margin:0">${String(a)}</p>
        </div>`).join('')}
    </div>

  </div>` : ''}

  </body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }, 300)
}

export default function LiveCandidateDrawer({ app, onClose, onMoved }: Props) {
  const [flex, setFlex]           = useState<FlexData | null>(null)
  const [visible, setVisible]     = useState(false)
  const [drawerTab, setDrawerTab] = useState<'flex' | 'answers'>('flex')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!app.user_id) return
    const sb = createClient()
    Promise.all([
      listExperiences(app.user_id),
      listEducation(app.user_id),
      listCerts(app.user_id),
      listAchievements(app.user_id),
      sb.from('profiles').select('about,open_to_work').eq('id', app.user_id).single(),
    ]).then(([exp, edu, certs, ach, { data: profile }]) => {
      const p = profile as { about: string | null; open_to_work: boolean } | null
      setFlex({
        exp, edu, certs, ach,
        about: p?.about ?? null,
        openToWork: p?.open_to_work ?? false,
      })
    })
  }, [app.user_id])

  const close = () => { setVisible(false); setTimeout(onClose, 220) }

  const move = async (s: Stage) => {
    const ok = await advanceStage(app.app_id, s)
    if (ok) { toast(`${app.user_full_name ?? app.user_username} → ${STAGE_LABEL[s]}`); onMoved(); close() }
  }

  const adv = NEXT_STAGE[app.stage]
  const answers = (app.screening_answers ?? {}) as Record<string, unknown>
  const userSkills = app.user_skills ?? []

  const hasAnyFlex = flex !== null && (
    !!flex.about || userSkills.length > 0 ||
    flex.exp.length > 0 || flex.edu.length > 0 ||
    flex.certs.length > 0 || flex.ach.length > 0
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
        onClick={close}
      />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[101] bg-card border-t border-line rounded-t-[24px] shadow-[0_-8px_40px_-4px_rgba(0,0,0,.25)] flex flex-col"
        style={{
          height: '88vh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Drag handle + close */}
        <div className="relative flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-9 h-1 bg-line rounded-full" />
          <button onClick={close} className="absolute right-4 top-2 text-ink-3 hover:text-orange transition-colors text-[18px] p-1">✕</button>
        </div>

        {/* Tab bar */}
        <div className="px-5 pt-2 pb-0 border-b border-line shrink-0">
          <div className="flex items-center gap-0">
            <button
              onClick={() => setDrawerTab('flex')}
              className={['text-[12.5px] font-semibold px-4 py-2.5 border-b-2 transition-colors', drawerTab === 'flex' ? 'border-orange text-ink' : 'border-transparent text-ink-3 hover:text-ink'].join(' ')}
            >Flex</button>
            <button
              onClick={() => setDrawerTab('answers')}
              className={['text-[12.5px] font-semibold px-4 py-2.5 border-b-2 transition-colors inline-flex items-center gap-1.5', drawerTab === 'answers' ? 'border-orange text-ink' : 'border-transparent text-ink-3 hover:text-ink'].join(' ')}
            >
              Screening
              {typeof app.ai_score === 'number' && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  app.ai_score >= 85 ? 'bg-green/10 text-green'
                  : app.ai_score >= 70 ? 'bg-orange-soft text-orange'
                  : 'bg-page text-ink-3 border border-line'}`}>
                  {Math.round(app.ai_score)}%
                </span>
              )}
            </button>
            <div className="ml-auto flex items-center gap-1">
              {/* Open the candidate's public Flex page — same UI as /flex/username */}
              <a
                href={`/flex/${app.user_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-ink-3 hover:text-orange transition-colors flex items-center gap-1 px-2.5 py-2 mb-[2px]"
                title="View full Flex page"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Flex
              </a>
              {flex !== null && (
                <button
                  onClick={() => printFlexPDF(flex, app, answers)}
                  className="text-[11px] font-semibold text-ink-3 hover:text-orange transition-colors flex items-center gap-1 px-2.5 py-2 mb-[2px]"
                  title="Download as PDF"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ══ FLEX TAB ══ */}
          {drawerTab === 'flex' && (
            <>
              {flex === null && (
                <p className="text-[11.5px] text-ink-3 italic py-4">Loading Flex…</p>
              )}

              {flex !== null && !hasAnyFlex && (
                <div className="text-center py-10">
                  <p className="text-[13px] font-semibold text-ink">No Flex data yet</p>
                  <p className="text-[12px] text-ink-3 mt-1">This candidate hasn&apos;t filled in their Flex profile.</p>
                </div>
              )}

              {flex !== null && hasAnyFlex && (
                <div id="flex-print-zone">
                  {/* Hero card — mirrors MyFlexView hero */}
                  <div className="rounded-[16px] border border-line bg-card p-5 relative overflow-hidden">
                    <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                         style={{ background: 'radial-gradient(circle, rgba(255,92,40,.12), transparent 65%)', filter: 'blur(20px)' }} />
                    <div className="relative flex items-start gap-4">
                      <div className="w-[64px] h-[64px] rounded-[16px] bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white text-[22px] font-black shrink-0 overflow-hidden">
                        {app.user_avatar
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={app.user_avatar} alt="" className="w-full h-full object-cover" />
                          : (app.user_full_name ?? app.user_username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-[18px] font-black text-ink leading-tight">{app.user_full_name ?? app.user_username}</h2>
                          {flex.openToWork && (
                            <span className="text-[10px] font-bold text-green bg-green/10 border border-green/20 px-2 py-0.5 rounded-full">Open to work</span>
                          )}
                        </div>
                        <p className="text-[13px] text-ink-2 mt-1 leading-snug">{app.user_headline ?? ''}</p>
                        {app.user_city && <p className="text-[11.5px] text-ink-3 mt-0.5">📍 {app.user_city}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {app.applicant_email && (
                            <a href={`mailto:${app.applicant_email}?subject=${encodeURIComponent('About your application to ' + app.job_title)}`}
                               className="text-[11px] font-medium text-ink-2 inline-flex items-center gap-1 hover:text-orange transition-colors">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>
                              {app.applicant_email}
                            </a>
                          )}
                          {app.applicant_phone && (
                            <a href={`tel:${app.applicant_phone.replace(/[^0-9+]/g,'')}`}
                               className="text-[11px] font-medium text-ink-2 hover:text-orange transition-colors">
                              {app.applicant_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  {flex.about && (
                    <div className="rounded-[16px] border border-line bg-card p-5">
                      <p className="text-[15px] font-bold text-ink mb-1">About</p>
                      <p className="text-[13px] text-ink-2 leading-relaxed">{flex.about}</p>
                    </div>
                  )}

                  {/* Work Experience */}
                  {flex.exp.length > 0 && (
                    <div className="rounded-[16px] border border-line bg-card p-5">
                      <p className="text-[15px] font-bold text-ink mb-1">Work Experience</p>
                      {flex.exp.map((e, i) => (
                        <div key={e.id} className={`flex gap-4 pt-4 ${i < flex.exp.length - 1 ? 'border-b border-line pb-4' : ''}`}>
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-9 h-9 rounded-[10px] bg-orange/10 flex items-center justify-center text-orange font-bold text-[15px]">
                              {e.company.charAt(0)}
                            </div>
                            {i < flex.exp.length - 1 && <div className="w-px flex-1 bg-line mt-2" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-ink">{e.role}</p>
                            <p className="text-[12px] text-ink-2">
                              {e.company}
                              {e.empType && <span className="text-ink-3"> · {e.empType}</span>}
                            </p>
                            <p className="text-[11px] text-ink-3 mt-0.5">
                              {e.startMonth ? `${MONTHS[+e.startMonth - 1]} ` : ''}{e.startYear} – {e.currentlyWorking ? 'Present' : `${e.endMonth ? `${MONTHS[+e.endMonth - 1]} ` : ''}${e.endYear}`}
                              {e.location && ` · ${e.location}`}
                            </p>
                            {e.description && (
                              <ExpandableText text={e.description} />
                            )}
                            {e.skillsUsed.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {e.skillsUsed.map(s => (
                                  <span key={s} className="text-[10px] font-medium text-ink-2 bg-line px-2 py-0.5 rounded-full">{s}</span>
                                ))}
                              </div>
                            )}
                            <ReadOnlySquad squad={e.squad} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {flex.edu.length > 0 && (
                    <div className="rounded-[16px] border border-line bg-card p-5">
                      <p className="text-[15px] font-bold text-ink mb-1">Education</p>
                      {flex.edu.map((e, i) => (
                        <div key={e.id} className={`flex gap-4 pt-4 ${i < flex.edu.length - 1 ? 'border-b border-line pb-4' : ''}`}>
                          <div className="w-9 h-9 rounded-[10px] bg-purple/10 flex items-center justify-center text-purple font-bold text-[15px] shrink-0">
                            {e.institution.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-ink">{e.institution}</p>
                            <p className="text-[12px] text-ink-2">
                              {e.degree}{e.field && ` · ${e.field}`}
                            </p>
                            <p className="text-[11px] text-ink-3 mt-0.5">
                              {e.startYear} – {e.endYear}{e.grade && ` · GPA ${e.grade}`}
                            </p>
                            <ReadOnlySquad squad={e.squad} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {userSkills.length > 0 && (
                    <div className="rounded-[16px] border border-line bg-card p-5">
                      <p className="text-[15px] font-bold text-ink mb-3">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {userSkills.map(s => (
                          <span key={s} className="inline-flex items-center text-[12px] font-medium text-teal bg-teal/8 border border-teal/15 px-3 py-1.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {flex.ach.length > 0 && (
                    <div className="rounded-[16px] border border-line bg-card p-5">
                      <p className="text-[15px] font-bold text-ink mb-1">Achievements</p>
                      {flex.ach.map(a => (
                        <div key={a.id} className="flex gap-3 py-3 border-b border-line last:border-0">
                          <span className="text-lg leading-none mt-0.5">🏆</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-ink">{a.title}</p>
                            {a.description && <p className="text-[12px] text-ink-2 mt-0.5">{a.description}</p>}
                            <ReadOnlySquad squad={a.squad} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certificates */}
                  {flex.certs.length > 0 && (
                    <div className="rounded-[16px] border border-line bg-card p-5">
                      <p className="text-[15px] font-bold text-ink mb-1">Certificates</p>
                      {flex.certs.map(c => (
                        <div key={c.id} className="flex gap-3 py-3 border-b border-line last:border-0">
                          <div className="w-9 h-9 rounded-[10px] bg-amber/15 flex items-center justify-center shrink-0">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-ink">{c.name}</p>
                            <p className="text-[11px] text-ink-3">{c.issuer}{c.year && ` · ${c.year}`}</p>
                            <ReadOnlySquad squad={c.squad} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══ SCREENING TAB ══ */}
          {drawerTab === 'answers' && (() => {
            const jobScreening = (app.job_screening ?? []) as Array<{ q: string; kind: string; expected?: string; must_have?: boolean }>
            const answerValues = Object.values(answers)
            // Build rows: question text from job, answer matched by exact key or by position
            const qaRows = jobScreening.map((sq, i) => ({
              question: sq.q,
              kind:     sq.kind,
              must_have: sq.must_have,
              answer:   answers[sq.q] ?? answerValues[i] ?? undefined,
            }))
            // Skills keyword match
            const mustHave    = app.job_must_have_skills ?? []
            const skillsLower = (app.user_skills ?? []).map(s => s.toLowerCase())
            const matched     = mustHave.filter(s => skillsLower.includes(s.toLowerCase()))
            const missing     = mustHave.filter(s => !skillsLower.includes(s.toLowerCase()))
            const bd          = (app.match_breakdown ?? {}) as Record<string, number>
            const hasQuestions = qaRows.length > 0

            return (
              <>
                {/* Score + keyword match card */}
                {(mustHave.length > 0 || Object.keys(bd).length > 0) && (
                  <div className="rounded-[16px] border border-line bg-card p-4 space-y-3">
                    {/* Overall score + breakdown */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[22px] font-black text-orange leading-none">
                          {typeof app.ai_score === 'number' ? `${Math.round(app.ai_score)}%` : '—'}
                        </span>
                        <div>
                          <p className="text-[11px] font-bold text-ink">Match score</p>
                          <p className="text-[10px] text-ink-3">AI-computed against job requirements</p>
                        </div>
                      </div>
                      {typeof app.knockout_passed === 'boolean' && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${app.knockout_passed ? 'bg-green/10 text-green border border-green/20' : 'bg-red/8 text-red border border-red/20'}`}>
                          {app.knockout_passed ? '✓ Must-haves met' : '✕ Must-have missing'}
                        </span>
                      )}
                    </div>
                    {/* Score breakdown pills */}
                    {Object.keys(bd).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(bd).sort(([,a],[,b]) => (b as number)-(a as number)).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-semibold bg-page border border-line rounded-full px-2.5 py-0.5 text-ink-2">
                            {k.charAt(0).toUpperCase()+k.slice(1)} <span className="font-black text-ink">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Keyword chips */}
                    {mustHave.length > 0 && (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {matched.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 text-[11px] font-semibold text-green bg-green/8 border border-green/20 rounded-full px-2.5 py-0.5">
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              {s}
                            </span>
                          ))}
                          {missing.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 text-[11px] font-semibold text-red/70 bg-red/5 border border-red/15 rounded-full px-2.5 py-0.5">
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="h-1.5 rounded-full bg-line overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green to-teal rounded-full"
                               style={{ width: `${mustHave.length > 0 ? Math.round((matched.length/mustHave.length)*100) : 0}%` }} />
                        </div>
                        <p className="text-[10px] text-ink-3">{matched.length}/{mustHave.length} required skills matched</p>
                      </>
                    )}
                  </div>
                )}

                {/* Q&A */}
                {hasQuestions ? (
                  <div className="space-y-3">
                    {qaRows.map((row, i) => (
                      <div key={i} className="rounded-[14px] border border-line bg-card p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full bg-page border border-line text-[9px] font-bold text-ink-3 flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                          <p className="text-[12px] font-semibold text-ink leading-snug">{row.question}</p>
                        </div>
                        <p className={`text-[13px] font-semibold pl-7 ${row.answer !== undefined ? 'text-orange' : 'text-ink-3 italic'}`}>
                          {row.answer !== undefined ? String(row.answer) : 'Not answered'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : Object.keys(answers).length > 0 ? (
                  // Legacy: answers stored without job_screening metadata
                  <div className="space-y-3">
                    {Object.entries(answers).map(([q, a], i) => (
                      <div key={q} className="rounded-[14px] border border-line bg-card p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full bg-page border border-line text-[9px] font-bold text-ink-3 flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                          <p className="text-[12px] font-semibold text-ink leading-snug">{q}</p>
                        </div>
                        <p className="text-[13px] font-semibold text-orange pl-7">{String(a)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-[13px] font-semibold text-ink">No screening questions</p>
                    <p className="text-[12px] text-ink-3 mt-1">This role had no screening questions set up.</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-3.5 border-t border-line flex items-center gap-2 shrink-0">
          <div className="flex-1" />
          {adv && (
            <button onClick={() => move(adv.next)}
              className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] py-2.5 px-6 hover:opacity-95 transition-opacity">
              {adv.label} →
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* Squad row — only verified members, no edit interaction */
function ReadOnlySquad({ squad }: { squad: AttachableSquad }) {
  const verified = squad.members.filter(m => m.status === 'verified')
  if (verified.length === 0) return null
  return (
    <div className="flex items-center gap-2 mt-2">
      <AvatarStack members={verified} />
      <span className="text-[11px] font-semibold text-green">
        {verified.length} verified {squad.teamLabel?.replace(/^\d+\s/, '') ?? 'teammates'}
      </span>
    </div>
  )
}

/* Description with expand/collapse at 160 chars */
function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= 160) {
    return <p className="text-[12px] text-ink-2 leading-relaxed mt-1.5">{text}</p>
  }
  return (
    <p className="text-[12px] text-ink-2 leading-relaxed mt-1.5">
      {!expanded
        ? <>{text.slice(0, 160)}<button onClick={() => setExpanded(true)} className="font-semibold text-orange hover:text-orange-2 transition-colors">…more</button></>
        : <>{text}<button onClick={() => setExpanded(false)} className="font-semibold text-orange hover:text-orange-2 transition-colors ml-1">less</button></>
      }
    </p>
  )
}
