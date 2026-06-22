'use client'

import { useState } from 'react'
import type { FeedPost } from '@/stubs/getFeed'
import { toast } from '@/components/profile/ui/Toast'
import ShareSheet from '@/components/home/ShareSheet'

interface Props {
  post: FeedPost
  onReply: (post: FeedPost) => void
}

export default function PostCard({ post, onReply }: Props) {
  const [liked, setLiked]     = useState(!!post.liked)
  const [likes, setLikes]     = useState(post.likes)
  const [reposted, setRepost] = useState(false)
  const [reposts, setReposts] = useState(post.reposts)
  const [marked, setMarked]   = useState(!!post.bookmarked)
  const [shareOpen, setShareOpen] = useState(false)

  const toggleLike = () => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }
  const toggleRepost = () => { setRepost(r => !r); setReposts(n => reposted ? n-1 : n+1); toast(reposted ? 'Repost removed' : 'Reposted ✓') }
  const toggleSave = () => { const next = !marked; setMarked(next); toast(next ? 'Saved to your Stash ✓' : 'Removed from Stash') }

  return (
    <article className="bg-card rounded-[20px] shadow-card p-6">
      {/* header */}
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-ink truncate">{post.author}</span>
            <span className="text-[13px] text-ink-3">{post.time}</span>
          </div>
          <span className="text-[13px] text-ink-3">@{post.handle}</span>
        </div>
        <button className="w-9 h-9 rounded-[10px] flex items-center justify-center text-ink-3 hover:bg-page transition-colors shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
        </button>
      </div>

      {/* body */}
      <p className="text-[15px] text-ink leading-relaxed">{post.body}</p>

      {/* media */}
      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt="" className="mt-3.5 w-full rounded-[16px] object-cover max-h-[500px]" />
      )}

      {/* actions */}
      <div className="flex items-center gap-7 mt-4 text-ink-3">
        <button onClick={toggleLike} className={`flex items-center gap-2 transition-colors ${liked ? 'text-red' : 'hover:text-red'}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span className="text-[13px] font-medium tabular-nums">{likes}</span>
        </button>
        <button onClick={toggleRepost} className={`flex items-center gap-2 transition-colors ${reposted ? 'text-green' : 'hover:text-green'}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          <span className="text-[13px] font-medium tabular-nums">{reposts}</span>
        </button>
        <button onClick={() => onReply(post)} className="flex items-center gap-2 hover:text-purple transition-colors">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span className="text-[13px] font-medium tabular-nums">{post.comments}</span>
        </button>
        <div className="flex-1" />
        <button onClick={toggleSave} title="Save to Stash" className={`transition-colors ${marked ? 'text-orange' : 'hover:text-ink'}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill={marked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
        <button onClick={() => setShareOpen(true)} title="Share" className="hover:text-ink transition-colors">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>

      {shareOpen && <ShareSheet url={`tiikme.com/p/${post.id}`} onClose={() => setShareOpen(false)} />}
    </article>
  )
}
