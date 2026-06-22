'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hydrateFlexFromOnboarding } from '@/lib/flexFromDraft'
import {
  listExperiences, addExperience, deleteExperience,
  listEducation,   addEducation,   deleteEducation,
  listCerts,       addCert,        deleteCert,
  listAchievements,addAchievement, deleteAchievement,
} from '@/lib/flex'
import type { Profile } from '@/lib/types'
import type { ExperienceEntry, EducationEntry, AchievementEntry, CertEntry, AttachableSquad, CustomSection, CustomSectionItem, UserRole } from '@/lib/profileTypes'
import { emptySquad } from '@/lib/profileTypes'
import { Card, Avatar, AvatarStack, EmptyState } from '@/components/profile/ui/Primitives'
import { RoleLine } from '@/components/profile/ui/RoleBadges'
import { toast } from '@/components/profile/ui/Toast'
import SquadAttachModal from '@/components/profile/modals/SquadAttachModal'
import ShareFlexModal from '@/components/profile/modals/ShareFlexModal'
import FirstVisitHint from '@/components/ui/FirstVisitHint'

interface Props { profile: Profile; roles: UserRole[]; onEditProfile: () => void }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const YEARS = Array.from({length:36},(_,i)=>(2026-i).toString())
const fmtMonthYear = (month: string | null | undefined, year: string | null | undefined) => {
  const y = year ?? ''
  const idx = month ? +month - 1 : -1
  const m = idx >= 0 && idx < 12 ? MONTHS[idx] + ' ' : ''
  return m + y
}
const EMP_TYPES = ['Full-time','Part-time','Freelance','Contract','Internship']
const LOC_TYPES: {v:'remote'|'onsite'|'hybrid';l:string}[] = [{v:'remote',l:'🌐 Remote'},{v:'onsite',l:'🏢 On-site'},{v:'hybrid',l:'🔄 Hybrid'}]

const inp = 'w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange transition-colors'
const sel = inp + ' appearance-none cursor-pointer'
const saveB = 'px-4 py-2 bg-orange text-white text-[12px] font-semibold rounded-[10px] hover:bg-orange-2 transition-colors disabled:opacity-50'
const cancelB = 'px-4 py-2 bg-line text-ink-2 text-[12px] font-medium rounded-[10px] hover:bg-line/80 transition-colors'

