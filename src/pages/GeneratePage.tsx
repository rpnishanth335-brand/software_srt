import React, { useState, useRef, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { useAuth } from '../auth/useAuth';
import { SolverClient } from '../solver/client';
import { SolverProgress, SolverResult } from '../solver/types';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { MissingAiKeyBanner } from '../components/ai/MissingAiKeyBanner';
import { ConsentPayloadPreviewModal } from '../components/ai/ConsentPayloadPreviewModal';
import { hasAiKey, getAiKey } from '../services/aiKeyStorage';
import { generateTimetableWithAi, StageProgressUpdate, AiGenerationResult, buildCompactAiPayload } from '../solver/aiGenerator';
import { computeTimetableCalculations } from '../calc/timetableMath';
import { 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Dices, 
  Zap, 
  StopCircle,
  Sparkles,
  Bot,
  Cpu,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Wrench
} from 'lucide-react';
import { TimetableVersion, AppRoute } from '../types';

export const GeneratePage: React.FC = () => {
  const { project, setCurrentRoute, setTimetableVersion, addToast, setActiveTab } = useTimetableStore();
  const { school, classes, subjects, teachers, assignments } = project;
  const totalSlotsPerWeek = (school.days || [1, 2, 3, 4, 5]).reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );
  const selectedClasses = classes.filter((c) => c.selected);

  // Pre-Flight Validation Checks
  const preflightIssues: Array<{
    id: string;
    level: 'error' | 'warning';
    title: string;
    description: string;
    actionLabel: string;
    targetRoute: AppRoute;
  }> = [];

  if (subjects.length === 0) {
    preflightIssues.push({
      id: 'no-subjects',
      level: 'error',
      title: 'Step 1 Incomplete: No Subjects Added',
      description: 'You need curriculum subjects before generating.',
      actionLabel: '1. Add Subjects',
      targetRoute: 'subjects',
    });
  }

  if (teachers.length === 0) {
    preflightIssues.push({
      id: 'no-teachers',
      level: 'error',
      title: 'Step 2 Incomplete: No Staff Added',
      description: 'You need faculty members to teach subjects.',
      actionLabel: '2. Add Faculty',
      targetRoute: 'staff',
    });
  }

  if (selectedClasses.length === 0) {
    preflightIssues.push({
      id: 'no-classes',
      level: 'error',
      title: 'Step 3 Incomplete: No Classes Selected',
      description: 'Select at least one class cohort to generate.',
      actionLabel: '3. Setup Classes',
      targetRoute: 'classes',
    });
  } else {
    for (const c of selectedClasses) {
      const classAssignments = assignments.filter((a) => a.classId === c.id);
      const assignedPeriods = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
      const hasUnassignedTeacher = classAssignments.some((a) => a.periodsPerWeek > 0 && !a.teacherId);

      if (c.status === 'overfilled' || assignedPeriods > totalSlotsPerWeek) {
        preflightIssues.push({
          id: `class-over-${c.id}`,
          level: 'error',
          title: `Class ${c.name}${c.section} Over Capacity (${assignedPeriods}/${totalSlotsPerWeek})`,
          description: `Assigned periods exceed total weekly slots (${totalSlotsPerWeek}).`,
          actionLabel: `Fix Class ${c.name}${c.section}`,
          targetRoute: 'classes',
        });
      } else if (c.status === 'incomplete' || assignedPeriods < totalSlotsPerWeek || hasUnassignedTeacher) {
        preflightIssues.push({
          id: `class-inc-${c.id}`,
          level: 'warning',
          title: `Class ${c.name}${c.section} Incomplete (${assignedPeriods}/${totalSlotsPerWeek})`,
          description: hasUnassignedTeacher
            ? 'One or more subjects do not have an assigned teacher.'
            : `Class has ${totalSlotsPerWeek - assignedPeriods} unscheduled period(s).`,
          actionLabel: `Edit Class ${c.name}${c.section}`,
          targetRoute: 'classes',
        });
      }
    }
  }

  const blockingPreflightCount = preflightIssues.filter((i) => i.level === 'error').length;

  const { user } = useAuth();

  // Mode & Configuration
  const [generationMode, setGenerationMode] = useState<'ai_hybrid' | 'local_solver'>('ai_hybrid');
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(true);
  const [extraInstructions, setExtraInstructions] = useState<string>('');
  const [seed, setSeed] = useState<number>(42);
  const [qualityMode, setQualityMode] = useState<'fast' | 'balanced' | 'best'>('balanced');
  const selectedClassIds = classes.filter((c) => c.selected).map((c) => c.id);

  // Solving & AI Generation State
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solverProgress, setSolverProgress] = useState<SolverProgress | null>(null);
  const [aiProgress, setAiProgress] = useState<StageProgressUpdate | null>(null);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [aiResult, setAiResult] = useState<AiGenerationResult | null>(null);

  // Consent Modal
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [consentPayload, setConsentPayload] = useState<any>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const solverClientRef = useRef<SolverClient | null>(null);

  useEffect(() => {
    solverClientRef.current = new SolverClient();
    return () => {
      solverClientRef.current?.terminate();
      abortControllerRef.current?.abort();
    };
  }, []);

  // Check if API key is stored in IndexedDB
  useEffect(() => {
    const checkKey = async () => {
      const uid = user?.uid || 'default_user';
      const present = await hasAiKey(uid);
      setHasConfiguredKey(present);
    };
    checkKey();
  }, [user?.uid]);

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 100000));
  };

  // Triggered when user clicks "Generate"
  const handleInitiateGeneration = async () => {
    if (blockingPreflightCount > 0) {
      addToast(`Please resolve the ${blockingPreflightCount} blocking pre-flight item(s) before generating.`, 'warning');
      return;
    }

    if (generationMode === 'ai_hybrid') {
      const uid = user?.uid || 'default_user';
      const key = await getAiKey(uid);

      if (!key) {
        setHasConfiguredKey(false);
        addToast('Please add your Gemini API key in Settings to use AI generation.', 'warning');
        return;
      }

      // Pre-compute calculations to check blocking errors and build consent preview
      const calcs = computeTimetableCalculations(project);
      if (calcs.hasBlockingErrors) {
        addToast('Generation blocked: Please fix mathematical overbooking in Feasibility Audit first.', 'error');
        setCurrentRoute('feasibility');
        return;
      }

      const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
      const lockedSlots = activeVersion ? activeVersion.slots.filter((s) => s.locked) : [];

      const payload = buildCompactAiPayload(project, selectedClassIds, calcs, lockedSlots, extraInstructions);
      setConsentPayload(payload);
      setShowConsentModal(true);
    } else {
      // Local Solver Only
      handleStartLocalSolver();
    }
  };

  // Runs the AI generation pipeline after user approves payload preview
  const handleRunAiPipeline = async () => {
    const uid = user?.uid || 'default_user';
    const apiKey = (await getAiKey(uid)) || '';
    const storedModel = localStorage.getItem('chronoforge_ai_model');
    const model = (!storedModel || storedModel.includes('gemini-2.5') || storedModel.includes('gemini-1.5'))
      ? 'gemini-3.8-flash'
      : storedModel;
    const temperature = parseFloat(localStorage.getItem('chronoforge_ai_temp') || '0.1');
    const useProxy = localStorage.getItem('chronoforge_use_proxy') === 'true';

    setIsSolving(true);
    setResult(null);
    setAiResult(null);
    setAiProgress({
      stage: 'calculating',
      message: 'Running pre-flight capacity calculations...',
      progressPct: 5,
    });

    abortControllerRef.current = new AbortController();

    try {
      const generated = await generateTimetableWithAi(project, {
        apiKey,
        model,
        temperature,
        useProxy,
        selectedClassIds,
        extraInstructions,
        seed,
        qualityMode,
        signal: abortControllerRef.current.signal,
        onProgress: (p) => {
          setAiProgress(p);
        },
      });

      setAiResult(generated);

      // Save generated timetable to store versions
      const newVersionId = `v-${Date.now()}`;
      const newVersion: TimetableVersion = {
        id: newVersionId,
        name: `Version ${project.timetables.length + 1} (${model} + Validator)`,
        createdAt: Date.now(),
        seed,
        qualityMode,
        slots: generated.slots,
        hardConflicts: generated.hardConflicts,
        softScore: generated.softScore,
        runtimeMs: generated.runtimeMs,
        metadata: {
          runtimeMs: generated.runtimeMs,
          seed,
        },
      };

      setTimetableVersion(newVersion);
      addToast('Timetable successfully synthesized with 0 hard conflicts!', 'success');
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        addToast('AI Generation was cancelled.', 'info');
      } else {
        console.error('AI Generation Failure:', err);
        addToast(err?.message || 'AI Generation encountered an error.', 'error');
      }
    } finally {
      setIsSolving(false);
    }
  };

  // Local Simulated Annealing Solver
  const handleStartLocalSolver = async () => {
    if (!solverClientRef.current) return;

    setIsSolving(true);
    setResult(null);
    setAiResult(null);
    setSolverProgress({
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
          setSolverProgress(p);
        }
      );

      setResult(solverRes);

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
    abortControllerRef.current?.abort();
    solverClientRef.current?.terminate();
    solverClientRef.current = new SolverClient();
    setIsSolving(false);
    addToast('Generation stopped.', 'info');
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
              Timetable Synthesis Engine
            </h1>
            <p className="text-xs text-slate-400">
              Generate conflict-free institution timetables with deterministic validation &amp; simulated annealing
            </p>
          </div>
        </div>

        {(result || aiResult) && (
          <div className="flex items-center gap-2">
            <MoltenButton
              size="sm"
              variant="glass"
              onClick={() => {
                setActiveTab('calculations');
                setCurrentRoute('viewer');
              }}
              leftIcon={<BarChart3 className="w-4 h-4 text-ember-400" />}
            >
              Calculation Report
            </MoltenButton>
            <MoltenButton
              size="sm"
              variant="molten"
              onClick={() => setCurrentRoute('viewer')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Timetable
            </MoltenButton>
          </div>
        )}
      </div>

      {/* Missing Key Banner */}
      {!hasConfiguredKey && generationMode === 'ai_hybrid' && (
        <MissingAiKeyBanner currentRouteName="generate" />
      )}

      {/* Generation Mode Switcher */}
      <div className="p-1 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setGenerationMode('ai_hybrid')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            generationMode === 'ai_hybrid'
              ? 'bg-gradient-to-r from-purple-600 via-amber-600 to-amber-500 text-white shadow-ember-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI + Deterministic Validator (Recommended)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono-code">Hybrid</span>
        </button>

        <button
          type="button"
          onClick={() => setGenerationMode('local_solver')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            generationMode === 'local_solver'
              ? 'bg-amber-500 text-white shadow-ember-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Local Simulated Annealing Only (Offline)</span>
        </button>
      </div>

      {/* Pre-Flight Health & Readiness Checker */}
      <PlasmaGlass glow={blockingPreflightCount === 0} className={`p-4 sm:p-5 border ${blockingPreflightCount > 0 ? 'border-red-500/40 bg-red-950/15' : 'border-emerald-500/40 bg-emerald-950/15'} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {blockingPreflightCount > 0 ? (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Pre-Flight Generation Readiness
                {blockingPreflightCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                    {blockingPreflightCount} Blocking Issue{blockingPreflightCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    All Checks Passed
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {blockingPreflightCount > 0
                  ? 'Resolve blocking setup items below before generating your master timetable.'
                  : `${subjects.length} Subjects, ${teachers.length} Faculty, and ${selectedClasses.length} Classes verified for 0-conflict generation.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <MoltenButton
              size="sm"
              variant="glass"
              onClick={() => setCurrentRoute('feasibility')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
              className="text-xs"
            >
              Audit Math
            </MoltenButton>
          </div>
        </div>

        {/* Preflight Issue List */}
        {preflightIssues.length > 0 && (
          <div className="space-y-2 pt-1">
            {preflightIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  issue.level === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${issue.level === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {issue.title}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      {issue.description}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentRoute(issue.targetRoute)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-colors self-start sm:self-auto flex items-center gap-1.5"
                >
                  <Wrench className="w-3 h-3 text-amber-300" />
                  <span>{issue.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PlasmaGlass>

      {/* Solver Configuration Panel */}
      <PlasmaGlass glow={!isSolving} className="p-6 border-white/10 space-y-6">
        <div className="text-sm font-bold text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-ember-400" /> Synthesis Parameters
          </div>
          <span className="text-xs text-slate-400 font-normal">
            Mode: <strong>{generationMode === 'ai_hybrid' ? 'Gemini AI + Validator' : 'Local Simulated Annealing'}</strong>
          </span>
        </div>

        {/* Extra Instructions (AI Mode Only) */}
        {generationMode === 'ai_hybrid' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Natural Language Constraints &amp; Directives (Optional)
            </label>
            <input
              type="text"
              disabled={isSolving}
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              placeholder='e.g., "Keep Maths and Science in morning periods" or "Distribute sports on Thursday afternoon"'
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>
        )}

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
            {isSolving ? 'Synthesis in progress...' : 'Ready to forge schedules.'}
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
                Stop Process
              </MoltenButton>
            ) : (
              <MoltenButton
                size="lg"
                variant={blockingPreflightCount > 0 ? 'glass' : 'molten'}
                disabled={blockingPreflightCount > 0}
                onClick={handleInitiateGeneration}
                leftIcon={generationMode === 'ai_hybrid' ? <Sparkles className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                className={
                  blockingPreflightCount > 0
                    ? 'opacity-60 cursor-not-allowed border-red-500/30 text-slate-400'
                    : generationMode === 'ai_hybrid'
                    ? 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500'
                    : ''
                }
              >
                {blockingPreflightCount > 0
                  ? `Fix ${blockingPreflightCount} Item(s) to Generate`
                  : generationMode === 'ai_hybrid'
                  ? 'Synthesize with AI + Validator'
                  : 'Generate with Local Solver'}
              </MoltenButton>
            )}
          </div>
        </div>
      </PlasmaGlass>

      {/* Animated Stage Tracker (AI Mode) */}
      {isSolving && aiProgress && (
        <PlasmaGlass glow className="p-6 border-purple-500/50 space-y-4 animate-slideIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <h3 className="text-sm font-bold text-white capitalize">
                Stage: {aiProgress.stage.replace('_', ' ')} ({aiProgress.progressPct}%)
              </h3>
            </div>
            <div className="font-mono-code text-xs text-amber-300 font-bold">
              {aiProgress.message}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${aiProgress.progressPct}%` }}
            />
          </div>

          {/* 6 Stage Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono-code pt-1">
            {[
              { id: 'calculating', label: '1. Math Audit' },
              { id: 'preparing', label: '2. Prepare' },
              { id: 'calling_ai', label: '3. Gemini AI' },
              { id: 'validating', label: '4. Validate' },
              { id: 'repairing', label: '5. Repair' },
              { id: 'finalizing', label: '6. Finalize' },
            ].map((stg) => {
              const stagesOrder = ['calculating', 'preparing', 'calling_ai', 'validating', 'repairing', 'finalizing', 'completed'];
              const currentIdx = stagesOrder.indexOf(aiProgress.stage);
              const thisIdx = stagesOrder.indexOf(stg.id);
              const isPast = currentIdx > thisIdx;
              const isCurrent = currentIdx === thisIdx;

              return (
                <div
                  key={stg.id}
                  className={`p-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-ember-glow'
                      : isPast
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-black/30 border-white/5 text-slate-500'
                  }`}
                >
                  {stg.label}
                </div>
              );
            })}
          </div>
        </PlasmaGlass>
      )}

      {/* Live Progress for Local Solver */}
      {isSolving && solverProgress && !aiProgress && (
        <PlasmaGlass glow className="p-6 border-amber-500/50 space-y-4 animate-slideIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              <h3 className="text-sm font-bold text-white capitalize">
                Phase: {solverProgress.phase} ({solverProgress.phaseProgress}%)
              </h3>
            </div>
            <div className="font-mono-code text-xs text-amber-300 font-bold">
              {solverProgress.runtimeMs}ms • {solverProgress.iterations.toLocaleString()} Iterations
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-300"
              style={{ width: `${solverProgress.phaseProgress}%` }}
            />
          </div>
        </PlasmaGlass>
      )}

      {/* Completed Results Summary (AI Mode) */}
      {aiResult && !isSolving && (
        <PlasmaGlass glow className="p-6 border-emerald-500/40 bg-[#0d1f14]/80 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Timetable Successfully Synthesized!
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    0 Hard Conflicts
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {aiResult.explanationNotes}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MoltenButton
                size="md"
                variant="glass"
                onClick={() => {
                  setActiveTab('calculations');
                  setCurrentRoute('viewer');
                }}
                leftIcon={<BarChart3 className="w-4 h-4 text-ember-400" />}
              >
                Calculation Report
              </MoltenButton>
              <MoltenButton
                size="md"
                variant="molten"
                onClick={() => setCurrentRoute('viewer')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Open Timetable
              </MoltenButton>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs pt-2 border-t border-white/10">
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Hard Conflicts</div>
              <div className="text-lg font-mono-code font-bold text-emerald-400">0 (Zero)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Soft Satisfaction</div>
              <div className="text-lg font-mono-code font-bold text-amber-300">{aiResult.softScore} pts</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Validator Corrections</div>
              <div className="text-lg font-mono-code font-bold text-purple-300">{aiResult.aiVsSolverCorrections} slots</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Time Elapsed</div>
              <div className="text-lg font-mono-code font-bold text-white">{aiResult.runtimeMs} ms</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div className="text-[11px] text-slate-400">Tokens Consumed</div>
              <div className="text-lg font-mono-code font-bold text-amber-400">{aiResult.tokensUsed} tokens</div>
            </div>
          </div>
        </PlasmaGlass>
      )}

      {/* Completed Results Summary (Local Solver Mode) */}
      {result && !isSolving && !aiResult && (
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
              View Timetable
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

      {/* Consent Payload Preview Modal */}
      {showConsentModal && consentPayload && (
        <ConsentPayloadPreviewModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onProceed={handleRunAiPipeline}
          payload={consentPayload}
          model={localStorage.getItem('chronoforge_ai_model') || 'gemini-3.8-flash'}
        />
      )}
    </div>
  );
};
