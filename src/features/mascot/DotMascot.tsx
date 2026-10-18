import React from 'react';
import type { MascotMood } from '../../types/regex.ts';

interface DotMascotProps {
  mood?: MascotMood;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBubble?: boolean;
}

export const DotMascot: React.FC<DotMascotProps> = ({
  mood = 'idle',
  message,
  size = 'md',
  className = '',
  showBubble = true,
}) => {
  const sizeMap = {
    sm: { svg: 48, box: 'h-12 w-12', text: 'text-xs' },
    md: { svg: 72, box: 'h-18 w-18', text: 'text-sm' },
    lg: { svg: 96, box: 'h-24 w-24', text: 'text-base' },
  };

  const currentSize = sizeMap[size];

  const moodDescriptions: Record<MascotMood, string> = {
    idle: 'Dot the Detective is observing attentively.',
    scanning: 'Dot is closely scanning the text for regex patterns.',
    thinking: 'Dot is analyzing the expression logic.',
    happy: 'Dot is smiling cheerfully at the successful match!',
    confused: 'Dot is puzzled by the pattern error or empty result.',
    champion: 'Dot is celebrating your solved mission!',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Dot Character Artwork */}
      <div
        className={`relative shrink-0 flex items-center justify-center ${currentSize.box}`}
        role="img"
        aria-label={moodDescriptions[mood]}
      >
        <svg
          viewBox="0 0 100 100"
          width={currentSize.svg}
          height={currentSize.svg}
          className="transition-transform duration-300 drop-shadow-md"
        >
          <defs>
            <linearGradient id="dot-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="dot-lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="hat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Detective Hat */}
          <g transform={mood === 'confused' ? 'rotate(-8 50 25)' : 'rotate(0 50 25)'}>
            {/* Hat brim */}
            <path
              d="M 22 36 C 22 34, 78 34, 78 36 C 82 37, 84 40, 78 40 C 50 42, 22 40, 22 36 Z"
              fill="#0f172a"
            />
            {/* Hat crown */}
            <path
              d="M 32 36 C 30 18, 70 18, 68 36 Z"
              fill="url(#hat-grad)"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Hat ribbon */}
            <path
              d="M 31 34 C 40 33, 60 33, 69 34 L 69 37 C 60 36, 40 36, 31 37 Z"
              fill="#6366f1"
            />
          </g>

          {/* Main Body (Lens / Orb) */}
          <circle
            cx="50"
            cy="58"
            r="30"
            fill="url(#dot-body-grad)"
            stroke="#a5b4fc"
            strokeWidth="2.5"
          />

          {/* Inner glass lens highlight */}
          <circle
            cx="50"
            cy="58"
            r="26"
            fill="url(#dot-lens-grad)"
          />

          {/* Specular gleam */}
          <ellipse
            cx="40"
            cy="46"
            rx="6"
            ry="3.5"
            transform="rotate(-25 40 46)"
            fill="#ffffff"
            opacity="0.6"
          />

          {/* Eyes & Expressions */}
          {mood === 'happy' || mood === 'champion' ? (
            <g>
              {/* Happy crescent eyes */}
              <path
                d="M 38 56 Q 43 51 48 56"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 54 56 Q 59 51 64 56"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Cheerful mouth */}
              <path
                d="M 46 64 Q 51 70 56 64"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Cheeks */}
              <circle cx="36" cy="62" r="3" fill="#f43f5e" opacity="0.4" />
              <circle cx="66" cy="62" r="3" fill="#f43f5e" opacity="0.4" />
            </g>
          ) : mood === 'confused' ? (
            <g>
              {/* Puzzled mismatched eyes */}
              <circle cx="42" cy="54" r="5" fill="#ffffff" />
              <circle cx="43" cy="53" r="2.5" fill="#0f172a" />
              <circle cx="60" cy="57" r="3.5" fill="#ffffff" />
              <circle cx="60" cy="56" r="1.8" fill="#0f172a" />
              {/* Wavy mouth */}
              <path
                d="M 45 68 Q 50 65 54 68 Q 57 70 60 67"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Question mark */}
              <text x="76" y="28" fill="#facc15" fontSize="16" fontWeight="bold">?</text>
            </g>
          ) : mood === 'thinking' ? (
            <g>
              {/* Thinking squint */}
              <circle cx="43" cy="54" r="4.5" fill="#ffffff" />
              <circle cx="44" cy="51" r="2.2" fill="#0f172a" />
              <path d="M 38 48 L 47 49" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

              <circle cx="59" cy="54" r="4.5" fill="#ffffff" />
              <circle cx="60" cy="51" r="2.2" fill="#0f172a" />
              <path d="M 54 49 L 63 48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

              {/* Small pursed mouth */}
              <circle cx="51" cy="65" r="2" fill="#ffffff" />

              {/* Thought bubbles */}
              <circle cx="76" cy="38" r="2" fill="#a5b4fc" opacity="0.8" />
              <circle cx="82" cy="30" r="3" fill="#a5b4fc" opacity="0.8" />
              <circle cx="89" cy="22" r="4.5" fill="#a5b4fc" opacity="0.9" />
            </g>
          ) : mood === 'scanning' ? (
            <g>
              {/* Focused laser eyes */}
              <circle cx="42" cy="56" r="5" fill="#ffffff" />
              <circle cx="44" cy="56" r="2.5" fill="#38bdf8" />
              <circle cx="44" cy="56" r="1.2" fill="#ffffff" />

              <circle cx="60" cy="56" r="5" fill="#ffffff" />
              <circle cx="62" cy="56" r="2.5" fill="#38bdf8" />
              <circle cx="62" cy="56" r="1.2" fill="#ffffff" />

              {/* Scan beam line across */}
              <line x1="26" y1="56" x2="74" y2="56" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,2" opacity="0.7" />
              {/* Concentrated mouth */}
              <line x1="48" y1="66" x2="54" y2="66" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            /* Idle / Attentive */
            <g>
              <circle cx="42" cy="55" r="5" fill="#ffffff" />
              <circle cx="43" cy="55" r="2.5" fill="#0f172a" />
              <circle cx="44" cy="54" r="1" fill="#ffffff" />

              <circle cx="59" cy="55" r="5" fill="#ffffff" />
              <circle cx="60" cy="55" r="2.5" fill="#0f172a" />
              <circle cx="61" cy="54" r="1" fill="#ffffff" />

              {/* Gentle smile */}
              <path
                d="M 47 65 Q 51 68 55 65"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Magnifying Glass Accessory */}
          <g transform={mood === 'scanning' ? 'translate(22, 46) rotate(10)' : 'translate(68, 56) rotate(-15)'}>
            {/* Glass Handle */}
            <line x1="12" y1="12" x2="22" y2="22" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="12" x2="22" y2="22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            {/* Glass Rim */}
            <circle cx="6" cy="6" r="10" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
            <circle cx="6" cy="6" r="8" fill="#38bdf8" opacity="0.3" />
            <line x1="2" y1="3" x2="7" y2="2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </g>

          {/* Champion Badge Star */}
          {mood === 'champion' && (
            <g transform="translate(14, 52) scale(0.9)">
              <polygon
                points="10,1 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7"
                fill="url(#gold-grad)"
                stroke="#ffffff"
                strokeWidth="0.8"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Mascot Speech / Microcopy Bubble */}
      {showBubble && message && (
        <div
          className={`relative max-w-md rounded-xl border px-3.5 py-2 transition-all duration-200 ${currentSize.text} bg-slate-900/90 text-slate-200 border-indigo-500/30 shadow-sm`}
          aria-live="polite"
        >
          {/* Arrow pointing to Dot */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-slate-900 border-l border-b border-indigo-500/30" />
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};
