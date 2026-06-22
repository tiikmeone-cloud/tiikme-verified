'use client'

/**
 * DeskShell — the post-onboarding workspace for buyers & creators.
 *
 * Candidates (student/intern/fresher/employee) live on Twin (/).
 * Buyers (organisation/brand) and creators get a *desk* — a workspace tuned to
 * what they do: hire, brief, or land collabs. Twin is embedded at the top so
 * they never leave to ask it something.
 *
 * Reads the onboarding draft (localStorage) for now. Auth → Supabase later.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { ToastHost, toast } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { loadOnboarding, type OnboardingState, type Persona } from '@/lib/onboarding'
import { listMyOrgs } from '@/lib/vouches'
import PostJobForm from '@/components/org/PostJobForm'
import { listBrandCampaigns, type BrandCampaign } from '@/lib/learn'
import BrandCampaignForm from '@/components/desk/BrandCampaignForm'

export default function DeskShell() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const s = loadOnboarding()
    setState(s)
    // Candidates don't have a desk — send them to Twin.
    const p = s.persona
    if (!p || ['student', 'intern', 'fresher', 'employee'].includes(p)) router.replace('/')
  }, [router])

  if (!state || !state.persona) return null
  const persona = state.persona
  const d = state.flexDraft ?? {}
  const name = state.name || 'there'
  const company = d.company || name

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="home" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 relative overflow-hidden">
          <InfiniteGridBackdrop />
          <div className="absolute inset-0 overflow-y-auto z-10">
          <div className="mx-auto px-4 lg:px-8 py-8 pb-24 lg:pb-10" style={{ maxWidth: 920 }}>

            {/* Header */}
            <header className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                {persona === 'creator' ? 'Creator desk' : persona === 'brand' ? 'Brand desk' : 'Hiring desk'}
              </p>
              <h1 className="text-[28px] lg:text-[34px] font-bold text-ink tracking-tight leading-tight mt-1">
                {persona === 'creator' ? `Hi, ${name.split(' ')[0]}` : company}
              </h1>
              <p className="text-[13px] text-ink-2 mt-1">
                {persona === 'creator'
                  ? 'Your collabs, brand matches, and proof — in one place.'
                  : persona === 'brand'
                    ? 'Brief verified creators and run campaigns — no DM grind.'
                    : 'Post roles, review verified candidates, move them forward.'}
              </p>
            </header>

            {/* Twin composer — always available */}
            <div className="mb-6">
              <PromptInputBox
                onSend={(text) => { if (text.trim()) router.push('/') /* Twin handles it */ }}
                placeholder={
                  persona === 'creator' ? 'Ask Tiik — find brand briefs, draft a pitch…'
                  : persona === 'brand'  ? 'Ask Tiik — find creators for a campaign…'
                  : 'Ask Tiik — find candidates, draft a JD…'
                }
                showSearch={false} showThink={false} showCanvas={false}
              />
            </div>

            {persona === 'organization' && <OrgDesk company={company} state={state} />}
            {persona === 'brand' && <BrandDesk company={company} state={state} />}
            {persona === 'creator' && <CreatorDesk name={name} state={state} />}
          </div>
          </div>
        </main>
      </div>

      <MobileTabBar active="home" onCreateClick={() => setCreateOpen(true)} />
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      <ToastHost />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  ORG DESK                                                        */
/* ─────────────────────────────────────────────────────────────── */
function OrgDesk({ company, state }: { company: string; state: OnboardingState }) {
  const d = state.flexDraft ?? {}
  const roles = (d.roles ?? '').split(/[,·]+/).map(s => s.trim()).filter(Boolean)

  // Resolve the org slug from the orgs the user works at (so buttons route to a real desk).
  const [org, setOrg] = useState<{ slug: string; name: string } | null>(null)
  const [jobOpen, setJobOpen] = useState(false)
  useEffect(() => {
    listMyOrgs().then(orgs => {
      const match = orgs.find(o => o.org_name.toLowerCase() === company.toLowerCase()) ?? orgs[0]
      if (match) setOrg({ slug: match.org_slug, name: match.org_name })
    })
  }, [company])

  return (
    <div className="space-y-5">
      <StatRow stats={[
        { label: 'Open roles', value: String(roles.length || 0), tint: 'text-orange' },
        { label: 'Applicants', value: '0', tint: 'text-ink' },
        { label: 'In pipeline', value: '0', tint: 'text-ink' },
        { label: 'Connected', value: '0', tint: 'text-purple' },
      ]} />

      {/* Primary actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard icon="＋" title="Post a role" body="Reach verified candidates matched by proof." cta="Post" onClick={() => org ? setJobOpen(true) : toast('Set up your org first')} accent />
        <ActionCard icon="◎" title="Review candidates" body="Move applicants through your pipeline." cta="Open desk" onClick={() => org ? location.assign(`/org/${org.slug}/talent`) : toast('No org desk yet')} />
        <ActionCard icon="＠" title="Invite a teammate" body="Add a co-worker to your hiring desk." cta="Invite" onClick={() => toast('Teammate invites land with auth')} />
      </div>

      {/* Roles you're hiring */}
      {roles.length > 0 && (
        <Section title="Roles you’re hiring for">
          <div className="flex flex-wrap gap-2">
            {roles.map(r => <Chip key={r}>{r}</Chip>)}
          </div>
        </Section>
      )}

      {/* Empty-but-actionable candidate state */}
      <Section title="Candidates" sub="Verified, peer-attested — surfaced by Tiik">
        <EmptyDesk
          line={org ? 'Manage applicants in your hiring desk' : 'No applicants yet'}
          sub="Post a role and Tiik surfaces verified candidates ranked by match + squad proximity. Move them through stages, request their Flex on shortlist."
          cta={org ? 'Open hiring desk →' : 'Post your first role'}
          onClick={() => org ? location.assign(`/org/${org.slug}/talent`) : (org ? setJobOpen(true) : toast('Set up your org first'))}
        />
      </Section>

      {jobOpen && org && (
        <PostJobForm orgSlug={org.slug} orgName={org.name} onClose={() => setJobOpen(false)} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  BRAND DESK                                                      */
/* ─────────────────────────────────────────────────────────────── */
function BrandDesk({ company, state }: { company: string; state: OnboardingState }) {
  const d = state.flexDraft ?? {}
  const niches = (d.lookingFor ?? '').split(/[,·]+/).map(s => s.trim()).filter(Boolean)
  const [briefOpen, setBriefOpen] = useState(false)
  return (
    <div className="space-y-5">
      {briefOpen && <BrandCampaignForm onClose={() => setBriefOpen(false)} />}
      <StatRow stats={[
        { label: 'Active briefs', value: '0', tint: 'text-orange' },
        { label: 'Creators matched', value: '0', tint: 'text-ink' },
        { label: 'Campaigns', value: '0', tint: 'text-ink' },
        { label: 'Budget band', value: d.budget || '—', tint: 'text-purple' },
      ]} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard icon="＋" title="Post a brief" body="Describe the campaign; Tiik matches creators." cta="Brief" onClick={() => setBriefOpen(true)} accent />
        <ActionCard icon="◉" title="Find creators" body="Search verified creators by niche + audience." cta="Search" onClick={() => toast('Creator search lands next')} />
        <ActionCard icon="✦" title="Ask Tiik" body="“5 fitness creators under ₹2L for a Q3 launch.”" cta="Ask" onClick={() => toast('Open Tiik to ask')} />
      </div>

      {niches.length > 0 && (
        <Section title="Niches you want">
          <div className="flex flex-wrap gap-2">{niches.map(n => <Chip key={n}>{n}</Chip>)}</div>
        </Section>
      )}

      <Section title="Matched creators" sub="Verified audience + past-collab proof">
        <EmptyDesk
          line="No matches yet"
          sub="Post a brief and Tiik returns verified creators with real audience numbers and past collabs."
          cta="Post your first brief"
          onClick={() => setBriefOpen(true)}
        />
      </Section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  CREATOR DESK                                                    */
/* ─────────────────────────────────────────────────────────────── */
function CreatorDesk({ name, state }: { name: string; state: OnboardingState }) {
  const d = state.flexDraft ?? {}
  const platforms = (d.platforms ?? '').split(/[,·]+/).map(s => s.trim()).filter(Boolean)
  const collabs = (d.collab ?? '').split(/[,·]+/).map(s => s.trim()).filter(Boolean)
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([])
  useEffect(() => { listBrandCampaigns().then(setCampaigns) }, [])

  return (
    <div className="space-y-5">
      <StatRow stats={[
        { label: 'Audience', value: d.audience || '—', tint: 'text-orange' },
        { label: 'Collabs done', value: '0', tint: 'text-ink' },
        { label: 'Brand briefs', value: String(campaigns.length), tint: 'text-purple' },
        { label: 'Niche', value: d.niche || '—', tint: 'text-ink' },
      ]} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard icon="🔗" title="Connect a platform" body="Verify YouTube / Dribbble — turns reach into proof." cta="Connect" onClick={() => toast('OAuth connectors land with auth')} accent />
        <ActionCard icon="＋" title="Add to portfolio" body="Show your best work + paid collabs." cta="Add" onClick={() => toast('Portfolio editor opening…')} />
        <ActionCard icon="◆" title="Browse briefs" body="Find brand campaigns matched to your niche." cta="Browse" onClick={() => toast('Brand briefs land next')} />
      </div>

      {platforms.length > 0 && (
        <Section title="Where you create">
          <div className="flex flex-wrap gap-2">{platforms.map(p => <Chip key={p}>{p}</Chip>)}</div>
        </Section>
      )}

      {collabs.length > 0 && (
        <Section title="Collabs you want">
          <div className="flex flex-wrap gap-2">{collabs.map(c => <Chip key={c} accent>{c}</Chip>)}</div>
        </Section>
      )}

      <Section title="Brand briefs" sub="Live campaigns matched to creators like you">
        {campaigns.length === 0 ? (
          <EmptyDesk
            line="No briefs yet"
            sub="Connect a platform so brands can verify your audience — then Tiik matches you to live briefs."
            cta="Connect your top platform"
            onClick={() => toast('OAuth connectors land with auth')}
          />
        ) : (
          <div className="space-y-2.5">
            {campaigns.map(c => (
              <div key={c.id} className="bg-card border border-line rounded-[14px] p-4 hover:border-orange/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold shrink-0" style={{ backgroundColor: c.brand_color }}>{c.brand_name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink leading-snug">{c.title}</p>
                    <p className="text-[11.5px] text-ink-3">{c.brand_name}{c.budget_band ? ` · ${c.budget_band}` : ''}{c.deliverables ? ` · ${c.deliverables}` : ''}</p>
                    {c.summary && <p className="text-[12px] text-ink-2 mt-1 leading-snug">{c.summary}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.niches.map(n => <Chip key={n} accent>{n}</Chip>)}
                      {c.platforms.map(p => <Chip key={p}>{p}</Chip>)}
                    </div>
                  </div>
                  <button onClick={() => toast(`Pitch sent to ${c.brand_name} — they'll see your verified Flex`)}
                    className="text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-3.5 py-2 hover:opacity-95 transition-opacity shrink-0">
                    Pitch →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  Shared bits                                                     */
/* ─────────────────────────────────────────────────────────────── */
function StatRow({ stats }: { stats: { label: string; value: string; tint: string }[] }) {
  return (
    <div className="bg-card border border-line rounded-[16px] p-3 shadow-card">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
        {stats.map(s => (
          <div key={s.label} className="px-3 py-1.5 first:pl-1">
            <p className="text-[10px] text-ink-3 leading-none">{s.label}</p>
            <p className={`text-[18px] font-black leading-none mt-1.5 ${s.tint}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionCard({ icon, title, body, cta, onClick, accent }: {
  icon: string; title: string; body: string; cta: string; onClick: () => void; accent?: boolean
}) {
  return (
    <button onClick={onClick}
      className={[
        'text-left rounded-[16px] border p-4 transition-all hover:-translate-y-0.5',
        accent
          ? 'bg-gradient-to-br from-orange/8 to-transparent border-orange/25 hover:border-orange/40'
          : 'bg-card border-line hover:border-orange/30',
      ].join(' ')}>
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[16px] mb-2.5 ${accent ? 'bg-orange-soft text-orange' : 'bg-page text-ink-2'}`}>{icon}</div>
      <p className="text-[13.5px] font-bold text-ink">{title}</p>
      <p className="text-[11.5px] text-ink-2 mt-1 leading-snug">{body}</p>
      <span className={`inline-block mt-2.5 text-[11.5px] font-semibold ${accent ? 'text-orange' : 'text-ink-3'}`}>{cta} →</span>
    </button>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {sub && <p className="text-[11px] text-ink-3 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyDesk({ line, sub, cta, onClick }: { line: string; sub: string; cta: string; onClick: () => void }) {
  return (
    <div className="bg-card border border-line rounded-[16px] p-8 text-center">
      <p className="text-[14px] font-semibold text-ink">{line}</p>
      <p className="text-[12px] text-ink-3 mt-1.5 max-w-[420px] mx-auto leading-relaxed">{sub}</p>
      <button onClick={onClick}
        className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[11px] px-4 py-2 hover:opacity-95 transition-opacity shadow-[0_4px_12px_-4px_rgba(255,92,40,.45)]">
        {cta} →
      </button>
    </div>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={[
      'text-[12px] font-medium px-3 py-1 rounded-full border',
      accent ? 'text-orange bg-orange-soft border-orange/20' : 'text-ink-2 bg-card border-line',
    ].join(' ')}>{children}</span>
  )
}
