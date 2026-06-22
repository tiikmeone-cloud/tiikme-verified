'use client'

import RuixenMoonChat from '@/components/ui/ruixen-moon-chat'

/**
 * Demo route — drop-in preview of the Ruixen Moon Chat component.
 *
 * Open: http://localhost:3002/demo/ruixen
 *
 * This is the verbatim component as supplied. The real Twin home at /
 * is the on-brand version. Use this page to verify the install worked
 * and as a reference for the Ruixen pattern.
 */
export default function DemoPage() {
  return (
    <main className="min-h-screen w-full bg-black text-white">
      <section className="flex justify-center items-start w-full">
        <RuixenMoonChat />
      </section>

      <footer className="text-center text-neutral-500 py-2 mt-10 border-t border-neutral-800 text-sm">
        © {new Date().getFullYear()} Ruixen Demo Page
      </footer>
    </main>
  )
}
