'use client'

import { useState } from 'react'
import type { FeedPost, Comment } from '@/stubs/getFeed'
import { getComments } from '@/stubs/getFeed'

interface Props {
  post: FeedPost
  avatar?: string | null
  onClose: () => void
}

export default function PostDetailModal({ post, avatar, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>(getComments(post.id))
  const [text, setText] = useState('')
  const me = avatar ?? 'https://i.pravatar.cc/120?img=3'

  const addComment = () => {
    const t = text.trim(); if (!t) return
    setComments(c => [{ id: Date.now().toString(), author: 'You', handle: 'you', avatar: me, time: 'now', body: t, likes: 0 }, ...c])
    setText('')
  }

  const addReply = (parentId: string, body: string) => {
    setComments(cs => cs.map(c => c.id === parentId
      ? { ...c, replies: [...(c.replies ?? []), { id: Date.now().toString(), author: 'You', handle: 'you', avatar: me, time: 'now', body, likes: 0 }] }
      : c))
  }

  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-[7vh]">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.4)] w-full max-w-xl max-h-[86vh] flex flex-col overflow-hidden">
          {/* header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line shrink-0">
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <span className="text-[15px] font-bold text-ink">Thread</span>
          </div>

          {/* scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* original post */}
            <div className="px-5 py-4 border-b border-line">
              <div className="flex items-center gap-3 mb-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.avatar} alt={post.author} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-2"><span className="text-[14px] font-semibold text-ink">{post.author}</span><span className="text-[12px] text-ink-3">{post.time}</span></div>
                  <span className="text-[12px] text-ink-3">@{post.handle}</span>
                </div>
              </div>
              <p className="text-[15px] text-ink leading-relaxed">{post.body}</p>
              {post.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image} alt="" className="mt-3 w-full rounded-[16px] object-cover max-h-[360px]" />
              )}
            </div>

            {/* comment count */}
            <div className="px-5 py-2.5 text-[12px] font-semibold text-ink-2 border-b border-line">
              {total} {total === 1 ? 'comment' : 'comments'}
            </div>

            {/* comments */}
            <div className="px-5 py-1 divide-y divide-line">
              {comments.map(c => <CommentRow key={c.id} c={c} onReply={addReply} />)}
            </div>
          </div>

          {/* composer */}
          <div className="border-t border-line p-3 shrink-0">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={me} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addComment()}}
                placeholder="Post your reply…" className="flex-1 bg-page border border-line rounded-[12px] px-3.5 py-2.5 text-[13px] text-ink placeholder-ink-3 outline-none focus:border-orange transition-colors" />
              <button onClick={addComment} disabled={!text.trim()} className="text-[13px] font-semibold text-white bg-orange rounded-[12px] px-4 py-2.5 hover:bg-orange-2 transition-colors disabled:opacity-40 shrink-0">Reply</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* X / Twitter-style comment: flat (no bubble), threaded with a connector line. */
function CommentRow({ c, depth = 0, onReply }: { c: Comment; depth?: number; onReply: (parentId: string, body: string) => void }) {
  const [liked, setLiked] = useState(!!c.liked)
  const [likes, setLikes] = useState(c.likes)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const hasReplies = (c.replies?.length ?? 0) > 0

  return (
    <div className={depth === 0 ? 'pt-3 first:pt-1' : 'pt-3'}>
      <div className="flex gap-3">
        {/* avatar column + thread line */}
        <div className="flex flex-col items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.avatar} alt={c.author} className="w-9 h-9 rounded-full object-cover" />
          {(hasReplies || (replyOpen && depth === 0)) && <div className="w-0.5 flex-1 bg-line mt-1.5 rounded-full" />}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          {/* header inline */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-semibold text-ink">{c.author}</span>
            <span className="text-[12px] text-ink-3">@{c.handle}</span>
            <span className="text-[12px] text-ink-3">· {c.time}</span>
          </div>
          {/* body */}
          <p className="text-[13px] text-ink mt-0.5 leading-snug">{c.body}</p>

          {/* X-style action row */}
          <div className="flex items-center gap-7 mt-2 text-ink-3">
            <button onClick={()=>setReplyOpen(o=>!o)} className="flex items-center gap-1.5 text-[12px] hover:text-purple transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {c.replies?.length ? c.replies.length : ''}
            </button>
            <button className="flex items-center gap-1.5 text-[12px] hover:text-green transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            </button>
            <button onClick={()=>{setLiked(l=>!l);setLikes(n=>liked?n-1:n+1)}} className={`flex items-center gap-1.5 text-[12px] transition-colors ${liked?'text-red':'hover:text-red'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {likes > 0 ? likes : ''}
            </button>
            <button className="flex items-center text-[12px] hover:text-ink transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>

          {/* inline reply composer */}
          {replyOpen && (
            <div className="flex items-center gap-2 mt-2.5">
              <input value={replyText} onChange={e=>setReplyText(e.target.value)} autoFocus
                onKeyDown={e=>{if(e.key==='Enter'&&replyText.trim()){onReply(c.id,replyText.trim());setReplyText('');setReplyOpen(false)}}}
                placeholder={`Reply to @${c.handle}…`} className="flex-1 bg-page border border-line rounded-[10px] px-3 py-2 text-[12px] text-ink placeholder-ink-3 outline-none focus:border-orange transition-colors" />
              <button onClick={()=>{if(replyText.trim()){onReply(c.id,replyText.trim());setReplyText('');setReplyOpen(false)}}} disabled={!replyText.trim()} className="text-[12px] font-semibold text-white bg-orange rounded-[10px] px-3 py-2 disabled:opacity-40">Reply</button>
            </div>
          )}

          {/* nested replies — flat, thread continues */}
          {c.replies?.map(r => <CommentRow key={r.id} c={r} depth={depth+1} onReply={onReply} />)}
        </div>
      </div>
    </div>
  )
}
