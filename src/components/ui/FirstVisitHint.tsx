'use client'

import { useEffect, useState } from 'react'
import { hasVisited, markVisited } from '@/lib/firstVisit'

/**
 * Renders children only on the user's first visit to a given section key.
 * After first render it writes to localStorage so subsequent visits are silent.
 */
export default function FirstVisitHint({ id, children }: { id: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!hasVisited(id)) {
      setShow(true)
      markVisited(id)
    }
  }, [id])

  if (!show) return null
  return <>{children}</>
}
