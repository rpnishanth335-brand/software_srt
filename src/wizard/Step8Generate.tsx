import React, { useState, useRef, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { SolverClient } from '../solver/client';
import { SolverProgress, SolverResult } from '../solver/types';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Flame, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Dices, 
  HelpCircle,
  Zap,
  TrendingDown
} from 'lucide-react';
import { TimetableVersion } from '../types';

export const Step8Generate: React.FC = () => {
  const { project, setStep, setTimetableVersion } = useTimetableStore();
  const { classes } = project;

  // Generator Configuration
  const [seed, setSeed] = useState<number>(42);
  const [qualityMode, setQualityMode] = useState<'fast' | 'balanced' | 'best'>('balanced');
  const selectedClassIds = classes.filter((c) => c.selected).map((c) => c.id);

  // Solving State
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [progress, setProgress] = useState<SolverProgress | null>(null);
  const [result, setResult] = useState<SolverResult | null>(null);
  const solverClientRef = useRef<SolverClient | null>(null);

  useEffect(() => {
    solverClientRef.current = new SolverClient();
    return () => {
      solverClientRef.current?.terminate();
    };
  }, []);

  const handleStartForge = async () => {
    if (!solverClientRef.current) return;

    setIsSolving(true);
    setResult(null);
    setProgress({
      phase: 'init',
      phaseProgress: 0,
      iterations: 0,
      hardConflicts: 0,
      softScore: 0,
      softTrend: [],
      runtimeMs: 0,
      message: 'Initializing constraint solver...',
    });

    try {
      // Gather any locked slots from previous version if present
      const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
      const lockedSlots = activeVersion ? activeVersion.slots.filter((s) => s.locked) : [];

      const solveResult = await solverClientRef.current.solve(
        project,
        {
          seed,
          qualityMode,
          selectedClassIds,
        },
        lockedSlots,
        (prog) => {
          setProgress(prog);
        }
      );

      setResult(solveResult);

      if (solveResult.success) {
        const newVersion: TimetableVersion = {
          id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: Date.now(),
          seed: solveResult.seed,
          qualityMode,
          slots: solveResult.slots,
          hardConflicts: solveResult.hardConflicts,
          softScore: solveResult.softScore,
          runtimeMs: solveResult.runtimeMs,
        };
        setTimetableVersion(newVersion);
      }
    } catch (err) {
      console.error('Solver execution error:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleCancelForge = () => {
    solverClientRef.current?.abort();
    setIsSolving(false);
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 999999) + 1);
  };

  // Sparkline generator for soft trend
  const renderSparkline = (trend: number[]) => {
    if (!trend || trend.length < 2) return null;
    const min = Math.min(...trend);
    const max = Math.max(...trend, min + 1);
    const width = 220;
    const height = 40;

    const points = trend
      .map((val, idx) => {
        const x = (idx / (trend.length - 1)) * width;
        const y = height - ((val - min) / (max - min)) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke="#ffb703"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">How the Forge works:</span> The AI solver operates entirely in a dedicated background Web Worker thread. It performs three stages: (1) Constraint construction with forward checking, (2) Simulated Annealing with Kempe swaps, and (3) Targeted conflict repair. Using the same Seed generates identical, reproducible timetables.
        </div>
      </div>

      {/* Main Forge Control Card */}
      <PlasmaGlass glow hoverEffect className="p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-ember-500 to-ember-plasma p-0.5 shadow-ember-glow">
              <div className="w-full h-full bg-[#0b0a10] rounded-[14px] flex items-center justify-center">
                <Flame className={`w-7 h-7 text-ember-gold ${isSolving ? 'animate-bounce' : ''}`} />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                The Timetable Forge
              </h2>
              <p className="text-xs text-slate-300">
                Stochastic constraint solver running locally in your browser
              </p>
            </div>
          </div>

          {/* Seed Input & Randomize */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <label className="block text-[10px] font-mono-code text-slate-400 uppercase">
                Random Seed
              </label>
              <input
                type="number"
                value={seed}
                disabled={isSolving}
                onChange={(e) => setSeed(parseInt(e.target.value, 10) || 1)}
                className="w-28 px-2.5 py-1 rounded-lg bg-white/5 border border-white/15 text-amber-300 font-mono-code text-xs text-center font-bold focus:outline-none"
              />
            </div>
            <button
              onClick={randomizeSeed}
              disabled={isSolving}
              title="Randomize Seed"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-amber-400 mt-3"
            >
              <Dices className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quality Mode Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'fast', label: 'Fast Mode', time: '~1–2s', desc: '5k iterations. Best for quick drafts and rapid validation.' },
            { id: 'balanced', label: 'Balanced Mode', time: '~4–6s', desc: '15k iterations. Recommended balance of speed and soft scores.' },
            { id: 'best', label: 'Best Quality', time: '~8–12s', desc: '30k iterations. Maximum simulated annealing cooling depth.' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={isSolving}
              onClick={() => setQualityMode(mode.id as any)}
              className={`p-4 rounded-xl border text-left transition-all ${
                qualityMode === mode.id
                  ? 'bg-gradient-to-br from-ember-500/20 to-purple-500/20 border-ember-500/60 shadow-ember-glow'
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{mode.label}</span>
                <span className="text-[10px] font-mono-code text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded">
                  {mode.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{mode.desc}</p>
            </button>
          ))}
        </div>

        {/* Primary Action Button (Forge vs Cancel) */}
        <div className="flex flex-col items-center justify-center pt-4">
          {isSolving ? (
            <div className="space-y-4 text-center">
              <MoltenButton
                size="forge"
                variant="danger"
                onClick={handleCancelForge}
                leftIcon={<XCircle className="w-5 h-5" />}
              >
                Cancel Solver Execution
              </MoltenButton>
              <p className="text-xs text-amber-300/80 font-mono-code animate-pulse">
                Web Worker thread actively computing Kempe-chain permutations...
              </p>
            </div>
          ) : (
            <MoltenButton
              size="forge"
              variant="molten"
              isForge
              onClick={handleStartForge}
              leftIcon={<Flame className="w-6 h-6 text-amber-200" />}
            >
              FORGE FULL TIMETABLE
            </MoltenButton>
          )}
        </div>

        {/* Live Progress Display */}
        {isSolving && progress && (
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-ember-gold animate-spin" />
                Phase: {progress.phase}
              </span>
              <span className="text-slate-400">
                {progress.iterations.toLocaleString()} iterations • {progress.runtimeMs}ms
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
              <div
                style={{ width: `${progress.phaseProgress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-ember-500 via-amber-400 to-ember-plasma transition-all duration-200 shadow-ember-glow"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 font-mono-code">HARD CLASHES</div>
                <div className={`text-xl font-mono-code font-bold ${
                  progress.hardConflicts === 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {progress.hardConflicts}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 font-mono-code">SOFT SCORE</div>
                <div className="text-xl font-mono-code font-bold text-amber-300">
                  {progress.softScore}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 font-mono-code">TEMPERATURE</div>
                <div className="text-xl font-mono-code font-bold text-purple-300">
                  {progress.temperature ?? 0}°
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                <div className="text-[10px] text-slate-400 font-mono-code mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-amber-400" /> SOFT TREND
                </div>
                {renderSparkline(progress.softTrend)}
              </div>
            </div>
          </div>
        )}

        {/* Completion Summary Card */}
        {result && (
          <div
            className={`p-6 rounded-2xl border-2 space-y-4 animate-fadeIn ${
              result.success
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/20 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {result.success
                      ? 'Timetable Generated Successfully!'
                      : 'Solver Completed with Residual Conflicts'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Solved in {result.runtimeMs}ms across {result.iterations.toLocaleString()} iterations • Hard Clashes: {result.hardConflicts}
                  </p>
                </div>
              </div>

              {result.success && (
                <MoltenButton
                  size="md"
                  variant="molten"
                  onClick={() => setStep(9)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  View Timetable Workspace
                </MoltenButton>
              )}
            </div>

            {/* Unsatisfiable Core (if unsuccessful) */}
            {!result.success && result.unsatisfiableCore && (
              <div className="mt-4 pt-4 border-t border-red-500/30 space-y-2">
                <div className="text-xs font-bold font-mono-code text-red-300 uppercase">
                  Unsatisfiable Core Explanation:
                </div>
                <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                  {result.unsatisfiableCore.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </PlasmaGlass>
    </div>
  );
};
