'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import type { FeedPost } from '@/stubs/getFeed'
import { getFeedPosts } from '@/stubs/getFeed'
import PostCard from '@/components/home/PostCard'

interface Props {
  profile: Profile | null
  posts: FeedPost[]
  onCompose: () => void
  onReply: (post: FeedPost) => void
}

export default function Feed({ profile, posts, onCompose, onReply }: Props) {
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou')
  const avatar = profile?.avatar_url ?? 'https://i.pravatar.cc/120?img=3'

  return (
    <div className="space-y-4">
      {/* tabs + search */}
      <div className="flex items-center gap-3 sticky top-0 z-10 pb-1" style={{ backgroundColor: 'var(--color-page)' }}>
        <div className="flex bg-card rounded-[14px] p-1 shadow-card shrink-0">
          <button onClick={()=>setTab('foryou')} className={['px-5 py-2 text-[13px] font-semibold rounded-[10px] transition-colors', tab==='foryou'?'bg-page text-ink':'text-ink-3'].join(' ')}>For you</button>
          <button onClick={()=>setTab('following')} className={['px-5 py-2 text-[13px] font-semibold rounded-[10px] transition-colors', tab==='following'?'bg-page text-ink':'text-ink-3'].join(' ')}>Following</button>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-card rounded-[14px] px-4 py-2.5 shadow-card">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search…" className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none" />
        </div>
        <button onClick={onCompose} className="w-10 h-10 rounded-[12px] bg-card shadow-card flex items-center justify-center text-ink-2 hover:text-orange transition-colors shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* composer trigger */}
      <button onClick={onCompose} className="w-full bg-card rounded-[18px] shadow-card p-4 flex items-center gap-3 text-left hover:shadow-[0_4px_12px_rgba(0,0,0,.08)] transition-shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        <span className="text-[14px] text-ink-3">Start a post…</span>
      </button>

      {/* posts */}
      {posts.map(p => <PostCard key={p.id} post={p} onReply={onReply} />)}
    </div>
  )
}

export { getFeedPosts }
