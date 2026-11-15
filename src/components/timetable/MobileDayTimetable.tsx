import React, { useState } from 'react';
import { Project, Slot } from '../../types';
import { Lock, Unlock, AlertTriangle, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileDayTimetableProps {
  project: Project;
  classId?: string;
  teacherId?: string;
  slots: Slot[];
  conflictSlotKeys?: Set<string>;
  conflictReasonMap?: Map<string, string>;
  onToggleLock?: (classId: string, day: number, period: number) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MobileDayTimetable: React.FC<MobileDayTimetableProps> = ({
  project,
  classId,
  teacherId,
  slots,
  conflictSlotKeys = new Set(),
  conflictReasonMap = new Map(),
  onToggleLock,
}) => {
  const { school, subjects, teachers, rooms, classes } = project;
  const activeDays = school.days || [1, 2, 3, 4, 5];
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const activeDay = activeDays[selectedDayIndex] ?? activeDays[0] ?? 1;

  const periodsCount = school.periodsByDay[activeDay] || 8;
  const periodIndices = Array.from({ length: periodsCount }, (_, i) => i + 1);

  // Filter slots for active day and class/teacher
  const daySlots = slots.filter((s) => {
    if (s.day !== activeDay) return false;
    if (classId && s.classId !== classId) return false;
    if (teacherId && s.teacherId !== teacherId) return false;
    return true;
  });

  const handlePrevDay = () => {
    setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : activeDays.length - 1));
  };

  const handleNextDay = () => {
    setSelectedDayIndex((prev) => (prev < activeDays.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-4">
      {/* Day Selector Chips & Carousel */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-black/40 border border-white/10">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          aria-label="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {activeDays.map((dayNum, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-ember-glow scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {DAY_SHORT[dayNum]}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNextDay}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          aria-label="Next Day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold text-amber-200">
          {DAY_NAMES[activeDay]} Schedule
        </span>
        <span className="text-xs text-slate-400 font-mono-code">
          {periodsCount} Periods Configured
        </span>
      </div>

      {/* Period Timeline Cards */}
      <div className="space-y-2.5">
        {periodIndices.map((period) => {
          const slot = daySlots.find((s) => s.period === period);
          const periodTime = school.periodTimes?.find((pt) => pt.period === period);
          const breakItem = school.breaks?.find((b) => b.afterPeriod === period);

          const subject = slot?.subjectId ? subjects.find((s) => s.id === slot.subjectId) : null;
          const teacher = slot?.teacherId ? teachers.find((t) => t.id === slot.teacherId) : null;
          const targetClass = slot?.classId ? classes.find((c) => c.id === slot.classId) : null;
          const room = slot?.roomId ? rooms.find((r) => r.id === slot.roomId) : null;

          const slotKey = slot ? `${slot.classId}_${slot.day}_${slot.period}` : '';
          const hasConflict = conflictSlotKeys.has(slotKey);
          const conflictReason = conflictReasonMap.get(slotKey);

          return (
            <React.Fragment key={period}>
              <div 
                className={`p-3.5 rounded-2xl border transition-all ${
                  hasConflict
                    ? 'bg-red-950/40 border-red-500/50 shadow-lg'
                    : slot
                    ? 'bg-white/[0.04] border-white/10 hover:border-amber-500/40'
                    : 'bg-black/20 border-dashed border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Period Time & Number */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-12 py-1 px-1 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs font-mono-code font-bold text-amber-300">P{period}</span>
                    {periodTime && (
                      <span className="text-[9px] text-slate-400 font-mono-code text-center">
                        {periodTime.startTime}
                      </span>
                    )}
                  </div>

                  {/* Slot Details */}
                  <div className="flex-1 min-w-0">
                    {slot && subject ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: subject.color }} 
                          />
                          <span className="text-sm font-bold text-white truncate">
                            {subject.name}
                          </span>
                          <span className="text-[10px] font-mono-code font-semibold px-1.5 py-0.5 rounded bg-white/10 text-amber-200">
                            {subject.code}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                          {/* Teacher or Class */}
                          {teacher && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-300 truncate">
                              <User className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{teacher.name} ({teacher.code})</span>
                            </span>
                          )}
                          {targetClass && teacherId && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-300">
                              <span>Class: {targetClass.name}-{targetClass.section}</span>
                            </span>
                          )}

                          {/* Room */}
                          {room && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{room.code || room.number}</span>
                            </span>
                          )}
                        </div>

                        {/* Conflict Banner */}
                        {hasConflict && (
                          <div className="flex items-center gap-1.5 text-[11px] text-red-300 pt-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>{conflictReason || 'Clash detected!'}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center h-full text-xs text-slate-500 italic py-2">
                        <span>Free / Unassigned Period</span>
                      </div>
                    )}
                  </div>

                  {/* Lock / Pin Button */}
                  {slot && onToggleLock && classId && (
                    <button
                      onClick={() => onToggleLock(classId, slot.day, slot.period)}
                      className={`p-2 rounded-xl transition-colors shrink-0 ${
                        slot.locked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                      title={slot.locked ? 'Slot is locked' : 'Pin / Lock slot'}
                    >
                      {slot.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Break Divider */}
              {breakItem && (
                <div className="my-1.5 py-1 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300 font-semibold">
                  <span>☕ {breakItem.name}</span>
                  <span className="text-[10px] font-mono-code text-amber-400/80">
                    {breakItem.durationMinutes} min
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
