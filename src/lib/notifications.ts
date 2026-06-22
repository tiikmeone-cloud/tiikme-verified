/**
 * Notifications — typed wrappers for the bell + slide-over.
 *
 * Auto-populated by SQL triggers on: vouches, applications, squads, etc.
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export type NotifKind =
  | 'vouch_received' | 'vouch_accepted' | 'vouch_declined'
  | 'app_stage_change'
  | 'squad_request' | 'squad_confirmed'
  | 'org_post' | 'flex_audit_done' | 'system'
  | 'flex_request_approved' | 'flex_request_declined'

export interface Notification {
  id: string
  user_id: string
  kind: NotifKind
  title: string
  body: string | null
  action_url: string | null
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export async function listNotifications(limit = 30): Promise<Notification[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_my_notifications', { p_user: user, p_limit: limit })
  if (error) { logRpc('listNotifications', error); return [] }
  return (data as Notification[]) ?? []
}

export async function unreadCount(): Promise<number> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return 0
  const { data, error } = await supabase.rpc('unread_notification_count', { p_user: user })
  if (error) { logRpc('unreadCount', error); return 0 }
  return (data as number) ?? 0
}

export async function markRead(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('mark_notification_read', { p_id: id })
}

export async function markAllRead(): Promise<void> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return
  await supabase.rpc('mark_all_notifications_read', { p_user: user })
}

export const NOTIF_ICON: Record<NotifKind, string> = {
  vouch_received:         '✦',
  vouch_accepted:         '✓',
  vouch_declined:         '×',
  app_stage_change:       '→',
  squad_request:          '◔',
  squad_confirmed:        '✓',
  org_post:               '◉',
  flex_audit_done:        '◆',
  system:                 '◌',
  flex_request_approved:  '✓',
  flex_request_declined:  '×',
}

export const NOTIF_TINT: Record<NotifKind, string> = {
  vouch_received:         'bg-purple/10 text-purple',
  vouch_accepted:         'bg-green/10 text-green',
  vouch_declined:         'bg-ink-3/10 text-ink-3',
  app_stage_change:       'bg-orange-soft text-orange',
  squad_request:          'bg-teal/10 text-teal',
  squad_confirmed:        'bg-green/10 text-green',
  org_post:               'bg-amber/10 text-amber',
  flex_audit_done:        'bg-purple/10 text-purple',
  system:                 'bg-page text-ink-2',
  flex_request_approved:  'bg-green/10 text-green',
  flex_request_declined:  'bg-ink-3/10 text-ink-3',
}
