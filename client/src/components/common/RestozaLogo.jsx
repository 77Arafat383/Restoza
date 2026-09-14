import React from 'react';

export default function RestozaLogo({ size = 'md', showText = true, subtitle = true, className = '' }) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Restoza Custom Emblem */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 transition-transform duration-300 hover:scale-105`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9F1239" />
              <stop offset="100%" stopColor="#4C0519" />
            </linearGradient>
          </defs>

          {/* Burgundy Rounded Shield */}
          <rect x="6" y="6" width="108" height="108" rx="28" fill="url(#logoBg)" stroke="url(#logoGold)" strokeWidth="3" />
          
          {/* Inner Accent Ring */}
          <rect x="12" y="12" width="96" height="96" rx="22" fill="none" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Flame on top */}
          <path d="M60 22 C58 26, 54 28, 54 32 C54 35.5, 56.5 38, 60 38 C63.5 38, 66 35.5, 66 32 C66 28, 62 26, 60 22 Z" fill="url(#logoGold)" />
          <circle cx="60" cy="40" r="3.5" fill="url(#logoGold)" />

          {/* Cloche Dome Arch */}
          <path d="M30 64 C30 46, 42 38, 60 38 C78 38, 90 46, 90 64 Z" fill="none" stroke="url(#logoGold)" strokeWidth="4.5" strokeLinecap="round" />
          
          {/* Cloche Platter Base */}
          <path d="M22 68 C22 68, 25 71, 32 71 L88 71 C95 71, 98 68, 98 68" fill="none" stroke="url(#logoGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="28" y1="75" x2="92" y2="75" stroke="url(#logoGold)" strokeWidth="3" strokeLinecap="round" />

          {/* Cutlery Motif */}
          <path d="M48 55 L72 88" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M72 55 L48 88" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M68 53 L74 59 M65 56 L71 62" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-serif tracking-wider font-bold gold-gradient-text uppercase leading-none ${textSizes[size]}`}>
            RESTOZA
          </div>
          {subtitle && (
            <span className="text-[10px] tracking-[0.2em] uppercase text-amber-200/70 font-sans mt-0.5 font-medium">
              Restaurant & Bar
            </span>
          )}
        </div>
      )}
    </div>
  );
}
