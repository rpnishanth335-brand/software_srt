import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Flame, Loader2 } from 'lucide-react';

export interface MoltenButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'molten' | 'glass' | 'plasma' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'forge';
  isForge?: boolean; // Special forge animation state
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * MoltenButton Component
 * Premium button with liquid refraction, molten ember gradients, and interactive heat amplification on hover.
 */
export const MoltenButton: React.FC<MoltenButtonProps> = ({
  variant = 'molten',
  size = 'md',
  isForge = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs font-semibold rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-sm font-semibold rounded-xl gap-2",
    lg: "px-7 py-3.5 text-base font-bold rounded-2xl gap-2.5",
    forge: "px-8 py-4 text-lg font-extrabold tracking-wide rounded-2xl gap-3 shadow-ember-glow-lg",
  };

  const variantStyles = {
    molten: "molten-gradient text-white border border-amber-300/40 shadow-ember-glow hover:shadow-ember-glow-lg",
    glass: "bg-white/10 hover:bg-white/15 text-slate-100 border border-white/20 backdrop-blur-md shadow-glass-specular hover:border-ember-400/50 hover:text-ember-300",
    plasma: "bg-gradient-to-r from-plasma-violet via-purple-600 to-plasma-fuchsia text-white border border-purple-300/30 shadow-lg hover:shadow-purple-500/40",
    danger: "bg-gradient-to-r from-red-600 to-rose-700 text-white border border-red-400/30 shadow-md hover:bg-red-500",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-transparent hover:border-white/10",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.025 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled || isLoading}
      className={twMerge(
        clsx(
          "relative inline-flex items-center justify-center font-medium overflow-hidden select-none outline-none transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          sizeStyles[size],
          variantStyles[variant],
          isForge && "animate-ember-flicker ring-2 ring-ember-400/60",
          className
        )
      )}
      {...props}
    >
      {/* Specular Inner Glint */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-[inherit] opacity-75"
        aria-hidden="true"
      />

      {/* Forge Swirling Plasma Overlay */}
      {isForge && (
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,183,3,0.35),transparent_70%)] animate-plasma-pulse"
          aria-hidden="true"
        />
      )}

      {/* Button Content */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
        ) : isForge ? (
          <Flame className="w-5 h-5 text-amber-200 animate-bounce" />
        ) : (
          leftIcon
        )}

        <span>{children}</span>

        {!isLoading && rightIcon}
      </span>
    </motion.button>
  );
};
