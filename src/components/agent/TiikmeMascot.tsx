/* tiikme mascot — the brand avatar used for the AI.
   Inline SVG so it scales perfectly + theme-aware. */

interface Props {
  size?: number
  bg?: boolean             // show the soft rounded background plate
  pulse?: boolean          // gentle breathing animation
}

export default function TiikmeMascot({ size = 32, bg = false, pulse = false }: Props) {
  return (
    <div
      className={['relative flex items-center justify-center', pulse ? 'tk-mascot-pulse' : '', bg ? 'bg-gradient-to-br from-orange-soft to-orange-soft/40 rounded-[28%]' : ''].join(' ')}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        {/* main body */}
        <path d="M 30 30
                 Q 22 33 22 50
                 L 22 70
                 Q 22 78 30 78
                 L 36 78
                 Q 40 78 40 72
                 L 40 66
                 L 56 66
                 L 56 72
                 Q 56 78 60 78
                 L 67 78
                 Q 74 78 74 70
                 L 74 60
                 Q 82 56 82 44
                 Q 82 22 56 22
                 Q 38 22 30 30 Z"
              fill="#FF5C28"/>
        {/* darker ear */}
        <ellipse cx="32" cy="42" rx="5" ry="8" fill="#B83D1C"/>
        {/* eye */}
        <circle cx="60" cy="38" r="4.5" fill="white"/>
        <circle cx="61" cy="38" r="2" fill="#1B1B1D"/>
        {/* trunk + tusk */}
        <path d="M 74 50 Q 84 55 82 66 Q 78 72 71 66"
              fill="#FFFFFF" stroke="#FF5C28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {pulse && (
        <style>{`
          @keyframes tk-mascot-breath { 0%,100% { transform: scale(1) } 50% { transform: scale(1.04) } }
          .tk-mascot-pulse { animation: tk-mascot-breath 2.4s ease-in-out infinite; }
        `}</style>
      )}
    </div>
  )
}
