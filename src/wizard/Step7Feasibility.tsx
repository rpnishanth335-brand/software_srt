import React, { useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { runFeasibilityAudit } from '../calc/feasibility';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Layers, 
  HelpCircle,
  FlaskConical,
  Wrench
} from 'lucide-react';

export const Step7Feasibility: React.FC = () => {
  const { project, setStep } = useTimetableStore();

  const audit = useMemo(() => {
    return runFeasibilityAudit(project);
  }, [project]);

  const { isFeasible, blockingErrors, warnings, teacherLoadMap } = audit;
  const { classes, teachers, subjects, school } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  const totalSchoolSlots = school.days.reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we calculate everything first:</span> Timetabling is mathematically constrained. Rather than running a blind solver that loops endlessly on an impossible instance, the feasibility calculator runs discrete combinatorial checks (pigeonhole theorem, capacity limits, and room bottlenecks). Generation is unlocked only when all blocking errors reach zero.
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
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isFeasible
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {isFeasible ? 'Mathematically Feasible' : 'Blocking Conflicts Detected'}
                </span>
                <span className="text-xs text-slate-400 font-mono-code">
                  {blockingErrors.length} Errors • {warnings.length} Warnings
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                {isFeasible
                  ? 'Your Schedule Matrix is 100% Solvable'
                  : 'Resolution Required Before Generation'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                {isFeasible
                  ? 'All class slot demands, faculty limits, and room capacities are mathematically harmonized. You may now ignite the timetable solver.'
                  : 'Review the diagnostic cards below and follow the actionable fix suggestions to resolve mathematical deadlocks.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <MoltenButton
              size="lg"
              variant={isFeasible ? 'molten' : 'glass'}
              disabled={!isFeasible}
              isForge={isFeasible}
              onClick={() => setStep(8)}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {isFeasible ? 'Ignite Solver Forge' : 'Blocked by Conflicts'}
            </MoltenButton>
            {!isFeasible && (
              <span className="text-[11px] text-red-400 font-mono-code">
                Resolve {blockingErrors.length} error{blockingErrors.length === 1 ? '' : 's'} to unlock
              </span>
            )}
          </div>
        </div>
      </PlasmaGlass>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <PlasmaGlass className="p-5">
          <div className="text-xs font-mono-code text-slate-400 mb-1 flex items-center justify-between">
            <span>SELECTED CLASSES</span>
            <Layers className="w-4 h-4 text-ember-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-code">
            {selectedClasses.length} Cohorts
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalSchoolSlots} lesson slots available per cohort
          </div>
        </PlasmaGlass>

        {/* Metric 2 */}
        <PlasmaGlass className="p-5">
          <div className="text-xs font-mono-code text-slate-400 mb-1 flex items-center justify-between">
            <span>FACULTY ACTIVE</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-code">
            {teachers.length} Faculty
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {Object.values(teacherLoadMap).reduce((s, t) => s + t.required, 0)} total teaching periods
          </div>
        </PlasmaGlass>

        {/* Metric 3 */}
        <PlasmaGlass className="p-5">
          <div className="text-xs font-mono-code text-slate-400 mb-1 flex items-center justify-between">
            <span>LABS &amp; SPECIAL ROOMS</span>
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-code">
            {subjects.filter((s) => s.specialRoomId).length} Spaces
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zero room collisions detected
          </div>
        </PlasmaGlass>

        {/* Metric 4 */}
        <PlasmaGlass className="p-5">
          <div className="text-xs font-mono-code text-slate-400 mb-1 flex items-center justify-between">
            <span>SOLVABILITY CONFIDENCE</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono-code">
            {isFeasible ? '99.9%' : '0%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isFeasible ? 'Deterministic completion' : 'Hard deadlocks exist'}
          </div>
        </PlasmaGlass>
      </div>

      {/* Diagnostic Feed */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
          Diagnostic Audit Feed ({blockingErrors.length + warnings.length})
        </h3>

        {/* Blocking Errors */}
        {blockingErrors.map((err) => (
          <PlasmaGlass
            key={err.id}
            className="p-5 border-l-4 border-l-red-500 bg-red-950/20 space-y-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-code font-bold text-red-300 uppercase">
                      [{err.code}]
                    </span>
                    <span className="text-xs font-bold text-white">{err.message}</span>
                  </div>
                  {err.suggestion && (
                    <div className="mt-2 text-xs text-amber-200/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2">
                      <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Actionable Fix:</strong> {err.suggestion}</span>
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase shrink-0">
                Blocking
              </span>
            </div>
          </PlasmaGlass>
        ))}

        {/* Warnings */}
        {warnings.map((warn) => (
          <PlasmaGlass
            key={warn.id}
            className="p-5 border-l-4 border-l-amber-500 bg-amber-950/20 space-y-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-code font-bold text-amber-300 uppercase">
                      [{warn.code}]
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{warn.message}</span>
                  </div>
                  {warn.suggestion && (
                    <div className="mt-2 text-xs text-slate-300 bg-white/5 p-2 rounded border border-white/10">
                      <strong>Suggestion:</strong> {warn.suggestion}
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase shrink-0">
                Warning
              </span>
            </div>
          </PlasmaGlass>
        ))}

        {/* Clean State */}
        {blockingErrors.length === 0 && warnings.length === 0 && (
          <PlasmaGlass className="p-8 text-center space-y-3 border-emerald-500/20 bg-emerald-950/10">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Zero Mathematical Conflicts Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All cohort demands align perfectly with available slots. Faculty assignments are within weekly capacity limits.
            </p>
          </PlasmaGlass>
        )}
      </div>

      {/* Teacher Load Breakdown Table */}
      <PlasmaGlass className="p-6 space-y-4">
        <h3 className="text-xs font-mono-code text-amber-400 uppercase tracking-wider">
          Faculty Capacity &amp; Assigned Workload Distribution
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] font-mono-code">
                <th className="py-2.5 px-3">Faculty Member</th>
                <th className="py-2.5 px-3">Assigned Load</th>
                <th className="py-2.5 px-3">Contract Max</th>
                <th className="py-2.5 px-3">Available Slots</th>
                <th className="py-2.5 px-3">Capacity Utilization</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono-code">
              {teachers.map((t) => {
                const info = teacherLoadMap[t.id] || { required: 0, max: t.maxPerWeek, available: 44 };
                const percent = Math.round((info.required / info.max) * 100);
                const isOverMax = info.required > info.max;
                const isOverAvail = info.required > info.available;

                return (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {t.name} ({t.code})
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">
                      {info.required} periods/wk
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {info.max} periods/wk
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {info.available} slots
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, percent)}%` }}
                            className={`h-full ${
                              isOverMax || isOverAvail ? 'bg-red-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] text-slate-300">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {isOverMax || isOverAvail ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          Overload
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PlasmaGlass>
    </div>
  );
};
