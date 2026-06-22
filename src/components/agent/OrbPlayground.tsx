'use client'

/**
 * Orb Playground — preview every state, every size, every loader
 * so the design feels real before it ships.
 *
 * Toggle the controls in the right panel to inspect each state.
 * Persona switch tints the rim.
 */

import { useState } from 'react'
import TwinOrb from '@/components/agent/TwinOrb'
import TwinLoader, { type LoaderKind } from '@/components/agent/TwinLoader'
import TwinThinking, { TwinVerb, type TwinVerbKind } from '@/components/agent/TwinThinking'

export default function OrbPlayground() {
  const [active, setActive] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [persona, setPersona] = useState<0 | 1 | 2>(0)

  const flashSuccess = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 1000)
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--color-page)' }}>
      <div className="mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10" style={{ maxWidth: 1240 }}>

        {/* LEFT — gallery */}
        <div className="space-y-12">
          <Header />

          <Section title="Hero · 140px" sub="Empty-state Twin presence">
            <div className="flex items-center gap-12 flex-wrap">
              <Stage label="On page (off-white)">
                <TwinOrb size="hero" active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} />
              </Stage>
              <Stage label="On card (white)" cardBg>
                <TwinOrb size="hero" active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} />
              </Stage>
              <Stage label="On dark surface" darkBg>
                <TwinOrb size="hero" active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} />
              </Stage>
            </div>
          </Section>

          <Section title="All sizes" sub="hero · header · inline · pill">
            <div className="flex items-end gap-12 flex-wrap">
              <Stage label="Hero · 140"><TwinOrb size="hero"   active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} /></Stage>
              <Stage label="Header · 36"><TwinOrb size="header" active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} /></Stage>
              <Stage label="Inline · 28"><TwinOrb size="inline" active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} /></Stage>
              <Stage label="Pill · 22"><TwinOrb size="pill"     active={active} thinking={thinking} speaking={speaking} success={success} personaTone={persona} /></Stage>
            </div>
          </Section>

          <Section title="Persona rim color">
            <div className="flex items-center gap-12 flex-wrap">
              <Stage label="Professional"><TwinOrb size="hero" personaTone={0} /></Stage>
              <Stage label="Student"><TwinOrb size="hero" personaTone={1} /></Stage>
              <Stage label="Organization"><TwinOrb size="hero" personaTone={2} /></Stage>
            </div>
          </Section>

          <Section title="Loaders" sub="Each has its own personality — no spinners">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(['thinking', 'matching', 'applying', 'auditing', 'building'] as LoaderKind[]).map(k => (
                <div key={k} className="bg-card border border-line rounded-[16px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{k}</p>
                    <span className="text-[10px] text-ink-3">48px</span>
                  </div>
                  <div className="flex items-center justify-center py-3 bg-page rounded-[12px]">
                    <TwinLoader kind={k} size={48} iconOnly />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <TwinLoader kind={k} size={20} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="In context">
            <ContextCard active={active} thinking={thinking} speaking={speaking} persona={persona} />
          </Section>

          <Section title="TwinThinking · overlay loader" sub="Full-screen take-over for weighty moments. Click each verb to preview.">
            <VerbPreviewer />
          </Section>

          <Section title="TwinThinking · inline" sub="Same pattern, sits inline in the chat.">
            <div className="bg-card border border-line rounded-[16px] py-2 inline-block">
              <TwinThinking variant="inline" text="Thinking" size={140} />
            </div>
          </Section>
        </div>

        {/* RIGHT — sticky controls */}
        <aside className="lg:sticky lg:top-6 self-start">
          <div className="bg-card border border-line rounded-[18px] p-5 shadow-card space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">Controls</p>
              <p className="text-[11px] text-ink-3 mt-1">Toggle to inspect every state.</p>
            </div>

            <ControlToggle label="isListening" hint="composer focused"   value={active}   onChange={setActive} />
            <ControlToggle label="isThinking"  hint="computing reply"    value={thinking} onChange={setThinking} />
            <ControlToggle label="isSpeaking"  hint="reply streaming"    value={speaking} onChange={setSpeaking} />

            <div>
              <p className="text-[11px] font-semibold text-ink-2 mb-2">isSuccess (one-shot)</p>
              <button onClick={flashSuccess}
                className="w-full text-[12.5px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] py-2 hover:opacity-95 transition-opacity">
                Flash success
              </button>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-ink-2 mb-2">personaTone</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Professional', 'Student', 'Organization'] as const).map((l, i) => (
                  <button key={l} onClick={() => setPersona(i as 0 | 1 | 2)}
                    className={['text-[11px] font-semibold py-1.5 rounded-[8px] border transition-colors',
                      persona === i ? 'bg-orange text-white border-orange' : 'bg-card text-ink-2 border-line hover:border-orange/30'].join(' ')}>
                    {i}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-ink-3 mt-1.5">{['Professional', 'Student', 'Organization'][persona]}</p>
            </div>

            <div className="pt-3 border-t border-line">
              <p className="text-[10px] text-ink-3 leading-relaxed">
                Drop <code className="text-orange bg-orange-soft px-1 rounded">/anim/twin-orb.riv</code> to hot-swap
                the orb. Same for the five loaders.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

function Header() {
  return (
    <header>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">tiikme · design</p>
      <h1 className="text-[28px] font-semibold text-ink tracking-tight mt-1">Orb playground</h1>
      <p className="text-[13px] text-ink-3 mt-1.5 leading-relaxed">
        Every state, every size, every loader. Pure CSS+SVG today —
        hot-swaps to a <code className="text-orange">.riv</code> the moment one lands in <code className="text-ink-2">public/anim/</code>.
      </p>
    </header>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {sub && <p className="text-[11.5px] text-ink-3 mt-0.5">{sub}</p>}
      </div>
      {children}
    </section>
  )
}

function Stage({
  label, children, cardBg, darkBg,
}: {
  label: string; children: React.ReactNode; cardBg?: boolean; darkBg?: boolean
}) {
  const bg = darkBg ? '#1A1410' : cardBg ? 'var(--color-card)' : 'var(--color-page)'
  const labelColor = darkBg ? 'rgba(255,255,255,.6)' : 'var(--color-ink-3)'
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="rounded-[18px] flex items-center justify-center"
           style={{ background: bg, padding: 24, minWidth: 200, minHeight: 200, border: darkBg ? '1px solid #2A2018' : '1px solid var(--color-line)' }}>
        {children}
      </div>
      <p className="text-[11px] font-medium" style={{ color: labelColor }}>{label}</p>
    </div>
  )
}

function ControlToggle({
  label, hint, value, onChange,
}: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch" aria-checked={value} onClick={() => onChange(!value)}
        className={['shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors relative',
          value ? 'bg-orange' : 'bg-line'].join(' ')}>
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-card transition-all"
          style={{ left: value ? 18 : 2 }}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-ink leading-tight">{label}</p>
        <p className="text-[10.5px] text-ink-3 leading-tight mt-0.5">{hint}</p>
      </div>
    </div>
  )
}

