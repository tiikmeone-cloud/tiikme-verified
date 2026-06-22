'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { PROFILE_COLUMNS } from '@/lib/types'

interface UseProfileResult {
  profile: Profile | null
  loading: boolean
  error: string | null
}

export function useProfile(handle: string): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const supabase = createClient()
    supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)   // explicit — never includes email
      .eq('username', handle)
      .eq('is_public', true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setProfile(data as Profile | null)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [handle])

  return { profile, loading, error }
}
