'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import type { FeedPost } from '@/stubs/getFeed'
import { getFeedPosts } from '@/stubs/getFeed'

import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import Feed from '@/components/home/Feed'
import RightSidebar from '@/components/home/RightSidebar'
import ComposeModal from '@/components/home/ComposeModal'
import PostDetailModal from '@/components/home/PostDetailModal'
import { ToastHost, toast } from '@/components/profile/ui/Toast'

interface Props { profile: Profile | null }

export default function HomeShell({ profile }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>(getFeedPosts())
  const [compose, setCompose] = useState(false)
  const [replyTo, setReplyTo] = useState<FeedPost | null>(null)

  const addPost = (text: string) => {
    setPosts(p => [{
      id: Date.now().toString(),
      author: profile?.full_name ?? 'You',
      handle: profile?.username ?? 'you',
      avatar: profile?.avatar_url ?? 'https://i.pravatar.cc/120?img=3',
      time: 'now', body: text, likes: 0, reposts: 0, comments: 0,
    }, ...p])
    toast('Posted ✓')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="home" onCreateClick={() => setCompose(true)} />

        {/* center feed */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-8 py-5 pb-24 lg:pb-8 mx-auto" style={{ maxWidth: '720px' }}>
            <Feed profile={profile} posts={posts} onCompose={() => setCompose(true)} onReply={setReplyTo} />
          </div>
        </main>

        {/* right sidebar */}
        <RightSidebar />
      </div>

      <MobileTabBar active="home" onCreateClick={() => setCompose(true)} />

      {compose && <ComposeModal avatar={profile?.avatar_url} onClose={() => setCompose(false)} onPost={addPost} />}
      {replyTo && <PostDetailModal post={replyTo} avatar={profile?.avatar_url} onClose={() => setReplyTo(null)} />}
      <ToastHost />
    </div>
  )
}
