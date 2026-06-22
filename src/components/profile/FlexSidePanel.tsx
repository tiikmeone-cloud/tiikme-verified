'use client'

/**
 * FlexSidePanel — slides in from the right when a field needs editing.
 *
 * Hidden by default. Open with `mode`:
 *   · 'audit' → Twin's line-by-line polish suggestions
 *   · 'certs' → import / add certificates
 *
 * Pattern matches Notion / Linear / Figma — content stays in place,
 * editor slides in beside it. Click outside or × to close.
 */

import { motion, AnimatePresence } from 'framer-motion'
import FlexBulletAuditView from '@/components/flex/FlexBulletAuditView'
import CertsView from '@/components/certs/CertsView'

export type FlexPanelMode = 'audit' | 'certs' | null

interface Props {
  mode: FlexPanelMode
  onClose: () => void
}

const TITLE: Record<NonNullable<FlexPanelMode>, { label: string; sub: string }> = {
  audit: { label: 'Tiik · Flex polish', sub: 'Suggested rewrites for your lines · accept what makes sense' },
  certs: { label: 'Certificates',       sub: 'Import verified certs or add manually' },
}

export default function FlexSidePanel({ mode, onClose }: Props) {
  return (
    <AnimatePresence>
      {mode && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[480px] bg-white/92 backdrop-blur-xl border-l border-white/60 shadow-[-12px_0_40px_-10px_rgba(0,0,0,.18)] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-white/60 px-5 pt-5 pb-3 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">{TITLE[mode].label}</p>
                <p className="text-[11.5px] text-ink-2 mt-1 leading-snug max-w-[340px]">{TITLE[mode].sub}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-[9px] text-ink-3 hover:text-ink hover:bg-page/80 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-5 py-4">
              {mode === 'audit' && <FlexBulletAuditView />}
              {mode === 'certs' && <CertsView />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
