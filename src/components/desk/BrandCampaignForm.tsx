'use client'

/**
 * BrandCampaignForm — a brand/org posts a creator brief. Writes `brand_campaigns`;
 * appears in the creator Desk + Level Up creator surface. Pre-filled with example
 * data so every field is self-explanatory.
 */

import { useState } from 'react'
import SmartSelect from '@/components/ui/SmartSelect'
import { postBrandCampaign } from '@/lib/learn'

interface Props { onClose: () => void; onPosted?: () => void }

const COLORS = ['#FF5C28', '#6D4BD8', '#1D9E75', '#378ADD', '#D4537E']
const BUDGETS = ['₹10–25k', '₹25–50k', '₹50k–1L', '₹1L–3L', '₹3L+']
const csv = (s: string) => s.split(/[,·]+/).map(x => x.trim()).filter(Boolean)

export default function BrandCampaignForm({ onClose, onPosted }: Props) {
  const [f, setF] = useState({
    brand: 'Atomberg', color: '#6D4BD8', title: 'Summer launch — short-form reels',
    summary: 'Looking for tech & lifestyle creators to launch our new smart fan with authentic short-form video.',
    niches: 'Tech / Coding, Lifestyle', platforms: 'Instagram, YouTube',
    budget: '₹50k–1L', deliverables: '2 Instagram reels\n1 YouTube short\nUsage rights for 30 days', deadline: '',
  })
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))

  const canPost = f.brand.trim().length > 0 && f.title.trim().length >= 3

  const submit = async () => {
    if (!canPost) { setError('Add a brand name and campaign title.'); return }
    setPosting(true); setError(null)
    const res = await postBrandCampaign({
      brand_name: f.brand.trim(), brand_color: f.color, title: f.title.trim(),
      summary: f.summary.trim() || null, niches: csv(f.niches), platforms: csv(f.platforms),
      budget_band: f.budget || null, deliverables: f.deliverables.trim() || null,
      deadline: f.deadline || null,
    })
    setPosting(false)
    if (res.error) { setError(res.error); return }
    setPosted(true); onPosted?.()
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-[6vh] overflow-y-auto">
        <div className="bg-card border border-line rounded-[20px] shadow-[0_24px_64px_-20px_rgba(0,0,0,.4)] w-full max-w-[520px]">
          <div className="px-5 pt-5 pb-3 border-b border-line">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">Post a brief · brand</p>
            <h2 className="text-[17px] font-bold text-ink mt-1">New creator campaign</h2>
          </div>

          {posted ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-orange/15 text-orange mx-auto flex items-center justify-center text-[22px]">✓</div>
              <p className="text-[15px] font-bold text-ink mt-3">“{f.title}” is live</p>
              <p className="text-[12.5px] text-ink-2 mt-1">Matching creators will see your brief.</p>
              <button onClick={onClose} className="mt-5 text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6">Done</button>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Brand name" required><Input value={f.brand} onChange={set('brand')} placeholder="Atomberg" /></Field>
                  <Field label="Accent colour">
                    <div className="flex items-center gap-2 h-[42px]">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => set('color')(c)} aria-label="colour"
                          className="w-6 h-6 rounded-full" style={{ backgroundColor: c, outline: f.color === c ? '2px solid var(--color-border-primary)' : 'none', outlineOffset: '2px' }} />
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label="Campaign title" required><Input value={f.title} onChange={set('title')} placeholder="Summer launch — short-form reels" /></Field>
                <Field label="Summary"><Area value={f.summary} onChange={set('summary')} placeholder="What the campaign is about…" rows={2} /></Field>
                <Field label="Niches"><SmartSelect field="creator_niche" value={f.niches} onChange={set('niches')} multi placeholder="Pick a niche…" /></Field>
                <Field label="Platforms"><SmartSelect field="creator_platform" value={f.platforms} onChange={set('platforms')} multi placeholder="Pick a platform…" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Budget band">
                    <select value={f.budget} onChange={e => set('budget')(e.target.value)} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40">
                      {BUDGETS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Deadline"><input type="date" value={f.deadline} onChange={e => set('deadline')(e.target.value)} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange/40" /></Field>
                </div>
                <Field label="Deliverables"><Area value={f.deliverables} onChange={set('deliverables')} placeholder="One deliverable per line…" rows={3} /></Field>
              </div>

              {error && <div className="mx-5 mb-1 bg-orange/10 border border-orange/30 rounded-[10px] px-3 py-2"><p className="text-[12px] text-orange font-medium">{error}</p></div>}

              <div className="px-5 py-3.5 border-t border-line flex items-center gap-2">
                <button onClick={onClose} className="text-[13px] font-semibold text-ink-2 bg-page border border-line rounded-[12px] py-2.5 px-4 hover:opacity-90">Cancel</button>
                <div className="flex-1" />
                <button onClick={submit} disabled={!canPost || posting}
                  className="text-[13px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[12px] py-2.5 px-6 hover:opacity-95 disabled:opacity-40 transition-opacity">
                  {posting ? 'Posting…' : 'Post brief'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-semibold text-ink-2">{label}{required && <span className="text-orange ml-0.5">*</span>}</span><div className="mt-1.5">{children}</div></label>
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all" />
}
function Area({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; rows: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange/40 transition-all resize-y leading-relaxed" />
}
