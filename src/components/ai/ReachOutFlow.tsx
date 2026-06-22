'use client'

import { useState } from 'react'
import type { TalentResult } from '@/stubs/getAgent'
import { Avatar } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

/* Org sources a candidate → sends a role-tied note (no email shown) →
   candidate notified → on Accept, contact revealed BOTH ways. Mirrors apply→shortlist reveal. */
type Step = 'compose' | 'sent' | 'revealed'

export default function ReachOutFlow({ person, role, onClose }: { person: TalentResult; role: string; onClose: () => void }) {
  const [step, setStep] = useState<Step>('compose')
  const [note, setNote] = useState(`Hi ${person.name.split(' ')[0]} — I'm hiring a ${role}. Your verified work is a strong fit. Open to a chat?`)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.3)] w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-[15px] font-bold text-ink">Reach out</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>

          {/* person */}
          <div className="px-5 py-3 flex items-center gap-3 border-b border-line">
            <Avatar name={person.name} src={person.avatar} size={42} />
            <div><p className="text-[13px] font-semibold text-ink">{person.name}</p><p className="text-[11px] text-ink-3">{person.role} · {person.location}</p></div>
            <span className="ml-auto text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">{person.matchPct}% match</span>
          </div>

          <div className="p-5">
            {step === 'compose' && (
              <>
                <p className="text-[11px] font-semibold text-ink mb-1.5">Your note (no email shown — they decide first)</p>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} className="w-full bg-page border border-line rounded-[12px] px-3 py-2.5 text-[13px] text-ink outline-none focus:border-orange transition-colors resize-none" />
                <button onClick={()=>setStep('sent')} className="w-full mt-3 bg-orange text-white text-[13px] font-semibold py-2.5 rounded-[12px] hover:bg-orange-2 transition-colors">Send reach-out</button>
                <p className="text-[10px] text-ink-3 text-center mt-2">They get it on WhatsApp + in-app. Contact is shared only if they accept.</p>
              </>
            )}

            {step === 'sent' && (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-orange-soft mx-auto flex items-center justify-center text-[22px]">📨</div>
                <p className="text-[14px] font-bold text-ink mt-2">Sent to {person.name.split(' ')[0]}</p>
                <p className="text-[12px] text-ink-2 mt-1 max-w-[300px] mx-auto leading-relaxed">They&apos;ve been notified. You&apos;ll get their contact the moment they accept — no cold inbox, higher reply rate.</p>
                {/* simulate the candidate accepting */}
                <button onClick={()=>setStep('revealed')} className="mt-4 text-[12px] font-semibold text-white bg-ink rounded-[10px] px-4 py-2 hover:opacity-90 transition-opacity">▶ Simulate: they tap “Accept”</button>
              </div>
            )}

            {step === 'revealed' && (
              <div className="py-1">
                <div className="text-center"><div className="w-12 h-12 rounded-full bg-green/12 mx-auto flex items-center justify-center text-[22px]">🤝</div>
                  <p className="text-[14px] font-bold text-green mt-2">They accepted!</p>
                  <p className="text-[11px] text-ink-2 mt-1">Contact shared both ways — take it to email/call.</p>
                </div>
                <div className="mt-3 bg-page rounded-[12px] p-3 space-y-2">
                  <Row l="Email" v={`${person.handle}@gmail.com`} />
                  <Row l="Phone" v="+91 98••• ••432" />
                </div>
                <button onClick={()=>{toast('Opening email…');onClose()}} className="w-full mt-3 bg-orange text-white text-[13px] font-semibold py-2.5 rounded-[12px] hover:bg-orange-2 transition-colors">Email {person.name.split(' ')[0]}</button>
                <p className="text-[10px] text-ink-3 text-center mt-2">Revealed by mutual consent · tiikme has no DMs by design.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex items-center justify-between"><span className="text-[12px] text-ink-3">{l}</span><span className="text-[12px] font-semibold text-ink">{v}</span></div>
}
