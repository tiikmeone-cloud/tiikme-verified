'use client'

import { useRouter } from 'next/navigation'
import TiikmeMark from '@/components/brand/TiikmeMark'
import Tilt3D from '@/components/ui/Tilt3D'
import { InfiniteGridBackdrop } from '@/components/ui/the-infinite-grid'

export default function WelcomeShell() {
  const router = useRouter()

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <InfiniteGridBackdrop />

      {/* brand row */}
      <header className="relative z-10 px-6 lg:px-10 pt-6 flex items-center gap-2.5">
        <TiikmeMark size={24} showWordmark wordmarkClassName="text-[15px]" />
        <div className="flex-1" />
        <button
          onClick={() => router.push('/sign-in')}
          className="text-[12px] font-semibold text-ink-2 hover:text-ink transition-colors px-3 py-1.5 rounded-[10px] hover:bg-card">
          Sign in
        </button>
      </header>

      {/* hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 lg:px-10 pb-12 mx-auto w-full" style={{ maxWidth: 680 }}>
        {/* ambient glow */}
        <div aria-hidden className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[240px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse,rgba(255,92,40,.20),transparent 65%)', filter: 'blur(48px)' }} />

        <TiikmeMark size={80} alive />

        <h1 className="text-[36px] lg:text-[44px] font-bold text-ink text-center mt-7 leading-[1.05] tracking-tight">
          Your career, verified.
        </h1>
        <p className="text-[15px] lg:text-[16px] text-ink-2 text-center mt-3 max-w-[480px] leading-relaxed">
          Build a Flex that proves who you are.
          Get a Tiik that fights for your next move.
        </p>

        {/* two path cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 w-full mt-10">
          <Tilt3D max={8} lift={5} glare>
            <button
              onClick={() => router.push('/sign-in?mode=signup&path=user')}
              className="group relative w-full h-full text-left rounded-[22px] border-2 border-line bg-card/95 backdrop-blur hover:border-orange/50 hover:bg-white/90 transition-all p-6 shadow-[0_10px_32px_-14px_rgba(0,0,0,.12)]">
              <div className="w-13 h-13 w-[52px] h-[52px] rounded-[15px] bg-gradient-to-br from-[#FFE7B5] to-[#FFC25C] flex items-center justify-center text-[26px] mb-4 shadow-[0_4px_10px_-4px_rgba(0,0,0,.18)]">
                👤
              </div>
              <p className="text-[16px] font-bold text-ink leading-tight">I'm a professional<br/>or student</p>
              <p className="text-[12px] text-ink-3 mt-2 leading-relaxed">
                Build your verified Flex<br/>Find opportunities · Squad up
              </p>
              <div className="mt-5 text-[12.5px] font-semibold text-orange">
                Get started
              </div>
            </button>
          </Tilt3D>

          <Tilt3D max={8} lift={5} glare>
            <button
              onClick={() => router.push('/sign-in?mode=signup&path=org')}
              className="group relative w-full h-full text-left rounded-[22px] border-2 border-line bg-card/95 backdrop-blur hover:border-orange/50 hover:bg-white/90 transition-all p-6 shadow-[0_10px_32px_-14px_rgba(0,0,0,.12)]">
              <div className="w-[52px] h-[52px] rounded-[15px] bg-gradient-to-br from-[#CDE7E4] to-[#3FBAA8] flex items-center justify-center text-[26px] mb-4 shadow-[0_4px_10px_-4px_rgba(0,0,0,.18)]">
                🏢
              </div>
              <p className="text-[16px] font-bold text-ink leading-tight">I'm hiring or<br/>building a team</p>
              <p className="text-[12px] text-ink-3 mt-2 leading-relaxed">
                Post roles · Discover verified talent<br/>Hire with confidence
              </p>
              <div className="mt-5 text-[12.5px] font-semibold text-orange">
                Set up your company
              </div>
            </button>
          </Tilt3D>
        </div>

        <p className="text-[12px] text-ink-3 mt-7 text-center">
          Already on tiikme?{' '}
          <button onClick={() => router.push('/sign-in')} className="font-semibold text-orange hover:text-orange-2 transition-colors">
            Sign in
          </button>
        </p>
      </section>

      <footer className="relative z-10 px-6 lg:px-10 pb-6 flex items-center justify-center gap-4">
        <span className="text-[10px] text-ink-3">© tiikme</span>
        <span className="text-[10px] text-ink-3">·</span>
        <a className="text-[10px] text-ink-3 hover:text-ink-2 transition-colors" href="#">Privacy</a>
        <span className="text-[10px] text-ink-3">·</span>
        <a className="text-[10px] text-ink-3 hover:text-ink-2 transition-colors" href="#">Terms</a>
      </footer>
    </main>
  )
}
