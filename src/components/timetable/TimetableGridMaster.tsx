import React, { useState } from 'react';
import { Project, Slot } from '../../types';

interface TimetableGridMasterProps {
  project: Project;
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

export const TimetableGridMaster: React.FC<TimetableGridMasterProps> = ({
  project,
  slots,
}) => {
  const { school, classes, subjects, teachers } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  const [activeDay, setActiveDay] = useState<number>(school.days[0] || 1);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  const dayPeriods = school.periodsByDay[activeDay] || 8;

  return (
    <div className="space-y-4">
      {/* Day Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {school.days.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeDay === d
                ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white border-amber-300/40 shadow-ember-glow'
                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Master Grid: Rows = Periods, Columns = Classes */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono-code text-slate-400">
                <th className="py-3 px-3 min-w-[80px] font-bold text-amber-400">Period</th>
                {selectedClasses.map((cls) => (
                  <th key={cls.id} className="py-3 px-2 text-center min-w-[110px]">
                    <div className="font-bold text-white">{cls.name}-{cls.section}</div>
                    <div className="text-[10px] text-slate-400 font-mono-code">{cls.room || 'Room TBA'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {Array.from({ length: dayPeriods }, (_, i) => i + 1).map((period) => (
                <tr key={period} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-mono-code font-bold text-amber-300">
                    P{period}
                  </td>

                  {selectedClasses.map((cls) => {
                    const slot = slots.find(
                      (s) => s.classId === cls.id && s.day === activeDay && s.period === period
                    );
                    const subject = slot?.subjectId ? subjectMap.get(slot.subjectId) : null;
                    const teacher = slot?.teacherId ? teacherMap.get(slot.teacherId) : null;

                    if (!subject) {
                      return (
                        <td key={cls.id} className="p-2 text-center">
                          <div className="h-14 rounded-lg border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center text-[10px] text-slate-500 font-mono-code">
                            Free
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={cls.id} className="p-2 text-center">
                        <div
                          style={{
                            backgroundColor: `${subject.color}25`,
                            borderColor: subject.color,
                          }}
                          className="h-14 p-1.5 rounded-lg border flex flex-col justify-between shadow-glass-specular"
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ color: subject.color }} className="font-bold font-mono-code text-[11px]">
                              {subject.code}
                            </span>
                            <span className="text-[9px] font-mono-code text-slate-300 font-bold">
                              {teacher?.code || 'TBA'}
                            </span>
                          </div>
                          <div className="text-[10px] font-medium text-slate-200 truncate">
                            {subject.name}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
