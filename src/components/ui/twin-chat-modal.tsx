'use client'

/**
 * TwinChatModal — the Ruixen pattern, tiikme-fied.
 *
 * Same layout DNA as Ruixen Moon Chat:
 *   · Full-bleed atmospheric background
 *   · Centered AI title + tagline
 *   · Dark glass input at the bottom with auto-resize
 *   · Quick action pill row
 *
 * What's different:
 *   · No moon image — tiikme cosmic gradient (warm purple → near-black)
 *     with a soft Twin orb watermark behind the title
 *   · Title is "Twin" with a persona-aware tagline
 *   · Quick actions are career-relevant, persona-driven
 *   · Send button is gradient orange when there's content
 *   · Close button (×) top-right to dismiss the modal
 *   · ESC closes
 *
 * Usage:
 *   <TwinChatModal
 *     open={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     firstName="Naadhan"
 *     persona="professional"
 *     onSend={(text) => handleSend(text)}
 *   />
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Paperclip,
  ArrowUpIcon,
  X,
  Search,
  Sparkles,
  TrendingUp,
  CalendarDays,
  Users,
  Code2,
  PenLine,
  Target,
  GraduationCap,
  Award,
  Hammer,
  Zap,
  FileText,
  BarChart3,
  UserPlus,
  Briefcase,
  Building2,
  Globe2,
} from 'lucide-react'
import TwinOrb from '@/components/agent/TwinOrb'

type Persona = 'professional' | 'student' | 'org'

interface Props {
  open: boolean
  onClose: () => void
  firstName?: string
  persona?: Persona
  onSend?: (text: string) => void
  defaultMessage?: string
}

interface AutoResizeProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const adjustHeight = useCallback((reset?: boolean) => {
    const ta = textareaRef.current
    if (!ta) return
    if (reset) { ta.style.height = `${minHeight}px`; return }
    ta.style.height = `${minHeight}px`
    const next = Math.max(minHeight, Math.min(ta.scrollHeight, maxHeight ?? Infinity))
    ta.style.height = `${next}px`
  }, [minHeight, maxHeight])

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [minHeight])

  return { textareaRef, adjustHeight }
}

export default function TwinChatModal({
  open,
  onClose,
  firstName = 'there',
  persona = 'professional',
  onSend,
  defaultMessage = '',
}: Props) {
  const [message, setMessage] = useState(defaultMessage)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 48, maxHeight: 160 })

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const submit = () => {
    const text = message.trim()
    if (!text) return
    onSend?.(text)
    setMessage('')
    adjustHeight(true)
  }

  const sendQuick = (text: string) => {
    onSend?.(text)
    onClose()
  }

  const tagline = TAGLINE[persona]
  const actions = QUICK_ACTIONS[persona]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-hidden animate-twin-fade-in"
      style={{
        background:
          // warm orange aurora at top → purple atmosphere → near-black bottom
          'radial-gradient(ellipse 70% 50% at 50% 18%, rgba(255,92,40,.36), transparent 55%),' +
          'radial-gradient(ellipse 90% 70% at 50% 95%, rgba(109,75,216,.32), transparent 55%),' +
          'linear-gradient(180deg, #1A0F1E 0%, #100815 45%, #060309 100%)',
      }}>

      {/* Faint Twin orb watermark behind the title — tiikme's "moon" */}
      <div aria-hidden className="absolute left-1/2 top-[24%] -translate-x-1/2 opacity-[0.12] blur-[2px] pointer-events-none">
        <TwinOrb size={460} halo={false} breathing personaTone={persona === 'student' ? 1 : persona === 'org' ? 2 : 0} />
      </div>

      {/* Star sprinkle for atmospheric depth */}
      <Sprinkle />

      {/* Close button — top-right */}
      <button
        onClick={onClose}
        title="Close (Esc)"
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-[12px] flex items-center justify-center text-white/65 hover:text-white bg-white/8 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-colors">
        <X className="w-4 h-4" />
      </button>

      {/* Centered Twin title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 px-6">
        <h1
          className="text-[44px] lg:text-[60px] font-semibold text-white tracking-tight leading-[1.02] text-center"
          style={{ textShadow: '0 2px 28px rgba(255,92,40,.35)' }}>
          Hi, {firstName}.
        </h1>
        <p className="mt-3 text-[14px] lg:text-[16px] text-white/75 text-center max-w-[520px] leading-relaxed">
          {tagline}
        </p>
        <p className="mt-3 text-[10.5px] font-semibold tracking-[0.18em] uppercase text-white/40">
          tiikme · twin
        </p>
      </div>

      {/* Input box + quick actions */}
      <div className="w-full max-w-3xl mb-[16vh] lg:mb-[18vh] relative z-10 px-4">
        <div
          className={cn(
            'relative bg-black/55 backdrop-blur-xl rounded-2xl border transition-colors',
            message.trim()
              ? 'border-orange/40 shadow-[0_18px_50px_-18px_rgba(255,92,40,.45)]'
              : 'border-white/10 shadow-[0_18px_50px_-20px_rgba(0,0,0,.7)]',
          )}>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); adjustHeight() }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Talk to Twin — paste a JD, ask for jobs, share your resume…"
            className={cn(
              'w-full px-4 py-3 resize-none border-none',
              'bg-transparent text-white text-sm',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'placeholder:text-white/40 min-h-[48px]',
            )}
            style={{ overflow: 'hidden' }}
            autoFocus
          />

          <div className="flex items-center justify-between p-3 pt-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 rounded-[10px]"
              title="Attach a resume (PDF)">
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 mr-1 hidden sm:inline">⏎ send · ⇧⏎ new line</span>
              <Button
                onClick={submit}
                disabled={!message.trim()}
                className={cn(
                  'h-9 w-9 rounded-[10px] flex items-center justify-center p-0 transition-all',
                  message.trim()
                    ? 'bg-gradient-to-br from-[#FF5C28] to-[#FF7A45] text-white hover:opacity-95 shadow-[0_4px_14px_-4px_rgba(255,92,40,.7)]'
                    : 'bg-white/8 text-white/30 cursor-not-allowed hover:bg-white/8',
                )}>
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick actions — persona-aware */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
          {actions.map((a, i) => (
            <QuickAction key={i} icon={a.icon} label={a.label} onClick={() => sendQuick(a.label)} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes twin-fade-in {
          from { opacity: 0; transform: scale(.985); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-twin-fade-in {
          animation: twin-fade-in 260ms cubic-bezier(.2,.7,.2,1);
        }
      `}</style>
    </div>
  )
}

/* ── Quick action pill ── */
function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="flex items-center gap-2 rounded-full border-white/12 bg-white/6 backdrop-blur-md text-white/75 hover:text-white hover:bg-white/12 hover:border-orange/40 h-auto py-1.5 px-3.5">
      <span className="text-orange/90">{icon}</span>
      <span className="text-[11.5px] font-medium">{label}</span>
    </Button>
  )
}

/* ── Star sprinkle ── */
function Sprinkle() {
  const dots = [
    { x: 12, y: 18, s: 1.2, o: 0.35 }, { x: 86, y: 12, s: 1, o: 0.4 },  { x: 28, y: 70, s: 0.8, o: 0.3 },
    { x: 73, y: 60, s: 1.4, o: 0.5 },  { x: 48, y: 88, s: 1, o: 0.35 }, { x: 92, y: 78, s: 1, o: 0.4 },
    { x: 6,  y: 50, s: 0.9, o: 0.3 },  { x: 56, y: 22, s: 1.1, o: 0.4 },{ x: 18, y: 36, s: 0.7, o: 0.25 },
    { x: 64, y: 8,  s: 1.3, o: 0.45 }, { x: 38, y: 54, s: 0.8, o: 0.3 },{ x: 80, y: 38, s: 1, o: 0.4 },
  ]
  return (
    <>
      {dots.map((d, i) => (
        <span key={i} aria-hidden
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.s * 2.4, height: d.s * 2.4,
            opacity: d.o, filter: 'blur(0.4px)',
            animation: `tk-twinkle ${4 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
          }} />
      ))}
      <style>{`@keyframes tk-twinkle{0%,100%{opacity:.2}50%{opacity:.6}}`}</style>
    </>
  )
}

