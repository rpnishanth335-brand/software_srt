/**
 * ChronoForge Design System Tokens
 * Theme: Plasma Glass / Molten Refraction
 */

export const THEME_TOKENS = {
  colors: {
    obsidian: {
      deepest: '#07060a',
      canvas: '#0b0a10',
      surface: '#13111c',
      surfaceHover: '#1c1829',
      border: 'rgba(255, 255, 255, 0.08)',
    },
    ember: {
      amber: '#ffb703',
      orange: '#ff6b00',
      plasma: '#ff3d00',
      crimson: '#d00000',
      gold: '#ffd166',
    },
    plasma: {
      violet: '#9d4edd',
      purple: '#7b2cbf',
      cyan: '#00f5d4',
      fuchsia: '#f72585',
    },
    glass: {
      bgDark: 'rgba(18, 16, 28, 0.65)',
      bgLight: 'rgba(255, 255, 255, 0.75)',
      borderDark: 'rgba(255, 255, 255, 0.12)',
      borderEmber: 'rgba(255, 107, 0, 0.35)',
      highlightTop: 'rgba(255, 255, 255, 0.25)',
      shadowBottom: 'rgba(0, 0, 0, 0.7)',
    },
    subjectColors: [
      { name: 'Ember Orange', hex: '#f97316', bg: 'rgba(249, 115, 22, 0.25)', border: '#f97316' },
      { name: 'Plasma Violet', hex: '#a855f7', bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7' },
      { name: 'Cyan Flux', hex: '#06b6d4', bg: 'rgba(6, 182, 212, 0.25)', border: '#06b6d4' },
      { name: 'Emerald Wave', hex: '#10b981', bg: 'rgba(16, 185, 129, 0.25)', border: '#10b981' },
      { name: 'Ruby Core', hex: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444' },
      { name: 'Gold Radiant', hex: '#eab308', bg: 'rgba(234, 179, 8, 0.25)', border: '#eab308' },
      { name: 'Indigo Deep', hex: '#6366f1', bg: 'rgba(99, 102, 241, 0.25)', border: '#6366f1' },
      { name: 'Rose Bloom', hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.25)', border: '#f43f5e' },
    ],
  },
  typography: {
    display: "'Cinzel', serif",
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  shadows: {
    specular: 'inset 1px 1px 1px 0px rgba(255, 255, 255, 0.25), inset -1px -1px 2px 0px rgba(0, 0, 0, 0.6), 0 10px 30px -10px rgba(0, 0, 0, 0.7)',
    specularHover: 'inset 1px 1px 2px 0px rgba(255, 255, 255, 0.4), inset -1px -1px 2px 0px rgba(255, 107, 0, 0.3), 0 15px 35px -5px rgba(255, 85, 0, 0.3)',
    emberGlow: '0 0 25px -3px rgba(255, 107, 0, 0.45)',
    emberGlowLg: '0 0 50px -5px rgba(255, 80, 0, 0.6)',
  },
  transitions: {
    springFast: { type: 'spring', stiffness: 400, damping: 25 },
    springSmooth: { type: 'spring', stiffness: 200, damping: 20 },
    moltenSnap: { type: 'spring', stiffness: 500, damping: 30 },
  },
  qualityPresets: {
    high: {
      enableSvgRefraction: true,
      enableHeatHaze: true,
      enableEmbers: true,
      maxParticles: 40,
      blurIntensity: 16,
    },
    medium: {
      enableSvgRefraction: false,
      enableHeatHaze: false,
      enableEmbers: true,
      maxParticles: 15,
      blurIntensity: 12,
    },
    low: {
      enableSvgRefraction: false,
      enableHeatHaze: false,
      enableEmbers: false,
      maxParticles: 0,
      blurIntensity: 6,
    },
  },
} as const;

export type QualityMode = keyof typeof THEME_TOKENS.qualityPresets;
