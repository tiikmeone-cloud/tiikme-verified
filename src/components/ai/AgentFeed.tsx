'use client'

import { useState } from 'react'
import { getAgentFeed, type AgentEvent } from '@/stubs/getAgent'
import Toggle from '@/components/profile/ui/Toggle'
import { toast } from '@/components/profile/ui/Toast'

const KIND: Record<AgentEvent['kind'], { icon: string; tag: string; color: string }> = {
  match:   { icon:'🎯', tag:'Match found', color:'#2FB866' },
  drafted: { icon:'✍️', tag:'Application drafted', color:'#FF5C28' },
  gap:     { icon:'🌱', tag:'Skill gap', color:'#F5A524' },
  reach:   { icon:'📨', tag:'Recruiter reach-out', color:'#6D4BD8' },
}

/* Candidate Agent — "your agent is on" + a feed of what it found / drafted, with Approve. */
export default function AgentFeed() {
  const [on, setOn] = useState(true)
  const [events, setEvents] = useState<AgentEvent[]>(getAgentFeed())

  const act = (id: string, status: 'approved' | 'dismissed') => {
    setEvents(p => p.map(e => e.id === id ? { ...e, status } : e))
    toast(status === 'approved' ? 'Approved — your agent will action it' : 'Dismissed')
  }

  return (
    <div className="space-y-4">
      {/* agent status header */}
      <div className="rounded-[16px] p-4 flex items-center gap-3" style={{ background:'linear-gradient(100deg, rgba(255,92,40,.10), rgba(109,75,216,.08))' }}>
        <div className="w-10 h-10 rounded-[12px] bg-card flex items-center justify-center text-[18px] shrink-0">🤖</div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-ink">Your Grind Agent {on ? 'is on' : 'is paused'}</p>
          <p className="text-[11px] text-ink-2">{on ? 'Hunting jobs 24/7, matching to your Flex & drafting applications. You approve before anything sends.' : 'Turn on to let it find & draft for you.'}</p>
        </div>
        <Toggle on={on} onChange={setOn} />
      </div>

      {!on ? null : (
        <div className="space-y-3">
          {events.map(e => {
            const k = KIND[e.kind]
            return (
              <div key={e.id} className="bg-card rounded-[16px] shadow-card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[15px]">{k.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color:k.color, backgroundColor:`${k.color}1A` }}>{k.tag}</span>
                  {e.matchPct && <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">{e.matchPct}% match</span>}
                  <span className="text-[10px] text-ink-3 ml-auto">{e.at}</span>
                </div>
                {e.org && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-[6px] flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: e.orgColor }}>{e.org.charAt(0)}</span>
                    <p className="text-[13px] font-semibold text-ink">{e.role} <span className="text-ink-3 font-normal">· {e.org}</span></p>
                  </div>
                )}
                <p className="text-[12px] text-ink-2 leading-snug">{e.body}</p>

                {/* actions */}
                {e.status === 'new' ? (
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={()=>act(e.id,'approved')} className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-4 py-2 hover:bg-orange-2 transition-colors">
                      {e.kind==='drafted'?'Approve & send':e.kind==='reach'?'Accept':e.kind==='gap'?'Go to Level Up':'Apply for me'}
                    </button>
                    <button onClick={()=>act(e.id,'dismissed')} className="text-[12px] font-medium text-ink-2 bg-page rounded-[10px] px-4 py-2 hover:bg-line transition-colors">Dismiss</button>
                  </div>
                ) : (
                  <p className={`text-[11px] font-semibold mt-2 ${e.status==='approved'?'text-green':'text-ink-3'}`}>{e.status==='approved'?'✓ Approved':'Dismissed'}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