/* ── Persona-aware content ── */
const TAGLINE: Record<Persona, string> = {
  professional: 'Tell me where you want to go. Twin has been reading the market.',
  student:      'Tell me what you want to learn or land — I’ve been watching.',
  org:          'Tell me what you’re hiring for — I’ll surface verified candidates.',
}

const QUICK_ACTIONS: Record<Persona, { icon: React.ReactNode; label: string }[]> = {
  professional: [
    { icon: <Search       className="w-4 h-4" />, label: 'Find me a senior role' },
    { icon: <Sparkles     className="w-4 h-4" />, label: 'Audit my Flex' },
    { icon: <TrendingUp   className="w-4 h-4" />, label: 'Show my salary band' },
    { icon: <CalendarDays className="w-4 h-4" />, label: 'Plan my week' },
    { icon: <Users        className="w-4 h-4" />, label: 'Squad-verify a colleague' },
    { icon: <Code2        className="w-4 h-4" />, label: 'Connect GitHub' },
    { icon: <PenLine      className="w-4 h-4" />, label: 'Draft outreach' },
    { icon: <Target       className="w-4 h-4" />, label: 'Skill gap check' },
  ],
  student: [
    { icon: <Target       className="w-4 h-4" />, label: 'Find me an internship' },
    { icon: <Award        className="w-4 h-4" />, label: 'Best cert for my role' },
    { icon: <Hammer       className="w-4 h-4" />, label: 'Turn project into proof' },
    { icon: <Users        className="w-4 h-4" />, label: 'Get classmate co-sign' },
    { icon: <Sparkles     className="w-4 h-4" />, label: 'Audit my Flex' },
    { icon: <Code2        className="w-4 h-4" />, label: 'Connect GitHub' },
    { icon: <Zap          className="w-4 h-4" />, label: 'Hackathons this weekend' },
    { icon: <GraduationCap className="w-4 h-4" />, label: 'Plan my week' },
  ],
  org: [
    { icon: <Search       className="w-4 h-4" />, label: 'Find verified candidates' },
    { icon: <FileText     className="w-4 h-4" />, label: 'Draft a JD' },
    { icon: <BarChart3    className="w-4 h-4" />, label: 'Check my pipeline' },
    { icon: <CalendarDays className="w-4 h-4" />, label: 'Set up an interview' },
    { icon: <UserPlus     className="w-4 h-4" />, label: 'Invite a teammate' },
    { icon: <Briefcase    className="w-4 h-4" />, label: 'Post a role' },
    { icon: <Building2    className="w-4 h-4" />, label: 'See applications' },
    { icon: <Globe2       className="w-4 h-4" />, label: 'Connect careers page' },
  ],
}