/* TwinThinking — verb previewer (click to launch the overlay) */
function VerbPreviewer() {
  const [active, setActive] = useState<TwinVerbKind | null>(null)
  const verbs = Object.keys(TwinVerb) as TwinVerbKind[]

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {verbs.map(k => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className="text-[12px] font-semibold text-ink-2 bg-card border border-line hover:border-orange/40 hover:text-orange rounded-[10px] py-2.5 transition-colors capitalize">
            {TwinVerb[k].text}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink-3 mt-3">Click a verb → overlay launches. Hit × top-right or wait to dismiss.</p>

      {active && (
        <TwinThinking
          variant="overlay"
          text={TwinVerb[active].text}
          subtext={TwinVerb[active].subtext}
          onCancel={() => setActive(null)}
        />
      )}
    </>
  )
}

/* In-context — looks like a real Twin reply */
function ContextCard({
  active, thinking, speaking, persona,
}: { active: boolean; thinking: boolean; speaking: boolean; persona: 0 | 1 | 2 }) {
  return (
    <div className="bg-card border border-line rounded-[18px] p-5 max-w-[640px]">
      <div className="flex items-start gap-3">
        <TwinOrb size="inline" active={active} thinking={thinking} speaking={speaking} personaTone={persona} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-ink-2 leading-none mb-2">Tiik</p>
          {thinking ? (
            <TwinLoader kind="thinking" size={28} />
          ) : (
            <p className="text-[13.5px] text-ink leading-[1.65]">
              Two roles dropped today that match your Flex above 80%. Senior Product Designer at Linear · Staff Designer at Razorpay. Want me to draft both?
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
