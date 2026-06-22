/**
 * profile_roles persistence — multi-hat identity.
 * Replaces the in-session stub roles with real DB rows.
 */

import { createClient } from '@/lib/supabase/client'
import type { UserRole, RoleType } from '@/lib/profileTypes'

import { getDemoUserId } from '@/lib/applications'

async function uid(): Promise<string | null> {
  return getDemoUserId()
}

export async function listRoles(userId: string): Promise<UserRole[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profile_roles')
    .select('id, title, org_name, role_type, is_current, is_primary, display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id,
    title: r.title,
    org: r.org_name ?? '',
    type: (r.role_type ?? 'work') as RoleType,
    current: !!r.is_current,
    primary: !!r.is_primary,
  }))
}

/* Replaces every row for this user with the supplied list — simplest correct
   semantics for the "edit roles, click save" flow. Wrapped in a transaction-
   like pattern: delete-all then insert. */
export async function replaceRoles(roles: UserRole[]): Promise<boolean> {
  const userId = await uid(); if (!userId) return false
  const supabase = createClient()
  const { error: delErr } = await supabase.from('profile_roles').delete().eq('user_id', userId)
  if (delErr) { console.error(delErr); return false }
  if (roles.length === 0) return true
  const rows = roles.map((r, i) => ({
    user_id: userId,
    title: r.title,
    org_name: r.org || null,
    role_type: r.type,
    is_current: r.current,
    is_primary: r.primary,
    display_order: i,
  }))
  const { error: insErr } = await supabase.from('profile_roles').insert(rows)
  if (insErr) { console.error(insErr); return false }
  return true
}
