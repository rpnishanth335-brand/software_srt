import { useEffect, useRef } from 'react';

interface UseHeatHazeOptions {
  enabled?: boolean;
  speed?: number; // animation speed factor
  baseFreqX?: number;
  baseFreqY?: number;
}

/**
 * useHeatHaze Hook
 * Animates the feTurbulence SVG filter baseFrequency and seed using requestAnimationFrame.
 * Automatically halts animation when motion is reduced or quality mode disables it.
 */
export function useHeatHaze({
  enabled = true,
  speed = 0.0003,
  baseFreqX = 0.035,
  baseFreqY = 0.05,
}: UseHeatHazeOptions = {}) {
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    // Respect system reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!enabled || prefersReduced) {
      return;
    }

    const turbElement = document.getElementById('haze-turbulence') as SVGFETurbulenceElement | null;
    if (!turbElement) return;

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;
      timeRef.current += 1;

      // Slowly waver base frequencies
      const freqX = baseFreqX + Math.sin(timeRef.current * speed * 2) * 0.005;
      const freqY = baseFreqY + Math.cos(timeRef.current * speed * 3) * 0.008;

      turbElement.setAttribute('baseFrequency', `${freqX.toFixed(4)} ${freqY.toFixed(4)}`);

      if (timeRef.current % 30 === 0) {
        // Change seed every ~0.5s for living plasma jitter
        const seed = Math.floor(Math.random() * 50) + 1;
        turbElement.setAttribute('seed', seed.toString());
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [enabled, speed, baseFreqX, baseFreqY]);
}
