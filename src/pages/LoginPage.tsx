import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { ChronoForgeLogo } from '../components/ChronoForgeLogo';
import { 
  Flame, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Lock,
  Layers,
  Cpu
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { 
    signInWithGoogle, 
    loading, 
    error, 
    clearError
  } = useAuth();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // 3D Tilt calculation on desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current || window.innerWidth < 1024) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const maxTilt = 8;
    setTilt({
      x: (-y / (rect.height / 2)) * maxTilt,
      y: (x / (rect.width / 2)) * maxTilt,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Canvas Ember Generator with FPS monitoring & Visibility pause
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = true;
    let lastTime = performance.now();
    let particleCount = window.innerWidth < 768 ? 20 : 55;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    interface Particle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      hue: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.6,
      speedY: Math.random() * 0.9 + 0.4,
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.7 + 0.2,
      hue: Math.random() > 0.4 ? 35 : 18, // Amber or Orange
    }));

    const render = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Auto-throttle if framerate drops
      if (delta > 35 && particleCount > 20) {
        particleCount = Math.max(15, particleCount - 5);
        particles.splice(particleCount);
      }

      if (isTabVisible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
          p.y -= p.speedY;
          p.x += p.speedX;
          if (p.y < 0) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 55%, ${p.opacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [prefersReducedMotion]);

  const handleGoogleClick = async () => {
    try {
      await signInWithGoogle();
      setIsSuccess(true);
    } catch {
      // Error handled by AuthProvider
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row relative overflow-hidden bg-[#07050d] text-slate-100 font-sans">
      {/* Background Layer 1: Ambient Plasma Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-25 filter blur-[100px] animate-[pulse_8s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, #ea580c 45%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full opacity-20 filter blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]"
          style={{ background: 'radial-gradient(circle, #ef4444 0%, #7c2d12 50%, transparent 70%)' }}
        />
        <div 
          className="absolute top-1/2 left-1/3 w-[40vw] h-[40vw] rounded-full opacity-15 filter blur-[90px] animate-[pulse_12s_ease-in-out_infinite_2s]"
          style={{ background: 'radial-gradient(circle, #fbbf24 0%, #b45309 50%, transparent 70%)' }}
        />
      </div>

      {/* Background Layer 2: Rising Canvas Embers */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-[1]" 
      />

      {/* ========================================================= */}
      {/* LEFT SECTION: BRAND HERO & FEATURES (DESKTOP)             */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative z-10 max-w-3xl">
        {/* Brand Header */}
        <div>
          <ChronoForgeLogo size="lg" subtitle="INSTITUTIONAL SCHEDULING ERP" />
        </div>

        {/* Hero Narrative & Features */}
        <div className="my-auto py-8 sm:py-12 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Next-Gen Constraint Solver</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-tight">
              Smart timetables, <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                forged in fire.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
              Synthesize zero-conflict school schedules for all classes, faculty, and facilities using client-side simulated annealing. 100% private in your browser.
            </p>
          </div>

          {/* 3 Staggered Glowing Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-1.5 transition-all hover:bg-white/[0.07] hover:border-amber-500/30">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Simulated Annealing</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Multi-constraint optimization in a background Web Worker.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-1.5 transition-all hover:bg-white/[0.07] hover:border-orange-500/30">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-300">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Interactive Drag & Drop</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Real-time clash detection, locked slots, and version history.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-1.5 transition-all hover:bg-white/[0.07] hover:border-emerald-500/30">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">IndexedDB Privacy</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Student and staff records never leave your local computer.
              </p>
            </div>
          </div>
        </div>

        {/* Hero Footer */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
          <span>Production-grade AI Scheduling</span>
          <span>•</span>
          <span>PDF, Excel & CSV Exports</span>
          <span>•</span>
          <span>Offline Capable</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SECTION: LIQUID GLASS LOGIN CARD                     */}
      {/* ========================================================= */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: prefersReducedMotion 
              ? 'none' 
              : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
          }}
          className={`w-full max-w-md rounded-3xl p-6 sm:p-8 relative backdrop-blur-2xl transition-all duration-300 border ${
            error 
              ? 'bg-[#180a0a]/90 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.3)] animate-shake' 
              : isSuccess
              ? 'bg-[#0f1f14]/90 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.3)]'
              : 'bg-[#120f20]/80 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/50'
          }`}
        >
          {/* Molten Glass Bevel Specular Sheen */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-amber-500/5 pointer-events-none" />

          {/* Card Contents */}
          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-ember-glow">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Welcome to ChronoForge
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Sign in to manage and synthesize institutional timetables
              </p>
            </div>

            {/* Error Message with Retry */}
            {error && (
              <div 
                role="alert" 
                className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs space-y-2 animate-fadeIn"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={clearError}
                    className="text-[11px] font-bold text-red-300 hover:text-white flex items-center gap-1 underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Dismiss & Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action: Sign in with Google Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading || isSuccess}
                className={`w-full min-h-[52px] px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                  loading
                    ? 'bg-amber-500/30 border border-amber-500/50 text-amber-200 cursor-wait'
                    : isSuccess
                    ? 'bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border border-white hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2.5">
                    {/* Swirling Plasma Orb Spinner */}
                    <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : isSuccess ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Signed In Successfully!</span>
                  </div>
                ) : (
                  <>
                    {/* Official Google Multicolor 'G' Logo */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Google Cloud Console OAuth Configuration / Status */}
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="w-full min-h-[40px] px-4 py-2 rounded-2xl text-xs font-medium text-slate-400 hover:text-amber-300 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors flex items-center justify-center gap-2"
                title="Configure Google Cloud Console OAuth 2.0 Credentials"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Console OAuth Settings</span>
              </button>
            </div>

            {/* Security Guarantee */}
            <div className="pt-2 border-t border-white/10 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Your school data remains 100% private in browser storage</span>
              </div>
              <p className="text-[10px] text-slate-500">
                By signing in, you accept the ChronoForge open-source terms and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Cloud Console OAuth Configuration Modal */}
      <GoogleConsoleConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConnectAndSignIn={signInWithGoogle}
      />
    </div>
  );
};
