'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '@/components/profile/ui/Toast'

interface Props {
  url: string
  onClose: () => void
}

const TARGETS = [
  { l: 'Copy link', c: 'bg-page text-ink', copy: true },
  { l: 'WhatsApp', c: 'bg-green/10 text-green' },
  { l: 'LinkedIn', c: 'bg-purple/10 text-purple' },
  { l: 'X', c: 'bg-page text-ink' },
  { l: 'Email', c: 'bg-orange-soft text-orange' },
  { l: 'Message', c: 'bg-teal/10 text-teal' },
]

export default function ShareSheet({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const handle = async (t: typeof TARGETS[number]) => {
    if (t.copy) {
      try { await navigator.clipboard.writeText(url) } catch {}
      setCopied(true); toast('Link copied ✓'); setTimeout(()=>setCopied(false), 1500)
      return
    }
    toast(`Shared to ${t.l}`)
    onClose()
  }
  const content = (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[62]" onClick={onClose} />
      <div className="fixed inset-0 z-[63] flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.4)] w-full max-w-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <span className="text-[14px] font-bold text-ink">Share</span>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 bg-page border border-line rounded-[12px] px-3 py-2.5 mb-3">
              <span className="flex-1 text-[12px] text-ink-2 truncate">{url}</span>
              <button onClick={()=>handle(TARGETS[0])} className="text-[12px] font-semibold text-orange shrink-0">{copied?'Copied':'Copy'}</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TARGETS.slice(1).map(t => (
                <button key={t.l} onClick={()=>handle(t)} className={`text-[12px] font-semibold py-3 rounded-[12px] transition-opacity hover:opacity-80 ${t.c}`}>{t.l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
