'use client'

/**
 * Twin Desk v2 — research-driven AI workspace.
 *
 * Composer location decisions:
 *  · HOME (empty)   — composer is the HERO. 640px, multi-line, tools row inside.
 *                     Twin orb (140px) breathes above it. Claude-style.
 *  · THREAD (active) — composer DOCKS at the bottom (sticky), like Claude/ChatGPT.
 *                      Thread scrolls behind it; a soft top-fade hints at content above.
 *
 * Twin presence:
 *  · Replaced the flat logo with <TwinOrb /> — a CSS-animated 3D-feel sphere
 *    with halo, swirl, specular highlight, and breathing scale.
 *
 * Layout: single 720px centered column. No left chat sidebar.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Profile } from '@/lib/types'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import CreateMenu from '@/components/profile/CreateMenu'
import { ToastHost, toast } from '@/components/profile/ui/Toast'
import { Avatar } from '@/components/profile/ui/Primitives'
import TwinThinking from '@/components/agent/TwinThinking'
import { AnimatedText } from '@/components/ui/animated-underline-text-one'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'
import { motion, AnimatePresence } from 'framer-motion'
import { loadOnboarding } from '@/lib/onboarding'
import {
  defaultSessions, suggestions, detectPersona, personaLabel,
  type ChatMessage, type ChatSession, type Citation,
} from '@/stubs/getChat'

async function generateAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  persona: string,
  onChunk: (text: string) => void,
  userId?: string,
  signal?: AbortSignal,
  sessionId?: string,
): Promise<void> {
  try {
    const res = await fetch('/api/twin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, persona, userId, sessionId }),
      signal,
    })
    if (!res.ok || !res.body) { onChunk('\n\n[Tiik is unavailable — try again.]'); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      onChunk(decoder.decode(value, { stream: true }))
    }
  } catch (err) {
    // AbortError is intentional — user stopped generation
    if (err instanceof Error && err.name !== 'AbortError') {
      onChunk('\n\n[Tiik is unavailable — try again.]')
    }
  }
}

interface Props { profile: Profile | null }

export default function AiChatShell({ profile }: Props) {
  const persona = detectPersona(profile)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [onboardName, setOnboardName] = useState<string | null>(null)
  useEffect(() => {
    const s = loadOnboarding()
    if (s.completedAt && s.name) setOnboardName(s.name)
  }, [])

  // Auto-send message when navigated here with ?q= (from "Ask Tiik" in job detail, ATS, audit).
  // Store it in state so send() is available when the effect fires.
  const [pendingQ, setPendingQ] = useState<string | null>(null)
  useEffect(() => {
    const q = searchParams.get('q')
    if (!q) return
    setPendingQ(q)
    router.replace('/', { scroll: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [sessions, setSessions] = useState<ChatSession[]>(defaultSessions())
  const [activeId, setActiveId] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [composerFocus, setComposerFocus] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [todayDismissed, setTodayDismissed] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [chipModal, setChipModal] = useState<{ label: string; query: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortCtrl = useRef<AbortController | null>(null)

  const stopGeneration = () => {
    abortCtrl.current?.abort()
    abortCtrl.current = null
    // Mark any streaming message as done
    setSessions(p => p.map(s => ({
      ...s,
      messages: s.messages
        .filter(m => !m.thinking)
        .map(m => m.streaming ? { ...m, streaming: false } : m),
    })))
    setSending(false)
  }

  const active = sessions.find(s => s.id === activeId) ?? null
  const messages = active?.messages ?? []
  const displayName = onboardName ?? profile?.full_name ?? 'You'
  const firstName = displayName.split(' ')[0]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const newChat = () => { setActiveId(null); setInput('') }

  const send = async (text?: string) => {
    const body = (text ?? input).trim()
    if (!body || sending) return
    setInput(''); setSending(true)

    const userMsg: ChatMessage = { id: 'u'+Date.now(), role:'user', content: body, at:'now' }
    const thinkingMsg: ChatMessage = { id: 't'+Date.now(), role:'assistant', content:'', thinking:true, trace:['Reading your Flex…','Searching roles…','Thinking…'], at:'now' }

    let sessionId = activeId
    const historyForApi: { role: 'user'|'assistant'; content: string }[] = []

    if (!sessionId) {
      sessionId = 'c'+Date.now()
      setSessions(p => [{ id: sessionId!, title: body.slice(0,52), updatedAt:'now', messages:[userMsg, thinkingMsg] }, ...p])
      setActiveId(sessionId)
    } else {
      const existing = sessions.find(s => s.id === sessionId)?.messages ?? []
      historyForApi.push(...existing.filter(m => !m.thinking && m.content).map(m => ({ role: m.role, content: m.content })))
      setSessions(p => p.map(s => s.id === sessionId ? { ...s, messages:[...s.messages, userMsg, thinkingMsg], updatedAt:'now' } : s))
    }
    historyForApi.push({ role:'user', content: body })

    const replyId = 'a'+Date.now()
    let accumulated = ''
    let firstChunk = true

    // Thinking state stays visible until first token arrives — no artificial delay
    abortCtrl.current = new AbortController()
    await generateAI(historyForApi, persona, (chunk) => {
      accumulated += chunk
      if (firstChunk) {
        firstChunk = false
        setSessions(p => p.map(s => {
          if (s.id !== sessionId) return s
          return { ...s, messages:[...s.messages.filter(m => !m.thinking), { id:replyId, role:'assistant' as const, content: accumulated, streaming:true, at:'now' }] }
        }))
      } else {
        setSessions(p => p.map(s => {
          if (s.id !== sessionId) return s
          return { ...s, messages: s.messages.map(m => m.id === replyId ? { ...m, content: accumulated } : m) }
        }))
      }
    }, profile?.id ?? undefined, abortCtrl.current.signal, sessionId)

    setSessions(p => p.map(s => {
      if (s.id !== sessionId) return s
      return { ...s, messages: s.messages.map(m => m.id === replyId ? { ...m, streaming:false } : m) }
    }))
    setSending(false)
  }

  // Fire the pending auto-question (set from ?q= URL param) once send() is in scope.
  useEffect(() => {
    if (!pendingQ || sending) return
    setPendingQ(null)
    send(pendingQ)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQ])

  const remove = (id: string) => {
    setSessions(p => p.filter(s => s.id !== id))
    if (activeId === id) setActiveId(null)
    toast('Chat deleted')
  }

  const regen = async () => {
    if (!activeId || sending) return
    const allMsgs = active?.messages ?? []
    let lastUserIdx = -1
    for (let i = allMsgs.length - 1; i >= 0; i--) {
      if (allMsgs[i].role === 'user') { lastUserIdx = i; break }
    }
    if (lastUserIdx < 0) return
    const sid = activeId
    const historyForApi = allMsgs.slice(0, lastUserIdx + 1).filter(m => !m.thinking && m.content).map(m => ({ role: m.role, content: m.content }))

    setSending(true)
    setSessions(p => p.map(s => {
      if (s.id !== sid) return s
      return { ...s, messages: [...s.messages.slice(0, lastUserIdx + 1), { id:'t'+Date.now(), role:'assistant' as const, content:'', thinking:true, trace:['Rethinking…'], at:'now' }], updatedAt:'now' }
    }))

    const replyId = 'a'+Date.now()
    let accumulated = ''
    let firstChunk = true

    abortCtrl.current = new AbortController()
    await generateAI(historyForApi, persona, chunk => {
      accumulated += chunk
      if (firstChunk) {
        firstChunk = false
        setSessions(p => p.map(s => {
          if (s.id !== sid) return s
          return { ...s, messages:[...s.messages.filter(m => !m.thinking), { id:replyId, role:'assistant' as const, content: accumulated, streaming:true, at:'now' }] }
        }))
      } else {
        setSessions(p => p.map(s => {
          if (s.id !== sid) return s
          return { ...s, messages: s.messages.map(m => m.id === replyId ? { ...m, content: accumulated } : m) }
        }))
      }
    }, profile?.id ?? undefined, abortCtrl.current.signal, sid)
    setSessions(p => p.map(s => {
      if (s.id !== sid) return s
      return { ...s, messages: s.messages.map(m => m.id === replyId ? { ...m, streaming:false } : m) }
    }))
    setSending(false)
  }

  const isThread = !!activeId
  const today = todayCardFor(persona, firstName)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor:'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="home" onCreateClick={()=>setCreateOpen(true)} />

        {/* ── Main column — infinite moving grid backdrop ── */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-background">
          {/* Background — absolute, pointer-events-none, scrolls forever, reveal-on-cursor */}
          <InfiniteGridBackdrop />

          {/* Scrollable area — home is full-bleed; thread is column-constrained */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10">
            {isThread ? (
              <div className="mx-auto px-4 lg:px-8" style={{ maxWidth: 1080 }}>
                <ThreadView
                  messages={messages} profile={profile} firstName={firstName}
                  onBack={newChat}
                  onRegen={regen}
                  onHistory={() => setHistoryOpen(true)}
                  sessionId={activeId ?? ''}
                />
              </div>
            ) : (
              <HomeView
                firstName={firstName} persona={persona}
                today={today} todayDismissed={todayDismissed} onDismissToday={() => setTodayDismissed(true)}
                input={input} setInput={setInput} composerFocus={composerFocus} setComposerFocus={setComposerFocus}
                onSend={send} sending={sending}
                sessions={sessions} onOpenSession={id => setActiveId(id)} onRemoveSession={remove}
                onChipJobClick={(label, query) => setChipModal({ label, query })}
                onOpenHistory={() => setHistoryOpen(true)}
              />
            )}
          </div>

          {/* Bottom-docked composer — glass so the grid shows through */}
          {isThread && (
            <div className="shrink-0 relative z-10 border-t border-line/20 bg-page/30 backdrop-blur-xl">
              <div className="mx-auto px-3 lg:px-8 pt-2.5 pb-3 lg:pb-4" style={{ maxWidth: 960 }}>
                <DockComposer value={input} onChange={setInput} onSend={send} disabled={false} sending={sending} onStop={stopGeneration} />
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileTabBar active="home" onCreateClick={() => setCreateOpen(true)} />
      {createOpen && <CreateMenu onSelect={()=>{}} onClose={()=>setCreateOpen(false)} />}
      {historyOpen && (
        <RecentChatsSheet
          sessions={sessions}
          onOpen={id => { setActiveId(id); setHistoryOpen(false) }}
          onRemove={remove}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {chipModal && (
        <ChipOpenModal
          label={chipModal.label}
          onAskTiik={() => { send(chipModal.label); setChipModal(null) }}
          onOpenJobs={() => { router.push(`/opportunities?q=${encodeURIComponent(chipModal.query)}`); setChipModal(null) }}
          onClose={() => setChipModal(null)}
        />
      )}
      <ToastHost />
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────── */
/*  Home view — orb hero + composer hero                             */
/* ───────────────────────────────────────────────────────────────── */
function HomeView({
  firstName, persona, today, todayDismissed, onDismissToday,
  input, setInput, composerFocus, setComposerFocus, onSend, sending,
  sessions, onOpenSession, onRemoveSession, onChipJobClick, onOpenHistory,
}: {
  firstName: string
  persona: 'professional'|'student'|'org'
  today: { title: string; body: string; cta: string }
  todayDismissed: boolean
  onDismissToday: () => void
  input: string; setInput: (v: string) => void
  composerFocus: boolean; setComposerFocus: (v: boolean) => void
  onSend: (v?: string) => void; sending: boolean
  sessions: ChatSession[]; onOpenSession: (id: string) => void; onRemoveSession: (id: string) => void
  onChipJobClick: (label: string, query: string) => void
  onOpenHistory: () => void
}) {
  const greeting = `Hi, ${firstName}!`
  const chips = suggestionChipsFor(persona)

  return (
    <div className="relative flex w-full flex-col justify-center items-center gap-10 lg:gap-12" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* History icon — top-right of home view */}
      <div className="absolute top-3 right-4 lg:right-6 flex items-center gap-1.5">
        {sessions.length > 0 && (
          <span className="text-[10px] font-semibold text-ink-3 hidden sm:inline">{sessions.length} chat{sessions.length !== 1 ? 's' : ''}</span>
        )}
        <button onClick={onOpenHistory} title="Chat history"
          className="relative w-9 h-9 rounded-[11px] flex items-center justify-center text-ink-2 hover:text-ink hover:bg-card border border-transparent hover:border-line transition-all">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {sessions.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange text-white text-[8px] font-bold flex items-center justify-center leading-none">
              {sessions.length > 9 ? '9+' : sessions.length}
            </span>
          )}
        </button>
      </div>
      {/* Animated greeting */}
      <AnimatedText
        text={greeting}
        textClassName="text-[44px] lg:text-[60px] font-semibold text-ink tracking-tight"
        underlineClassName="text-orange"
        underlineDuration={1.5}
        className="mb-2"
      />

      <div className="w-full px-4 lg:px-10 max-w-[960px] flex flex-col gap-3.5">
        {/* Suggestion chips above the composer */}
        <div className="flex items-center justify-center flex-wrap gap-2">
          {chips.map((c, i) => (
            <button
              key={i}
              onClick={() => c.jobSearch ? onChipJobClick(c.label, c.searchQuery ?? c.label) : onSend(c.label)}
              className="inline-flex items-center gap-1.5 rounded-full bg-card/70 hover:bg-card dark:bg-card/80 dark:hover:bg-card border border-line/70 hover:border-orange/40 backdrop-blur-md px-3 py-1.5 text-[11.5px] font-medium text-ink-2 hover:text-ink transition-colors shadow-[0_2px_8px_-4px_rgba(0,0,0,.08)]">
              <span className="text-[13px] leading-none">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Composer wrapper with bottom-inner glow */}
        <div className="relative">
          <div aria-hidden className="absolute inset-x-6 -bottom-4 h-12 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,92,40,.22), transparent 70%)', filter: 'blur(20px)' }} />
          <DockComposer value={input} onChange={setInput} onSend={onSend} disabled={false} sending={sending} />
        </div>
      </div>

    </div>
  )
}

type Chip = { icon: string; label: string; jobSearch?: boolean; searchQuery?: string }

/* Persona-aware suggestion chips above the empty composer */
function suggestionChipsFor(persona: 'professional'|'student'|'org'): Chip[] {
  if (persona === 'org') return [
    { icon: '🔍', label: 'Find verified candidates' },
    { icon: '📝', label: 'Draft a JD' },
    { icon: '📊', label: 'Check my pipeline' },
    { icon: '💼', label: 'Post a role' },
  ]
  if (persona === 'student') return [
    { icon: '🎯', label: 'Find me an internship', jobSearch: true, searchQuery: 'internship' },
    { icon: '🎖', label: 'Best cert for my role' },
    { icon: '👥', label: 'Get classmate co-sign' },
    { icon: '✨', label: 'Audit my Flex' },
  ]
  return [
    { icon: '🔍', label: 'Find me a senior role', jobSearch: true, searchQuery: 'senior' },
    { icon: '✨', label: 'Audit my Flex' },
    { icon: '💰', label: 'Show my salary band' },
    { icon: '📅', label: 'Plan my week' },
  ]
}

/* ── Recent chats slide-over · search + groups + hover actions + undo delete ── */
function RecentChatsSheet({
  sessions, onOpen, onRemove, onClose,
}: { sessions: ChatSession[]; onOpen: (id: string) => void; onRemove: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  // Soft-delete: id → pending purge timeout
  const [pending, setPending] = useState<Set<string>>(new Set())

  const softDelete = (id: string) => {
    setPending(p => { const n = new Set(p); n.add(id); return n })
    // After 5s, actually remove
    setTimeout(() => {
      setPending(p => {
        if (!p.has(id)) return p
        const n = new Set(p); n.delete(id)
        onRemove(id)
        return n
      })
    }, 5000)
  }
  const undo = (id: string) => {
    setPending(p => { const n = new Set(p); n.delete(id); return n })
  }

  const filtered = sessions.filter(s => !q || s.title.toLowerCase().includes(q.toLowerCase()))
  const grouped = groupSessionsByTime(filtered)

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-ink/25 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="relative w-full max-w-[380px] h-full overflow-y-auto bg-card border-l border-line shadow-[-12px_0_40px_-12px_rgba(0,0,0,.18)]">

        <div className="sticky top-0 z-10 bg-card border-b border-line px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">Recent chats</p>
            <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors w-7 h-7 rounded-[8px] hover:bg-line flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-page border border-line rounded-[12px] px-3 py-2 focus-within:border-orange/40 focus-within:shadow-[0_0_0_3px_rgba(255,92,40,.08)] transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-[12.5px] text-ink placeholder-ink-3 outline-none"
            />
          </div>
        </div>

        {grouped.map(group => (
          <div key={group.label} className="pb-1">
            <p className="px-5 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">{group.label}</p>
            <div className="px-2 space-y-0.5">
              {group.items.map(s => {
                const isPending = pending.has(s.id)
                if (isPending) {
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 mx-0 bg-red/[.06] rounded-[12px] border border-red/15">
                      <span className="w-7 h-7 rounded-[8px] bg-red/15 text-red flex items-center justify-center text-[11px] shrink-0">×</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] text-ink-3 italic truncate leading-tight line-through">{s.title}</p>
                        <p className="text-[10px] text-ink-3 leading-none mt-0.5">Deleting in 5s…</p>
                      </div>
                      <button onClick={() => undo(s.id)}
                        className="text-[11px] font-semibold text-orange hover:text-orange-2 transition-colors px-2.5 py-1.5 rounded-[8px] bg-orange-soft">
                        Undo
                      </button>
                    </div>
                  )
                }
                return (
                  <div key={s.id}
                       className="group flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-line cursor-pointer transition-colors"
                       onClick={() => onOpen(s.id)}>
                    <span className="w-7 h-7 rounded-[8px] bg-orange-soft text-orange flex items-center justify-center text-[11px] shrink-0">✦</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-ink truncate leading-tight">{s.title}</p>
                      <p className="text-[10.5px] text-ink-3 leading-none mt-0.5">{s.updatedAt}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                      <RowAction title="Pin" onClick={(e) => { e.stopPropagation(); toast('Pinned ✓') }}>
                        <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14V8a4 4 0 00-4-4H9a4 4 0 00-4 4v9z"/>
                      </RowAction>
                      <RowAction title="Delete" onClick={(e) => { e.stopPropagation(); softDelete(s.id) }} danger>
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                      </RowAction>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="px-5 py-10 text-[12px] text-ink-3 italic text-center">
            {q ? 'No chats match.' : 'No chats yet.'}
          </p>
        )}
      </motion.aside>
    </div>
  )
}

/* ── Chip action modal: job-search chips show "Ask Tiik" vs "Open in Jobs" ── */
function ChipOpenModal({ label, onAskTiik, onOpenJobs, onClose }: {
  label: string; onAskTiik: () => void; onOpenJobs: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-ink/25 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-card rounded-[24px] border border-line shadow-[0_24px_60px_-16px_rgba(0,0,0,.22)] p-5 mb-4 sm:mb-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-1">Where should Tiik take you?</p>
        <p className="text-[14px] font-semibold text-ink mb-4 leading-snug">&ldquo;{label}&rdquo;</p>
        <div className="flex flex-col gap-2.5">
          <button onClick={onAskTiik}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] bg-page border border-line hover:border-orange/30 transition-colors text-left">
            <span className="w-8 h-8 rounded-[10px] bg-orange-soft text-orange flex items-center justify-center shrink-0 text-[14px]">✦</span>
            <div>
              <p className="text-[13px] font-semibold text-ink">Ask Tiik here</p>
              <p className="text-[11px] text-ink-3">Get an AI answer with your Flex context</p>
            </div>
          </button>
          <button onClick={onOpenJobs}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] bg-gradient-to-br from-orange/10 to-orange-2/5 border border-orange/20 hover:border-orange/40 transition-colors text-left">
            <span className="w-8 h-8 rounded-[10px] bg-orange text-white flex items-center justify-center shrink-0 text-[14px]">💼</span>
            <div>
              <p className="text-[13px] font-semibold text-ink">Open in Jobs</p>
              <p className="text-[11px] text-ink-3">Browse with filters auto-applied</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function RowAction({ title, onClick, children, danger }: { title: string; onClick: (e: React.MouseEvent) => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={[
        'w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors',
        danger ? 'text-ink-3 hover:text-red hover:bg-red/10' : 'text-ink-3 hover:text-ink hover:bg-page',
      ].join(' ')}>
      <svg width="12.5" height="12.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  )
}

/* Group sessions into Today / This week / Earlier based on `updatedAt` string. */
function groupSessionsByTime(sessions: ChatSession[]): { label: string; items: ChatSession[] }[] {
  const today: ChatSession[] = []
  const week: ChatSession[] = []
  const earlier: ChatSession[] = []
  for (const s of sessions) {
    const t = s.updatedAt.toLowerCase()
    if (t === 'now' || t.includes('h ago') || t.includes('m ago') || t === 'today') today.push(s)
    else if (t === 'yesterday' || (t.includes('d ago') && parseInt(t) <= 7) || t.includes('mon') || t.includes('tue') || t.includes('wed') || t.includes('thu') || t.includes('fri') || t.includes('sat') || t.includes('sun')) week.push(s)
    else earlier.push(s)
  }
  const groups: { label: string; items: ChatSession[] }[] = []
  if (today.length)   groups.push({ label: 'Today',     items: today })
  if (week.length)    groups.push({ label: 'This week', items: week })
  if (earlier.length) groups.push({ label: 'Earlier',   items: earlier })
  return groups
}

/* ── Persona-aware quick actions ── */
function quickActionsFor(persona: 'professional'|'student'|'org'): { icon: string; label: string }[] {
  if (persona === 'org') return [
    { icon: '🔍', label: 'Find verified candidates' },
    { icon: '📝', label: 'Draft a JD' },
    { icon: '📊', label: 'Check my pipeline' },
    { icon: '📅', label: 'Set up an interview' },
    { icon: '👥', label: 'Invite a teammate' },
    { icon: '💼', label: 'Post a role' },
    { icon: '📈', label: 'See applications' },
    { icon: '🏢', label: 'Connect careers page' },
  ]
  if (persona === 'student') return [
    { icon: '🎯', label: 'Find me an internship' },
    { icon: '🎖', label: 'Best cert for my role' },
    { icon: '🛠', label: 'Turn project into proof' },
    { icon: '👥', label: 'Get classmate co-sign' },
    { icon: '✨', label: 'Audit my Flex' },
    { icon: '🔗', label: 'Connect GitHub' },
    { icon: '⚡', label: 'Hackathons this weekend' },
    { icon: '📅', label: 'Plan my week' },
  ]
  return [
    { icon: '🔍', label: 'Find me a senior role' },
    { icon: '✨', label: 'Audit my Flex' },
    { icon: '💰', label: 'Show my salary band' },
    { icon: '📅', label: 'Plan my week' },
    { icon: '👥', label: 'Squad-verify a colleague' },
    { icon: '🔗', label: 'Connect GitHub' },
    { icon: '📝', label: 'Draft outreach' },
    { icon: '🎯', label: 'Skill gap check' },
  ]
}

/* ───────────────────────────────────────────────────────────────── */
/*  Thread view — messages stack, composer docks at bottom           */
/* ───────────────────────────────────────────────────────────────── */
function ThreadView({
  messages, profile, firstName, onBack, onRegen, onHistory, sessionId,
}: {
  messages: ChatMessage[]; profile: Profile | null; firstName: string
  onBack: () => void; onRegen: () => void; onHistory: () => void
  sessionId: string
}) {
  return (
    <div className="pt-5 pb-10">
      {/* Thread header — original position, no back button */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink leading-none">Tiik</p>
          <p className="text-[10px] text-ink-3 leading-none mt-0.5">Working with your verified Flex</p>
        </div>
        <button onClick={onHistory} className="w-8 h-8 rounded-[10px] text-ink-3 hover:text-ink hover:bg-card transition-colors flex items-center justify-center" title="Chat history">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        <button onClick={onBack} className="h-7 px-2.5 rounded-[9px] text-[11px] font-semibold text-ink-3 hover:text-ink hover:bg-card border border-transparent hover:border-line transition-all">
          + New
        </button>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {messages.map(m => (
          <MessageBubble key={m.id} m={m} profile={profile} firstName={firstName}
            onRegen={onRegen} sessionId={sessionId} />
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────── */
/*  Composer — the hero. Multi-line. Tools row inside.               */
/* ───────────────────────────────────────────────────────────────── */
function Composer({
  value, onChange, onSend, focused, setFocused, disabled, compact,
}: {
  value: string; onChange: (v: string) => void; onSend: (v?: string) => void
  focused: boolean; setFocused: (v: boolean) => void; disabled: boolean
  compact?: boolean
}) {
  const minRows = compact ? 1 : 3
  return (
    <div
      className={[
        'rounded-[22px] bg-card transition-all',
        focused
          ? 'border border-orange/30 shadow-[0_18px_40px_-18px_rgba(255,92,40,.25),0_2px_10px_rgba(0,0,0,.04)]'
          : 'border border-line shadow-[0_8px_24px_-14px_rgba(0,0,0,.10)]',
      ].join(' ')}>
      <div className="px-4 pt-4">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder="Talk to Tiik — paste a JD, ask for jobs, share your resume…"
          rows={minRows}
          disabled={disabled}
          className="w-full bg-transparent text-[14.5px] text-ink placeholder-ink-3 outline-none resize-none leading-[1.55] py-0"
          style={{ minHeight: compact ? 24 : 60, maxHeight: 200 }}
        />
      </div>

      {/* Tools row — inside the box, divider above */}
      <div className="px-3 pb-3 pt-2 mt-2 border-t border-line/60 flex items-center gap-1">
        <ToolChip icon={<><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></>}>
          <label className="cursor-pointer">
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e)=>{ if(e.target.files?.[0]) toast('PDF received — reading your resume…') }} />
            Attach
          </label>
        </ToolChip>
        <ToolChip icon={<><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
          onClick={() => toast('Voice mode — coming soon')}>
          Voice
        </ToolChip>
        <ToolChip icon={<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>}
          onClick={() => toast('Twin will read your verified Flex on every reply.')}>
          Flex on
        </ToolChip>

        <div className="flex-1" />

        <span className="text-[10px] text-ink-3 mr-1 hidden sm:inline">⏎ send · ⇧⏎ new line</span>

        <button onClick={() => onSend()} disabled={!value.trim() || disabled}
          className={[
            'rounded-[12px] flex items-center justify-center transition-all shrink-0',
            value.trim() && !disabled
              ? 'w-9 h-9 bg-gradient-to-br from-orange to-orange-2 text-white hover:opacity-95 shadow-[0_3px_10px_-3px_rgba(255,92,40,.5)]'
              : 'w-9 h-9 bg-page text-ink-3'
          ].join(' ')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ── Compact single-row dock composer ── */
function DockComposer({ value, onChange, onSend, disabled, sending, onStop }: {
  value: string; onChange: (v: string) => void; onSend: (v?: string) => void
  disabled: boolean; sending?: boolean; onStop?: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [value])

  return (
    <div className={[
      'flex items-end gap-2 rounded-[22px] bg-card/55 backdrop-blur-xl border px-3 py-2.5 transition-all',
      focused ? 'border-orange/40 shadow-[0_0_0_3px_rgba(255,92,40,.08)]' : 'border-line/60 shadow-sm',
    ].join(' ')}>
      <label className="w-8 h-8 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-line transition-colors shrink-0 mb-0.5 cursor-pointer">
        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={() => toast('File received — processing…')} />
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
        placeholder="Message Tiik…"
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent text-[14px] text-ink placeholder-ink-3 outline-none resize-none leading-[1.5] py-1.5"
        style={{ minHeight: 24, maxHeight: 140 }}
      />
      {sending ? (
        /* Stop button — shown while generating */
        <button onClick={onStop}
          className="w-8 h-8 rounded-[10px] bg-ink/8 border border-line hover:bg-ink/14 text-ink flex items-center justify-center shrink-0 mb-0.5 transition-colors"
          title="Stop generating">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="0" y="0" width="10" height="10" rx="2"/></svg>
        </button>
      ) : value.trim() ? (
        <button onClick={() => onSend()} disabled={disabled}
          className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-orange to-orange-2 text-white flex items-center justify-center shadow-[0_3px_10px_-3px_rgba(255,92,40,.5)] hover:opacity-95 transition-opacity shrink-0 mb-0.5 disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      ) : (
        <button onClick={() => toast('Voice mode — coming soon')}
          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-line transition-colors shrink-0 mb-0.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
      )}
    </div>
  )
}

function ToolChip({ icon, onClick, children }: { icon: React.ReactNode; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-2 hover:text-ink hover:bg-page transition-colors px-2.5 py-1.5 rounded-[10px]">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      {children}
    </button>
  )
}

/* ───────────────────────────────────────────────────────────────── */
/*  Today card                                                       */
/* ───────────────────────────────────────────────────────────────── */
function TodayCard({
  title, body, cta, onCta, onDismiss,
}: { title: string; body: string; cta: string; onCta: () => void; onDismiss: () => void }) {
  return (
    <div className="relative rounded-[20px] p-5 mt-6 border border-orange/15 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, rgba(255,92,40,.06) 0%, var(--color-card) 65%)' }}>
      <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(255,92,40,.18), transparent 65%)', filter: 'blur(22px)' }} />

      <div className="relative flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Today</p>
          <p className="text-[15px] font-semibold text-ink mt-1 leading-snug">{title}</p>
          <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">{body}</p>

          <div className="mt-3 flex items-center gap-2">
            <button onClick={onCta}
              className="text-[12.5px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] px-3.5 py-2 hover:opacity-95 transition-opacity shadow-[0_3px_10px_-3px_rgba(255,92,40,.45)]">
              {cta} →
            </button>
            <button onClick={onDismiss}
              className="text-[11px] font-semibold text-ink-3 hover:text-ink transition-colors px-2 py-2">
              Not now
            </button>
          </div>
        </div>

        <button onClick={onDismiss} className="absolute top-0 right-0 w-7 h-7 rounded-[8px] text-ink-3 hover:text-ink hover:bg-card transition-colors flex items-center justify-center" title="Dismiss">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────── */
/*  Suggestions + Recent                                             */
/* ───────────────────────────────────────────────────────────────── */
function TwoSuggestions({ persona, onPick }: { persona: 'professional'|'student'|'org'; onPick: (q: string) => void }) {
  const sug = suggestions(persona).slice(0, 2)
  return (
    <div className="mt-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-3">Try</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sug.map((s, i) => (
          <button key={i} onClick={() => onPick(s.label)}
            className="flex items-start gap-3 bg-card rounded-[14px] p-4 text-left border border-line hover:border-orange/40 transition-all group">
            <span className="text-[16px] leading-none mt-0.5 shrink-0">{s.icon}</span>
            <span className="text-[13px] font-medium text-ink-2 group-hover:text-ink transition-colors leading-snug">{s.label}</span>
            <svg className="ml-auto opacity-0 group-hover:opacity-100 text-orange transition-all shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </div>
  )
}

function RecentChats({
  sessions, onOpen, onRemove,
}: { sessions: ChatSession[]; onOpen: (id: string) => void; onRemove: (id: string) => void }) {
  if (sessions.length === 0) return null
  return (
    <div className="mt-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-3">Recent chats</p>
      <div className="rounded-[14px] border border-line bg-card divide-y divide-line overflow-hidden">
        {sessions.map(s => (
          <div key={s.id}
               className="group flex items-center gap-3 px-4 py-2.5 hover:bg-page transition-colors cursor-pointer"
               onClick={() => onOpen(s.id)}>
            <span className="w-6 h-6 rounded-[7px] bg-orange-soft text-orange flex items-center justify-center text-[10px] shrink-0">✦</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-ink truncate leading-tight">{s.title}</p>
              <p className="text-[10px] text-ink-3 leading-none mt-0.5">{s.updatedAt}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); onRemove(s.id) }}
              className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red transition-all"
              title="Delete chat">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────── */
/*  Message bubble + reasoning                                       */
/* ───────────────────────────────────────────────────────────────── */
const TRUNCATE_AT = 300

function MessageBubble({
  m, profile, firstName, onRegen, sessionId,
}: {
  m: ChatMessage; profile: Profile | null; firstName: string
  onRegen: () => void; sessionId: string
}) {
  const isUser = m.role === 'user'
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null)
  const router = useRouter()

  const copyContent = () => {
    navigator.clipboard.writeText(m.content).then(() => toast('Copied ✓')).catch(() => toast('Copy failed'))
  }

  const giveFeedback = (type: 'liked' | 'disliked') => {
    if (feedback) return  // already rated
    setFeedback(type)
    toast(type === 'liked' ? 'Thanks — Tiik learns from this ✓' : 'Noted — Tiik will improve')
    // Persist to ai_messages for training pipeline
    if (sessionId && m.content) {
      fetch('/api/tiik/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: m.content, rating: type === 'liked' ? 1 : -1 }),
      }).catch(() => {})
    }
  }

  // ──── USER ──── glossy orange bubble, right-aligned
  if (isUser) {
    const isLong = m.content.length > TRUNCATE_AT
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex justify-end gap-2.5 lg:gap-3 pl-[10%] lg:pl-[18%]">
        <div className="max-w-full flex flex-col items-end">
          <p className="hidden lg:block text-[11.5px] font-semibold text-ink leading-none mb-2 px-1">{firstName}</p>
          <div className="relative overflow-hidden bg-gradient-to-br from-orange to-orange-2 text-white text-[14.5px] lg:text-[15px] leading-[1.65] rounded-[18px] rounded-tr-[5px] px-4 py-3 shadow-[0_4px_16px_-8px_rgba(255,92,40,.5)]">
            <span aria-hidden className="absolute inset-x-0 top-0 h-[60%] pointer-events-none rounded-t-[22px]"
                  style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,.28), rgba(255,255,255,0))' }} />
            <span aria-hidden className="absolute top-0 inset-x-6 h-px pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,.6), transparent)' }} />
            <span className="relative">
              {isLong && !expanded ? (
                <>{m.content.slice(0, TRUNCATE_AT)}<button onClick={() => setExpanded(true)} className="font-semibold opacity-75 hover:opacity-100 underline underline-offset-1 ml-0.5 transition-opacity">…more</button></>
              ) : (
                <>{renderMd(m.content)}{isLong && <button onClick={() => setExpanded(false)} className="font-semibold opacity-75 hover:opacity-100 ml-1.5 transition-opacity">↑ less</button>}</>
              )}
            </span>
          </div>
        </div>
        <Avatar name={firstName} src={profile?.avatar_url} size={28} />
      </motion.div>
    )
  }

  // ──── TIIK ──── clean prose, left-aligned, Claude-style (no card box)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex gap-3">
      {/* Tiik avatar */}
      <span className="w-7 h-7 rounded-[9px] bg-card border border-line text-orange flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,.10)]">
        T
      </span>

      <div className="flex-1 min-w-0 pb-1">
        <p className="text-[11.5px] font-semibold text-ink leading-none mb-2.5">Tiik</p>

        {m.thinking ? (
          <div className="py-1">
            <WaveThinking />
          </div>
        ) : (
          <div>
            {m.trace && m.trace.length > 0 && !m.streaming && <ReasoningChevron lines={m.trace} />}

            <div className="text-[15px] text-ink leading-[1.7] [&_strong]:font-semibold [&_strong]:text-ink [&_code]:text-[13.5px]">
              {renderMd(m.content)}
              {m.streaming && <StreamingCursor />}
            </div>

            {!m.streaming && m.citations && m.citations.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {m.citations.slice(0, 5).map((c, i) => <CitationCard key={i} c={c} idx={i+1} />)}
                {m.citations.length > 5 && (
                  <button onClick={() => router.push(`/opportunities?q=${encodeURIComponent(m.citations![0].title)}`)}
                    className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors py-1 text-left">
                    See {m.citations.length - 5} more in Jobs →
                  </button>
                )}
              </div>
            )}

            {!m.streaming && (
              <div className="flex items-center gap-0.5 mt-3 -ml-1.5">
                <ActionBtn label="Copy" active={false} onClick={copyContent}>
                  <path d="M9 4h11a2 2 0 012 2v11"/><rect x="3" y="9" width="13" height="13" rx="2"/>
                </ActionBtn>
                <ActionBtn label="Regenerate" active={false} onClick={onRegen}>
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </ActionBtn>
                <ActionBtn label="Good" active={feedback === 'liked'} onClick={() => giveFeedback('liked')}>
                  <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                </ActionBtn>
                <ActionBtn label="Not great" active={feedback === 'disliked'} onClick={() => giveFeedback('disliked')}>
                  <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                </ActionBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── ThinkingDots — clean Claude-style "Thinking..." with elapsed time ── */
function WaveThinking() {
  const [seconds, setSeconds] = useState(0)
  const [dot, setDot] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000)
    const dots  = setInterval(() => setDot(d => (d + 1) % 4), 500)
    return () => { clearInterval(timer); clearInterval(dots) }
  }, [])

  const dotStr = '.'.repeat(dot)
  return (
    <span className="text-[14px] text-ink-2 font-medium select-none">
      Thinking{dotStr}
      {seconds > 2 && <span className="text-ink-3 text-[12px] ml-1.5">{seconds}s</span>}
    </span>
  )
}

/* Subtle streaming cursor — fading dot */
function StreamingCursor() {
  return (
    <span className="inline-block w-1 h-1 rounded-full bg-ink-3 ml-0.5 align-middle"
          style={{ animation: 'tk-cursor 1.2s ease-in-out infinite' }}>
      <style>{`@keyframes tk-cursor{0%,100%{opacity:0.2}50%{opacity:0.7}}`}</style>
    </span>
  )
}

function ReasoningPill({ lines }: { lines: string[] }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step >= lines.length - 1) return
    const t = setInterval(() => setStep(s => Math.min(s + 1, lines.length - 1)), 380)
    return () => clearInterval(t)
  }, [lines.length, step])

  return (
    <div className="inline-flex items-center gap-2 bg-card border border-line rounded-full pl-2 pr-3 py-1.5 text-[11.5px] text-ink-2">
      <Spinner />
      <span className="font-medium">{lines[step]}</span>
    </div>
  )
}

function ReasoningChevron({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-2">
      <button onClick={() => setOpen(o => !o)} className="text-[10.5px] font-medium text-ink-3 hover:text-ink-2 transition-colors inline-flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}><polyline points="9 18 15 12 9 6"/></svg>
        Reasoning ({lines.length} steps)
      </button>
      {open && (
        <div className="mt-2 ml-3 pl-3 border-l-2 border-orange/20 space-y-1">
          {lines.map((l, i) => <p key={i} className="text-[11px] text-ink-3 leading-snug">{l}</p>)}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-orange/30 border-t-orange shrink-0" style={{ animation:'tk-spin .6s linear infinite' }}>
      <style>{`@keyframes tk-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}

// ── Inline markdown: **bold**, *italic*, `code`, [text](url) ──────────────
function parseInline(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(\*\*(.+?)\*\*|\*([^*]+?)\*|`([^`]+?)`|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out.push(str.slice(last, m.index))
    if (m[0].startsWith('**'))   out.push(<strong key={m.index} className="font-semibold text-ink">{m[2]}</strong>)
    else if (m[0].startsWith('*')) out.push(<em key={m.index}>{m[3]}</em>)
    else if (m[0].startsWith('`')) out.push(<code key={m.index} className="bg-line rounded px-1.5 py-0.5 text-[13px] font-mono text-orange">{m[4]}</code>)
    else out.push(<a key={m.index} href={m[6]} className="text-orange underline underline-offset-2 hover:text-orange-2 transition-colors">{m[5]}</a>)
    last = m.index + m[0].length
  }
  if (last < str.length) out.push(str.slice(last))
  return out
}

// ── Block markdown renderer ────────────────────────────────────────────────
function renderMd(text: string): React.ReactNode {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()

    // blank line — separator
    if (line.trim() === '') { i++; continue }

    // horizontal rule ━━━ or --- or ───
    if (/^[━─\-]{3,}$/.test(line.trim())) {
      blocks.push(<hr key={i} className="border-line my-3" />)
      i++; continue
    }

    // headings
    if (line.startsWith('### ')) {
      blocks.push(<p key={i} className="text-[12px] font-bold uppercase tracking-widest text-ink-2 mt-4 mb-1">{parseInline(line.slice(4))}</p>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      blocks.push(<p key={i} className="text-[15px] font-bold text-ink mt-3 mb-1">{parseInline(line.slice(3))}</p>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      blocks.push(<p key={i} className="text-[16px] font-bold text-ink mt-3 mb-1">{parseInline(line.slice(2))}</p>)
      i++; continue
    }

    // unordered list — -, *, •
    if (/^[-*•] /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-*•] /.test(lines[i].trimEnd())) {
        const content = lines[i].trimEnd().replace(/^[-*•] /, '')
        items.push(
          <li key={i} className="flex gap-2 items-start leading-[1.65]">
            <span className="shrink-0 text-ink-3 mt-[1px] select-none">•</span>
            <span className="flex-1">{parseInline(content)}</span>
          </li>
        )
        i++
      }
      blocks.push(<ul key={`ul${i}`} className="space-y-1 my-2 pl-1">{items}</ul>)
      continue
    }

    // ordered list — 1. 2. etc
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = []
      let n = 1
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimEnd())) {
        const content = lines[i].trimEnd().replace(/^\d+\.\s/, '')
        items.push(
          <li key={i} className="flex gap-2 items-start leading-[1.65]">
            <span className="shrink-0 text-ink-3 font-medium tabular-nums min-w-[1.2em] select-none">{n++}.</span>
            <span className="flex-1">{parseInline(content)}</span>
          </li>
        )
        i++
      }
      blocks.push(<ol key={`ol${i}`} className="space-y-1 my-2 pl-1">{items}</ol>)
      continue
    }

    // regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[-*•] /.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('#') &&
      !/^[━─\-]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trimEnd())
      i++
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p key={`p${i}`} className="mb-2 last:mb-0">{parseInline(paraLines.join(' '))}</p>
      )
    }
  }

  return <div className="space-y-0.5">{blocks}</div>
}

function CitationCard({ c, idx }: { c: Citation; idx: number }) {
  const KIND_ICON: Record<Citation['kind'], string> = { job:'💼', course:'📘', person:'👤', profile:'✨', org:'🏢', gap:'🌱' }
  const [jobModal, setJobModal] = useState(false)
  const router = useRouter()
  const isJob = c.kind === 'job'

  const handleClick = (e: React.MouseEvent) => {
    if (isJob) { e.preventDefault(); setJobModal(true) }
  }

  return (
    <div>
      <a href={isJob ? '#' : c.href} onClick={handleClick}
        className="bg-card rounded-[12px] border border-line p-3 flex items-start gap-2.5 hover:border-orange/40 transition-colors cursor-pointer">
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white text-[13px] shrink-0 relative" style={{ backgroundColor: c.color ?? 'var(--color-ink-3)' }}>
          {KIND_ICON[c.kind]}
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-card border border-line text-[8px] font-bold text-ink-2 flex items-center justify-center">{idx}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-ink truncate">{c.title}</p>
          {c.sub && <p className="text-[11px] text-ink-2 truncate">{c.sub}</p>}
          {c.meta && <p className="text-[10px] text-orange mt-0.5">{c.meta}</p>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
      {jobModal && (
        <div className="mt-1.5 rounded-[12px] bg-card border border-orange/20 px-3.5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-semibold text-ink truncate">Open this role?</p>
            <p className="text-[10.5px] text-ink-3 mt-0.5 truncate">{c.sub}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setJobModal(false)}
              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-line transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button onClick={() => { router.push(`/opportunities?q=${encodeURIComponent(c.title)}`); setJobModal(false) }}
              className="text-[11.5px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 px-3 py-1.5 rounded-[8px] hover:opacity-95 transition-opacity">
              Open in Jobs →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label}
      className={['w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors',
        active ? 'text-orange bg-orange-soft' : 'text-ink-3 hover:text-ink hover:bg-line',
      ].join(' ')}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  )
}

/* ───────────────────────────────────────────────────────────────── */
/*  Helpers                                                          */
/* ───────────────────────────────────────────────────────────────── */
function prettyDate(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

/** Pick the right verb from Twin's trace so the loader says what it's actually doing. */
function pickVerb(trace?: string[]): string {
  const joined = (trace ?? []).join(' ').toLowerCase()
  if (joined.includes('match') || joined.includes('rank'))   return 'Matching'
  if (joined.includes('draft'))                              return 'Drafting'
  if (joined.includes('audit') || joined.includes('review')) return 'Auditing'
  if (joined.includes('build'))                              return 'Building'
  if (joined.includes('send'))                               return 'Sending'
  return 'Thinking'
}

function todayCardFor(persona: 'professional'|'student'|'org', firstName: string): { title: string; body: string; cta: string } {
  if (persona === 'org') return {
    title: 'A Senior Designer matched your open Zeta role above 88%.',
    body: 'I have their verified Figma squads and 2 mutual peers. Want me to draft the reach-out?',
    cta: 'Show me the candidate',
  }
  if (persona === 'student') return {
    title: `You're 1 cert away from a paid Razorpay internship.`,
    body: 'Free Razorpay Payments cert · 4 hours. I can save the role and pace your week.',
    cta: 'Plan my week',
  }
  return {
    title: 'Two roles dropped today that match your Flex above 80%.',
    body: 'Senior Product Designer at Linear · Staff Designer at Razorpay. Want me to draft both?',
    cta: 'Draft them',
  }
}
