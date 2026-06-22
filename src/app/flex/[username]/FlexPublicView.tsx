'use client'

import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import type { FlexExp, FlexEdu, FlexCert, FlexAchievement } from '@/stubs/demoProfiles'

interface Props {
  profile: Profile
  experience?: FlexExp[]
  education?: FlexEdu[]
  certs?: FlexCert[]
  achievements?: FlexAchievement[]
}

export default function FlexPublicView({ profile, experience, education, certs, achievements }: Props) {
  const router = useRouter()
  const displayName = profile.full_name ?? profile.username
  const location = [profile.location_city, profile.location_state, profile.country].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page)' }}>
      {/* Top bar */}
      <div className="border-b border-line bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[720px] mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <span className="text-[16px] font-black text-orange tracking-tight">tiikme</span>
          </button>
          <button onClick={() => router.push('/sign-in')}
            className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-4 py-2 hover:opacity-95 transition-opacity">
            Join tiikme →
          </button>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 py-8 space-y-6">
        {/* Hero card */}
        <div className="rounded-[20px] border border-line bg-card p-6 relative overflow-hidden">
          <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(255,92,40,.14), transparent 65%)', filter: 'blur(24px)' }} />
          <div className="relative flex items-start gap-5">
            <div className="w-[72px] h-[72px] rounded-[18px] bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white text-[28px] font-black shrink-0 overflow-hidden">
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                : displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-black text-ink leading-tight">{displayName}</h1>
                {profile.open_to_work && (
                  <span className="text-[10px] font-bold text-green bg-green/10 border border-green/20 px-2 py-0.5 rounded-full">Open to work</span>
                )}
              </div>
              <p className="text-[14px] text-ink-2 mt-1 leading-snug">{profile.headline ?? 'Career profile on tiikme'}</p>
              {location && <p className="text-[12px] text-ink-3 mt-1.5">📍 {location}</p>}
            </div>
          </div>
        </div>

        {/* About */}
        {profile.about && (
          <Section title="About">
            <p className="text-[13.5px] text-ink-2 leading-relaxed">{profile.about}</p>
          </Section>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 text-[12px] font-medium text-ink-2 bg-page border border-line rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <Section title="Experience">
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <div key={exp.id} className={i > 0 ? 'pt-4 border-t border-line' : ''}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink leading-tight">{exp.role}</p>
                      <p className="text-[12px] text-ink-2 mt-0.5">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    </div>
                    <span className="text-[11px] text-ink-3 shrink-0 mt-0.5">
                      {exp.start_year}{exp.currently_working ? ' – Present' : exp.end_year ? ` – ${exp.end_year}` : ''}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-[12.5px] text-ink-3 mt-2 leading-relaxed">{exp.description}</p>
                  )}
                  {exp.skills_used && exp.skills_used.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {exp.skills_used.map(s => (
                        <span key={s} className="text-[11px] px-2 py-0.5 bg-page border border-line rounded-full text-ink-3">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <Section title="Education">
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={edu.id} className={i > 0 ? 'pt-3 border-t border-line' : ''}>
                  <p className="text-[13.5px] font-semibold text-ink">{edu.institution}</p>
                  <p className="text-[12px] text-ink-2 mt-0.5">
                    {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {(edu.start_year || edu.end_year) && (
                      <span className="text-[11px] text-ink-3">{edu.start_year ?? ''}{edu.end_year ? ` – ${edu.end_year}` : ''}</span>
                    )}
                    {edu.grade && (
                      <span className="text-[11px] text-ink-3">· {edu.grade}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {certs && certs.length > 0 && (
          <Section title="Certifications">
            <div className="space-y-3">
              {certs.map((cert, i) => (
                <div key={cert.id} className={i > 0 ? 'pt-3 border-t border-line' : ''}>
                  <p className="text-[13.5px] font-semibold text-ink">{cert.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[12px] text-ink-2">{cert.issuer}</p>
                    {cert.issued_year && <span className="text-[11px] text-ink-3">· {cert.issued_year}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <Section title="Highlights">
            <div className="space-y-3">
              {achievements.map((ach, i) => (
                <div key={ach.id} className={i > 0 ? 'pt-3 border-t border-line' : ''}>
                  <p className="text-[13.5px] font-semibold text-ink">🏆 {ach.title}</p>
                  {ach.description && (
                    <p className="text-[12.5px] text-ink-3 mt-1 leading-relaxed">{ach.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Verified notice */}
        <div className="rounded-[16px] border border-purple/20 bg-card p-5 flex items-start gap-4">
          <span className="w-10 h-10 rounded-[12px] bg-purple/10 text-purple flex items-center justify-center text-[18px] shrink-0">✦</span>
          <div>
            <p className="text-[13px] font-semibold text-ink">Flex is squad-verified on tiikme</p>
            <p className="text-[12px] text-ink-3 mt-0.5 leading-relaxed">
              Experience, education, and skills on tiikme are co-signed by real teammates — not self-reported.
              Create your own verified Flex to connect with the right roles.
            </p>
            <button onClick={() => router.push('/sign-in')}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-purple hover:text-purple/80 transition-colors">
              Build your Flex → <span aria-hidden>↗</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-ink-3 text-center pb-6">
          Shared via tiikme · <button onClick={() => router.push('/')} className="text-orange font-semibold hover:underline">tiikme.com</button>
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-line bg-card p-5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">{title}</h2>
      {children}
    </div>
  )
}
