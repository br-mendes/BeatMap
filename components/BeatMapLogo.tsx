'use client'

export const BeatMapLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  const rounding = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl'
  };

  const fontSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-5xl',
    xl: 'text-7xl'
  };

  return (
    <div className="flex items-center gap-3 select-none group">
      <div className={`relative ${dimensions[size]} flex items-center justify-center`}>
        {/* Glow effect with pulse */}
        <div className={`absolute inset-0 bg-beatmap-primary blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 rounded-full animate-pulse`}></div>
        
        {/* Main Container with Gradient */}
        <div className={`relative w-full h-full bg-gradient-to-br from-beatmap-primary via-[#8b5cf6] to-beatmap-secondary ${rounding[size]} shadow-2xl flex items-center justify-center overflow-hidden transform transition-all duration-500 group-hover:rotate-6 group-hover:scale-105 border border-white/10`}>
          
          {/* Tech Grid Pattern */}
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', 
            backgroundSize: '6px 6px' 
          }}></div>

          {/* Icon: Pulse Wave */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="relative z-10 w-3/5 h-3/5 drop-shadow-md"
          >
            <path d="M2 12h3l3-8 5 16 3-8h6" />
          </svg>
          
          {/* Shine effect */}
          <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-b from-white/10 to-transparent transform rotate-45 pointer-events-none"></div>
        </div>
      </div>
      
      <span className={`font-black tracking-tighter text-white ${fontSizeClasses[size]}`}>
        Beat<span className="text-transparent bg-clip-text bg-gradient-to-r from-beatmap-primary to-beatmap-secondary">Map</span>
      </span>
    </div>
  );
};
