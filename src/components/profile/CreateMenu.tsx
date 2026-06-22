'use client'

interface CreateOption {
  id: string
  label: string
  sub: string
  gradient: string
  icon: React.ReactNode
}

const OPTIONS: CreateOption[] = [
  {
    id: 'experience',
    label: 'Add Experience',
    sub: 'A new job, role, or project',
    gradient: 'from-teal to-[#43C9BA]',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  },
  {
    id: 'education',
    label: 'Add Education',
    sub: 'School, degree, or course',
    gradient: 'from-purple to-[#8A6EF0]',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  },
  {
    id: 'achievement',
    label: 'Add Achievement',
    sub: 'Award, win, or recognition',
    gradient: 'from-amber to-[#F8C155]',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  },
  {
    id: 'certificate',
    label: 'Add Certificate',
    sub: 'Certification or credential',
    gradient: 'from-green to-[#52D87E]',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 12 10 13 12 11"/></svg>,
  },
  {
    id: 'skill',
    label: 'Add Skill',
    sub: 'A tool, language, or skill',
    gradient: 'from-[#FF4D4D] to-[#FF7A7A]',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
]

interface Props {
  onSelect: (id: string) => void
  onClose: () => void
}

export default function CreateMenu({ onSelect, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[3px] z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,.18)] w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-line">
            <div>
              <h2 className="text-[15px] font-bold text-ink">Create</h2>
              <p className="text-[11px] text-ink-3 mt-0.5">What do you want to add?</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-line text-ink-2 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Options */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onSelect(opt.id); onClose() }}
                className="flex flex-col items-start gap-3 p-4 rounded-[14px] border border-line hover:border-orange/30 hover:bg-orange-soft/30 transition-all group text-left"
              >
                <div className={`w-10 h-10 rounded-[11px] bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-card`}>
                  {opt.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink group-hover:text-orange transition-colors">{opt.label}</p>
                  <p className="text-[10px] text-ink-3 mt-0.5 leading-snug">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
