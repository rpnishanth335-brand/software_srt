import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PlasmaGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ember' | 'plasma' | 'subtle' | 'daylight';
  glow?: boolean;
  refraction?: boolean;
  hoverEffect?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * PlasmaGlass Component
 * Translucent lens card with liquid refraction, specular highlights, and animated ember rim lighting.
 */
export const PlasmaGlass = forwardRef<HTMLDivElement, PlasmaGlassProps>(({
  variant = 'default',
  glow = false,
  refraction = false,
  hoverEffect = false,
  className,
  children,
  ...props
}, ref) => {
  const baseStyles = "relative rounded-2xl transition-all duration-300";

  const variantStyles = {
    default: "bg-[#100e1a]/70 backdrop-blur-xl border border-white/10 shadow-glass-specular text-slate-100",
    ember: "bg-[#160f1c]/75 backdrop-blur-xl border border-ember-500/30 shadow-glass-specular text-slate-100",
    plasma: "bg-[#140b20]/75 backdrop-blur-xl border border-plasma-violet/30 shadow-glass-specular text-slate-100",
    subtle: "bg-[#0d0c14]/50 backdrop-blur-md border border-white/5 text-slate-200",
    daylight: "bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg text-slate-900",
  };

  const hoverStyles = hoverEffect
    ? "hover:border-ember-500/50 hover:shadow-glass-hover hover:-translate-y-0.5"
    : "";

  const refractionClass = refraction ? "filter-refraction" : "";

  return (
    <div
      ref={ref}
      className={twMerge(
        clsx(
          baseStyles,
          variantStyles[variant],
          hoverStyles,
          glow && "ember-rim-container ember-rim-glow",
          className
        )
      )}
      {...props}
    >
      {/* Specular Inner Glare Highlight (Top-Left) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-white/30 via-transparent to-transparent" />
      </div>

      {/* Main Content with Optional Edge Lens Refraction */}
      <div className={clsx("relative z-10 w-full h-full", refractionClass)}>
        {children}
      </div>
    </div>
  );
});

PlasmaGlass.displayName = 'PlasmaGlass';
