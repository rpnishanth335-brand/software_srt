import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GooGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  activeGoo?: boolean;
}

/**
 * GooGroup Component
 * Wraps adjacent elements (chips, tab pills, wizard steps) with an SVG metaball filter
 * allowing them to stretch and fuse like molten droplets when nearby.
 */
export const GooGroup: React.FC<GooGroupProps> = ({
  className,
  children,
  activeGoo = true,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "relative inline-flex items-center",
          activeGoo && "filter-goo",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
