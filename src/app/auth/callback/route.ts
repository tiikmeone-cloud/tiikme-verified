import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure a profiles row exists for OAuth users
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
        if (!existing) {
          const base = (user.email?.split('@')[0] ?? 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'user'
          await supabase.from('profiles').insert({
            id: user.id,
            username: `${base}_${user.id.slice(0, 4)}`,
            full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'New user',
            avatar_url: (user.user_metadata?.avatar_url as string) || null,
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth_failed`)
}
