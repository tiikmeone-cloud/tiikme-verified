/**
 * cn — the shadcn class-merging utility.
 *
 * Combines `clsx` (conditional class names) with `tailwind-merge`
 * (de-duplicates and resolves Tailwind class conflicts).
 *
 * Use anywhere you need to safely merge Tailwind classes:
 *
 *   <div className={cn('px-4 py-2', isActive && 'bg-orange', className)} />
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
