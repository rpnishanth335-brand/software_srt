import React from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Grid3X3, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Wand2
} from 'lucide-react';
import { ID } from '../types';

export const Step5Assignments: React.FC = () => {
  const { 
    project, 
    setAssignment, 
    suggestTeacherForAssignment, 
    autoAssignLowestLoad 
  } = useTimetableStore();

  const { classes, subjects, teachers, assignments, school } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  // Calculate available slots per class per week
  const totalSlotsPerWeek = school.days.reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );

  const getAssignment = (classId: ID, subjectId: ID) => {
    return assignments.find((a) => a.classId === classId && a.subjectId === subjectId);
  };

  const handlePeriodsChange = (classId: ID, subjectId: ID, periods: number) => {
    const current = getAssignment(classId, subjectId);
    const teacherId = current?.teacherId || suggestTeacherForAssignment(classId, subjectId) || '';
    setAssignment(classId, subjectId, teacherId, periods);
  };

  const handleTeacherChange = (classId: ID, subjectId: ID, teacherId: ID) => {
    const current = getAssignment(classId, subjectId);
    const periods = current?.periodsPerWeek || 0;
    setAssignment(classId, subjectId, teacherId, periods);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we ask this:</span> The assignment matrix is the mathematical core of the timetable. For every class, the total allocated subject periods must match the available slots ({totalSlotsPerWeek} periods/week). The live status indicator highlights exact parity (green), shortages (amber), or over-allocations (red).
        </div>
      </div>

      {/* Header & Helper Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Curriculum Assignment Matrix</h2>
            <p className="text-xs text-slate-400">
              {selectedClasses.length} Selected Classes × {subjects.length} Subjects • Target: {totalSlotsPerWeek} slots/class
            </p>
          </div>
        </div>

        <MoltenButton
          size="sm"
          variant="molten"
          onClick={autoAssignLowestLoad}
          leftIcon={<Wand2 className="w-3.5 h-3.5" />}
        >
          Auto-Assign Lowest Load Faculty
        </MoltenButton>
      </div>

      {/* Matrix Table */}
      <PlasmaGlass className="p-4 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono-code text-slate-400">
                <th className="py-3 px-3 min-w-[130px] font-bold text-white">Class &amp; Section</th>
                {subjects.map((sub) => (
                  <th key={sub.id} className="py-3 px-2 text-center min-w-[105px]">
                    <span 
                      style={{ color: sub.color }} 
                      className="font-bold block tracking-wider"
                    >
                      {sub.code}
                    </span>
                    <span className="text-[9px] text-slate-500 font-normal truncate block max-w-[90px] mx-auto">
                      {sub.name}
                    </span>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[110px] font-bold text-amber-300">
                  Total Slots
                </th>
                <th className="py-3 px-3 text-center min-w-[100px] font-bold text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {selectedClasses.map((cls) => {
                const classAssignments = assignments.filter((a) => a.classId === cls.id);
                const allocatedPeriods = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
                const diff = allocatedPeriods - totalSlotsPerWeek;

                const isPerfect = diff === 0;
                const isOver = diff > 0;

                return (
                  <tr key={cls.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Class Name */}
                    <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                      <div>{cls.name} – {cls.section}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{cls.room || 'Room TBA'}</div>
                    </td>

                    {/* Subject Cells */}
                    {subjects.map((sub) => {
                      const assignment = getAssignment(cls.id, sub.id);
                      const periods = assignment?.periodsPerWeek || 0;
                      const teacherId = assignment?.teacherId || '';

                      // Eligible teachers for this subject
                      const eligibleTeachers = teachers.filter((t) =>
                        t.subjectIds.includes(sub.id)
                      );

                      return (
                        <td key={sub.id} className="py-2.5 px-2 text-center align-top">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Periods Stepper */}
                            <input
                              type="number"
                              min={0}
                              max={15}
                              value={periods}
                              onChange={(e) =>
                                handlePeriodsChange(cls.id, sub.id, parseInt(e.target.value, 10) || 0)
                              }
                              className={`w-12 py-1 text-center rounded-lg text-xs font-mono-code font-bold transition-all border ${
                                periods > 0
                                  ? 'bg-white/10 text-white border-white/20'
                                  : 'bg-black/20 text-slate-600 border-white/5'
                              } focus:outline-none focus:border-ember-400`}
                            />

                            {/* Teacher Dropdown */}
                            {periods > 0 && (
                              <select
                                value={teacherId}
                                onChange={(e) => handleTeacherChange(cls.id, sub.id, e.target.value)}
                                className={`text-[10px] rounded px-1 py-0.5 max-w-[95px] font-mono-code border focus:outline-none ${
                                  teacherId
                                    ? 'bg-[#0b0a10] text-amber-200 border-white/20'
                                    : 'bg-red-950/60 text-red-300 border-red-500/50 animate-pulse'
                                }`}
                              >
                                <option value="">Select Faculty</option>
                                {eligibleTeachers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.code} ({t.name.split(' ').pop()})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Row Total */}
                    <td className="py-3 px-3 text-center font-mono-code">
                      <div className={`text-sm font-extrabold ${
                        isPerfect ? 'text-emerald-400' : isOver ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {allocatedPeriods} / {totalSlotsPerWeek}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isPerfect ? 'Balanced' : isOver ? `+${diff} Over` : `${diff} Under`}
                      </div>
                    </td>

                    {/* Parity Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {isPerfect ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : isOver ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                          <XCircle className="w-3 h-3" /> Over
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Under
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
