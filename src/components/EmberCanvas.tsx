import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
  glow: number;
}

export interface EmberCanvasProps {
  maxParticles?: number;
  intensity?: number; // 1 = normal, 2 = forge solving mode
  interactive?: boolean;
  className?: string;
}

/**
 * EmberCanvas Component
 * High-performance 2D Canvas rendering rising embers, sparks, and flame wisps.
 * Embers brighten, wobble organically, and dissipate into the obsidian backdrop.
 */
export const EmberCanvas: React.FC<EmberCanvasProps> = ({
  maxParticles = 35,
  intensity = 1,
  interactive = true,
  className = 'absolute inset-0 pointer-events-none',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const colors = [
      '#ff6b00', // orange
      '#ffb703', // gold
      '#ff3d00', // plasma
      '#ffd166', // warm yellow
      '#ff8533', // amber
    ];

    const particles: Particle[] = [];
    const count = Math.floor(maxParticles * intensity);

    const createParticle = (spawnY?: number): Particle => {
      const maxLife = 80 + Math.random() * 120;
      return {
        x: Math.random() * width,
        y: spawnY !== undefined ? spawnY : height + Math.random() * 20,
        size: 1 + Math.random() * 2.8,
        speedY: (0.4 + Math.random() * 1.2) * (0.8 + intensity * 0.4),
        speedX: (Math.random() - 0.5) * 0.6,
        life: 0,
        maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.1,
        glow: 4 + Math.random() * 8,
      };
    };

    // Pre-populate particles across canvas height
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
    };

    if (interactive && canvas.parentElement) {
      canvas.parentElement.addEventListener('mousemove', handleMouseMove);
      canvas.parentElement.addEventListener('mouseleave', handleMouseLeave);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.life * 0.05) * 0.3;

        // Interactive mouse repelling / excitation
        if (mouseRef.current) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100 && dist > 0) {
            const force = (100 - dist) / 100;
            p.x += (dx / dist) * force * 2;
            p.y -= force * 1.5;
            p.alpha = Math.min(1, p.alpha + 0.1);
          }
        }

        // Fade in then fade out
        const progress = p.life / p.maxLife;
        if (progress < 0.2) {
          p.alpha = progress * 5;
        } else if (progress > 0.7) {
          p.alpha = (1 - progress) / 0.3;
        } else {
          p.alpha = 0.9;
        }

        // Recycle dead particle
        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = createParticle();
          continue;
        }

        // Draw glowing ember
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.shadowBlur = p.glow * (0.8 + intensity * 0.5);
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (interactive && canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
        canvas.parentElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [maxParticles, intensity, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
};
