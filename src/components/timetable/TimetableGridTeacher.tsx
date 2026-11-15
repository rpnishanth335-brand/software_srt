import React from 'react';
import { Project, Slot, ID } from '../../types';
import { Ban, UserCheck } from 'lucide-react';

interface TimetableGridTeacherProps {
  project: Project;
  teacherId: ID;
  slots: Slot[];
}

const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  0: 'Sunday',
};

export const TimetableGridTeacher: React.FC<TimetableGridTeacherProps> = ({
  project,
  teacherId,
  slots,
}) => {
  const { school, classes, subjects, teachers } = project;

  const currentTeacher = teachers.find((t) => t.id === teacherId);
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const maxPeriods = Math.max(...school.days.map((d) => school.periodsByDay[d] || 8));

  // Find slot where this teacher is assigned on day and period
  const getTeacherAssignment = (day: number, period: number) => {
    return slots.find((s) => s.teacherId === teacherId && s.day === day && s.period === period);
  };

  const isBlocked = (day: number, period: number) => {
    return currentTeacher?.blocked.some((b) => b.day === day && b.period === period) || false;
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="min-w-[950px]">
        {/* Header */}
        <div className="grid grid-cols-[110px_repeat(auto-fit,minmax(105px,1fr))] gap-2.5 mb-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-mono-code text-xs font-bold text-slate-300 flex items-center justify-center">
            Day / Period
          </div>

          {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((p) => (
            <div key={p} className="p-2 rounded-xl bg-white/5 border border-white/10 text-center font-mono-code text-xs font-bold text-amber-400">
              P{p}
            </div>
          ))}
        </div>

        {/* Rows: Each Day */}
        <div className="space-y-2.5">
          {school.days.map((day) => {
            const dayPeriodCount = school.periodsByDay[day] || 8;

            return (
              <div
                key={day}
                className="grid grid-cols-[110px_repeat(auto-fit,minmax(105px,1fr))] gap-2.5 items-stretch"
              >
                <div className="p-3 rounded-xl bg-[#12101c]/90 border border-white/10 flex flex-col items-center justify-center text-center shadow-glass-specular">
                  <span className="text-xs font-extrabold text-white tracking-wide">
                    {DAY_LABELS[day]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-code mt-0.5">
                    {dayPeriodCount} Periods
                  </span>
                </div>

                {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((period) => {
                  const isAvailablePeriod = period <= dayPeriodCount;
                  if (!isAvailablePeriod) {
                    return (
                      <div
                        key={period}
                        className="h-24 rounded-xl bg-black/30 border border-white/[0.03] flex items-center justify-center"
                      >
                        <span className="text-[10px] font-mono-code text-slate-600">—</span>
                      </div>
                    );
                  }

                  const blocked = isBlocked(day, period);
                  const assignment = getTeacherAssignment(day, period);

                  if (blocked) {
                    return (
                      <div
                        key={period}
                        className="h-24 p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col items-center justify-center text-center text-red-300 shadow-inner"
                      >
                        <Ban className="w-5 h-5 text-red-400 mb-1" />
                        <span className="text-[10px] font-mono-code font-bold uppercase">
                          Unavailable
                        </span>
                      </div>
                    );
                  }

                  if (!assignment || !assignment.subjectId) {
                    return (
                      <div
                        key={period}
                        className="h-24 p-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center"
                      >
                        <UserCheck className="w-4 h-4 text-slate-600 mb-1" />
                        <span className="text-[10px] font-mono-code text-slate-500">Free Slot</span>
                      </div>
                    );
                  }

                  const assignedClass = classMap.get(assignment.classId);
                  const assignedSubject = subjectMap.get(assignment.subjectId);

                  return (
                    <div
                      key={period}
                      style={{
                        backgroundColor: assignedSubject?.color ? `${assignedSubject.color}25` : 'rgba(255,255,255,0.08)',
                        borderColor: assignedSubject?.color || 'rgba(255,255,255,0.2)',
                      }}
                      className="h-24 p-2.5 rounded-xl border shadow-glass-specular flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          style={{ color: assignedSubject?.color }}
                          className="text-xs font-mono-code font-bold tracking-wide"
                        >
                          {assignedSubject?.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white font-mono-code">
                          {assignedClass?.name}-{assignedClass?.section}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-100 truncate">
                        {assignedSubject?.name}
                      </div>

                      <div className="text-[10px] font-mono-code text-slate-400 truncate">
                        {assignedClass?.room || 'Room TBA'}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
