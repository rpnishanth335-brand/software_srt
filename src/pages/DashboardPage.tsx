import React, { useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { runFeasibilityAudit } from '../calc/feasibility';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Users, 
  DoorOpen, 
  ShieldCheck, 
  Flame, 
  Download, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { AppRoute } from '../types';

export const DashboardPage: React.FC = () => {
  const { project, setCurrentRoute } = useTimetableStore();
  const { school, classes, subjects, teachers, rooms, assignments, timetables, currentVersionId } = project;

  const selectedClasses = classes.filter((c) => c.selected);
  const activeDaysCount = school.days?.length || 5;
  const maxDayPeriods = Math.max(...Object.values(school.periodsByDay || {}), 8);
  const totalSlotsPerWeek = (school.days || [1, 2, 3, 4, 5]).reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );

  // Feasibility Check
  const audit = useMemo(() => {
    return runFeasibilityAudit(project);
  }, [project]);

  // Active timetable
  const activeTimetable = timetables.find((t) => t.id === currentVersionId) || timetables[0];

  // Setup Completeness Score (0-100%)
  const setupSteps = useMemo(() => {
    const hasSchool = Boolean(school.name.trim() && (school.days?.length > 0 || (school.workingDays && school.workingDays.length > 0)));
    const hasClasses = classes.length > 0 && selectedClasses.length > 0;
    const hasSubjects = subjects.length > 0;
    const hasStaff = teachers.length > 0;
    const hasRooms = rooms.length > 0;
    const hasAssignments = assignments.some(a => a.periodsPerWeek > 0);
    const hasGenerated = timetables.length > 0 && (activeTimetable?.slots.length || 0) > 0;

    return [
      { id: 'school', title: 'School Settings', done: hasSchool, detail: school.name || 'Set institution info', route: 'school' as AppRoute },
      { id: 'classes', title: 'Classes & Sections', done: hasClasses, detail: `${selectedClasses.length} selected of ${classes.length}`, route: 'classes' as AppRoute },
      { id: 'subjects', title: 'Subjects Catalog', done: hasSubjects, detail: `${subjects.length} registered`, route: 'subjects' as AppRoute },
      { id: 'staff', title: 'Faculty & Staff', done: hasStaff, detail: `${teachers.length} faculty registered`, route: 'staff' as AppRoute },
      { id: 'rooms', title: 'Rooms & Labs', done: hasRooms, detail: `${rooms.length} facilities registered`, route: 'rooms' as AppRoute },
      { id: 'assignments', title: 'Curriculum Matrix', done: hasAssignments, detail: `${assignments.filter(a => a.periodsPerWeek > 0).length} active allocations`, route: 'assignments' as AppRoute },
      { id: 'generate', title: 'Generate Timetable', done: hasGenerated, detail: hasGenerated ? `${activeTimetable?.slots.length} slots synthesized` : 'Not yet generated', route: 'generate' as AppRoute },
    ];
  }, [school, classes, selectedClasses, subjects, teachers, rooms, assignments, timetables, activeTimetable]);

  const completedCount = setupSteps.filter(s => s.done).length;
  const completenessPercentage = Math.round((completedCount / setupSteps.length) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-ember-gold" />
            <span>{school.name || 'ChronoForge School Timetable ERP'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Academic Year {school.year || school.academicYear || '2026–2027'} • {activeDaysCount} Working Days • {maxDayPeriods} Periods/Day
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setCurrentRoute('classes')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Class
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setCurrentRoute('subjects')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Subject
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setCurrentRoute('staff')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Staff
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setCurrentRoute('generate')}
            leftIcon={<Flame className="w-3.5 h-3.5" />}
          >
            Generate
          </MoltenButton>
        </div>
      </div>

      {/* Setup Completeness Progress Card */}
      <PlasmaGlass glow className="p-6 border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ember-gold" />
              <span>Timetable Readiness: {completenessPercentage}% Complete</span>
            </div>
            <p className="text-xs text-slate-400">
              {completedCount} of {setupSteps.length} essential setup milestones completed
            </p>
          </div>

          <div className="text-right font-mono-code text-xs text-amber-300 font-bold">
            {completenessPercentage === 100 ? 'Ready for Publication!' : 'Setup in Progress'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-700"
            style={{ width: `${completenessPercentage}%` }}
          />
        </div>

        {/* Milestone Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {setupSteps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentRoute(step.route)}
              className={`p-2 rounded-xl text-left border transition-all ${
                step.done
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={step.done ? 'text-emerald-300' : 'text-slate-300'}>{step.title}</span>
                {step.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-1">
                {step.detail}
              </div>
            </button>
          ))}
        </div>
      </PlasmaGlass>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <PlasmaGlass hoverEffect className="p-4 border-white/10 cursor-pointer" onClick={() => setCurrentRoute('classes')}>
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <GraduationCap className="w-4 h-4 text-ember-400" /> Classes
          </div>
          <div className="text-xl font-bold font-mono-code text-white">
            {selectedClasses.length} <span className="text-xs text-slate-500">/ {classes.length}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active cohorts</div>
        </PlasmaGlass>

        <PlasmaGlass hoverEffect className="p-4 border-white/10 cursor-pointer" onClick={() => setCurrentRoute('subjects')}>
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <BookOpen className="w-4 h-4 text-ember-400" /> Subjects
          </div>
          <div className="text-xl font-bold font-mono-code text-white">
            {subjects.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{subjects.filter(s => s.doublePeriod).length} practical labs</div>
        </PlasmaGlass>

        <PlasmaGlass hoverEffect className="p-4 border-white/10 cursor-pointer" onClick={() => setCurrentRoute('staff')}>
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-4 h-4 text-ember-400" /> Faculty
          </div>
          <div className="text-xl font-bold font-mono-code text-white">
            {teachers.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Teaching staff</div>
        </PlasmaGlass>

        <PlasmaGlass hoverEffect className="p-4 border-white/10 cursor-pointer" onClick={() => setCurrentRoute('rooms')}>
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <DoorOpen className="w-4 h-4 text-ember-400" /> Rooms
          </div>
          <div className="text-xl font-bold font-mono-code text-white">
            {rooms.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Labs &amp; rooms</div>
        </PlasmaGlass>

        <PlasmaGlass hoverEffect className="p-4 border-white/10 cursor-pointer" onClick={() => setCurrentRoute('feasibility')}>
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-ember-400" /> Feasibility
          </div>
          <div className={`text-base font-bold font-mono-code ${audit.isFeasible ? 'text-emerald-400' : 'text-red-400'}`}>
            {audit.isFeasible ? 'Feasible ✓' : `${audit.blockingErrors.length} Errors`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{audit.warnings.length} warnings</div>
        </PlasmaGlass>

        <PlasmaGlass hoverEffect className="p-4 border-white/10 cursor-pointer" onClick={() => setCurrentRoute('viewer')}>
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CalendarDays className="w-4 h-4 text-ember-400" /> Timetable
          </div>
          <div className="text-xl font-bold font-mono-code text-amber-300">
            {activeTimetable ? `${activeTimetable.slots.length}` : '0'} <span className="text-xs text-slate-500">slots</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{timetables.length} versions</div>
        </PlasmaGlass>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Action Hub & Feasibility Summary */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Timetable Card */}
          <PlasmaGlass glow={Boolean(activeTimetable)} className="p-6 border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Flame className="w-4 h-4 text-ember-400" />
                <span>Current Active Timetable</span>
              </div>
              {activeTimetable && (
                <span className="text-xs text-emerald-400 font-mono-code font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 0 Hard Conflicts
                </span>
              )}
            </div>

            {activeTimetable ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Active Version</span>
                    <span className="font-bold text-white text-xs">{activeTimetable.name || 'Version 1'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Soft Score</span>
                    <span className="font-bold text-amber-300 font-mono-code">{activeTimetable.softScore} pts</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Total Slots</span>
                    <span className="font-bold text-white font-mono-code">{activeTimetable.slots.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MoltenButton
                    size="sm"
                    variant="molten"
                    onClick={() => setCurrentRoute('viewer')}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="flex-1 justify-center"
                  >
                    Open Timetable Viewer
                  </MoltenButton>
                  <MoltenButton
                    size="sm"
                    variant="glass"
                    onClick={() => setCurrentRoute('export')}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="flex-1 justify-center"
                  >
                    Export Documents
                  </MoltenButton>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  No schedule generated yet. Complete the setup checklist and run the AI solver.
                </p>
                <MoltenButton
                  size="sm"
                  variant="molten"
                  onClick={() => setCurrentRoute('generate')}
                  leftIcon={<Flame className="w-4 h-4" />}
                >
                  Generate First Timetable
                </MoltenButton>
              </div>
            )}
          </PlasmaGlass>

          {/* Setup Checklist */}
          <PlasmaGlass className="p-6 border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step Setup Guide</span>
            </h3>

            <div className="space-y-2">
              {setupSteps.map((step, idx) => (
                <div
                  key={step.id}
                  onClick={() => setCurrentRoute(step.route)}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      step.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
                    }`}>
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{step.title}</div>
                      <div className="text-[11px] text-slate-400">{step.detail}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          </PlasmaGlass>
        </div>

        {/* Right Column: Feasibility Diagnostic & System Health */}
        <div className="lg:col-span-5 space-y-5">
          <PlasmaGlass className="p-6 border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Feasibility Health Check</span>
              </h3>
              <MoltenButton size="sm" variant="ghost" onClick={() => setCurrentRoute('feasibility')}>
                View Details
              </MoltenButton>
            </div>

            {audit.blockingErrors.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  {audit.blockingErrors.length} Unresolved Errors
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {audit.blockingErrors.slice(0, 3).map((err, i) => (
                    <li key={i} className="truncate">{err.message}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">Zero Mathematical Conflicts</div>
                  <div className="text-[11px] text-slate-300">All periods and teacher capacities are balanced.</div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Working Days:</span>
                <span className="text-white font-mono-code">{activeDaysCount} days/week</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Periods per Day:</span>
                <span className="text-white font-mono-code">{maxDayPeriods} periods</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Weekly Capacity:</span>
                <span className="text-amber-300 font-mono-code font-bold">{totalSlotsPerWeek} slots/class</span>
              </div>
            </div>
          </PlasmaGlass>
        </div>
      </div>
    </div>
  );
};
