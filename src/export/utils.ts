import { School } from '../types';

export const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  0: 'Sunday',
};

export const DAY_SHORT_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  0: 'Sun',
};

/**
 * Convert Hex color string (e.g. #3b82f6) to [r, g, b] array (0-255).
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [100, 100, 100];
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b];
}

/**
 * Determine readable text color (black or white) based on background luminance.
 */
export function getContrastTextColor(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  // Perceptive luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? [20, 20, 20] : [255, 255, 255];
}

/**
 * Format clock time for a given period from school settings.
 */
export function getPeriodTiming(school: School, period: number): string {
  const pt = school.periodTimes.find((p) => p.period === period);
  if (pt) {
    return `${pt.startTime} - ${pt.endTime}`;
  }
  return `P${period}`;
}
