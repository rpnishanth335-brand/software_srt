import React from 'react';

interface ChronoForgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  animated?: boolean;
  className?: string;
  subtitle?: string;
}

const SIZE_MAP = {
  sm: { icon: 28, text: 'text-sm', sub: 'text-[9px]' },
  md: { icon: 38, text: 'text-base', sub: 'text-[10px]' },
  lg: { icon: 52, text: 'text-xl', sub: 'text-xs' },
  xl: { icon: 68, text: 'text-2xl', sub: 'text-xs' },
  hero: { icon: 96, text: 'text-4xl', sub: 'text-sm' },
};

export const ChronoForgeLogo: React.FC<ChronoForgeLogoProps> = ({
  size = 'md',
  showText = true,
  animated = true,
  className = '',
  subtitle = 'AI TIMETABLE STUDIO',
}) => {
  const { icon: iconSize, text: textSize, sub: subSize } = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Animated SVG Emblem */}
      <div 
        className="relative shrink-0 flex items-center justify-center group"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Soft Ambient Refraction Halo */}
        <div 
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-600/30 via-orange-500/20 to-yellow-400/10 blur-md pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:from-amber-500/40"
        />

        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] ${
            animated ? 'transition-transform duration-500 hover:scale-105' : ''
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Molten Plasma Gradient */}
            <linearGradient id="plasmaGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="45%" stopColor="#f97316" />
              <stop offset="85%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            {/* Molten Gold Rim */}
            <linearGradient id="goldRim" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Glass Sheen */}
            <linearGradient id="glassSheen" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </linearGradient>

            {/* Core Incandescence */}
            <radialGradient id="sparkGlow" cx="50" cy="50" r="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Layer 1: Outer Molten Hexagonal Shield / Anvil Frame */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="url(#plasmaGrad)"
            fillOpacity="0.12"
            stroke="url(#goldRim)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Layer 2: Glass Refraction Bevel Inner Contour */}
          <polygon
            points="50,14 80,32 80,68 50,86 20,68 20,32"
            fill="url(#glassSheen)"
            fillOpacity="0.1"
            stroke="url(#glassSheen)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Layer 3: Rotating Chrono-Orbit Ring */}
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="14"
            transform="rotate(-25 50 50)"
            stroke="url(#goldRim)"
            strokeWidth="2.2"
            strokeDasharray="14 8"
            className={animated ? 'motion-safe:animate-[spin_12s_linear_infinite]' : ''}
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* Layer 4: The Hourglass Temporal Core (Top & Bottom Cones) */}
          {/* Top Funnel */}
          <path
            d="M 32 30 L 68 30 L 53 47 C 51.5 48.5 48.5 48.5 47 47 Z"
            fill="url(#plasmaGrad)"
            stroke="url(#goldRim)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Bottom Funnel */}
          <path
            d="M 47 53 C 48.5 51.5 51.5 51.5 53 53 L 68 70 L 32 70 Z"
            fill="url(#plasmaGrad)"
            stroke="url(#goldRim)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Layer 5: Molten Sand Cascade Stream */}
          <line
            x1="50"
            y1="46"
            x2="50"
            y2="54"
            stroke="#fef08a"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'motion-safe:animate-pulse' : ''}
          />

          {/* Layer 6: Incandescent Core Spark (Diamond Center) */}
          <circle
            cx="50"
            cy="50"
            r="7"
            fill="url(#sparkGlow)"
            className={animated ? 'motion-safe:animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}
          />

          <polygon
            points="50,44 54,50 50,56 46,50"
            fill="#ffffff"
            className="drop-shadow-[0_0_6px_#fde047]"
          />

          {/* Ambient Corner Spark Flares */}
          <circle cx="50" cy="8" r="1.8" fill="#fef08a" />
          <circle cx="88" cy="29" r="1.8" fill="#f59e0b" />
          <circle cx="88" cy="71" r="1.8" fill="#f97316" />
          <circle cx="50" cy="92" r="1.8" fill="#ef4444" />
          <circle cx="12" cy="71" r="1.8" fill="#f97316" />
          <circle cx="12" cy="29" r="1.8" fill="#f59e0b" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight font-display flex items-center gap-1.5 ${textSize}`}>
            <span className="text-white drop-shadow-sm">Chrono</span>
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Forge
            </span>
          </div>
          {subtitle && (
            <div className={`font-mono-code font-bold tracking-widest text-slate-400 uppercase ${subSize}`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
