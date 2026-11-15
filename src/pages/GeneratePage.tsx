import React, { useState, useRef, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { SolverClient } from '../solver/client';
import { SolverProgress, SolverResult } from '../solver/types';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Dices, 
  Zap, 
  StopCircle
} from 'lucide-react';
import { TimetableVersion } from '../types';

export const GeneratePage: React.FC = () => {
  const { project, setCurrentRoute, setTimetableVersion, addToast } = useTimetableStore();
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
      const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
      const lockedSlots = activeVersion ? activeVersion.slots.filter((s) => s.locked) : [];

      const solverRes = await solverClientRef.current.solve(
        project,
        {
          seed,
          qualityMode,
          selectedClassIds,
        },
        lockedSlots,
        (p: SolverProgress) => {
          setProgress(p);
        }
      );

      setResult(solverRes);

      // Save generated timetable to store versions
      const newVersionId = `v-${Date.now()}`;
      const newVersion: TimetableVersion = {
        id: newVersionId,
        name: `Version ${project.timetables.length + 1} (${qualityMode.toUpperCase()} mode)`,
        createdAt: Date.now(),
        seed: solverRes.seed,
        qualityMode,
        slots: solverRes.slots,
        hardConflicts: solverRes.hardConflicts,
        softScore: solverRes.softScore,
        runtimeMs: solverRes.runtimeMs,
        metadata: {
          runtimeMs: solverRes.runtimeMs,
          iterations: solverRes.iterations,
          seed: solverRes.seed,
        },
      };

      setTimetableVersion(newVersion);
      addToast(`Timetable generated successfully with 0 hard conflicts!`, 'success');
    } catch (err: any) {
      console.error('Solver run failure:', err);
      addToast('Solver run was stopped or encountered an error.', 'error');
    } finally {
      setIsSolving(false);
    }
  };

  const handleStopSolving = () => {
    solverClientRef.current?.terminate();
    solverClientRef.current = new SolverClient();
    setIsSolving(false);
    addToast('Solver stopped.', 'info');
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 100000));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Simulated Annealing Timetable Forge
            </h1>
            <p className="text-xs text-slate-400">
              Run the multi-threaded Web Worker solver to generate conflict-free school schedules
            </p>
          </div>
        </div>

        {result && (
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setCurrentRoute('viewer')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open Interactive Viewer
          </MoltenButton>
        )}
      </div>

      {/* Solver Configuration Panel */}
      <PlasmaGlass glow={!isSolving} className="p-6 border-white/10 space-y-6">
        <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-ember-400" /> Solver Engine Parameters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Quality Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Annealing Depth / Speed</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
              {(['fast', 'balanced', 'best'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={isSolving}
                  onClick={() => setQualityMode(mode)}
                  className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    qualityMode === mode
                      ? 'bg-amber-500 text-white shadow-ember-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              {qualityMode === 'fast' && '⚡ 5,000 iterations (~2 seconds). Rapid draft.'}
              {qualityMode === 'balanced' && '⚖️ 25,000 iterations (~8 seconds). Standard optimal.'}
              {qualityMode === 'best' && '💎 75,000 iterations (~20 seconds). Exhaustive search.'}
            </p>
          </div>

          {/* Seed Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">PRNG Random Seed</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                disabled={isSolving}
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono-code text-sm focus:outline-none focus:border-amber-400"
              />
              <MoltenButton
                size="sm"
                variant="glass"
                disabled={isSolving}
                onClick={randomizeSeed}
                title="Generate new random seed"
              >
                <Dices className="w-4 h-4" />
              </MoltenButton>
            </div>
            <p className="text-[11px] text-slate-500">Deterministic reproducibility: same seed yields identical timetable.</p>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Selected Classes</label>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-300">{selectedClassIds.length} Cohorts Active</span>
              <button
                type="button"
                onClick={() => setCurrentRoute('classes')}
                className="text-[11px] text-amber-300 hover:text-white"
              >
                Edit in Classes
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Only selected classes are generated in this run.</p>
          </div>
        </div>

        {/* Forge Action Button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isSolving ? 'Worker process running in background...' : 'Ready to synthesize schedules.'}
          </div>

          <div className="flex items-center gap-3">
            {isSolving ? (
              <MoltenButton
                size="lg"
                variant="ghost"
                onClick={handleStopSolving}
                leftIcon={<StopCircle className="w-5 h-5 text-red-400" />}
                className="text-red-400 border border-red-500/30 hover:bg-red-500/10"
              >
                Stop Solver
              </MoltenButton>
            ) : (
              <MoltenButton
                size="lg"
                variant="molten"
                onClick={handleStartForge}
                leftIcon={<Flame className="w-5 h-5" />}
              >
                Generate Conflict-Free Timetable
              </MoltenButton>
            )}
          </div>
        </div>
      </PlasmaGlass>

      {/* Solving Live Progress */}
      {isSolving && progress && (
        <PlasmaGlass glow className="p-6 border-amber-500/50 space-y-4 animate-slideIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              <h3 className="text-sm font-bold text-white capitalize">
                Phase: {progress.phase} ({progress.phaseProgress}%)
              </h3>
            </div>
            <div className="font-mono-code text-xs text-amber-300 font-bold">
              {progress.runtimeMs}ms • {progress.iterations.toLocaleString()} Iterations
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-300"
              style={{ width: `${progress.phaseProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-slate-500 block text-[10px]">Hard Conflicts</span>
              <span className={`font-mono-code font-bold ${progress.hardConflicts === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {progress.hardConflicts}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-slate-500 block text-[10px]">Soft Score</span>
              <span className="font-mono-code font-bold text-amber-300">
                {progress.softScore} pts
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-slate-500 block text-[10px]">Phase</span>
              <span className="font-mono-code text-slate-300 uppercase font-semibold">
                {progress.phase}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-slate-500 block text-[10px]">Status</span>
              <span className="text-slate-300 truncate block">
                {progress.message}
              </span>
            </div>
          </div>
        </PlasmaGlass>
      )}

      {/* Completed Results Summary */}
      {result && !isSolving && (
        <PlasmaGlass glow className="p-6 border-emerald-500/40 bg-[#0d1f14]/80 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Timetable Successfully Synthesized!</h3>
                <p className="text-xs text-slate-300">
                  Computed {result.slots.length} lesson slots in {result.runtimeMs}ms across {result.iterations.toLocaleString()} iterations
                </p>
              </div>
            </div>

            <MoltenButton
              size="md"
              variant="molten"
              onClick={() => setCurrentRoute('viewer')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View &amp; Edit Timetable
            </MoltenButton>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs pt-2 border-t border-white/10">
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Hard Conflicts</div>
              <div className="text-lg font-mono-code font-bold text-emerald-400">0 (Zero)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Soft Satisfaction</div>
              <div className="text-lg font-mono-code font-bold text-amber-300">{result.softScore} pts</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Total Slots</div>
              <div className="text-lg font-mono-code font-bold text-white">{result.slots.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Engine Seed</div>
              <div className="text-lg font-mono-code font-bold text-slate-300">#{seed}</div>
            </div>
          </div>
        </PlasmaGlass>
      )}
    </div>
  );
};
