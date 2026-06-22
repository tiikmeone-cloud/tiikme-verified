'use client'

import { useState } from 'react'
import TwinChatModal from '@/components/ui/twin-chat-modal'
import { Button } from '@/components/ui/button'

type Persona = 'professional' | 'student' | 'org'

export default function TwinModalDemo() {
  const [open, setOpen] = useState(false)
  const [persona, setPersona] = useState<Persona>('professional')

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-8" style={{ backgroundColor: 'var(--color-page)' }}>
      <div className="max-w-[520px] text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">tiikme · demo</p>
        <h1 className="text-[34px] font-semibold text-ink tracking-tight mt-1">Twin chat modal</h1>
        <p className="text-[14px] text-ink-2 mt-3 leading-relaxed">
          Same Ruixen layout — full-bleed atmosphere, centered title, glass input,
          quick actions — but with Twin&rsquo;s identity, tiikme palette, and persona-aware copy.
        </p>

        <div className="mt-7 inline-flex bg-card border border-line rounded-[12px] p-1 shadow-card">
          {(['professional','student','org'] as Persona[]).map(p => (
            <button key={p} onClick={() => setPersona(p)}
              className={[
                'px-3.5 py-1.5 text-[12px] font-semibold rounded-[9px] transition-colors capitalize',
                persona === p ? 'bg-orange text-white' : 'text-ink-2 hover:text-ink',
              ].join(' ')}>
              {p === 'org' ? 'Organization' : p}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <Button onClick={() => setOpen(true)} className="bg-gradient-to-br from-[#FF5C28] to-[#FF7A45] text-white hover:opacity-95 h-11 px-6 rounded-[12px] text-[14px] font-semibold shadow-[0_4px_14px_-4px_rgba(255,92,40,.5)]">
            ✦ Talk to Twin
          </Button>
        </div>

        <p className="text-[10.5px] text-ink-3 mt-5">Press <kbd className="bg-card border border-line rounded px-1.5 py-0.5 text-[10px]">Esc</kbd> to close · click backdrop to dismiss</p>
      </div>

      <TwinChatModal
        open={open}
        onClose={() => setOpen(false)}
        firstName="Naadhan"
        persona={persona}
        onSend={(text) => {
          console.log('Twin received:', text)
          setOpen(false)
        }}
      />
    </main>
  )
}
