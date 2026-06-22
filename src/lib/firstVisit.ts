/**
 * First-visit tracking via localStorage.
 * Explanatory/onboarding text is shown only once per section key.
 * After the user visits, the hint is hidden on all subsequent visits.
 */

const PREFIX = 'tk_fv_'

export function hasVisited(key: string): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(PREFIX + key)
}

export function markVisited(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFIX + key, '1')
}
