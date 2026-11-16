import React, { useState, useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { Modal } from '../components/ui/Modal';
import { 
  Grid3X3, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Wand2, 
  Copy, 
  RotateCcw, 
  Trash2
} from 'lucide-react';
import { ID, ClassRoom } from '../types';

export const AssignmentsPage: React.FC = () => {
  const { 
    project, 
    setAssignment, 
    autoAssignTeachers, 
    copyClassAssignments, 
    clearClassAssignments,
    suggestTeacherForAssignment,
    addToast 
  } = useTimetableStore();

  const { classes, subjects, teachers, assignments, school } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  // Grade filter
  const [gradeFilter, setGradeFilter] = useState<'all' | 'primary' | 'middle' | 'high' | 'senior'>('all');

  // Copy Row Modal State
  const [copySourceClass, setCopySourceClass] = useState<ClassRoom | null>(null);
  const [copyTargetIds, setCopyTargetIds] = useState<ID[]>([]);

  // Calculate available slots per class per week
  const totalSlotsPerWeek = (school.days || [1, 2, 3, 4, 5]).reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );

  // Filtered classes
  const displayedClasses = useMemo(() => {
    return selectedClasses.filter((cls) => {
      if (gradeFilter === 'all') return true;
      const numMatch = cls.name.match(/\d+/);
      const gradeNum = numMatch ? parseInt(numMatch[0], 10) : 0;
      if (gradeFilter === 'primary') return gradeNum >= 1 && gradeNum <= 5;
      if (gradeFilter === 'middle') return gradeNum >= 6 && gradeNum <= 8;
      if (gradeFilter === 'high') return gradeNum >= 9 && gradeNum <= 10;
      if (gradeFilter === 'senior') return gradeNum >= 11 && gradeNum <= 12;
      return true;
    });
  }, [selectedClasses, gradeFilter]);

  // Workload map for teachers: assigned periods vs maxPerWeek
  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<ID, number>();
    assignments.forEach((a) => {
      if (a.teacherId) {
        map.set(a.teacherId, (map.get(a.teacherId) || 0) + a.periodsPerWeek);
      }
    });
    return map;
  }, [assignments]);

  // Lookup assignment helper
  const getAssignment = (classId: ID, subjectId: ID) => {
    return assignments.find((a) => a.classId === classId && a.subjectId === subjectId);
  };

  const handlePeriodsChange = (classId: ID, subjectId: ID, periods: number) => {
    const current = getAssignment(classId, subjectId);
    const teacherId = current?.teacherId || suggestTeacherForAssignment(classId, subjectId) || '';
    setAssignment(classId, subjectId, teacherId, Math.max(0, Math.min(20, periods)));
  };

  const handleTeacherChange = (classId: ID, subjectId: ID, teacherId: ID) => {
    const current = getAssignment(classId, subjectId);
    const periods = current?.periodsPerWeek || 0;
    setAssignment(classId, subjectId, teacherId, periods);
  };

  // Open Copy Row Modal
  const openCopyModal = (cls: ClassRoom) => {
    setCopySourceClass(cls);
    setCopyTargetIds(
      selectedClasses
        .filter(c => c.id !== cls.id && c.name === cls.name) // default to same grade sections
        .map(c => c.id)
    );
  };

  const handleExecuteCopy = () => {
    if (!copySourceClass || copyTargetIds.length === 0) return;
    copyClassAssignments(copySourceClass.id, copyTargetIds);
    setCopySourceClass(null);
  };

  // Fill Standard Template
  const fillTemplate = (targetPeriods: number) => {
    if (subjects.length === 0 || selectedClasses.length === 0) {
      addToast('Add subjects and classes first before filling template.', 'warning');
      return;
    }

    const periodsPerSub = Math.max(1, Math.floor(targetPeriods / subjects.length));
    const remainder = targetPeriods % subjects.length;

    selectedClasses.forEach((cls) => {
      subjects.forEach((sub, idx) => {
        const extra = idx < remainder ? 1 : 0;
        const periods = periodsPerSub + extra;
        const teacherId = suggestTeacherForAssignment(cls.id, sub.id) || '';
        setAssignment(cls.id, sub.id, teacherId, periods);
      });
    });

    addToast(`Template applied (${targetPeriods} periods per class).`, 'success');
  };

  // Total periods allocated for a subject across all selected classes
  const getSubjectColumnTotal = (subjectId: ID) => {
    return assignments
      .filter(a => a.subjectId === subjectId && selectedClasses.some(c => c.id === a.classId))
      .reduce((sum, a) => sum + a.periodsPerWeek, 0);
  };

  return (
    <div className="space-y-6 max-w-[96rem] mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Curriculum Assignment Matrix
            </h1>
            <p className="text-xs text-slate-400">
              {selectedClasses.length} Selected Classes × {subjects.length} Subjects • Weekly Target: {totalSlotsPerWeek} periods/class
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={autoAssignTeachers}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Auto-Assign Teachers
          </MoltenButton>

          {/* Template presets */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[11px] text-slate-400 px-1 font-semibold">Templates:</span>
            <button
              onClick={() => fillTemplate(30)}
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              Primary (30h)
            </button>
            <button
              onClick={() => fillTemplate(35)}
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              Middle (35h)
            </button>
            <button
              onClick={() => fillTemplate(40)}
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              High (40h)
            </button>
          </div>

          <MoltenButton
            size="sm"
            variant="ghost"
            onClick={() => clearClassAssignments()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-red-400 hover:bg-red-500/10"
          >
            Clear All
          </MoltenButton>
        </div>
      </div>

      {/* Why We Ask Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">How this works:</span> The assignment matrix defines the exact curriculum structure. Each row represents a class. The total allocated hours must match the weekly slots available ({totalSlotsPerWeek} periods). Green indicates exact match, amber indicates unassigned slots, and red indicates over-allocation.
        </div>
      </div>

      {/* Grade Filters */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          {(['all', 'primary', 'middle', 'high', 'senior'] as const).map((gf) => (
            <button
              key={gf}
              onClick={() => setGradeFilter(gf)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                gradeFilter === gf
                  ? 'bg-ember-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {gf}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          Showing {displayedClasses.length} of {selectedClasses.length} classes
        </span>
      </div>

      {/* Assignment Table Matrix */}
      {selectedClasses.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <Grid3X3 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No classes selected for timetable</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please go to the Classes tab and include at least one class to configure curriculum assignments.
          </p>
        </PlasmaGlass>
      ) : subjects.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <Grid3X3 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No subjects registered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please register curriculum subjects in the Subjects tab first.
          </p>
        </PlasmaGlass>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl bg-[#0c0a14]/80">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-3 font-bold text-slate-200 sticky left-0 bg-[#161224] z-20 min-w-[180px] shadow-r">
                  Class / Section
                </th>
                <th className="p-3 font-bold text-center text-slate-300 min-w-[100px] border-r border-white/10">
                  Total / Target
                </th>
                {subjects.map((sub) => (
                  <th key={sub.id} className="p-3 min-w-[170px] border-r border-white/10 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-white">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                      <span className="truncate max-w-[130px]">{sub.name}</span>
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono-code font-semibold">
                      {sub.code} {sub.doublePeriod ? '• 2P' : ''}
                    </div>
                  </th>
                ))}
                <th className="p-3 font-semibold text-center text-slate-400 min-w-[120px]">
                  Row Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedClasses.map((cls) => {
                // Calculate class row total periods
                const classAssignments = assignments.filter((a) => a.classId === cls.id);
                const rowTotal = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);

                const isOver = rowTotal > totalSlotsPerWeek;
                const isUnder = rowTotal < totalSlotsPerWeek;

                let rowBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                let icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                if (isOver) {
                  rowBadgeClass = 'bg-red-500/20 text-red-300 border-red-500/40';
                  icon = <XCircle className="w-3.5 h-3.5 text-red-400" />;
                } else if (isUnder) {
                  rowBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
                }

                return (
                  <tr key={cls.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    {/* Class Homeroom Header */}
                    <td className="p-3 sticky left-0 bg-[#120f1e] z-10 font-bold text-white border-r border-white/10 shadow-r">
                      <div className="text-sm font-bold text-amber-100">{cls.name} – {cls.section}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{cls.room || 'No Room'}</div>
                    </td>

                    {/* Row Parity Status */}
                    <td className="p-3 text-center border-r border-white/10">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code font-bold border ${rowBadgeClass}`}>
                        {icon}
                        <span>{rowTotal}/{totalSlotsPerWeek}</span>
                      </div>
                    </td>

                    {/* Subject Assignment Cells */}
                    {subjects.map((sub) => {
                      const assignment = getAssignment(cls.id, sub.id);
                      const periods = assignment?.periodsPerWeek || 0;
                      const teacherId = assignment?.teacherId || '';

                      // Qualified teachers for this subject
                      const qualifiedTeachers = teachers.filter((t) => t.subjectIds.includes(sub.id));

                      return (
                        <td key={sub.id} className="p-2 border-r border-white/10 align-top">
                          <div className="space-y-1.5 p-1.5 rounded-xl bg-black/20 border border-white/5">
                            {/* Period Counter */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">Periods:</span>
                              <input
                                type="number"
                                min={0}
                                max={15}
                                value={periods}
                                onChange={(e) => handlePeriodsChange(cls.id, sub.id, parseInt(e.target.value, 10) || 0)}
                                className={`w-12 px-1.5 py-0.5 rounded text-center font-mono-code text-xs font-bold focus:outline-none ${
                                  periods > 0
                                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                                    : 'bg-white/5 border border-white/10 text-slate-500'
                                }`}
                              />
                            </div>

                            {/* Teacher Dropdown */}
                            <select
                              value={teacherId}
                              onChange={(e) => handleTeacherChange(cls.id, sub.id, e.target.value)}
                              disabled={periods === 0}
                              className={`w-full px-2 py-1 rounded-lg text-[11px] focus:outline-none ${
                                periods === 0
                                  ? 'bg-white/5 text-slate-600 border border-transparent'
                                  : teacherId
                                  ? 'bg-[#181528] text-white border border-white/20'
                                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              <option value="">(No Teacher)</option>
                              {qualifiedTeachers.map((t) => {
                                const currentLoad = teacherWorkloadMap.get(t.id) || 0;
                                return (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({currentLoad}/{t.maxPerWeek}h)
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </td>
                      );
                    })}

                    {/* Row Action Helpers */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openCopyModal(cls)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy subject allocations to other classes"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => clearClassAssignments(cls.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                          title="Reset row to 0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Column Totals Footer */}
            <tfoot>
              <tr className="border-t-2 border-white/20 bg-white/5 font-bold">
                <td className="p-3 sticky left-0 bg-[#161224] text-slate-200 z-10 border-r border-white/10 shadow-r">
                  Subject Totals
                </td>
                <td className="p-3 text-center text-slate-400 font-mono-code border-r border-white/10">
                  Total Hours
                </td>
                {subjects.map((sub) => {
                  const colTotal = getSubjectColumnTotal(sub.id);
                  return (
                    <td key={sub.id} className="p-3 text-center font-mono-code border-r border-white/10 text-amber-300">
                      {colTotal} hrs
                    </td>
                  );
                })}
                <td className="p-3 text-center text-slate-500">
                  —
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Copy Row Modal */}
      <Modal
        isOpen={Boolean(copySourceClass)}
        onClose={() => setCopySourceClass(null)}
        maxWidth="md"
        title={copySourceClass ? `Copy Allocations from ${copySourceClass.name} – ${copySourceClass.section}` : 'Copy Allocations'}
        subtitle="Select target classes to receive the exact same weekly subject period distribution"
        icon={<Copy className="w-5 h-5 text-ember-400" />}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <MoltenButton size="sm" variant="ghost" onClick={() => setCopySourceClass(null)}>
              Cancel
            </MoltenButton>
            <MoltenButton
              size="sm"
              variant="molten"
              onClick={handleExecuteCopy}
              disabled={copyTargetIds.length === 0}
            >
              Copy to {copyTargetIds.length} Classes
            </MoltenButton>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Target classes:
          </p>

          <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
            {copySourceClass && selectedClasses
              .filter(c => c.id !== copySourceClass.id)
              .map((c) => {
                const isChecked = copyTargetIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                  >
                    <span className="font-semibold text-white">{c.name} – {c.section}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setCopyTargetIds(prev =>
                          isChecked ? prev.filter(x => x !== c.id) : [...prev, c.id]
                        );
                      }}
                      className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0"
                    />
                  </label>
                );
              })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
