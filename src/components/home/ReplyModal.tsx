'use client'

import { useState } from 'react'
import type { FeedPost } from '@/stubs/getFeed'

interface Props {
  post: FeedPost
  avatar?: string | null
  onClose: () => void
  onReply: (text: string) => void
}

export default function ReplyModal({ post, avatar, onClose, onReply }: Props) {
  const [text, setText] = useState('')
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-[14vh]">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.4)] w-full max-w-xl overflow-hidden">
          {/* header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line">
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <span className="text-[15px] font-bold text-ink">Replying to {post.author}</span>
          </div>

          <div className="p-5">
            {/* original post */}
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="flex flex-col items-center shrink-0">
                <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                <div className="w-px flex-1 bg-line mt-1" />
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">{post.author}</span>
                  <span className="text-[12px] text-ink-3">{post.time}</span>
                </div>
                <p className="text-[14px] text-ink leading-relaxed mt-1">{post.body}</p>
                <div className="flex items-center gap-5 mt-2 text-ink-3 text-[12px]">
                  <span className="flex items-center gap-1.5"><Heart/>{post.likes}</span>
                  <span className="flex items-center gap-1.5"><Repost/>{post.reposts}</span>
                  <span className="flex items-center gap-1.5"><Comment/>{post.comments}</span>
                </div>
              </div>
            </div>

            {/* reply composer */}
            <div className="flex gap-3 mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar ?? 'https://i.pravatar.cc/120?img=3'} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder={`Reply to ${post.author}…`} rows={3}
                className="flex-1 bg-transparent text-[14px] text-ink placeholder-ink-3 outline-none resize-none pt-2" />
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-line">
            <div className="flex gap-1 text-ink-3">
              <Tool><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></Tool>
              <Tool><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></Tool>
              <Tool><path d="M16 8a6 6 0 01-7.5 5.5 6 6 0 117.5-5.5z"/></Tool>
            </div>
            <button onClick={()=>{ if(text.trim()){ onReply(text.trim()); onClose() } }} disabled={!text.trim()}
              className="text-[13px] font-semibold text-white bg-orange rounded-[12px] px-5 py-2 hover:bg-orange-2 transition-colors disabled:opacity-40">
              Reply
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const Heart   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const Repost  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
const Comment = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
function Tool({ children }: { children: React.ReactNode }) {
  return <button className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page hover:text-orange transition-colors"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg></button>
}