export default function MyFlexView({ profile, roles, onEditProfile }: Props) {
  const displayName = profile.full_name ?? profile.username

  // about (editable inline)
  const [about, setAbout] = useState(profile.about ?? '')
  const [aboutEdit, setAboutEdit] = useState(false)

  const [skills, setSkills] = useState<string[]>(profile.skills ?? [])
  const [newSkill, setNewSkill] = useState('')

  const [exps, setExps] = useState<ExperienceEntry[]>([])
  const [edus, setEdus] = useState<EducationEntry[]>([])
  const [achs, setAchs] = useState<AchievementEntry[]>([])
  const [certs, setCerts] = useState<CertEntry[]>([])
  const [customs, setCustoms] = useState<CustomSection[]>([])
  const [keywords, setKeywords] = useState<string[]>(profile.skills?.slice(0, 8) ?? [])
  const [newKw, setNewKw] = useState('')

  const [expForm, setExpForm] = useState(false)
  const [eduForm, setEduForm] = useState(false)
  const [achForm, setAchForm] = useState(false)
  const [certForm, setCertForm] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [addSectionOpen, setAddSectionOpen] = useState(false)

  // which sections are in "manage" (delete) mode
  const [manage, setManage] = useState<Record<string,boolean>>({})
  const toggleManage = (k:string) => setManage(m=>({...m,[k]:!m[k]}))

  // ── Hydrate from Supabase, then overlay any onboarding-draft entries ──
  useEffect(() => {
    (async () => {
      const [dbExps, dbEdus, dbCerts, dbAchs] = await Promise.all([
        listExperiences(profile.id),
        listEducation(profile.id),
        listCerts(profile.id),
        listAchievements(profile.id),
      ])
      setExps(dbExps); setEdus(dbEdus); setCerts(dbCerts); setAchs(dbAchs)

      const h = hydrateFlexFromOnboarding()
      if (!h) return
      if (h.about && !about) setAbout(h.about)
      if (h.skills.length && skills.length === 0) setSkills(h.skills)
      // Inject draft entries only when DB has nothing. Deduplicate by role+company
      // to prevent the same entry appearing twice if onboarding saved to both DB and localStorage.
      if (h.experiences.length && dbExps.length === 0) setExps(h.experiences)
      else if (h.experiences.length && dbExps.length > 0) {
        // Merge: add any draft entry that doesn't already exist in DB (by role+company match)
        const dbKeys = new Set(dbExps.map(e => `${e.role}|${e.company ?? ''}`))
        const novel = h.experiences.filter(e => !dbKeys.has(`${e.role}|${e.company ?? ''}`))
        if (novel.length) setExps(prev => [...prev, ...novel])
      }
      if (h.educations.length  && dbEdus.length === 0) setEdus(h.educations)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const saveExp = async (d: ExperienceEntry) => {
    const id = await addExperience(d)
    if (!id) { toast('Could not save experience'); return }
    setExps(p => [{ ...d, id }, ...p]); setExpForm(false); toast('Experience added ✓')
  }
  const saveEdu = async (d: EducationEntry) => {
    const id = await addEducation(d)
    if (!id) { toast('Could not save education'); return }
    setEdus(p => [{ ...d, id }, ...p]); setEduForm(false); toast('Education added ✓')
  }
  const saveCert = async (d: CertEntry) => {
    const id = await addCert(d)
    if (!id) { toast('Could not save certificate'); return }
    setCerts(p => [{ ...d, id }, ...p]); setCertForm(false); toast('Certificate added ✓')
  }
  const saveAch = async (d: AchievementEntry) => {
    const id = await addAchievement(d)
    if (!id) { toast('Could not save achievement'); return }
    setAchs(p => [{ ...d, id }, ...p]); setAchForm(false); toast('Achievement added ✓')
  }
  const removeExp  = async (id: string) => { if (await deleteExperience(id))  setExps(p  => p.filter(x => x.id !== id)) }
  const removeEdu  = async (id: string) => { if (await deleteEducation(id))   setEdus(p  => p.filter(x => x.id !== id)) }
  const removeCert = async (id: string) => { if (await deleteCert(id))        setCerts(p => p.filter(x => x.id !== id)) }
  const removeAch  = async (id: string) => { if (await deleteAchievement(id)) setAchs(p  => p.filter(x => x.id !== id)) }

  const [squadTarget, setSquadTarget] = useState<null | { kind:'experience'|'education'|'certificate'|'achievement'; id:string; context:string; current:AttachableSquad }>(null)

  const saveAbout = async () => {
    setAboutEdit(false)
    await createClient().from('profiles').update({ about }).eq('id', profile.id)
    toast('About saved')
  }
  const saveSkill = async () => {
    const s = newSkill.trim(); if(!s) return
    const u = [...skills,s]; setSkills(u); setNewSkill('')
    await createClient().from('profiles').update({ skills:u }).eq('id', profile.id)
  }

  const applySquad = (squad: AttachableSquad) => {
    if (!squadTarget) return
    const { kind, id } = squadTarget
    // members are pending until they approve — that's fine, only verified render
    if (kind==='experience')  setExps(p=>p.map(e=>e.id===id?{...e,squad}:e))
    if (kind==='education')   setEdus(p=>p.map(e=>e.id===id?{...e,squad}:e))
    if (kind==='achievement') setAchs(p=>p.map(e=>e.id===id?{...e,squad}:e))
    if (kind==='certificate') setCerts(p=>p.map(e=>e.id===id?{...e,squad}:e))
    const pending = squad.members.filter(m=>m.status==='pending').length
    if (pending>0) toast(`Requests sent to ${pending} — they’ll appear once confirmed`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink leading-tight">My Flex</h1>
          <FirstVisitHint id="my-flex"><p className="text-[12px] text-ink-3 mt-1">Your living resume — verified by people you worked with. Only confirmed peers show here.</p></FirstVisitHint>
        </div>
        <button onClick={()=>setShareOpen(true)} className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-orange hover:bg-orange-2 rounded-[12px] px-4 py-2.5 transition-colors shrink-0"
          style={{boxShadow:'0 2px 8px -2px rgba(255,92,40,.4),inset 0 1px 0 rgba(255,255,255,.18)'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share My Flex
        </button>
      </div>

      {/* Proof of Work trust summary — always visible once any squad data exists */}
      {(() => {
        const totalSquad = [...exps, ...edus, ...achs, ...certs]
          .flatMap(e => e.squad.members.filter(m => m.status === 'verified')).length
        const verifiedSkillCount = skills.filter(s =>
          exps.some(e => e.squad.members.some(m => m.status === 'verified') && e.skillsUsed.includes(s))
        ).length
        if (totalSquad === 0 && verifiedSkillCount === 0) return null
        return (
          <div className="flex items-center gap-3 px-4 py-3 bg-green/6 border border-green/18 rounded-[14px]">
            <div className="w-8 h-8 rounded-[10px] bg-green/15 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-green leading-tight">Proof of Work active</p>
              <p className="text-[11px] text-ink-3 mt-0.5 leading-tight">
                {totalSquad} Squad confirmation{totalSquad !== 1 ? 's' : ''} · {verifiedSkillCount} verified skill{verifiedSkillCount !== 1 ? 's' : ''}
              </p>
            </div>
            <span className="text-[20px] font-bold text-green/40 leading-none shrink-0">{verifiedSkillCount}</span>
          </div>
        )
      })()}

      {/* Hero — desktop only. Mobile profile header already shows name/role/edit. */}
      <Card className="hidden lg:block p-6">
        <div className="flex items-center gap-5">
          <Avatar name={displayName} src={profile.avatar_url} size={72} />
          <div className="flex-1 min-w-0">
            <h2 className="text-[19px] font-bold text-ink leading-tight">{displayName}</h2>
            {roles.length > 0 && <div className="mt-1.5"><RoleLine roles={roles} /></div>}
            {profile.headline && <p className="text-[12px] text-ink-3 mt-1.5">{profile.headline}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {profile.open_to_work && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green bg-green/10 border border-green/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green"/>Open to work</span>}
              {[profile.location_city, profile.location_state].filter(Boolean).join(', ') && (
                <span className="text-[11px] text-ink-3 flex items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{[profile.location_city, profile.location_state].filter(Boolean).join(', ')}</span>
              )}
            </div>
          </div>
          <EditPencil onClick={onEditProfile} />
        </div>
      </Card>

      {/* About — with pencil */}
      <Card className="p-5">
        <SectionHead title="About" onEdit={()=>setAboutEdit(v=>!v)} />
        {aboutEdit ? (
          <div className="mt-2 space-y-2">
            <textarea value={about} onChange={e=>setAbout(e.target.value)} rows={4} placeholder="Tell your story…" className={`${inp} resize-none`} />
            <div className="flex gap-2"><button onClick={saveAbout} className={saveB}>Save</button><button onClick={()=>setAboutEdit(false)} className={cancelB}>Cancel</button></div>
          </div>
        ) : about ? <p className="text-[13px] text-ink-2 leading-relaxed mt-1">{about}</p>
          : <p className="text-[12px] text-ink-3 italic mt-1">Tell your story — who you are, what you build, what drives you.</p>}
      </Card>

      {/* Experience */}
      <Card className="p-5">
        <SectionHead title="Work Experience" onAdd={()=>setExpForm(true)} onEdit={exps.length?()=>toggleManage('exp'):undefined} managing={manage.exp} />
        {exps.length===0 && !expForm && <EmptyState icon={brief} title="Add your first role" body="Recruiters spend 80% of time here. Add a job, then verify it with teammates." cta="+ Add experience" onCta={()=>setExpForm(true)} />}
        {exps.map((e,i)=><ExpRow key={e.id} e={e} last={i===exps.length-1&&!expForm} manage={manage.exp} onDelete={()=>removeExp(e.id)} onSquad={()=>setSquadTarget({kind:'experience',id:e.id,context:e.company,current:e.squad})} />)}
        {expForm && <ExperienceForm onCancel={()=>setExpForm(false)} onSave={saveExp} />}
      </Card>

      {/* Education */}
      <Card className="p-5">
        <SectionHead title="Education" onAdd={()=>setEduForm(true)} onEdit={edus.length?()=>toggleManage('edu'):undefined} managing={manage.edu} />
        {edus.length===0 && !eduForm && <EmptyState icon={cap} title="Where did you study?" body="Add your school, then connect with classmates already on tiikme." cta="+ Add education" onCta={()=>setEduForm(true)} />}
        {edus.map((e,i)=><EduRow key={e.id} e={e} last={i===edus.length-1&&!eduForm} manage={manage.edu} onDelete={()=>removeEdu(e.id)} onSquad={()=>setSquadTarget({kind:'education',id:e.id,context:e.institution,current:e.squad})} />)}
        {eduForm && <EducationForm onCancel={()=>setEduForm(false)} onSave={saveEdu} />}
      </Card>

      {/* Skills — verified / self-reported split */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-bold text-ink">Skills</p>
          {/* Live trust count */}
          {skills.length > 0 && (() => {
            const verifiedSet = new Set(
              exps.flatMap(e =>
                e.squad.members.some(m => m.status === 'verified') ? e.skillsUsed : []
              )
            )
            const vCount = skills.filter(s => verifiedSet.has(s)).length
            return vCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green bg-green/8 border border-green/20 px-2 py-1 rounded-full">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {vCount} verified by Squad
              </span>
            ) : null
          })()}
        </div>
        {skills.length > 0 && (() => {
          const verifiedSet = new Set(
            exps.flatMap(e =>
              e.squad.members.some(m => m.status === 'verified') ? e.skillsUsed : []
            )
          )
          const verified = skills.filter(s => verifiedSet.has(s))
          const selfReported = skills.filter(s => !verifiedSet.has(s))
          return (
            <div className="space-y-3 mb-3">
              {verified.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-green mb-1.5">Verified by Squad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {verified.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green bg-green/8 border border-green/20 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
                        {s}
                        <button onClick={() => setSkills(p => p.filter(x => x !== s))} className="text-green/50 hover:text-red transition-colors ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selfReported.length > 0 && (
                <div>
                  {verified.length > 0 && <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-3 mb-1.5">Self-reported</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {selfReported.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal bg-teal/8 border border-teal/15 px-3 py-1.5 rounded-full">
                        {s}
                        <button onClick={() => setSkills(p => p.filter(x => x !== s))} className="text-ink-3 hover:text-red transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
        <div className="flex gap-2"><input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveSkill()}} placeholder="Add a skill (press Enter)…" className={`${inp} flex-1`} /><button onClick={saveSkill} disabled={!newSkill.trim()} className={saveB}>Add</button></div>
      </Card>

      {/* Achievements */}
      <Card className="p-5">
        <SectionHead title="Achievements" onAdd={()=>setAchForm(true)} onEdit={achs.length?()=>toggleManage('ach'):undefined} managing={manage.ach} />
        {achs.length===0 && !achForm && <EmptyState icon={trophy} title="Flex your wins" body="Hackathon wins, awards, launches. Tag the crew you won them with." cta="+ Add achievement" onCta={()=>setAchForm(true)} />}
        {achs.map(a=>(
          <div key={a.id} className="flex gap-3 py-3 border-b border-line last:border-0">
            <span className="text-lg leading-none mt-0.5">🏆</span>
            <div className="flex-1"><p className="text-[13px] font-bold text-ink">{a.title}</p>{a.description && <p className="text-[12px] text-ink-2 mt-0.5">{a.description}</p>}<SquadLine squad={a.squad} onClick={()=>setSquadTarget({kind:'achievement',id:a.id,context:a.title,current:a.squad})} /></div>
            {manage.ach && <DeleteBtn onClick={()=>removeAch(a.id)} />}
          </div>
        ))}
        {achForm && <AchForm onCancel={()=>setAchForm(false)} onSave={saveAch} />}
      </Card>

      {/* Certificates */}
      <Card className="p-5">
        <SectionHead title="Certificates" onAdd={()=>setCertForm(true)} onEdit={certs.length?()=>toggleManage('cert'):undefined} managing={manage.cert} />
        {certs.length===0 && !certForm && <EmptyState icon={doc} title="Add credentials" body="Certs and courses build trust. Connect with your cohort to verify." cta="+ Add certificate" onCta={()=>setCertForm(true)} />}
        {certs.map(c=>(
          <div key={c.id} className="flex gap-3 py-3 border-b border-line last:border-0">
            <div className="w-9 h-9 rounded-[10px] bg-amber/15 flex items-center justify-center shrink-0"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
            <div className="flex-1"><p className="text-[13px] font-bold text-ink">{c.name}</p><p className="text-[11px] text-ink-3">{c.issuer} · {c.year}</p><SquadLine squad={c.squad} onClick={()=>setSquadTarget({kind:'certificate',id:c.id,context:c.issuer,current:c.squad})} /></div>
            {manage.cert && <DeleteBtn onClick={()=>removeCert(c.id)} />}
          </div>
        ))}
        {certForm && <CertForm onCancel={()=>setCertForm(false)} onSave={saveCert} />}
      </Card>

      {customs.map(sec => (
        <CustomSectionCard
          key={sec.id}
          sec={sec}
          onRemove={() => setCustoms(cs => cs.filter(x => x.id !== sec.id))}
          onAddItem={(item) => setCustoms(cs => cs.map(x => x.id === sec.id
            ? { ...x, items: [...x.items, { id: Date.now().toString(), ...item }] }
            : x))}
        />
      ))}

      {/* Keywords */}
      <Card className="p-5">
        <p className="text-[15px] font-bold text-ink mb-1">Keywords</p>
        <p className="text-[11px] text-ink-3 mb-3">Used by AI to match you to jobs &amp; pass recruiter ATS filters.</p>
        <div className="flex flex-wrap gap-2 mb-3">{keywords.map(k=><span key={k} className="inline-flex items-center gap-1 text-[11px] font-medium text-purple bg-purple/8 border border-purple/15 px-2.5 py-1 rounded-full">#{k}<button onClick={async()=>{const u=keywords.filter(x=>x!==k);setKeywords(u);await createClient().from('profiles').update({skills:u}).eq('id',profile.id)}} className="text-ink-3 hover:text-red transition-colors">×</button></span>)}</div>
        <div className="flex gap-2"><input value={newKw} onChange={e=>setNewKw(e.target.value)} onKeyDown={async e=>{if(e.key==='Enter'){const k=newKw.trim().toLowerCase();if(k&&!keywords.includes(k)){const u=[...keywords,k];setKeywords(u);setNewKw('');await createClient().from('profiles').update({skills:u}).eq('id',profile.id)}else setNewKw('')}}} placeholder="Add keyword…" className={`${inp} flex-1`} /><button onClick={async()=>{const k=newKw.trim().toLowerCase();if(k&&!keywords.includes(k)){const u=[...keywords,k];setKeywords(u);setNewKw('');await createClient().from('profiles').update({skills:u}).eq('id',profile.id)}}} disabled={!newKw.trim()} className={saveB}>Add</button></div>
      </Card>

      {/* Add custom section */}
      {addSectionOpen ? (
        <Card className="p-5">
          <AddSectionForm onCancel={()=>setAddSectionOpen(false)} onSave={(name)=>{ setCustoms(c=>[...c,{id:Date.now().toString(),name,items:[]}]); setAddSectionOpen(false); toast(`Added “${name}” section`) }} />
        </Card>
      ) : (
        <button onClick={()=>setAddSectionOpen(true)} className="w-full border-2 border-dashed border-line rounded-[16px] py-4 text-[13px] font-semibold text-ink-3 hover:text-orange hover:border-orange/40 transition-colors flex items-center justify-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add custom section (Projects, Volunteering, Languages…)
        </button>
      )}

      {squadTarget && <SquadAttachModal contextLabel={squadTarget.context} kind={squadTarget.kind} current={squadTarget.current} onClose={()=>setSquadTarget(null)} onSave={applySquad} />}
      {shareOpen && <ShareFlexModal profile={profile} onClose={()=>setShareOpen(false)} />}
    </div>
  )
}

/* ── Section head with add + edit pencil ── */
function SectionHead({ title, onAdd, onEdit, managing }: { title:string; onAdd?:()=>void; onEdit?:()=>void; managing?:boolean }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      <div className="flex items-center gap-1">
        {onEdit && <button onClick={onEdit} className={['w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors', managing?'text-orange bg-orange-soft':'text-ink-3 hover:text-ink hover:bg-page'].join(' ')} title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}
        {onAdd && <button onClick={onAdd} className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors px-1">+ Add</button>}
      </div>
    </div>
  )
}
function EditPencil({ onClick }: { onClick:()=>void }) {
  return <button onClick={onClick} title="Edit profile" className="w-9 h-9 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-page transition-colors shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
}
function DeleteBtn({ onClick }: { onClick:()=>void }) {
  return <button onClick={onClick} className="w-7 h-7 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-red hover:bg-red/5 transition-colors shrink-0" title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
}

/* ── Squad line — ONLY verified members render (pending hidden) ── */
function SquadLine({ squad, onClick }: { squad: AttachableSquad; onClick: () => void }) {
  const verified = squad.members.filter(m => m.status === 'verified')
  if (verified.length > 0) {
    return (
      <button onClick={onClick} className="flex items-center gap-2 mt-2 group">
        <AvatarStack members={verified} />
        <span className="text-[11px] font-semibold text-green group-hover:opacity-80 transition-opacity">{verified.length} verified {squad.teamLabel?.replace(/^\d+\s/,'') ?? 'teammates'}</span>
      </button>
    )
  }
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-purple hover:text-purple/80 transition-colors">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      Add your squad
    </button>
  )
}

/* ── Display rows ── */
function ExpRow({ e, last, manage, onSquad, onDelete }: { e:ExperienceEntry; last:boolean; manage?:boolean; onSquad:()=>void; onDelete:()=>void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`flex gap-4 pt-4 ${!last?'border-b border-line pb-4':''}`}>
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-[10px] bg-orange/10 flex items-center justify-center text-orange font-bold text-[15px]">{e.company.charAt(0)}</div>
        {!last && <div className="w-px flex-1 bg-line mt-2" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-ink">{e.role}</p>
        <p className="text-[12px] text-ink-2">{e.company}{e.empType && <span className="text-ink-3"> · {e.empType}</span>}</p>
        <p className="text-[11px] text-ink-3 mt-0.5">{fmtMonthYear(e.startMonth, e.startYear)} – {e.currentlyWorking ? 'Present' : fmtMonthYear(e.endMonth, e.endYear)}{e.location && ` · ${e.location}`}{e.locationType && ` · ${LOC_TYPES.find(l=>l.v===e.locationType)?.l}`}</p>
        {e.description && (
          <p className="text-[12px] text-ink-2 leading-relaxed mt-1.5">
            {!expanded && e.description.length > 160 ? (
              <>{e.description.slice(0, 160)}<button onClick={() => setExpanded(true)} className="font-semibold text-orange hover:text-orange-2 transition-colors">…more</button></>
            ) : (
              <>{e.description}{e.description.length > 160 && <button onClick={() => setExpanded(false)} className="font-semibold text-orange hover:text-orange-2 transition-colors ml-1">less</button>}</>
            )}
          </p>
        )}
        {e.skillsUsed.length>0 && <div className="flex flex-wrap gap-1 mt-2">{e.skillsUsed.map(s=><span key={s} className="text-[10px] font-medium text-ink-2 bg-line px-2 py-0.5 rounded-full">{s}</span>)}</div>}
        <SquadLine squad={e.squad} onClick={onSquad} />
      </div>
      {manage && <DeleteBtn onClick={onDelete} />}
    </div>
  )
}
function EduRow({ e, last, manage, onSquad, onDelete }: { e:EducationEntry; last:boolean; manage?:boolean; onSquad:()=>void; onDelete:()=>void }) {
  return (
    <div className={`flex gap-4 pt-4 ${!last?'border-b border-line pb-4':''}`}>
      <div className="w-9 h-9 rounded-[10px] bg-purple/10 flex items-center justify-center text-purple font-bold text-[15px] shrink-0">{e.institution.charAt(0)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-ink">{e.institution}</p>
        <p className="text-[12px] text-ink-2">{e.degree}{e.field && ` · ${e.field}`}</p>
        <p className="text-[11px] text-ink-3 mt-0.5">{e.startYear} – {e.endYear}{e.grade && ` · GPA ${e.grade}`}</p>
        <SquadLine squad={e.squad} onClick={onSquad} />
      </div>
      {manage && <DeleteBtn onClick={onDelete} />}
    </div>
  )
}

/* ── Forms (same as before) ── */
function ExperienceForm({ onSave, onCancel }: { onSave:(d:ExperienceEntry)=>void; onCancel:()=>void }) {
  const [d,setD] = useState<ExperienceEntry>({id:Date.now().toString(),role:'',company:'',empType:'Full-time',startMonth:'01',startYear:'2024',currentlyWorking:false,endMonth:'12',endYear:'2025',location:'',locationType:'onsite',description:'',aiPoints:[],skillsUsed:[],squad:emptySquad()})
  const [skillIn,setSkillIn]=useState('')
  const set=<K extends keyof ExperienceEntry>(k:K,v:ExperienceEntry[K])=>setD(p=>({...p,[k]:v}))
  return (
    <div className="mt-4 p-4 rounded-[14px] bg-page border border-line space-y-3">
      <p className="text-[12px] font-bold text-ink">New Experience</p>
      <div className="grid grid-cols-2 gap-3"><L l="Role / Title *"><input value={d.role} onChange={e=>set('role',e.target.value)} placeholder="Product Designer" className={inp}/></L><L l="Employment Type"><select value={d.empType} onChange={e=>set('empType',e.target.value)} className={sel}>{EMP_TYPES.map(t=><option key={t}>{t}</option>)}</select></L></div>
      <L l="Company *"><input value={d.company} onChange={e=>set('company',e.target.value)} placeholder="e.g. Zeta, Razorpay" className={inp}/></L>
      <div className="grid grid-cols-2 gap-3"><L l="Location"><input value={d.location} onChange={e=>set('location',e.target.value)} placeholder="Hyderabad, India" className={inp}/></L><L l="Type"><div className="flex gap-1.5">{LOC_TYPES.map(lt=><button key={lt.v} type="button" onClick={()=>set('locationType',lt.v)} className={['flex-1 text-[10px] font-medium py-2 rounded-[9px] border transition-colors',d.locationType===lt.v?'bg-orange text-white border-orange':'bg-card text-ink-2 border-line hover:border-orange/40'].join(' ')}>{lt.l}</button>)}</div></L></div>
      <L l="Start"><div className="grid grid-cols-2 gap-2"><select value={d.startMonth} onChange={e=>set('startMonth',e.target.value)} className={sel}>{MONTHS_FULL.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}</select><select value={d.startYear} onChange={e=>set('startYear',e.target.value)} className={sel}>{YEARS.map(y=><option key={y}>{y}</option>)}</select></div></L>
      <label className="flex items-center gap-2.5 cursor-pointer select-none"><div onClick={()=>set('currentlyWorking',!d.currentlyWorking)} className={['w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors',d.currentlyWorking?'bg-orange border-orange':'border-line bg-card'].join(' ')}>{d.currentlyWorking&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div><span className="text-[13px] font-medium text-ink">I currently work here</span></label>
      {!d.currentlyWorking && <L l="End"><div className="grid grid-cols-2 gap-2"><select value={d.endMonth} onChange={e=>set('endMonth',e.target.value)} className={sel}>{MONTHS_FULL.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}</select><select value={d.endYear} onChange={e=>set('endYear',e.target.value)} className={sel}>{YEARS.map(y=><option key={y}>{y}</option>)}</select></div></L>}
      <L l="Description"><textarea value={d.description} onChange={e=>set('description',e.target.value)} rows={4} placeholder="What did you do? Use bullet points to make it readable." className={`${inp} resize-none`}/></L>
      <L l="Skills used">{d.skillsUsed.length>0 && <div className="flex flex-wrap gap-1 mb-2">{d.skillsUsed.map(s=><span key={s} className="inline-flex items-center gap-1 text-[10px] text-ink-2 bg-line px-2 py-0.5 rounded-full">{s}<button type="button" onClick={()=>set('skillsUsed',d.skillsUsed.filter(x=>x!==s))} className="text-ink-3 hover:text-red">×</button></span>)}</div>}<div className="flex gap-2"><input value={skillIn} onChange={e=>setSkillIn(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const s=skillIn.trim();if(s&&!d.skillsUsed.includes(s))set('skillsUsed',[...d.skillsUsed,s]);setSkillIn('')}}} placeholder="Add skill…" className={`${inp} flex-1`}/><button type="button" onClick={()=>{const s=skillIn.trim();if(s&&!d.skillsUsed.includes(s))set('skillsUsed',[...d.skillsUsed,s]);setSkillIn('')}} className={saveB}>+</button></div></L>
      <div className="flex gap-2 pt-1"><button onClick={()=>d.role&&d.company&&onSave(d)} disabled={!d.role||!d.company} className={saveB}>Save</button><button onClick={onCancel} className={cancelB}>Cancel</button></div>
    </div>
  )
}
function EducationForm({ onSave, onCancel }: { onSave:(d:EducationEntry)=>void; onCancel:()=>void }) {
  const [d,setD]=useState<EducationEntry>({id:Date.now().toString(),institution:'',degree:'',field:'',startYear:'2020',endYear:'2024',grade:'',squad:emptySquad()})
  const set=<K extends keyof EducationEntry>(k:K,v:EducationEntry[K])=>setD(p=>({...p,[k]:v}))
  return (
    <div className="mt-4 p-4 rounded-[14px] bg-page border border-line space-y-3">
      <p className="text-[12px] font-bold text-ink">New Education</p>
      <L l="School / University *"><input value={d.institution} onChange={e=>set('institution',e.target.value)} placeholder="e.g. IIT Bombay" className={inp}/></L>
      <div className="grid grid-cols-2 gap-3"><L l="Degree *"><input value={d.degree} onChange={e=>set('degree',e.target.value)} placeholder="B.Tech" className={inp}/></L><L l="Field"><input value={d.field} onChange={e=>set('field',e.target.value)} placeholder="Computer Science" className={inp}/></L></div>
      <div className="grid grid-cols-3 gap-3"><L l="Start Year"><select value={d.startYear} onChange={e=>set('startYear',e.target.value)} className={sel}>{YEARS.map(y=><option key={y}>{y}</option>)}</select></L><L l="End Year"><select value={d.endYear} onChange={e=>set('endYear',e.target.value)} className={sel}>{YEARS.map(y=><option key={y}>{y}</option>)}</select></L><L l="GPA"><input value={d.grade} onChange={e=>set('grade',e.target.value)} placeholder="8.5" className={inp}/></L></div>
      <div className="flex gap-2"><button onClick={()=>d.institution&&d.degree&&onSave(d)} disabled={!d.institution||!d.degree} className={saveB}>Save</button><button onClick={onCancel} className={cancelB}>Cancel</button></div>
    </div>
  )
}
function AchForm({ onSave, onCancel }: { onSave:(d:AchievementEntry)=>void; onCancel:()=>void }) {
  const [d,setD]=useState<AchievementEntry>({id:Date.now().toString(),title:'',description:'',squad:emptySquad()})
  return <div className="mt-4 p-4 rounded-[14px] bg-page border border-line space-y-3"><input value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))} placeholder="Achievement title *" className={inp}/><textarea value={d.description} onChange={e=>setD(p=>({...p,description:e.target.value}))} rows={2} placeholder="The story behind the win…" className={`${inp} resize-none`}/><div className="flex gap-2"><button onClick={()=>d.title&&onSave(d)} disabled={!d.title} className={saveB}>Save</button><button onClick={onCancel} className={cancelB}>Cancel</button></div></div>
}
function CertForm({ onSave, onCancel }: { onSave:(d:CertEntry)=>void; onCancel:()=>void }) {
  const [d,setD]=useState<CertEntry>({id:Date.now().toString(),name:'',issuer:'',year:'',squad:emptySquad()})
  return <div className="mt-4 p-4 rounded-[14px] bg-page border border-line space-y-3"><input value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} placeholder="Certificate name *" className={inp}/><div className="grid grid-cols-2 gap-3"><input value={d.issuer} onChange={e=>setD(p=>({...p,issuer:e.target.value}))} placeholder="Issuer (e.g. Google)" className={inp}/><input value={d.year} onChange={e=>setD(p=>({...p,year:e.target.value}))} placeholder="Year" className={inp}/></div><div className="flex gap-2"><button onClick={()=>d.name&&onSave(d)} disabled={!d.name} className={saveB}>Save</button><button onClick={onCancel} className={cancelB}>Cancel</button></div></div>
}
function AddSectionForm({ onSave, onCancel }: { onSave:(name:string)=>void; onCancel:()=>void }) {
  const [name,setName]=useState('')
  const presets=['Projects','Volunteering','Languages','Publications','Side Hustles','Speaking']
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-bold text-ink">Name your section</p>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Projects, Volunteering, Languages…" className={inp} autoFocus />
      <div className="flex flex-wrap gap-1.5">{presets.map(p=><button key={p} onClick={()=>setName(p)} className="text-[11px] font-medium text-ink-2 bg-page border border-line px-2.5 py-1 rounded-full hover:border-orange/40 transition-colors">{p}</button>)}</div>
      <div className="flex gap-2"><button onClick={()=>name.trim()&&onSave(name.trim())} disabled={!name.trim()} className={saveB}>Create section</button><button onClick={onCancel} className={cancelB}>Cancel</button></div>
    </div>
  )
}
function L({ l, children }: { l:string; children:React.ReactNode }) { return <div><label className="block text-[10px] font-semibold text-ink-2 mb-1.5">{l}</label>{children}</div> }

function CustomSectionCard({ sec, onRemove, onAddItem }: {
  sec: CustomSection
  onRemove: () => void
  onAddItem: (item: Omit<CustomSectionItem, 'id'>) => void
}) {
  const [adding, setAdding] = useState(false)
  const [itemTitle, setItemTitle] = useState('')
  const [itemSub, setItemSub] = useState('')
  const [itemDate, setItemDate] = useState('')
  const [itemUrl, setItemUrl] = useState('')

  const reset = () => { setAdding(false); setItemTitle(''); setItemSub(''); setItemDate(''); setItemUrl('') }

  const submit = () => {
    if (!itemTitle.trim()) return
    onAddItem({ title: itemTitle.trim(), sub: itemSub.trim(), detail: '', date: itemDate.trim() || undefined, url: itemUrl.trim() || undefined })
    reset()
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[15px] font-bold text-ink">{sec.name}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setAdding(a => !a)} className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors">+ Add</button>
          <button onClick={onRemove} className="w-7 h-7 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-red hover:bg-red/5 transition-colors" title="Remove section">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
      {sec.items.length === 0 && !adding && <p className="text-[12px] text-ink-3 italic mt-1">Empty — tap &ldquo;+ Add&rdquo; to add an item.</p>}
      {sec.items.map(it => (
        <div key={it.id} className="py-2.5 border-b border-line last:border-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink">{it.title}</p>
              {it.sub && <p className="text-[12px] text-ink-2 mt-0.5">{it.sub}</p>}
              {it.date && <p className="text-[11px] text-ink-3 mt-0.5">{it.date}</p>}
            </div>
            {it.url && (
              <a href={it.url.startsWith('http') ? it.url : `https://${it.url}`} target="_blank" rel="noopener"
                className="text-[11px] font-medium text-orange hover:text-orange-2 transition-colors shrink-0 mt-0.5">
                Link ↗
              </a>
            )}
          </div>
        </div>
      ))}
      {adding && (
        <div className="mt-3 p-4 rounded-[12px] bg-page border border-line space-y-2.5">
          <input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="Title *" className={inp} autoFocus onKeyDown={e => { if (e.key === 'Enter') submit() }} />
          <input value={itemSub} onChange={e => setItemSub(e.target.value)} placeholder="Description or detail" className={inp} onKeyDown={e => { if (e.key === 'Enter') submit() }} />
          <div className="grid grid-cols-2 gap-2">
            <input value={itemDate} onChange={e => setItemDate(e.target.value)} placeholder="Date (e.g. 2024, Jan–Mar 2023)" className={inp} />
            <input value={itemUrl} onChange={e => setItemUrl(e.target.value)} placeholder="Link URL (optional)" className={inp} />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={!itemTitle.trim()} className={saveB}>Add item</button>
            <button onClick={reset} className={cancelB}>Cancel</button>
          </div>
        </div>
      )}
    </Card>
  )
}

const brief =<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
const cap = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
const trophy = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
const doc = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
