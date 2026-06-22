'use client'

import { useState } from 'react'

interface Props {
  avatar?: string | null
  onClose: () => void
  onPost: (text: string) => void
}

const ToolIcons = [
  <path key="i" d="M21 15l-5-5L5 21 M3 5h18v14H3z M8.5 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  null, // image (custom below)
]

export default function ComposeModal({ avatar, onClose, onPost }: Props) {
  const [text, setText] = useState('')
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-[12vh]">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.4)] w-full max-w-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-line">
            <span className="text-[14px] font-bold text-ink">Create post</span>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="p-5">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar ?? 'https://i.pravatar.cc/120?img=3'} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Start a post…" rows={4}
                className="flex-1 bg-transparent text-[15px] text-ink placeholder-ink-3 outline-none resize-none pt-1.5" />
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-line">
            <div className="flex gap-1 text-ink-3">
              <Tool><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></Tool>
              <Tool><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></Tool>
              <Tool><rect x="2" y="6" width="20" height="12" rx="2"/><text x="6" y="15" fontSize="7" fill="currentColor" stroke="none">GIF</text></Tool>
              <Tool><path d="M16 8a6 6 0 01-7.5 5.5 6 6 0 117.5-5.5z"/><path d="M8.5 8.5h.01"/></Tool>
            </div>
            <button onClick={()=>{ if(text.trim()){ onPost(text.trim()); onClose() } }} disabled={!text.trim()}
              className="text-[13px] font-semibold text-white bg-orange rounded-[12px] px-5 py-2 hover:bg-orange-2 transition-colors disabled:opacity-40">
              Post
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Tool({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page hover:text-orange transition-colors">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  )
}
