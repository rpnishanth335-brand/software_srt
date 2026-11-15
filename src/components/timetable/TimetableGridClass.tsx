import React from 'react';
import { Project, Slot, ID } from '../../types';
import { TimetableCell } from './TimetableCell';

interface TimetableGridClassProps {
  project: Project;
  classId: ID;
  slots: Slot[];
  conflictSlotKeys: Set<string>;
  conflictReasonMap: Map<string, string>;
  onToggleLock: (classId: ID, day: number, period: number) => void;
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

export const TimetableGridClass: React.FC<TimetableGridClassProps> = ({
  project,
  classId,
  slots,
  conflictSlotKeys,
  conflictReasonMap,
  onToggleLock,
}) => {
  const { school, subjects, teachers } = project;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  // Find max periods across any active day
  const maxPeriods = Math.max(...school.days.map((d) => school.periodsByDay[d] || 8));

  const getSlot = (day: number, period: number): Slot => {
    return (
      slots.find((s) => s.classId === classId && s.day === day && s.period === period) || {
        classId,
        day,
        period,
        subjectId: null,
        teacherId: null,
        locked: false,
      }
    );
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="min-w-[950px]">
        {/* Header: Periods & Clock Times */}
        <div className="grid grid-cols-[110px_repeat(auto-fit,minmax(105px,1fr))] gap-2.5 mb-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-mono-code text-xs font-bold text-slate-300 flex items-center justify-center">
            Day / Period
          </div>

          {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((p) => {
            const timeInfo = school.periodTimes?.find((pt) => pt.period === p);
            const breakAfter = school.breaks.find((b) => b.afterPeriod === p);

            return (
              <div key={p} className="space-y-1">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xs font-bold font-mono-code text-amber-400">P{p}</div>
                  <div className="text-[10px] text-slate-400 font-mono-code truncate">
                    {timeInfo ? `${timeInfo.startTime}` : `Period ${p}`}
                  </div>
                </div>
                {breakAfter && (
                  <div className="text-[9px] font-bold text-amber-300/80 bg-amber-500/10 rounded py-0.5 border border-amber-500/20 truncate">
                    ☕ {breakAfter.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rows: Each School Day */}
        <div className="space-y-2.5">
          {school.days.map((day) => {
            const dayPeriodCount = school.periodsByDay[day] || 8;

            return (
              <div
                key={day}
                className="grid grid-cols-[110px_repeat(auto-fit,minmax(105px,1fr))] gap-2.5 items-stretch"
              >
                {/* Day Header Label */}
                <div className="p-3 rounded-xl bg-[#12101c]/90 border border-white/10 flex flex-col items-center justify-center text-center shadow-glass-specular">
                  <span className="text-xs font-extrabold text-white tracking-wide">
                    {DAY_LABELS[day]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-code mt-0.5">
                    {dayPeriodCount} Periods
                  </span>
                </div>

                {/* Period Cells */}
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

                  const slot = getSlot(day, period);
                  const cellKey = `${classId}:${day}:${period}`;
                  const isConflict = conflictSlotKeys.has(cellKey);
                  const conflictReason = conflictReasonMap.get(cellKey);

                  const subject = slot.subjectId ? subjectMap.get(slot.subjectId) : undefined;
                  const teacher = slot.teacherId ? teacherMap.get(slot.teacherId) : undefined;

                  return (
                    <TimetableCell
                      key={period}
                      slot={slot}
                      subject={subject}
                      teacher={teacher}
                      isConflict={isConflict}
                      conflictReason={conflictReason}
                      onToggleLock={() => onToggleLock(classId, day, period)}
                    />
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
