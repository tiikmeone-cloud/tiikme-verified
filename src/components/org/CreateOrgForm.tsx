'use client'

/**
 * CreateOrgForm — a user creates an organization and becomes its OWNER. This is
 * the gate for hiring: only org owners/admins can post roles, so a user who wants
 * to hire creates an org here first. Writes `orgs` + an owner `org_memberships` row.
 * (Demo: owner = seed user; becomes the real auth.uid() when auth lands.)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrg } from '@/lib/applications'

const COLORS = ['#FF5C28', '#6D4BD8', '#1D9E75', '#378ADD', '#D4537E', '#F5A524']
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function CreateOrgForm() {
  const router = useRouter()
  const [f, setF] = useState({ name: '', slug: '', location: '', website: '', tagline: '', color: '#FF5C28' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))

  const slug = slugTouched ? f.slug : slugify(f.name)
  const canCreate = f.name.trim().length >= 2 && slug.length >= 2

  const submit = async () => {
    if (!canCreate) { setError('Add an organization name.'); return }
    setCreating(true); setError(null)
    const res = await createOrg({
      name: f.name.trim(), slug,
      location: f.location.trim() || null, website: f.website.trim() || null,
      tagline: f.tagline.trim() || null, logo_color: f.color,
    })
    if (res.error) { setCreating(false); setError(res.error); return }
    router.push(`/org/${res.slug}`)
  }

  return (
    <div className="min-h-screen bg-page flex items-start justify-center p-4 pt-[8vh]">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white text-[20px] font-bold shrink-0" style={{ backgroundColor: f.color }}>{(f.name.trim()[0] || 'O').toUpperCase()}</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Create organization</p>
            <h1 className="text-[20px] font-bold text-ink">Set up your company page</h1>
          </div>
        </div>
        <p className="text-[12.5px] text-ink-2 mb-5 leading-relaxed">Only org owners can post roles. Create your organization to become its owner and start hiring.</p>

        <div className="bg-card border border-line rounded-[18px] p-5 space-y-3.5">
          <Field label="Organization name" required><Input value={f.name} onChange={set('name')} placeholder="Ironwood Labs" /></Field>
          <Field label="Handle" required>
            <div className="flex items-center bg-page border border-line rounded-[10px] px-3 focus-within:border-orange/40">
              <span className="text-[13px] text-ink-3">tiikme.com/org/</span>
              <input value={slug} onChange={e => { setSlugTouched(true); set('slug')(slugify(e.target.value)) }}
                className="flex-1 bg-transparent py-2.5 text-[13px] text-ink outline-none" placeholder="ironwood" />
            </div>
          </Field>
          <Field label="Accent colour">
            <div className="flex items-center gap-2.5 h-[42px]">
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color')(c)} aria-label="colour"
                  className="w-7 h-7 rounded-full" style={{ backgroundColor: c, outline: f.color === c ? '2px solid var(--color-border-primary)' : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location"><Input value={f.location} onChange={set('location')} placeholder="Bengaluru, IN" /></Field>
            <Field label="Website"><Input value={f.website} onChange={set('website')} placeholder="ironwood.com" /></Field>
          </div>
          <Field label="Tagline"><Input value={f.tagline} onChange={set('tagline')} placeholder="Designing products people love" /></Field>

          {error && <div className="bg-orange/10 border border-orange/30 rounded-[10px] px-3 py-2"><p className="text-[12px] text-orange font-medium">{error}</p></div>}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => router.back()} className="text-[13px] font-semibold text-ink-2 bg-page border border-line rounded-[12px] py-2.5 px-4 hover:opacity-90">Cancel</button>
            <div className="flex-1" />
            <button onClick={submit} disabled={!canCreate || creating}
              className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">
              {creating ? 'Creating…' : 'Create organization'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span><div className="mt-1.5">{children}</div></label>
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all" />
}
