'use client'

/**
 * NotificationBell — drop into TopBar.
 *
 * Polls unread count every 30s. Click → opens slide-over panel.
 */

import { useEffect, useState } from 'react'
import {
  listNotifications, unreadCount, markRead, markAllRead,
  NOTIF_ICON, NOTIF_TINT,
  type Notification,
} from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // Realtime subscription — zero polling at any DAU
  useEffect(() => {
    let alive = true
    const supabase = createClient()
    const refresh = async () => { const n = await unreadCount(); if (alive) setUnread(n) }
    refresh()

    // Subscribe to INSERT on notifications for current user
    const channel = supabase
      .channel('notif-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        if (alive) refresh().catch(() => {/* transient, ignore */})
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        if (alive) refresh().catch(() => {/* transient, ignore */})
      })
      .subscribe()

    return () => { alive = false; supabase.removeChannel(channel) }
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Notifications"
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-ink-2 hover:text-ink hover:bg-page transition-colors">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && <NotificationsPanel onClose={() => setOpen(false)} onChange={async () => setUnread(await unreadCount())} />}
    </>
  )
}

/* ── Slide-over panel ── */
function NotificationsPanel({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => { setLoading(true); setItems(await listNotifications(50)); setLoading(false) }
  useEffect(() => { refresh() }, [])

  const onClick = async (n: Notification) => {
    await markRead(n.id)
    onChange()
    if (n.action_url) location.assign(n.action_url)
  }
  const onAll = async () => { await markAllRead(); await refresh(); onChange() }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-ink/25 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="relative w-full max-w-[400px] h-full overflow-y-auto bg-card/95 backdrop-blur-xl border-l border-line shadow-[-12px_0_40px_-12px_rgba(0,0,0,.18)]">

        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-line px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">Notifications</p>
            <div className="flex items-center gap-2">
              {items.some(i => !i.read_at) && (
                <button onClick={onAll} className="text-[11px] font-semibold text-orange hover:text-orange-2">
                  Mark all read
                </button>
              )}
              <button onClick={onClose} className="text-ink-3 hover:text-ink w-7 h-7 rounded-[8px] hover:bg-page/80 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="text-[12px] text-ink-3 py-10 text-center">Loading…</p>}

        {!loading && items.length === 0 && (
          <p className="px-5 py-10 text-[12px] text-ink-3 italic text-center">No notifications yet.</p>
        )}

        <div className="px-2 py-3 space-y-1">
          {items.map(n => (
            <button key={n.id} onClick={() => onClick(n)}
              className={[
                'w-full flex items-start gap-3 p-3 rounded-[12px] text-left transition-colors',
                n.read_at ? 'hover:bg-white/70' : 'bg-orange-soft/30 hover:bg-orange-soft/50',
              ].join(' ')}>
              <span className={`w-7 h-7 rounded-[9px] flex items-center justify-center text-[12px] font-bold shrink-0 ${NOTIF_TINT[n.kind]}`}>
                {NOTIF_ICON[n.kind]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-ink leading-tight">{n.title}</p>
                {n.body && <p className="text-[11px] text-ink-2 truncate mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-ink-3 mt-1">{relTime(n.created_at)}</p>
              </div>
              {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0 mt-2" />}
            </button>
          ))}
        </div>
      </motion.aside>
    </div>
  )
}

function relTime(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60)    return 'just now'
  if (d < 3600)  return `${Math.floor(d/60)}m ago`
  if (d < 86400) return `${Math.floor(d/3600)}h ago`
  return `${Math.floor(d/86400)}d ago`
}
