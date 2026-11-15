import React from 'react';

interface SvgFiltersProps {
  turbulenceFreq?: number;
  displacementScale?: number;
}

/**
 * Global SVG Filters for Plasma Glass Refraction, Heat Haze, and Molten Gooey effects.
 * Embedded once in the DOM root, referenced via `filter: url(#id)`.
 */
export const SvgFilters: React.FC<SvgFiltersProps> = ({
  turbulenceFreq = 0.035,
  displacementScale = 5,
}) => {
  return (
    <svg
      id="chronoforge-svg-filters"
      className="sr-only pointer-events-none absolute w-0 h-0"
      aria-hidden="true"
    >
      <defs>
        {/* 1. Liquid Glass Refraction & Thermal Haze */}
        <filter id="plasma-refraction" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            id="haze-turbulence"
            type="fractalNoise"
            baseFrequency={`${turbulenceFreq} ${turbulenceFreq * 1.5}`}
            numOctaves={2}
            seed={1}
            result="noise"
          />
          <feDisplacementMap
            id="haze-displacement"
            in="SourceGraphic"
            in2="noise"
            scale={displacementScale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          {/* Subtle Chromatic Aberration */}
          <feOffset in="displaced" dx="1.5" dy="0" result="red-shift" />
          <feOffset in="displaced" dx="-1.5" dy="0" result="cyan-shift" />
          <feBlend in="red-shift" in2="displaced" mode="screen" result="chroma1" />
          <feBlend in="cyan-shift" in2="chroma1" mode="lighten" />
        </filter>

        {/* 2. Molten Droplet Merging (Gooey Filter) */}
        <filter id="molten-goo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 19 -9
            "
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        {/* 3. Subtle Edge Lens Distortion */}
        <filter id="glass-edge-lens" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.05"
            numOctaves={1}
            result="turb"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turb"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
    </svg>
  );
};
