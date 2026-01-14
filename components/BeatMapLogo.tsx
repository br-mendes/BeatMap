import React from 'react';

export const BeatMapLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const fontSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Animated background circles */}
        <div className="absolute inset-0 bg-beatmap-primary rounded-full opacity-75 animate-pulse-slow blur-md"></div>
        <div className="absolute inset-1 bg-beatmap-secondary rounded-full opacity-70 animate-pulse blur-sm"></div>
        
        {/* SVG Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="relative z-10 text-white w-full h-full p-1.5"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="21" cy="16" r="3" />
          <path d="M2 12h.01" /> {/* Decorative dot */}
          <path d="M22 22h.01" />
        </svg>
      </div>
      <span className={`font-bold tracking-tight text-white ${fontSizeClasses[size]}`}>
        Beat<span className="text-transparent bg-clip-text bg-gradient-to-r from-beatmap-primary to-beatmap-secondary">Map</span>
      </span>
    </div>
  );
};