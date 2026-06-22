'use client'

import { useState } from 'react'
import { getExplorePeople } from '@/stubs/getExplore'
import { toast } from '@/components/profile/ui/Toast'

/* Refer = recommend someone from your network for a role.
   Referred candidates are boosted + show "Referred by you" to the org. */
export default function ReferModal({ jobTitle, onClose }: { jobTitle: string; onClose: () => void }) {
  const people = getExplorePeople()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n })

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.3)] w-full max-w-md max-h-[82vh] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">Refer someone</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <p className="text-[12px] text-ink-3 mt-0.5">for <span className="font-semibold text-ink-2">{jobTitle}</span> — they get boosted &amp; notified.</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {people.map(p => {
              const on = picked.has(p.id)
              return (
                <button key={p.id} onClick={()=>toggle(p.id)} className={['w-full flex items-center gap-3 p-2.5 rounded-[12px] transition-colors text-left', on?'bg-orange-soft/50':'hover:bg-page'].join(' ')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-ink truncate">{p.name}</p><p className="text-[11px] text-ink-3 truncate">{p.role} · {p.company}</p></div>
                  <div className={['w-5 h-5 rounded-full border-2 flex items-center justify-center', on?'bg-orange border-orange':'border-line'].join(' ')}>{on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                </button>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-line">
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note (why they're great)…" className="w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-[12px] text-ink placeholder-ink-3 outline-none focus:border-orange transition-colors mb-2" />
            <button onClick={()=>{ toast(`Referred ${picked.size} ${picked.size===1?'person':'people'} ✓`); onClose() }} disabled={picked.size===0}
              className="w-full bg-orange text-white text-[13px] font-semibold py-2.5 rounded-[12px] hover:bg-orange-2 transition-colors disabled:opacity-40">
              {picked.size>0?`Refer ${picked.size}`:'Pick people to refer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
