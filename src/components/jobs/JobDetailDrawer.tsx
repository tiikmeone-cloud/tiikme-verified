'use client'

import type { Opening } from '@/stubs/getJobs'
import JobDetailContent from '@/components/jobs/JobDetailContent'

/* Mobile full-screen job detail (desktop uses the sticky right pane). */
export default function JobDetailDrawer({ job, onClose, onRefer }: { job: Opening; onClose: () => void; onRefer: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onClose} />
      <aside className="fixed inset-x-0 bottom-0 top-12 bg-card z-50 rounded-t-[20px] flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-line shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-page text-ink-2"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
          <span className="text-[14px] font-bold text-ink">Job Detail</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <JobDetailContent job={job} onRefer={onRefer} />
        </div>
      </aside>
    </>
  )
}
