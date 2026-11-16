import React, { useMemo, useState, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { useAuth } from '../auth/useAuth';
import { runFeasibilityAudit } from '../calc/feasibility';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { MissingAiKeyBanner } from '../components/ai/MissingAiKeyBanner';
import { hasAiKey } from '../services/aiKeyStorage';
import { 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Layers, 
  HelpCircle, 
  Wrench,
  GraduationCap
} from 'lucide-react';

export const FeasibilityPage: React.FC = () => {
  const { project, setCurrentRoute } = useTimetableStore();
  const { user } = useAuth();
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(true);

  useEffect(() => {
    hasAiKey(user?.uid || 'default_user').then(setHasConfiguredKey);
  }, [user?.uid]);

  const audit = useMemo(() => {
    return runFeasibilityAudit(project);
  }, [project]);

  const { isFeasible, blockingErrors, warnings } = audit;
  const { classes, teachers, school } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  const totalSlotsPerWeek = (school.days || [1, 2, 3, 4, 5]).reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Combinatorial Feasibility Audit
            </h1>
            <p className="text-xs text-slate-400">
              Pre-flight mathematical check before launching simulated annealing
            </p>
          </div>
        </div>

        {isFeasible ? (
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setCurrentRoute('generate')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Proceed to Timetable Generator
          </MoltenButton>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> Generation Blocked ({blockingErrors.length} errors)
          </div>
        )}
      </div>

      {!hasConfiguredKey && (
        <MissingAiKeyBanner currentRouteName="feasibility" />
      )}

      {/* Why We Ask Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why calculate math first:</span> School timetabling is NP-complete. Rather than letting the engine run endlessly on an instance that mathematically violates the pigeonhole principle, we audit period counts, faculty availability, and room bottlenecks first.
        </div>
      </div>

      {/* Hero Feasibility Status Banner */}
      <PlasmaGlass
        glow={isFeasible}
        className={`p-6 sm:p-8 border-2 transition-all ${
          isFeasible
            ? 'border-emerald-500/40 bg-[#0d1f14]/80 shadow-emerald-950/40'
            : 'border-red-500/50 bg-[#200d12]/80 shadow-red-950/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isFeasible
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-500/20 border-red-500/40 text-red-400'
              }`}
            >
              {isFeasible ? (
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              ) : (
                <ShieldAlert className="w-8 h-8 animate-bounce" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">
                  {isFeasible ? 'Timetable Instance is Mathematically Feasible' : 'Mathematical Conflicts Detected'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {isFeasible
                  ? 'All selected classes have valid curriculum distributions and faculty workloads are strictly within constraints.'
                  : `Found ${blockingErrors.length} blocking mathematical contradiction${blockingErrors.length > 1 ? 's' : ''}. Resolve them below before launching the solver.`}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Instance Health</div>
              <div className={`text-base font-mono-code font-bold ${isFeasible ? 'text-emerald-300' : 'text-red-400'}`}>
                {blockingErrors.length} Errors • {warnings.length} Warnings
              </div>
            </div>
          </div>
        </div>
      </PlasmaGlass>

      {/* Blocking Errors */}
      {blockingErrors.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Blocking Conflicts ({blockingErrors.length})
          </h2>

          <div className="space-y-2">
            {blockingErrors.map((err, idx) => (
              <PlasmaGlass
                key={idx}
                className="p-4 border border-red-500/40 bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {err.message}
                  </div>
                  {err.affected && err.affected.length > 0 && (
                    <div className="text-[11px] text-red-200 font-mono-code">
                      Affected: <strong className="text-white">{err.affected.join(', ')}</strong>
                    </div>
                  )}
                  {err.suggestion && (
                    <div className="text-xs text-amber-200/90 pt-1 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Suggested fix: {err.suggestion}</span>
                    </div>
                  )}
                </div>

                <MoltenButton
                  size="sm"
                  variant="glass"
                  onClick={() => setCurrentRoute(err.code.includes('TEACHER') ? 'staff' : 'classes')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="shrink-0 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                >
                  Fix in {err.code.includes('TEACHER') ? 'Staff' : 'Classes'}
                </MoltenButton>
              </PlasmaGlass>
            ))}
          </div>
        </div>
      )}

      {/* Soft Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Advisory Warnings ({warnings.length})
          </h2>

          <div className="space-y-2">
            {warnings.map((warn, idx) => (
              <PlasmaGlass
                key={idx}
                className="p-3.5 border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {warn.message}
                  </div>
                  {warn.suggestion && (
                    <div className="text-[11px] text-slate-400">
                      Recommendation: {warn.suggestion}
                    </div>
                  )}
                </div>

                <MoltenButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentRoute('classes')}
                  className="shrink-0 text-amber-300"
                >
                  Adjust in Classes
                </MoltenButton>
              </PlasmaGlass>
            ))}
          </div>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <PlasmaGlass className="p-4 border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <GraduationCap className="w-4 h-4 text-ember-400" />
            <span>Active Student Cohorts</span>
          </div>
          <div className="text-2xl font-bold font-mono-code text-white">
            {selectedClasses.length} / {classes.length}
          </div>
          <p className="text-[11px] text-slate-400">Classes participating in timetable generation</p>
        </PlasmaGlass>

        <PlasmaGlass className="p-4 border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Users className="w-4 h-4 text-ember-400" />
            <span>Teaching Faculty Capacity</span>
          </div>
          <div className="text-2xl font-bold font-mono-code text-white">
            {teachers.length} Faculty
          </div>
          <p className="text-[11px] text-slate-400">Instructors available across curriculum subjects</p>
        </PlasmaGlass>

        <PlasmaGlass className="p-4 border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Layers className="w-4 h-4 text-ember-400" />
            <span>Slots Target per Class</span>
          </div>
          <div className="text-2xl font-bold font-mono-code text-amber-300">
            {totalSlotsPerWeek} periods
          </div>
          <p className="text-[11px] text-slate-400">{(school.days || [1, 2, 3, 4, 5]).length} working days per week</p>
        </PlasmaGlass>
      </div>
    </div>
  );
};
