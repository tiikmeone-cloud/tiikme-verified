'use client'

import { useEffect, useState } from 'react'
import { Card, EmptyState } from '@/components/profile/ui/Primitives'
import { listNotifications, markAllRead, markRead, NOTIF_ICON, NOTIF_TINT, type Notification } from '@/lib/notifications'
import { relativeTime } from '@/lib/applications'

export default function AlertsView() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    setItems(await listNotifications(50))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const unread = items.filter(n => !n.read_at).length

  const onMarkAll = async () => {
    await markAllRead()
    setItems(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
  }

  const onClick = async (n: Notification) => {
    if (!n.read_at) {
      await markRead(n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    }
    if (n.action_url) location.assign(n.action_url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink leading-tight">Alerts</h1>
          <p className="text-[12px] text-ink-3 mt-1">
            {loading ? 'Loading…' : unread > 0 ? `${unread} new` : 'You\'re all caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={onMarkAll} className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <Card key={i} className="p-4 h-16 animate-pulse bg-line/40">{null}</Card>)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <Card>
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
            title="No alerts yet"
            body="Application updates, squad requests, and vouches will show here."
          />
        </Card>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map(n => (
            <button key={n.id} onClick={() => onClick(n)}
              className={['w-full text-left', n.read_at ? '' : ''].join(' ')}>
              <Card className={`p-4 flex items-start gap-3 transition-colors hover:bg-page/50 ${!n.read_at ? 'ring-1 ring-orange/15' : ''}`}>
                <span className={`w-10 h-10 rounded-[11px] flex items-center justify-center text-[14px] font-bold shrink-0 ${NOTIF_TINT[n.kind]}`}>
                  {NOTIF_ICON[n.kind]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-[12px] text-ink-2 mt-0.5 leading-snug">{n.body}</p>}
                  <p className="text-[10px] text-ink-3 mt-1">{relativeTime(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="w-2 h-2 rounded-full bg-orange shrink-0 mt-1.5" />}
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
