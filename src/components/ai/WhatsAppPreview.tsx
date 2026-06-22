'use client'

import { toast } from '@/components/profile/ui/Toast'
import { getWhatsAppSamples, type WaMessage } from '@/stubs/getAgent'

/* Preview of the WhatsApp template notifications the agent sends.
   Real delivery = WhatsApp Business Cloud API (Gupshup/MSG91 for India) after backend. */
export default function WhatsAppPreview() {
  const msgs = getWhatsAppSamples()
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-full bg-green/15 flex items-center justify-center text-green text-[14px]">✆</span>
        <div>
          <p className="text-[13px] font-bold text-ink">WhatsApp notifications</p>
          <p className="text-[11px] text-ink-3">How the agent reaches you & recruiters — tap a button to act.</p>
        </div>
      </div>
      <div className="space-y-3">
        {msgs.map(m => <Bubble key={m.id} m={m} />)}
      </div>
    </div>
  )
}

function fmt(line: string) {
  // *bold* → <b>
  const parts = line.split('*')
  return parts.map((p, i) => i % 2 === 1 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>)
}

function Bubble({ m }: { m: WaMessage }) {
  return (
    <div className="max-w-[420px]">
      <p className="text-[10px] text-ink-3 mb-1 ml-1">{m.to === 'candidate' ? 'To job seeker' : 'To recruiter (no company email — their WhatsApp)'}</p>
      {/* whatsapp-ish card */}
      <div className="rounded-[14px] rounded-tl-[4px] overflow-hidden border border-line" style={{ backgroundColor: 'var(--color-card)' }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line" style={{ backgroundColor: 'rgba(47,184,102,.06)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          <span className="text-[12px] font-semibold text-ink">{m.name}</span>
          <span className="text-[10px] text-ink-3 ml-auto">{m.time}</span>
        </div>
        <div className="px-3 py-2.5 space-y-0.5">
          {m.lines.map((l, i) => <p key={i} className="text-[12px] text-ink leading-snug">{fmt(l)}</p>)}
        </div>
        <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
          {m.buttons.map((b, i) => (
            <button key={b} onClick={()=>toast(`${b} → ${i===0?'done':'opened'}`)} className="py-2 text-[12px] font-semibold text-green hover:bg-green/5 transition-colors">{b}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
